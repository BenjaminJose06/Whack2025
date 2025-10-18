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
            title: 'Budget Balance',
            instructions: 'Click on income items (green) to collect them and avoid expense items (red). Balance your budget to win!',
            init: initBudgetBalance,
            update: updateBudgetBalance,
            render: renderBudgetBalance,
            handleClick: handleBudgetBalanceClick
        },
        'investment-clicker': {
            title: 'Investment Clicker',
            instructions: 'Click on investment opportunities to grow your portfolio. Higher risk = higher reward, but be careful!',
            init: initInvestmentClicker,
            update: updateInvestmentClicker,
            render: renderInvestmentClicker,
            handleClick: handleInvestmentClickerClick
        },
        'expense-catcher': {
            title: 'Expense Catcher',
            instructions: 'Use arrow keys to move and catch falling expenses. Sort them into the correct categories!',
            init: initExpenseCatcher,
            update: updateExpenseCatcher,
            render: renderExpenseCatcher,
            handleKeyboard: handleExpenseCatcherKeyboard
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
    
    // Game 1: Budget Balance
    let budgetItems = [];
    
    function initBudgetBalance() {
        budgetItems = [];
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click Start to begin Budget Balance!', canvas.width/2, canvas.height/2);
    }
    
    function updateBudgetBalance() {
        // Spawn new items
        if (Math.random() < 0.03) {
            budgetItems.push({
                x: Math.random() * (canvas.width - 60),
                y: -30,
                type: Math.random() < 0.6 ? 'income' : 'expense',
                value: Math.floor(Math.random() * 50) + 10,
                speed: Math.random() * 2 + 1
            });
        }
        
        // Update item positions
        budgetItems.forEach(item => {
            item.y += item.speed;
        });
        
        // Remove items that are off screen
        budgetItems = budgetItems.filter(item => {
            if (item.y > canvas.height + 30) {
                if (item.type === 'income') {
                    lives--; // Lost income = lose life
                    updateUI();
                    if (lives <= 0) {
                        endGame();
                    }
                }
                return false;
            }
            return true;
        });
    }
    
    function renderBudgetBalance() {
        // Clear canvas
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw items
        budgetItems.forEach(item => {
            ctx.fillStyle = item.type === 'income' ? '#10b981' : '#ef4444';
            ctx.fillRect(item.x, item.y, 60, 30);
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            const symbol = item.type === 'income' ? '+' : '-';
            ctx.fillText(`${symbol}$${item.value}`, item.x + 30, item.y + 20);
        });
        
        // Draw instructions
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Green = Income (click to collect)', 10, 30);
        ctx.fillText('Red = Expenses (avoid clicking)', 10, 50);
    }
    
    function handleBudgetBalanceClick(x, y) {
        for (let i = budgetItems.length - 1; i >= 0; i--) {
            const item = budgetItems[i];
            if (x >= item.x && x <= item.x + 60 && y >= item.y && y <= item.y + 30) {
                if (item.type === 'income') {
                    score += item.value;
                } else {
                    score = Math.max(0, score - item.value);
                    lives--;
                    if (lives <= 0) {
                        endGame();
                    }
                }
                budgetItems.splice(i, 1);
                updateUI();
                break;
            }
        }
    }
    
    // Game 2: Investment Clicker
    let investments = [];
    
    function initInvestmentClicker() {
        investments = [];
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click Start to begin Investment Clicker!', canvas.width/2, canvas.height/2);
    }
    
    function updateInvestmentClicker() {
        // Spawn new investments
        if (Math.random() < 0.02) {
            const risk = Math.random();
            investments.push({
                x: Math.random() * (canvas.width - 80),
                y: Math.random() * (canvas.height - 60),
                risk: risk,
                reward: Math.floor(risk * 100) + 10,
                size: 80,
                lifetime: 180 + Math.random() * 120, // 3-5 seconds at 60fps
                maxLifetime: 180 + Math.random() * 120
            });
        }
        
        // Update investments
        investments.forEach(investment => {
            investment.lifetime--;
        });
        
        // Remove expired investments
        investments = investments.filter(investment => investment.lifetime > 0);
    }
    
    function renderInvestmentClicker() {
        // Clear canvas
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw investments
        investments.forEach(investment => {
            const alpha = investment.lifetime / investment.maxLifetime;
            const riskColor = investment.risk > 0.7 ? '#ef4444' : 
                             investment.risk > 0.4 ? '#f59e0b' : '#10b981';
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = riskColor;
            ctx.fillRect(investment.x, investment.y, investment.size, 40);
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`$${investment.reward}`, investment.x + investment.size/2, investment.y + 25);
            
            ctx.globalAlpha = 1;
        });
        
        // Draw instructions
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Click investments before they disappear!', 10, 30);
        ctx.fillText('Green = Low risk, Yellow = Medium, Red = High risk', 10, 50);
    }
    
    function handleInvestmentClickerClick(x, y) {
        for (let i = investments.length - 1; i >= 0; i--) {
            const investment = investments[i];
            if (x >= investment.x && x <= investment.x + investment.size && 
                y >= investment.y && y <= investment.y + 40) {
                
                if (Math.random() < (1 - investment.risk * 0.5)) {
                    // Successful investment
                    score += investment.reward;
                } else {
                    // Failed investment
                    score = Math.max(0, score - Math.floor(investment.reward / 2));
                    lives--;
                    if (lives <= 0) {
                        endGame();
                    }
                }
                investments.splice(i, 1);
                updateUI();
                break;
            }
        }
    }
    
    // Game 3: Expense Catcher
    let player = { x: 375, y: 550, width: 50, height: 30, speed: 5 };
    let fallingExpenses = [];
    let categories = ['Food', 'Transport', 'Entertainment', 'Bills'];
    let baskets = [];
    
    function initExpenseCatcher() {
        player = { x: 375, y: 550, width: 50, height: 30, speed: 5 };
        fallingExpenses = [];
        baskets = [];
        
        // Create category baskets
        for (let i = 0; i < categories.length; i++) {
            baskets.push({
                x: i * 200 + 50,
                y: canvas.height - 80,
                width: 150,
                height: 50,
                category: categories[i],
                color: `hsl(${i * 90}, 70%, 60%)`
            });
        }
        
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click Start to begin Expense Catcher!', canvas.width/2, canvas.height/2);
        ctx.font = '16px Arial';
        ctx.fillText('Use arrow keys to move!', canvas.width/2, canvas.height/2 + 40);
    }
    
    function updateExpenseCatcher() {
        // Spawn falling expenses
        if (Math.random() < 0.02) {
            fallingExpenses.push({
                x: Math.random() * (canvas.width - 40),
                y: -30,
                width: 40,
                height: 20,
                speed: Math.random() * 2 + 2,
                category: categories[Math.floor(Math.random() * categories.length)],
                value: Math.floor(Math.random() * 30) + 10
            });
        }
        
        // Update falling expenses
        fallingExpenses.forEach(expense => {
            expense.y += expense.speed;
        });
        
        // Check for player catching expenses
        for (let i = fallingExpenses.length - 1; i >= 0; i--) {
            const expense = fallingExpenses[i];
            if (expense.x < player.x + player.width &&
                expense.x + expense.width > player.x &&
                expense.y < player.y + player.height &&
                expense.y + expense.height > player.y) {
                
                // Player caught the expense, now check if dropped in correct basket
                expense.caught = true;
                expense.x = player.x + player.width / 2 - expense.width / 2;
                expense.y = player.y - expense.height;
            }
        }
        
        // Remove expenses that fell off screen
        fallingExpenses = fallingExpenses.filter(expense => {
            if (expense.y > canvas.height + 30 && !expense.caught) {
                lives--; // Missed expense
                updateUI();
                if (lives <= 0) {
                    endGame();
                }
                return false;
            }
            return true;
        });
    }
    
    function renderExpenseCatcher() {
        // Clear canvas
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw category baskets
        baskets.forEach(basket => {
            ctx.fillStyle = basket.color;
            ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
            
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(basket.category, basket.x + basket.width/2, basket.y + 30);
        });
        
        // Draw player
        ctx.fillStyle = '#667eea';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Draw falling expenses
        fallingExpenses.forEach(expense => {
            ctx.fillStyle = expense.caught ? '#fbbf24' : '#ef4444';
            ctx.fillRect(expense.x, expense.y, expense.width, expense.height);
            
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`$${expense.value}`, expense.x + expense.width/2, expense.y + 15);
        });
        
        // Draw instructions
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Catch expenses and drop them in correct baskets!', 10, 20);
    }
    
    function handleExpenseCatcherKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
                player.x = Math.max(0, player.x - player.speed);
                break;
            case 'ArrowRight':
                player.x = Math.min(canvas.width - player.width, player.x + player.speed);
                break;
            case 'ArrowDown':
                // Drop caught expenses
                for (let i = fallingExpenses.length - 1; i >= 0; i--) {
                    const expense = fallingExpenses[i];
                    if (expense.caught) {
                        // Check which basket it's dropped into
                        for (let basket of baskets) {
                            if (expense.x + expense.width/2 >= basket.x && 
                                expense.x + expense.width/2 <= basket.x + basket.width) {
                                
                                if (basket.category === expense.category) {
                                    score += expense.value;
                                } else {
                                    score = Math.max(0, score - Math.floor(expense.value / 2));
                                }
                                break;
                            }
                        }
                        fallingExpenses.splice(i, 1);
                        updateUI();
                    }
                }
                break;
        }
    }
    
    // Load high scores on page load
    loadHighScores();
});