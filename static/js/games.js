// Games.js - Canvas-based mini-games
document.addEventListener('DOMContentLoaded', function() {
    const gameCards = document.querySelectorAll('.game-card');
    const modal = document.getElementById('gameModal');
    const gameTitle = document.getElementById('gameTitle');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const closeModal = document.querySelector('.close-modal');
    
    // Game control elements
    const startBtn = document.getElementById('startGame');
    const pauseBtn = document.getElementById('pauseGame');
    const restartBtn = document.getElementById('restartGame');
    const scoreElement = document.getElementById('currentScore');
    const timeElement = document.getElementById('gameTime');
    const livesElement = document.getElementById('gameLives');
    const instructionContent = document.getElementById('instructionContent');
    
    let currentGame = null;
    let gameState = 'stopped'; // stopped, running, paused
    let gameLoop = null;
    
    // Game variables
    let score = 0;
    let timeLeft = 60;
    let lives = 3;
    
    // Game definitions
    const games = {
        'budget-balance': {
            title: 'Game1',
            instructions: 'TODO: Game1 instructions',
            init: initGame1,
            update: updateGame1,
            render: renderGame1,
            handleClick: handleGame1Click
        },
        'investment-clicker': {
            title: 'Game2',
            instructions: 'TODO: Game2 instructions',
            init: initGame2,
            update: updateGame2,
            render: renderGame2,
            handleClick: handleGame2Click
        },
        'expense-catcher': {
            title: 'Game3',
            instructions: 'TODO: Game3 instructions',
            init: initGame3,
            update: updateGame3,
            render: renderGame3,
            handleKeyboard: handleGame3Keyboard
        }
    };
    
    // Add event listeners
    gameCards.forEach(card => {
        const playButton = card.querySelector('.play-button');
        playButton.addEventListener('click', function() {
            const gameType = card.dataset.game;
            openGame(gameType);
        });
    });
    
    closeModal.addEventListener('click', closeGameModal);
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', restartGame);
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeGameModal();
        }
    });
    
    // Canvas click handler
    canvas.addEventListener('click', function(e) {
        if (currentGame && games[currentGame].handleClick) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            games[currentGame].handleClick(x, y);
        }
    });
    
    // Keyboard handler
    document.addEventListener('keydown', function(e) {
        if (currentGame && games[currentGame].handleKeyboard && gameState === 'running') {
            games[currentGame].handleKeyboard(e);
        }
    });
    
    function openGame(gameType) {
        currentGame = gameType;
        const game = games[gameType];
        
        gameTitle.textContent = game.title;
        instructionContent.textContent = game.instructions;
        
        // Reset game state
        score = 0;
        timeLeft = 60;
        lives = 3;
        gameState = 'stopped';
        
        updateUI();
        
        // Initialize game
        game.init();
        
        modal.style.display = 'block';
        
        // Enable/disable buttons
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
    }
    
    function closeGameModal() {
        modal.style.display = 'none';
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        gameState = 'stopped';
        currentGame = null;
    }
    
    function startGame() {
        if (gameState === 'stopped') {
            gameState = 'running';
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            
            // Start game loop
            gameLoop = setInterval(() => {
                if (gameState === 'running') {
                    games[currentGame].update();
                    games[currentGame].render();
                    updateTimer();
                }
            }, 1000/60); // 60 FPS
            
            // Start timer countdown
            const timerLoop = setInterval(() => {
                if (gameState === 'running' && timeLeft > 0) {
                    timeLeft--;
                    updateUI();
                    
                    if (timeLeft <= 0) {
                        endGame();
                        clearInterval(timerLoop);
                    }
                } else if (gameState !== 'running') {
                    clearInterval(timerLoop);
                }
            }, 1000);
        } else if (gameState === 'paused') {
            gameState = 'running';
            startBtn.textContent = 'Start Game';
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        }
    }
    
    function pauseGame() {
        if (gameState === 'running') {
            gameState = 'paused';
            startBtn.textContent = 'Resume';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }
    
    function restartGame() {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        
        score = 0;
        timeLeft = 60;
        lives = 3;
        gameState = 'stopped';
        
        updateUI();
        games[currentGame].init();
        
        startBtn.textContent = 'Start Game';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    function endGame() {
        gameState = 'stopped';
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        
        // Award XP based on score
        const xpGained = Math.floor(score / 10);
        if (xpGained > 0) {
            awardXP(xpGained, 'game', `${games[currentGame].title} - Score: ${score}`);
        }
        
        // Update high score
        updateHighScore(currentGame, score);
        
        // Show game over message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText(`XP Gained: ${xpGained}`, canvas.width/2, canvas.height/2 + 60);
        
        startBtn.textContent = 'Start Game';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    function updateUI() {
        scoreElement.textContent = score;
        timeElement.textContent = timeLeft;
        livesElement.textContent = lives;
    }
    
    function updateTimer() {
        // This function can be used for per-frame timer updates if needed
    }
    
    function awardXP(points, activityType, details) {
        fetch('/api/add_xp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                xp: points,
                activity_type: activityType,
                details: details
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.level_up) {
                showLevelUp(data.new_level);
            }
        })
        .catch(error => console.error('Error awarding XP:', error));
    }
    
    function showLevelUp(newLevel) {
        // Create level up notification (similar to learning.js)
        const levelUpNotification = document.createElement('div');
        levelUpNotification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            color: #333;
            padding: 2rem 3rem;
            border-radius: 20px;
            font-weight: bold;
            font-size: 1.5rem;
            z-index: 3000;
            animation: levelUp 3s ease-out forwards;
            box-shadow: 0 20px 40px rgba(255, 215, 0, 0.4);
            text-align: center;
        `;
        levelUpNotification.innerHTML = `
            🎉 LEVEL UP! 🎉<br>
            <span style="font-size: 2rem;">Level ${newLevel}</span>
        `;
        document.body.appendChild(levelUpNotification);
        
        setTimeout(() => {
            levelUpNotification.remove();
        }, 3000);
    }
    
    function updateHighScore(gameType, newScore) {
        const scoreElement = document.getElementById(`${gameType.replace('-', '-')}-high-score`);
        if (scoreElement) {
            const currentHigh = parseInt(scoreElement.textContent) || 0;
            if (newScore > currentHigh) {
                scoreElement.textContent = newScore;
                // Save to localStorage
                localStorage.setItem(`${gameType}-high-score`, newScore);
            }
        }
    }
    
    // Load high scores from localStorage
    function loadHighScores() {
        ['budget-balance', 'investment-clicker', 'expense-catcher'].forEach(gameType => {
            const saved = localStorage.getItem(`${gameType}-high-score`);
            if (saved) {
                const scoreElement = document.getElementById(`${gameType.replace('-', '-')}-high-score`);
                if (scoreElement) {
                    scoreElement.textContent = saved;
                }
            }
        });
    }
    
    // Game 1
    function initGame1() {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game1', canvas.width/2, canvas.height/2 - 20);
        ctx.fillText('TODO: Implement game logic', canvas.width/2, canvas.height/2 + 20);
    }
    
    function updateGame1() {
        // TODO: Implement Game1 update logic
    }
    
    function renderGame1() {
        // TODO: Implement Game1 rendering
    }
    
    function handleGame1Click(x, y) {
        // TODO: Implement Game1 click handling
        console.log('TODO: Game1 click at', x, y);
    }
    
    // Game 2
    function initGame2() {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game2', canvas.width/2, canvas.height/2 - 20);
        ctx.fillText('TODO: Implement game logic', canvas.width/2, canvas.height/2 + 20);
    }
    
    function updateGame2() {
        // TODO: Implement Game2 update logic
    }
    
    function renderGame2() {
        // TODO: Implement Game2 rendering
    }
    
    function handleGame2Click(x, y) {
        // TODO: Implement Game2 click handling
        console.log('TODO: Game2 click at', x, y);
    }
    
    // Game 3
    function initGame3() {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game3', canvas.width/2, canvas.height/2 - 20);
        ctx.fillText('TODO: Implement game logic', canvas.width/2, canvas.height/2 + 20);
    }
    
    function updateGame3() {
        // TODO: Implement Game3 update logic
    }
    
    function renderGame3() {
        // TODO: Implement Game3 rendering
    }
    
    function handleGame3Keyboard(e) {
        // TODO: Implement Game3 keyboard handling
        console.log('TODO: Game3 keyboard input', e.key);
    }
    
    // Load high scores on page load
    loadHighScores();
});