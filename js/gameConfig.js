// Game Configuration
// This file makes it easy to add new games to the hub

const GAMES = [
    {
        id: 'wordle',
        name: 'Wordle',
        description: 'Guess the 5-letter word in 6 tries',
        url: 'wordle.html',
        icon: 'wordle',
        available: true,
        category: 'word'
    },
    {
        id: 'numberle',
        name: 'Numberle',
        description: 'Solve the math equation',
        url: 'numberle.html',
        icon: '🔢',
        available: false,
        category: 'math'
    },
    {
        id: 'colordle',
        name: 'Colordle',
        description: 'Guess the color combination',
        url: 'colordle.html',
        icon: '🎨',
        available: false,
        category: 'visual'
    },
    {
        id: 'puzzlr',
        name: 'Puzzlr',
        description: 'Daily logic puzzle',
        url: 'puzzlr.html',
        icon: '🧩',
        available: false,
        category: 'logic'
    }
];

// Game template for creating new games
class DailyGame {
    constructor(gameId) {
        this.gameId = gameId;
        this.storagePrefix = `${gameId}-`;
        this.stats = this.loadStats();
    }

    // Get a daily seed based on the game ID and date
    getDailySeed() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        return this.hashString(`${this.gameId}-${dateStr}`);
    }

    // Simple hash function for consistent daily puzzles
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    // Load game statistics
    loadStats() {
        const saved = localStorage.getItem(`${this.storagePrefix}stats`);
        if (saved) {
            return JSON.parse(saved);
        }
        return this.getDefaultStats();
    }

    // Override this in your game
    getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            lastPlayedDate: null
        };
    }

    // Save game statistics
    saveStats() {
        localStorage.setItem(`${this.storagePrefix}stats`, JSON.stringify(this.stats));
    }

    // Check if the player has already played today
    hasPlayedToday() {
        const today = new Date().toDateString();
        return this.stats.lastPlayedDate === today;
    }

    // Save today's game state
    saveGameState(state) {
        const today = new Date().toDateString();
        localStorage.setItem(`${this.storagePrefix}state-${today}`, JSON.stringify(state));
    }

    // Load today's game state
    loadGameState() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem(`${this.storagePrefix}state-${today}`);
        return saved ? JSON.parse(saved) : null;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAMES, DailyGame };
}