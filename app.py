from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import requests
import json
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

# Quiz Question Model
class QuizQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    choices = db.Column(db.Text, nullable=False)  # JSON-encoded list[str]
    correct_index = db.Column(db.Integer, nullable=False)
    explanation = db.Column(db.Text)
    tags = db.Column(db.String(200))  # comma-separated tags
    difficulty = db.Column(db.Integer, default=1)
    source = db.Column(db.String(200))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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

@app.route('/game1')
def game1():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('game1.html', user=user)

@app.route('/game2')
def game2():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('game2.html', user=user)

@app.route('/game3')
def game3():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('game3.html', user=user)

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
        'success': True,
        'level': user.level,
        'xp': user.xp,
        'xp_to_next': user.xp_to_next_level(),
        'progress_percentage': user.xp_progress_percentage()
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
        'content': (
            'You are a financial advisor helping university students manage their money wisely. '
            'Keep responses concise, practical, and student-friendly. '
            'Reply in plain text only. Do not use Markdown (no **bold**, lists, or code blocks).'
        )
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

@app.route('/quiz')
def quiz_page():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('quiz.html', user=user)

@app.route('/api/quiz/start', methods=['POST'])
def quiz_start():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    payload = request.get_json() or {}
    count = int(payload.get('count', 5))
    tag_filter = payload.get('tags')  # list[str] or None
    difficulty = payload.get('difficulty')  # optional exact match

    query = QuizQuestion.query.filter_by(active=True)
    if difficulty is not None:
        try:
            diff = int(difficulty)
            query = query.filter(QuizQuestion.difficulty == diff)
        except Exception:
            pass
    if tag_filter:
        # simple contains check (comma-separated tags)
        for t in tag_filter:
            query = query.filter(QuizQuestion.tags.ilike(f"%{t}%"))

    # Fetch and sample
    questions = query.all()
    if not questions:
        return jsonify({'success': True, 'questions': []})

    import random
    random.shuffle(questions)
    picked = questions[:max(1, min(count, len(questions)))]

    def serialize(q: QuizQuestion):
        return {
            'id': q.id,
            'question': q.question,
            'choices': json.loads(q.choices),
        }

    return jsonify({'success': True, 'questions': [serialize(q) for q in picked]})

@app.route('/api/quiz/submit', methods=['POST'])
def quiz_submit():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.get_json() or {}
    answers = data.get('answers', [])  # [{id, selectedIndex}]

    # Grade
    total = len(answers)
    correct = 0
    breakdown = []
    id_map = {a.get('id'): a.get('selectedIndex') for a in answers}
    if not id_map:
        return jsonify({'success': True, 'score': 0, 'total': 0, 'breakdown': []})

    questions = QuizQuestion.query.filter(QuizQuestion.id.in_(list(id_map.keys()))).all()
    for q in questions:
        sel = id_map.get(q.id)
        is_correct = (sel == q.correct_index)
        correct += 1 if is_correct else 0
        breakdown.append({
            'id': q.id,
            'correctIndex': q.correct_index,
            'isCorrect': is_correct,
            'explanation': q.explanation or ''
        })

    # Award XP (5 per correct, +10 bonus for perfect)
    xp_awarded = correct * 5 + (10 if total > 0 and correct == total else 0)
    user = User.query.get(session['user_id'])
    level_up = False
    if xp_awarded > 0:
        level_up = user.add_xp(xp_awarded)
        log = ActivityLog(
            user_id=user.id,
            activity_type='quiz',
            xp_gained=xp_awarded,
            details=f'Quiz: {correct}/{total} correct'
        )
        db.session.add(log)
        db.session.commit()

    return jsonify({
        'success': True,
        'score': correct,
        'total': total,
        'breakdown': breakdown,
        'xp_awarded': xp_awarded,
        'level_up': level_up,
        'new_level': user.level,
        'new_xp': user.xp,
    })

if __name__ == '__main__':
    # Ensure database directory exists and create tables
    with app.app_context():
        try:
            db.create_all()
            print("Database initialized successfully!")
            # Seed quiz questions if empty
            if QuizQuestion.query.count() == 0:
                print("Seeding quiz questions...")
                samples = [
                    QuizQuestion(
                        question='Which budgeting method allocates 50% to needs, 30% to wants, and 20% to savings/debt?',
                        choices=json.dumps(['Zero-based budget', '50/30/20 rule', 'Envelope method', 'Line-item budget']),
                        correct_index=1,
                        explanation='The 50/30/20 rule is a simple starting framework.',
                        tags='budgeting,basics',
                        difficulty=1,
                        source='General finance education',
                        active=True
                    ),
                    QuizQuestion(
                        question='For an emergency fund, a good initial target for students is:',
                        choices=json.dumps(['$100', '$500–$1,000', '$10,000', '12 months of income']),
                        correct_index=1,
                        explanation='Start with $500–$1,000, then work toward 3–6 months of expenses.',
                        tags='savings,emergency',
                        difficulty=1,
                        source='General finance education',
                        active=True
                    ),
                    QuizQuestion(
                        question='Which action is least harmful long-term in a tight month?',
                        choices=json.dumps(['Skip minimum loan payment', 'Delay rent', 'Reduce eating out', 'Cancel health insurance']),
                        correct_index=2,
                        explanation='Cut discretionary spending first to avoid fees, credit damage, or health risks.',
                        tags='tradeoffs,spending',
                        difficulty=2,
                        source='General finance education',
                        active=True
                    ),
                ]
                db.session.bulk_save_objects(samples)
                db.session.commit()
                print("Seeded quiz questions.")
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