from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import math
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from plaid.api_client import ApiClient
from dotenv import load_dotenv
import threading

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure database directory exists
db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database')
if not os.path.exists(db_dir):
    os.makedirs(db_dir)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(db_dir, "finquest.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Plaid Configuration
PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
PLAID_SECRET = os.getenv('PLAID_SECRET')
PLAID_ENV = os.getenv('PLAID_ENV', 'sandbox')

# Configure Plaid client
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox if PLAID_ENV == 'sandbox' else plaid.Environment.Production,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)

api_client = ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(api_client)

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

# Plaid Item Model
class PlaidItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    access_token = db.Column(db.String(200), nullable=False)
    item_id = db.Column(db.String(200), nullable=False)
    institution_name = db.Column(db.String(100))
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
    """Serve the Pygbag-generated game"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    import os
    from flask import send_from_directory
    pygbag_dir = os.path.join(app.root_path, 'static', 'pygbag', 'build', 'web')
    return send_from_directory(pygbag_dir, 'index.html')

@app.route('/pygbag.apk')
@app.route('/favicon.png')
@app.route('/<filename>.js')
def serve_pygbag_file(filename=None):
    """Serve Pygbag static assets"""
    import os
    from flask import send_from_directory, request
    
    pygbag_dir = os.path.join(app.root_path, 'static', 'pygbag', 'build', 'web')
    # Get the actual filename from the URL path
    path = request.path.lstrip('/')
    return send_from_directory(pygbag_dir, path)

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
        'level': user.level,
        'xp': user.xp,
        'xp_to_next': user.xp_to_next_level(),
        'progress_percentage': user.xp_progress_percentage()
    })

@app.route('/api/create_link_token', methods=['POST'])
def create_link_token():
    """Create a link token for Plaid Link"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        link_request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(
                client_user_id=str(session['user_id'])
            ),
            client_name="WHACK2025",
            products=[Products("transactions")],
            country_codes=[CountryCode('US')],
            language='en'
        )
        
        response = plaid_client.link_token_create(link_request)
        return jsonify({'link_token': response['link_token']})
    
    except plaid.ApiException as e:
        print(f"Plaid API Error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"General Error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/exchange_public_token', methods=['POST'])
def exchange_public_token():
    """Exchange public token for access token"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        public_token = request.json.get('public_token')
        institution_name = request.json.get('institution_name', 'Unknown Bank')
        
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        
        exchange_response = plaid_client.item_public_token_exchange(exchange_request)
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']
        
        # Store the access token
        plaid_item = PlaidItem(
            user_id=session['user_id'],
            access_token=access_token,
            item_id=item_id,
            institution_name=institution_name
        )
        
        db.session.add(plaid_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item_id': item_id
        })
    
    except plaid.ApiException as e:
        print(f"Plaid API Error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"General Error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/transactions')
def get_transactions():
    """Fetch transactions from Plaid"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Get user's Plaid items
        plaid_items = PlaidItem.query.filter_by(user_id=session['user_id']).all()
        
        if not plaid_items:
            return jsonify({'error': 'No bank accounts connected'}), 404
        
        all_transactions = []
        
        # Get transactions for each connected account
        for item in plaid_items:
            start_date = (datetime.now() - timedelta(days=30)).date()
            end_date = datetime.now().date()
            
            txn_request = TransactionsGetRequest(
                access_token=item.access_token,
                start_date=start_date,
                end_date=end_date,
                options=TransactionsGetRequestOptions(
                    count=100,
                    offset=0
                )
            )
            
            response = plaid_client.transactions_get(txn_request)
            transactions = response['transactions']
            
            # Format transactions
            for txn in transactions:
                all_transactions.append({
                    'id': txn['transaction_id'],
                    'date': str(txn['date']),
                    'name': txn['name'],
                    'amount': txn['amount'],
                    'category': txn['category'][0] if txn.get('category') else 'Uncategorized',
                    'merchant_name': txn.get('merchant_name', txn['name']),
                    'institution': item.institution_name
                })
        
        # Sort by date (most recent first)
        all_transactions.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify({
            'success': True,
            'transactions': all_transactions,
            'count': len(all_transactions)
        })
    
    except plaid.ApiException as e:
        print(f"Plaid API Error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"General Error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/connected_accounts')
def connected_accounts():
    """Get list of connected bank accounts"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    plaid_items = PlaidItem.query.filter_by(user_id=session['user_id']).all()
    
    accounts = [{
        'id': item.id,
        'institution_name': item.institution_name,
        'connected_at': item.created_at.isoformat()
    } for item in plaid_items]
    
    return jsonify({
        'success': True,
        'accounts': accounts
    })

@app.route('/bank-api')
def bank_api():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    return render_template('bank_api.html', user=user)

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