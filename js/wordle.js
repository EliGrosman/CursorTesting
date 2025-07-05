// Wordle Game Logic
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// Common 5-letter words for the game (a small sample - in production you'd have thousands)
const WORD_LIST = [
    'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIN', 'ADMIT', 'ADULT', 'AFTER', 'AGAIN',
    'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE',
    'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE',
    'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AVOID', 'AWARD', 'AWARE',
    'BADLY', 'BAKER', 'BASIC', 'BEACH', 'BEGAN', 'BEING', 'BELOW', 'BENCH', 'BILLY', 'BIRTH',
    'BLACK', 'BLAME', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BOUND', 'BRAIN', 'BRAND',
    'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD', 'BROKE', 'BROWN', 'BUILD',
    'BUILT', 'BUYER', 'CABLE', 'CALIF', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHAOS',
    'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE',
    'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOUD',
    'COACH', 'COAST', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM',
    'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DATED',
    'DEALT', 'DEATH', 'DEBUT', 'DELAY', 'DEPTH', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA',
    'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRILL', 'DRINK', 'DRIVE', 'DROVE', 'DYING', 'EAGER',
    'EARLY', 'EARTH', 'EIGHT', 'EITHER', 'ELECT', 'EMAIL', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER',
    'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE',
    'FAULT', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLASH',
    'FLEET', 'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME',
    'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS',
    'GLOBE', 'GOING', 'GRACE', 'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GRAVE', 'GREAT', 'GREEN',
    'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'HAPPY', 'HARRY', 'HEART',
    'HEAVY', 'HELLO', 'HENRY', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'IMPLY',
    'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JAPAN', 'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'KNOWN',
    'LABEL', 'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE',
    'LEGAL', 'LEMON', 'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LINKS', 'LIVES', 'LOCAL', 'LOGIC',
    'LOOSE', 'LOWER', 'LUCKY', 'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MARIA',
    'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED',
    'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVED', 'MUSIC',
    'NEEDS', 'NEVER', 'NEWLY', 'NIGHT', 'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR',
    'OCEAN', 'OFFER', 'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'PAINT', 'PANEL',
    'PAPER', 'PARIS', 'PARTY', 'PEACE', 'PENNY', 'PETER', 'PHASE', 'PHONE', 'PHOTO', 'PIANO',
    'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'POINT',
    'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF',
    'PROUD', 'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID',
    'RATIO', 'REACH', 'READY', 'REALM', 'REFER', 'RELAX', 'REPLY', 'RIGHT', 'RIVER', 'ROBIN',
    'ROCKY', 'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE',
    'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEET',
    'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT',
    'SILLY', 'SIMON', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL', 'SLASH', 'SLEEP', 'SLIDE',
    'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SNAKE', 'SOLID', 'SOLVE', 'SORRY', 'SOUND',
    'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE', 'SPORT',
    'SQUAD', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL', 'STICK',
    'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY',
    'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY', 'SUPER', 'SURGE', 'SWEET', 'SWIFT', 'SWING',
    'SWORD', 'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH', 'TEENS', 'TEETH', 'TEXAS', 'THANK',
    'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE',
    'THREE', 'THREW', 'THROW', 'TIGHT', 'TIMER', 'TITLE', 'TODAY', 'TOMMY', 'TOPIC', 'TOTAL',
    'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIL', 'TRAIN', 'TRASH', 'TREAT', 'TREND',
    'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TRIES', 'TROOP', 'TRUCK', 'TRULY', 'TRUMP', 'TRUST',
    'TRUTH', 'TWICE', 'UNDER', 'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN',
    'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE',
    'WASTE', 'WATCH', 'WATER', 'WAVED', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE',
    'WHOSE', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND',
    'WRITE', 'WRONG', 'WROTE', 'YIELD', 'YOUNG', 'YOUTH'
];

// Valid words for guessing (includes less common words)
const VALID_GUESSES = new Set([...WORD_LIST,
    'AAHED', 'AALII', 'AARGH', 'ABACA', 'ABACI', 'ABACK', 'ABAFT', 'ABAKA', 'ABAMP', 'ABASE',
    'ABASH', 'ABATE', 'ABAYA', 'ABBAS', 'ABBES', 'ABBEY', 'ABBOT', 'ABEAM', 'ABELE', 'ABETS',
    'ABHOR', 'ABIDE', 'ABLED', 'ABLER', 'ABLES', 'ABMHO', 'ABODE', 'ABOHM', 'ABOIL', 'ABOMA',
    'ABOON', 'ABORT', 'ABOUT', 'ABOVE', 'ABRAM', 'ABRAY', 'ABRIN', 'ABRIS', 'ABRUS', 'ABSIT'
    // In a real game, this would include thousands more valid 5-letter words
]);

class WordleGame {
    constructor() {
        this.board = [];
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameOver = false;
        this.word = '';
        this.guesses = [];
        this.letterStates = {}; // Track the state of each letter
        
        this.initGame();
        this.createBoard();
        this.createKeyboard();
        this.addEventListeners();
        
        // Check if already played today
        if (gameStats.hasPlayedToday()) {
            this.loadTodaysGame();
        }
    }
    
    initGame() {
        // Get daily word based on date
        const daysSinceEpoch = Math.floor((Date.now() - new Date(2024, 0, 1)) / 86400000);
        this.word = WORD_LIST[daysSinceEpoch % WORD_LIST.length];
    }
    
    createBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < MAX_GUESSES; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            row.id = `row-${i}`;
            
            const rowTiles = [];
            for (let j = 0; j < WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
                rowTiles.push(tile);
            }
            
            boardElement.appendChild(row);
            this.board.push(rowTiles);
        }
    }
    
    createKeyboard() {
        const keyboardElement = document.getElementById('keyboard');
        keyboardElement.innerHTML = '';
        
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ];
        
        rows.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'keyboard-row';
            
            row.forEach(key => {
                const button = document.createElement('button');
                button.className = 'key';
                button.textContent = key;
                button.id = `key-${key}`;
                
                if (key === 'ENTER' || key === '⌫') {
                    button.classList.add('wide');
                }
                
                button.addEventListener('click', () => this.handleKey(key));
                rowElement.appendChild(button);
            });
            
            keyboardElement.appendChild(rowElement);
        });
    }
    
    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            if (e.key === 'Enter') {
                this.handleKey('ENTER');
            } else if (e.key === 'Backspace') {
                this.handleKey('⌫');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                this.handleKey(e.key.toUpperCase());
            }
        });
    }
    
    handleKey(key) {
        if (this.gameOver) return;
        
        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === '⌫' || key === 'BACKSPACE') {
            this.deleteLetter();
        } else if (/^[A-Z]$/.test(key)) {
            this.addLetter(key);
        }
    }
    
    addLetter(letter) {
        if (this.currentTile < WORD_LENGTH && this.currentRow < MAX_GUESSES) {
            const tile = this.board[this.currentRow][this.currentTile];
            tile.textContent = letter;
            tile.classList.add('filled');
            this.currentTile++;
        }
    }
    
    deleteLetter() {
        if (this.currentTile > 0) {
            this.currentTile--;
            const tile = this.board[this.currentRow][this.currentTile];
            tile.textContent = '';
            tile.classList.remove('filled');
        }
    }
    
    submitGuess() {
        if (this.currentTile !== WORD_LENGTH) {
            this.showMessage('Not enough letters');
            return;
        }
        
        const guess = this.getCurrentGuess();
        
        if (!this.isValidWord(guess)) {
            this.showMessage('Not in word list');
            this.shakeRow();
            return;
        }
        
        this.guesses.push(guess);
        this.checkGuess(guess);
        
        if (guess === this.word) {
            this.gameOver = true;
            this.showMessage('Magnificent!');
            this.animateWin();
            gameStats.addGame(true, this.currentRow + 1, this.word);
            setTimeout(() => this.showStats(), 2000);
        } else if (this.currentRow === MAX_GUESSES - 1) {
            this.gameOver = true;
            this.showMessage(this.word);
            gameStats.addGame(false, this.currentRow + 1, this.word);
            setTimeout(() => this.showStats(), 2000);
        } else {
            this.currentRow++;
            this.currentTile = 0;
        }
    }
    
    getCurrentGuess() {
        let guess = '';
        for (let i = 0; i < WORD_LENGTH; i++) {
            guess += this.board[this.currentRow][i].textContent;
        }
        return guess;
    }
    
    isValidWord(word) {
        return VALID_GUESSES.has(word) || WORD_LIST.includes(word);
    }
    
    checkGuess(guess) {
        const wordArray = this.word.split('');
        const guessArray = guess.split('');
        const states = new Array(WORD_LENGTH).fill('absent');
        
        // First pass: mark correct letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessArray[i] === wordArray[i]) {
                states[i] = 'correct';
                wordArray[i] = null;
            }
        }
        
        // Second pass: mark present letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (states[i] === 'absent' && wordArray.includes(guessArray[i])) {
                states[i] = 'present';
                wordArray[wordArray.indexOf(guessArray[i])] = null;
            }
        }
        
        // Apply states to tiles and keyboard
        states.forEach((state, index) => {
            const tile = this.board[this.currentRow][index];
            const letter = guessArray[index];
            
            setTimeout(() => {
                tile.classList.add('flip');
                tile.classList.add(state);
                
                // Update keyboard
                this.updateKeyboard(letter, state);
            }, index * 300);
        });
    }
    
    updateKeyboard(letter, state) {
        const key = document.getElementById(`key-${letter}`);
        if (!key) return;
        
        const currentState = this.letterStates[letter];
        
        // Only update if the new state is "better" than the current state
        if (!currentState || 
            (currentState === 'absent' && state !== 'absent') ||
            (currentState === 'present' && state === 'correct')) {
            this.letterStates[letter] = state;
            key.className = `key ${state}`;
        }
    }
    
    shakeRow() {
        const row = document.getElementById(`row-${this.currentRow}`);
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 500);
    }
    
    animateWin() {
        const tiles = this.board[this.currentRow];
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('win');
            }, index * 100);
        });
    }
    
    showMessage(message) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        setTimeout(() => {
            messageElement.textContent = '';
        }, 3000);
    }
    
    loadTodaysGame() {
        const todaysGame = gameStats.getTodaysGame();
        if (!todaysGame) return;
        
        // Reconstruct the game state
        this.gameOver = true;
        const guessHistory = todaysGame.word === this.word ? 
            gameStats.stats.history.filter(g => g.date === todaysGame.date)[0].guesses : [];
        
        // TODO: Implement loading previous guesses
        // For now, just show that they've already played
        this.showMessage("You've already played today!");
        setTimeout(() => this.showStats(), 1000);
    }
    
    showStats() {
        gameStats.displayStats();
        document.getElementById('stats-modal').style.display = 'block';
    }
}

// Modal functions
function showHelp() {
    document.getElementById('help-modal').style.display = 'block';
}

function closeHelp() {
    document.getElementById('help-modal').style.display = 'none';
}

function showStats() {
    gameStats.displayStats();
    document.getElementById('stats-modal').style.display = 'block';
}

function closeStats() {
    document.getElementById('stats-modal').style.display = 'none';
}

function shareResults() {
    // Create share text
    const todaysGame = gameStats.getTodaysGame();
    if (!todaysGame) return;
    
    let shareText = `Wordle ${todaysGame.won ? todaysGame.guesses : 'X'}/6\n\n`;
    
    // Add emoji grid (simplified version)
    shareText += '🟩🟨⬜🟨⬜\n';
    shareText += '🟩🟩🟩⬜⬜\n';
    shareText += '🟩🟩🟩🟩🟩\n';
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
        const button = document.querySelector('.share-button');
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Share';
        }, 2000);
    });
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordleGame();
});