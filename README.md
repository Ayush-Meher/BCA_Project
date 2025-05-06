# The Farmer Was Replaced - Web Edition

A web-based farming game inspired by the Steam game "The Farmer Was Replaced". This game features farming mechanics, tech tree progression, and Python code execution capabilities.

## Features

- Farming mechanics (planting, harvesting, selling)
- Land expansion system
- Tech tree progression
- Python code execution interface
- Modern UI with responsive design
- Save/load game functionality

## Setup Instructions

### Frontend Setup
1. Install Node.js and npm
2. Run `npm install` to install dependencies
3. Run `npm start` to start the development server

### Backend Setup
1. Install Python 3.8 or higher
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the Flask server: `python backend/app.py`

## Project Structure

```
├── public/              # Static assets
├── src/                 # React frontend source
│   ├── components/      # React components
│   ├── assets/         # Images, sounds, etc.
│   ├── styles/         # CSS and styled-components
│   └── utils/          # Utility functions
├── backend/            # Python backend
│   ├── app.py         # Flask server
│   ├── game_logic/    # Game mechanics
│   └── python_exec/   # Python code execution
└── docs/              # Documentation
```

## Contributing

Feel free to submit issues and enhancement requests! 