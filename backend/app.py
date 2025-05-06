from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Game state storage
game_state = {
    'money': 100,
    'land_size': 5,
    'inventory': {
        'wheat': 0,
        'corn': 0,
        'potato': 0
    },
    'unlocked_techs': ['basic_tools'],
    'land': [[{'isPlowed': False, 'hasCrop': False, 'cropType': None} for _ in range(5)] for _ in range(5)]
}

@app.route('/api/game-state', methods=['GET'])
def get_game_state():
    return jsonify(game_state)

@app.route('/api/update-state', methods=['POST'])
def update_game_state():
    global game_state
    new_state = request.json
    game_state.update(new_state)
    return jsonify({'status': 'success'})

@app.route('/api/execute-python', methods=['POST'])
def execute_python():
    try:
        code = request.json.get('code', '')
        # Here we would use Brython or another Python interpreter
        # For now, we'll just return a mock response
        return jsonify({
            'status': 'success',
            'output': 'Python code executed successfully',
            'result': None
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@app.route('/api/save-game', methods=['POST'])
def save_game():
    try:
        with open('save_game.json', 'w') as f:
            json.dump(game_state, f)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/load-game', methods=['GET'])
def load_game():
    try:
        if os.path.exists('save_game.json'):
            with open('save_game.json', 'r') as f:
                global game_state
                game_state = json.load(f)
            return jsonify({'status': 'success', 'game_state': game_state})
        return jsonify({'status': 'error', 'error': 'No save file found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 