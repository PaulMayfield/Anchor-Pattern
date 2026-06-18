# Anchor Pattern Game

A browser-based implementation of the Anchor Pattern game. Test your ability to identify hidden mathematical patterns by making guesses and analyzing feedback!

## 🎮 [Play the Game](https://paulmayfield.github.io/Anchor-Pattern/)

## How to Play

**Win Condition:** Get two consecutive rounds where BOTH your guess and your dice roll are correct.

### Gameplay
1. Two initial dice are rolled (Anchor and Pattern-setter)
2. Make your guess for the third value (1-6)
3. Your third die is rolled
4. Receive feedback on whether you got it right, the roll was right, both, or neither
5. Each time you're completely correct, the game advances to the next phase
6. The hidden pattern uses mathematical operations (sum or difference)

### Modes
- **Play Yourself**: You make the guesses
- **Autoplay**: The AI analyzes the pattern and makes guesses for you

## Features
- Fully client-side - no backend required
- Responsive design for mobile and desktop
- AI opponent that learns the pattern
- Real-time feedback and scoring

## Technical Details
Original Python implementation converted to vanilla JavaScript with no dependencies.

The game uses Bayesian hypothesis testing where the AI maintains a pool of candidate pattern hypotheses and eliminates those that don't match observed outcomes.

## Running the Game
Simply open `index.html` in a modern web browser.

## License
MIT
