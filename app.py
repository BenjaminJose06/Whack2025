from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import requests
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

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(db_dir, "WHACK2025.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)  # Add this line
    password_hash = db.Column(db.String(200), nullable=False)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    # XP progression: start at 0/100 for level 1; requirement increases by 20% each level
    BASE_XP_PER_LEVEL = 100
    GROWTH_RATE = 1.2

    def _requirement_for_level(self, level:int) -> int:
        """XP required to go from `level` to `level+1`. Level is 1-based.
        Rounds UP to the nearest 10 (e.g., 141 -> 150)."""
        raw = self.BASE_XP_PER_LEVEL * (self.GROWTH_RATE ** (level - 1))
        return int(math.ceil(raw / 10.0) * 10)

    def _level_state(self):
        """Return a tuple: (level, progress_in_level, requirement_for_level).
        - level: current integer level (>=1)
        - progress_in_level: XP gained within current level
        - requirement_for_level: XP required to reach next level from current level
        """
        total = self.xp
        level = 1
        while True:
            req = self._requirement_for_level(level)
            if total >= req:
                total -= req
                level += 1
            else:
                # total is progress within this level
                return level, int(total), int(req)

    def add_xp(self, points:int):
        prev_level = self.level
        self.xp += int(points)
        # Recalculate level based on geometric progression
        new_level, _, _ = self._level_state()
        self.level = new_level
        return self.level > prev_level

    def xp_to_next_level(self) -> int:
        level, progress, req = self._level_state()
        # Ensure the stored level matches computed (defensive)
        self.level = level
        return max(req - progress, 0)

    def xp_progress_percentage(self) -> float:
        level, progress, req = self._level_state()
        self.level = level
        if req <= 0:
            return 0.0
        return (progress / req) * 100.0

    def xp_progress_text(self) -> str:
        """Human-readable progress like '86/100 XP' within current level."""
        level, progress, req = self._level_state()
        self.level = level
        return f"{progress}/{req} XP"

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
        email_or_username = request.form['email']
        password = request.form['password']
        
        # Try to find user by email first, then by username
        user = User.query.filter_by(email=email_or_username).first()
        if not user:
            user = User.query.filter_by(username=email_or_username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['username'] = user.username
            flash('Login successful!', 'success')
            return redirect(url_for('map_view'))
        else:
            flash('Invalid email/username or password!', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        username = request.form['username']  # Add this line
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        if password != confirm_password:
            flash('Passwords do not match!', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'error')
            return render_template('register.html')
            
        if User.query.filter_by(username=username).first():  # Add this check
            flash('Username already taken!', 'error')
            return render_template('register.html')
        
        user = User(email=email, username=username)  # Add username parameter
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

@app.route('/bank')
def bank_zone():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('bank_zone.html', user=user)

@app.route('/reading')
def reading():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('reading.html', user=user)

@app.route('/quiz')
def quiz():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('quiz.html', user=user)

@app.route('/game1')
def game1():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('wordsearch.html', user=user)

@app.route('/game2')
def game2():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('froodle.html', user=user)

@app.route('/game3')
def game3():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('spaceinvader.html', user=user)

@app.route('/game4')
def game4():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('crossword.html', user=user)

@app.route('/crossword')
def crossword_alias():
    return redirect(url_for('game4'))

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
        'progress_percentage': user.xp_progress_percentage(),
        'progress_text': user.xp_progress_text()
    })

@app.route('/api/user_stats')
def user_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    return jsonify({
        'success': True,
        'level': user.level,
        'xp': user.xp,
        'xp_to_next': user.xp_to_next_level(),
        'progress_percentage': user.xp_progress_percentage(),
        'progress_text': user.xp_progress_text()
    })

@app.route('/bank-api')
def bank_api():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('bank_api.html', user=user)

@app.route('/advisor')
def advisor():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('advisor.html', user=user)

@app.route('/invest')
def invest_tools():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('invest.html', user=user)

@app.route('/api/advisor_chat', methods=['POST'])
def advisor_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.get_json() or {}
    messages = data.get('messages', [])
    options = data.get('options', {})
    model = data.get('model', 'llama3.2:3b')

    # Ensure a domain-specific system prompt is always included
    system_prompt = {
        'role': 'system',
        'content': 'You are a financial advisor helping university students manage their money wisely. Keep responses concise, practical, and student-friendly.'
    }

    # Build chat payload for Ollama
    ollama_payload = {
        'model': model,
        'messages': [system_prompt] + [m for m in messages if m.get('role') in ('user', 'assistant')],
        'stream': False,
        'options': {
            # Safely map options with sensible defaults
            'temperature': options.get('temperature', 0.6),
            'top_p': options.get('top_p', 0.9),
            'top_k': options.get('top_k', 40),
            'num_predict': options.get('num_predict', 160),
            'repeat_penalty': options.get('repeat_penalty', 1.1),
            'presence_penalty': options.get('presence_penalty', 0.6),
            'frequency_penalty': options.get('frequency_penalty', 0.3),
        }
    }

    try:
        resp = requests.post('http://localhost:11434/api/chat', json=ollama_payload, timeout=60)
        if resp.status_code != 200:
            return jsonify({'error': 'LLM backend error', 'detail': resp.text}), 502

        payload = resp.json()
        content = payload.get('message', {}).get('content', '').strip()
        return jsonify({'bot': content})
    except Exception as e:
        return jsonify({'error': 'Failed to contact LLM backend', 'detail': str(e)}), 500

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
            print("Database created successfully!")
            db.create_all()
    
    print("Starting WHACK2025 application...")
    print("Visit http://localhost:5000 to access the application")

    app.run(debug=True)