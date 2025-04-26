# Jeopardy Game

A client-side Jeopardy game hosted on GitHub Pages, featuring dynamic team/player entry, customizable tonality, and question generation powered by Together.ai.

## How to Play

1. Visit the game at [your-username.github.io/jeopardy-ai](https://your-username.github.io/jeopardy-ai).
2. Enter your Together.ai API key (get one from [together.ai](https://www.together.ai)).
3. Provide at least 4 comma-separated topics (e.g., "History, Science, Pop Culture, Sports").
4. Select a tonality (Serious, Humorous, Sarcastic, Dry).
5. Choose a game mode (Team or Free-for-All) and add teams/players.
6. Click "Generate Questions" to start the game.
7. Play through questions, award points, and proceed to Final Jeopardy!

## Setup for Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/jeopardy-ai.git
   cd jeopardy-ai
   ```

2. Serve locally (e.g., using Python):
   ```bash
   python3 -m http.server 8000
   ```

3. Open `http://localhost:8000` in a browser.

## Deployment to GitHub Pages

1. Push changes to the `main` branch.
2. Enable GitHub Pages in the repository settings, selecting the `main` branch.
3. Access the site at `https://your-username.github.io/jeopardy-ai`.

## Notes

- The Together.ai API key is stored in the browser's `localStorage` temporarily. Do not share your key publicly.
- For a more secure setup, consider using a proxy server to handle API requests.