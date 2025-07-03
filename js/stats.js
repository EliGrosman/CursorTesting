// Statistics Management Module
class GameStats {
    constructor() {
        this.storageKey = 'wordle-stats';
        this.stats = this.loadStats();
    }

    loadStats() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0], // Index 0-5 for guesses 1-6
            lastPlayedDate: null,
            lastCompletedDate: null,
            history: [] // Array of game results
        };
    }

    saveStats() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    }

    addGame(won, guesses, word) {
        const today = new Date().toDateString();
        
        // Update games played
        this.stats.gamesPlayed++;
        
        if (won) {
            this.stats.gamesWon++;
            this.stats.guessDistribution[guesses - 1]++;
            
            // Update streak
            if (this.stats.lastCompletedDate === this.getYesterday()) {
                this.stats.currentStreak++;
            } else if (this.stats.lastCompletedDate !== today) {
                this.stats.currentStreak = 1;
            }
            
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
            this.stats.lastCompletedDate = today;
        } else {
            // Lost - reset current streak
            this.stats.currentStreak = 0;
            this.stats.lastCompletedDate = today;
        }
        
        this.stats.lastPlayedDate = today;
        
        // Add to history
        this.stats.history.push({
            date: today,
            won: won,
            guesses: guesses,
            word: word
        });
        
        this.saveStats();
    }

    getYesterday() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date.toDateString();
    }

    getWinPercentage() {
        if (this.stats.gamesPlayed === 0) return 0;
        return Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
    }

    hasPlayedToday() {
        const today = new Date().toDateString();
        return this.stats.lastPlayedDate === today;
    }

    getTodaysGame() {
        const today = new Date().toDateString();
        return this.stats.history.find(game => game.date === today);
    }

    displayStats() {
        document.getElementById('total-played').textContent = this.stats.gamesPlayed;
        document.getElementById('win-percentage').textContent = this.getWinPercentage();
        document.getElementById('current-streak').textContent = this.stats.currentStreak;
        document.getElementById('max-streak').textContent = this.stats.maxStreak;
        
        // Display guess distribution
        const distributionChart = document.getElementById('distribution-chart');
        distributionChart.innerHTML = '';
        
        const maxCount = Math.max(...this.stats.guessDistribution, 1);
        
        for (let i = 0; i < 6; i++) {
            const count = this.stats.guessDistribution[i];
            const percentage = (count / maxCount) * 100;
            
            const row = document.createElement('div');
            row.className = 'distribution-row';
            
            const number = document.createElement('div');
            number.className = 'distribution-number';
            number.textContent = i + 1;
            
            const bar = document.createElement('div');
            bar.className = 'distribution-bar';
            bar.style.width = Math.max(percentage, 7) + '%';
            bar.textContent = count;
            
            // Highlight the most recent game's guess count
            const todaysGame = this.getTodaysGame();
            if (todaysGame && todaysGame.won && todaysGame.guesses === i + 1) {
                bar.classList.add('highlight');
            }
            
            row.appendChild(number);
            row.appendChild(bar);
            distributionChart.appendChild(row);
        }
    }
}

// Create global instance
const gameStats = new GameStats();