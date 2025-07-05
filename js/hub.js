// Hub Script - Dynamically loads games from configuration

document.addEventListener('DOMContentLoaded', () => {
    loadGames();
});

function loadGames() {
    const gamesGrid = document.getElementById('games-grid');
    
    GAMES.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = game.available ? 'game-card' : 'game-card coming-soon';
    
    if (game.available) {
        card.onclick = () => window.location.href = game.url;
    }
    
    // Create game icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'game-icon';
    
    if (game.icon === 'wordle') {
        // Special Wordle icon
        iconDiv.innerHTML = `
            <div class="wordle-icon">
                <div class="letter-box">W</div>
                <div class="letter-box">O</div>
                <div class="letter-box">R</div>
                <div class="letter-box">D</div>
                <div class="letter-box">L</div>
                <div class="letter-box">E</div>
            </div>
        `;
    } else {
        // Emoji or other icons
        iconDiv.innerHTML = `<span class="placeholder-icon">${game.icon}</span>`;
    }
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = game.available ? game.name : 'Coming Soon';
    
    // Create description
    const description = document.createElement('p');
    description.textContent = game.available ? game.description : 'More games on the way!';
    
    // Create play button
    const playButton = document.createElement('div');
    playButton.className = game.available ? 'play-button' : 'play-button disabled';
    playButton.textContent = game.available ? 'Play Now' : 'Coming Soon';
    
    // Check if already played today
    if (game.available) {
        checkGameStatus(game.id, playButton);
    }
    
    // Assemble the card
    card.appendChild(iconDiv);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(playButton);
    
    return card;
}

function checkGameStatus(gameId, playButton) {
    const stats = localStorage.getItem(`${gameId}-stats`);
    if (stats) {
        const parsed = JSON.parse(stats);
        const today = new Date().toDateString();
        
        if (parsed.lastPlayedDate === today) {
            // Already played today
            playButton.innerHTML = '✓ Played Today';
            playButton.style.background = '#6aaa64';
        }
    }
}

// Add some visual feedback for coming soon games
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('disabled') || 
        e.target.closest('.coming-soon')) {
        const card = e.target.closest('.game-card');
        if (card) {
            card.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                card.style.animation = '';
            }, 500);
        }
    }
});