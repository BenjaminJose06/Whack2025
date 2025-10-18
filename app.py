from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import math

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure database directory exists
db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database')
if not os.path.exists(db_dir):
    os.makedirs(db_dir)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(db_dir, "finquest.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def add_xp(self, points):
        self.xp += points
        # Level calculation: level = floor(sqrt(xp/100)) + 1
        new_level = math.floor(math.sqrt(self.xp / 100)) + 1
        if new_level > self.level:
            self.level = new_level
            return True  # Level up occurred
        return False
    
    def xp_to_next_level(self):
        current_level_xp = (self.level - 1) ** 2 * 100
        next_level_xp = self.level ** 2 * 100
        return next_level_xp - self.xp
    
    def xp_progress_percentage(self):
        current_level_xp = (self.level - 1) ** 2 * 100
        next_level_xp = self.level ** 2 * 100
        level_xp_range = next_level_xp - current_level_xp
        current_progress = self.xp - current_level_xp
        return (current_progress / level_xp_range) * 100

# Activity Log Model
class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # 'game', 'learning', 'quiz'
    xp_gained = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('map_view'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_email'] = user.email
            flash('Login successful!', 'success')
            return redirect(url_for('map_view'))
        else:
            flash('Invalid email or password!', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        if password != confirm_password:
            flash('Passwords do not match!', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'error')
            return render_template('register.html')
        
        user = User(email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/map')
def map_view():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('map.html', user=user)

@app.route('/learn')
def learn_zone():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('learn_zone.html', user=user)

@app.route('/games')
def game_zone():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('game_zone.html', user=user)

@app.route('/api/add_xp', methods=['POST'])
def add_xp():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    xp_points = data.get('xp', 0)
    activity_type = data.get('activity_type', 'unknown')
    details = data.get('details', '')
    
    user = User.query.get(session['user_id'])
    level_up = user.add_xp(xp_points)
    
    # Log the activity
    activity = ActivityLog(
        user_id=user.id,
        activity_type=activity_type,
        xp_gained=xp_points,
        details=details
    )
    
    db.session.add(activity)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'level_up': level_up,
        'new_level': user.level,
        'new_xp': user.xp,
        'xp_to_next': user.xp_to_next_level(),
        'progress_percentage': user.xp_progress_percentage()
    })

@app.route('/api/user_stats')
def user_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    return jsonify({
        'level': user.level,
        'xp': user.xp,
        'xp_to_next': user.xp_to_next_level(),
        'progress_percentage': user.xp_progress_percentage()
    })

if __name__ == '__main__':
    # Ensure database directory exists and create tables
    with app.app_context():
        try:
            db.create_all()
            print("Database initialized successfully!")
        except Exception as e:
            print(f"Error initializing database: {e}")
            print("Trying to create database directory...")
            db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database')
            os.makedirs(db_dir, exist_ok=True)
            db.create_all()
            print("Database created successfully!")
    
    print("Starting FinQuest application...")
    print("Visit http://localhost:5000 to access the application")
    app.run(debug=True)