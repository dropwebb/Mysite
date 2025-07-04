import os
import sys
import uuid
from datetime import datetime
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Включаем CORS для всех доменов
CORS(app, origins="*")

# Инициализация SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

app.register_blueprint(user_bp, url_prefix='/api')

# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

# Хранилище для активных групп и пользователей (в памяти)
active_groups = {}
active_users = {}

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    is_registering = data.get('isRegistering', False)
    
    if not username or not password:
        return jsonify({'error': 'Имя пользователя и пароль обязательны'}), 400
    
    # Простая проверка (в реальном приложении нужна полноценная аутентификация)
    if is_registering:
        if len(password) < 6:
            return jsonify({'error': 'Пароль должен содержать минимум 6 символов'}), 400
    
    # Генерируем токен сессии
    session_token = str(uuid.uuid4())
    active_users[session_token] = {
        'username': username,
        'created_at': datetime.now().isoformat()
    }
    
    return jsonify({
        'success': True,
        'token': session_token,
        'username': username
    })

@app.route('/api/groups', methods=['POST'])
def create_group():
    data = request.get_json()
    group_name = data.get('name')
    
    if not group_name:
        return jsonify({'error': 'Название группы обязательно'}), 400
    
    group_id = str(int(datetime.now().timestamp() * 1000))
    group_link = f"{request.host_url}group/{group_id}"
    
    active_groups[group_id] = {
        'id': group_id,
        'name': group_name,
        'link': group_link,
        'members': [],
        'created_at': datetime.now().isoformat()
    }
    
    return jsonify({
        'id': group_id,
        'name': group_name,
        'link': group_link,
        'members': 0,
        'created': datetime.now().strftime('%d.%m.%Y, %H:%M:%S')
    })

@app.route('/api/groups/<group_id>/join', methods=['POST'])
def join_group(group_id):
    if group_id not in active_groups:
        return jsonify({'error': 'Группа не найдена'}), 404
    
    group = active_groups[group_id]
    return jsonify({
        'id': group_id,
        'name': group['name'],
        'link': group['link'],
        'members': len(group['members']),
        'created': datetime.fromisoformat(group['created_at']).strftime('%d.%m.%Y, %H:%M:%S')
    })

# WebSocket события
@socketio.on('connect')
def handle_connect():
    print(f'Пользователь подключился: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Пользователь отключился: {request.sid}')
    # Удаляем пользователя из всех групп
    for group_id, group in active_groups.items():
        if request.sid in group['members']:
            group['members'].remove(request.sid)

@socketio.on('join_group')
def handle_join_group(data):
    group_id = data.get('groupId')
    username = data.get('username')
    
    if group_id in active_groups:
        join_room(group_id)
        if request.sid not in active_groups[group_id]['members']:
            active_groups[group_id]['members'].append(request.sid)
        
        emit('user_joined', {
            'username': username,
            'message': f'{username} присоединился к группе'
        }, room=group_id)

@socketio.on('leave_group')
def handle_leave_group(data):
    group_id = data.get('groupId')
    username = data.get('username')
    
    if group_id in active_groups:
        leave_room(group_id)
        if request.sid in active_groups[group_id]['members']:
            active_groups[group_id]['members'].remove(request.sid)
        
        emit('user_left', {
            'username': username,
            'message': f'{username} покинул группу'
        }, room=group_id)

@socketio.on('send_message')
def handle_send_message(data):
    group_id = data.get('groupId')
    message = data.get('message')
    username = data.get('username')
    
    if group_id in active_groups and message:
        message_data = {
            'id': str(uuid.uuid4()),
            'text': message,
            'sender': username,
            'timestamp': datetime.now().strftime('%H:%M:%S'),
            'groupId': group_id
        }
        
        # Отправляем сообщение всем участникам группы
        emit('new_message', message_data, room=group_id)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

