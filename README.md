# Daily Game Hub

A web-based daily game hub featuring word puzzle games inspired by popular daily challenges like Wordle and NYT Games.

## Features

### Main Hub
- Clean, modern interface displaying all available games
- Easy navigation between games
- Responsive design that works on desktop and mobile devices

### Wordle Clone
- Daily 5-letter word puzzle
- 6 attempts to guess the word
- Color-coded feedback:
  - 🟩 Green: Letter is correct and in the right position
  - 🟨 Yellow: Letter is in the word but wrong position
  - ⬜ Gray: Letter is not in the word
- On-screen keyboard with visual feedback
- Keyboard input support

### Statistics Tracking
- Games played
- Win percentage
- Current streak
- Maximum streak
- Guess distribution chart
- All statistics saved locally in your browser

## How to Play

1. Open `index.html` in your web browser
2. Click on "Wordle" to start playing
3. Type or click letters to make a guess
4. Press Enter to submit your guess
5. Use the color feedback to narrow down the word
6. Try to guess the word in 6 attempts or less!

## Game Rules

- Each guess must be a valid 5-letter word
- The word changes daily at midnight
- You can only play once per day
- Your statistics are saved automatically

## File Structure

```
daily-game-hub/
├── index.html          # Main hub page
├── wordle.html         # Wordle game page
├── css/
│   ├── styles.css      # Main styles
│   └── wordle.css      # Wordle-specific styles
├── js/
│   ├── stats.js        # Statistics management
│   └── wordle.js       # Wordle game logic
└── README.md           # This file
```

## Technical Details

- Pure HTML, CSS, and JavaScript (no frameworks required)
- Uses localStorage to save game statistics
- Responsive design using CSS Grid and Flexbox
- Smooth animations and transitions

## Future Enhancements

The hub is designed to easily add more games:
- Number puzzles
- Logic games
- Trivia challenges
- And more!

## Browser Compatibility

Works on all modern browsers that support:
- ES6 JavaScript
- CSS Grid
- Local Storage

Enjoy your daily puzzle challenge! 🎮