<div align="center">
    <img src="docs/assets/jeopardy-logo.png" alt="Jeopardy logo" width="500">
</div>
<br>

*Written by*: Joshua Boquiren

[![](https://img.shields.io/badge/@thejoshbq-grey?style=for-the-badge&logo=github)](https://github.com/thejoshbq) [![](https://img.shields.io/badge/@thejoshbq-grey?style=for-the-badge&logo=X)](https://x.com/thejoshbq) 

[![](https://img.shields.io/badge/Play-Online-blue?style=for-the-badge)](https://thejoshbq.github.io/jeopordy-ai/)
 
<br>

---

# Jeopardy AI

Jeopardy AI is a web-based game inspired by the classic TV show *Jeopardy!*. It allows users to set up and play a customized Jeopardy game with dynamically generated questions using the Together.ai API. Players can compete in team or free-for-all modes, with support for multiple teams or individual players, customizable topics, and various tonalities (serious, humorous, sarcastic, or dry). The game includes a setup screen, a game board, a question-and-answer system, a timer, and a Final Jeopardy round.

## Features

- **Customizable Setup**: Choose topics, tonality, and game mode (team or free-for-all).
- **Dynamic Question Generation**: Questions are generated via the Together.ai API based on user-provided topics and tonality.
- **Team or Free-for-All Modes**: Play with teams (with multiple members) or as individual players.
- **Interactive Game Board**: Select questions by category and point value, with a countdown timer for answers.
- **Final Jeopardy**: A wagering-based final round to conclude the game.
- **Score Tracking**: Automatic score updates for teams or players, saved locally.
- **Responsive UI**: Clean, user-friendly interface with a Jeopardy-inspired design.

## Prerequisites

To run Jeopardy AI, you need:
- A modern web browser (Chrome, Firefox, Safari, etc.).
- A valid [Together.ai API key](https://www.together.ai/) to generate questions.
- An internet connection for API calls.

## Usage

1. **Setup Screen**:
   - Enter your Together.ai API key.
   - Provide at least 4 comma-separated topics (e.g., History, Science, Pop Culture, Sports).
   - Select a tonality (Serious, Humorous, Sarcastic, or Dry).
   - Choose a game mode: Team or Free-for-All.
   - For Team mode, add teams and their members. For Free-for-All, add individual players.
   - Click "Generate Questions" to create the game.

2. **Starting the Game**:
   - Once questions are generated, click "Start Game" to view the game board.

3. **Gameplay**:
   - Select a question by clicking a point value (200, 400, 600, 800, or 1000) in a category.
   - A question appears with a 30-second timer. Click "See Answer" to reveal the answer.
   - Award points to the correct team or player using the dropdown menu.
   - The game tracks scores and alternates turns between teams or players.

4. **Final Jeopardy**:
   - After answering 20 questions, the "Final Jeopardy" button becomes active.
   - Enter wagers for each team/player, answer the final question, and indicate correct/incorrect answers to update scores.

5. **End Screen**:
   - The game displays the winner and final scores. Click "New Game" to reset and start over.


## Notes

- The game uses `localStorage` to save game state (questions, scores, etc.) during play. Starting a new game clears the storage.
- Ensure your Together.ai API key is valid and has sufficient credits for question generation.
- The timer bar is visual only and does not enforce time limits but provides a sense of urgency.
- The game assumes a general audience, so questions are appropriate for all ages.

## Acknowledgments

- Inspired by the *Jeopardy!* TV show.
- Powered by [Together.ai](https://www.together.ai/) for question generation.
- Logo and styling inspired by the official Jeopardy brand (used for educational purposes only).
