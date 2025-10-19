// Doodle (Froodle) Game Script - extracted from froodle.html
// This script expects the following DOM elements to exist:
// #gameCanvas, #score, #xpFlash, #pointsFeedback, #startScreen, #gameOverScreen,
// #startButton, #restartButton, #finalScore, #quizScreen, #quizCard, #questionText,
// #answerButtons, #inGameExit

function awardXP(points, activityType, details) {
  if (!points || points <= 0) return;
  try {
    if (typeof showXPFlash === 'function') showXPFlash(points);
  } catch {}
  fetch('/api/add_xp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xp: points, activity_type: activityType, details })
  }).catch(() => {});
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const scoreEl = document.getElementById('score');
const startScreenEl = document.getElementById('startScreen');
const gameOverScreenEl = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreEl = document.getElementById('finalScore');
const quizScreenEl = document.getElementById('quizScreen');
const quizCardEl = document.getElementById('quizCard');
const questionTextEl = document.getElementById('questionText');
const answerButtonsEl = document.getElementById('answerButtons');
const pointsFeedbackEl = document.getElementById('pointsFeedback');
const inGameExitEl = document.getElementById('inGameExit');

// Finance quiz questions
const questions = [
  { question: 'What does APR stand for?', answers: ['Annual Percentage Rate', 'Average Payment Ratio', 'Account Payback Rate', 'Automatic Payment Request'], correct: 0 },
  { question: 'What is a budget?', answers: ['A shopping list', 'A plan for spending and saving money', 'A type of loan', 'A credit card'], correct: 1 },
  { question: 'A credit score is mainly used for?', answers: ['Approving loans or credit', 'Setting tax rates', 'Determining favorite color', 'Tracking shopping history'], correct: 0 },
  { question: 'Missing a credit card payment can lead to?', answers: ['Nothing', 'A late fee and interest', 'Bonus points', 'Higher credit score'], correct: 1 },
  { question: "On a loan, 'interest' is?", answers: ['Free money', 'The cost of borrowing', 'A discount', 'A reward'], correct: 1 },
  { question: "Which is typically considered 'good debt'?", answers: ['High-interest credit card', 'Student loan', 'Gambling loan', 'Payday loan'], correct: 1 },
  { question: 'An emergency fund is ideally how much?', answers: ['1–2 weeks of expenses', '3–6 months of expenses', 'Two years of salary', 'No savings needed'], correct: 1 },
  { question: 'Diversification helps to?', answers: ['Increase fees', 'Reduce investment risk', 'Eliminate all risk', 'Lower returns automatically'], correct: 1 },
  { question: 'Compound interest means?', answers: ['Interest only on principal', 'Earning interest on interest', 'No interest charged', 'Flat interest each year'], correct: 1 },
  { question: 'Checking vs Savings: which is for everyday spending?', answers: ['Savings account', 'Money market', 'Checking account', 'CD'], correct: 2 },
  { question: 'FDIC insurance generally protects deposits up to?', answers: ['$25,000', '$100,000', '$250,000', '$1,000,000'], correct: 2 },
  { question: 'Debit vs Credit card: a debit card?', answers: ['Borrows money from bank', 'Uses your checking funds', 'Builds credit automatically', 'Is always safer than credit'], correct: 1 },
  { question: 'Which document shows your yearly wages and taxes withheld?', answers: ['W-2', '1099-INT', 'W-4', '1040-EZ'], correct: 0 },
  { question: 'A 401(k) is a type of?', answers: ['Mortgage', 'Retirement account', 'Car insurance', 'Student grant'], correct: 1 },
  { question: 'Inflation usually?', answers: ['Increases purchasing power', 'Decreases purchasing power', 'Has no effect', 'Raises interest you earn'], correct: 1 },
  { question: 'A mortgage is?', answers: ['A rent agreement', 'A loan to buy a home', 'A bank fee', 'An insurance policy'], correct: 1 },
  { question: 'Grace period on a credit card is?', answers: ['Time before late fee', 'Time before interest accrues on purchases', 'A fee waiver', 'A balance transfer'], correct: 1 },
  { question: 'Paying only the minimum on a credit card?', answers: ['Avoids all interest', 'May cost more interest over time', 'Increases your score fast', 'Is better than paying in full'], correct: 1 },
  { question: 'A Certificate of Deposit (CD) typically has?', answers: ['No term and no penalties', 'Fixed term and early withdrawal penalty', 'Daily transfers', 'Unlimited check writing'], correct: 1 },
  { question: 'Best way to pay off high-interest debt first is called?', answers: ['Snowball (smallest balance)', 'Avalanche (highest rate)', 'Sandcastle', 'Interest shuffle'], correct: 1 },
  { question: 'Gross income vs net income: net is?', answers: ['Before taxes/deductions', 'After taxes/deductions', 'Just bonuses', 'Only cash income'], correct: 1 },
  { question: 'Credit utilization is?', answers: ['Payments made', 'Balance ÷ limit', 'APR × balance', 'Credit age'], correct: 1 },
  { question: 'APY vs APR: APY includes?', answers: ['Monthly fees', 'Compounding', 'Late charges', 'Taxes'], correct: 1 },
  { question: 'A secured loan requires?', answers: ['No application', 'Collateral', 'A co-signer always', 'Zero interest'], correct: 1 },
  { question: 'Roth IRA contributions are?', answers: ['Tax-deductible now', 'Taxed now; withdrawals tax-free in retirement', 'Taxed later', 'Not allowed under age 59½'], correct: 1 },
  { question: 'Payday loans often have?', answers: ['Very low rates', 'High fees and interest', 'Tax benefits', 'FDIC coverage'], correct: 1 },
  { question: 'Dollar-cost averaging means?', answers: ['Investing a fixed amount regularly', 'Investing only at lows', 'All-in at once', 'Only bonds'], correct: 0 }
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let score = 0;
let gameOver = true;
let gameStarted = false;
let jumpCount = 0;
let questionsAnswered = 0;
let quizActive = false;
let lastQuizTime = 0;
const quizCooldownMs = 12000; // 12s cooldown between quizzes

const playerImage = new Image();
playerImage.src = '/static/images/character.png';

const player = {
  width: 64,
  height: 64,
  x: canvas.width / 2 - 24,
  y: canvas.height - 100,
  dx: 0,
  dy: 0,
  speed: 10,
  gravity: 0.35,
  jumpStrength: -14,
  facingRight: true
};

let platforms = [];
const platformCount = 10;
const platformWidth = 100;
const platformHeight = 40;

const keys = { right: false, left: false };

const platformImage = new Image();
platformImage.src = '/static/images/platform.png';
startButton.disabled = true;
platformImage.onload = () => (startButton.disabled = false);
platformImage.onerror = () => (startButton.disabled = false);

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  if (playerImage.complete && playerImage.naturalWidth !== 0) {
    ctx.save();
    if (!player.facingRight) {
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(playerImage, -player.width / 2, -player.height / 2, player.width, player.height);
    } else {
      ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
}

function drawPlatforms() {
  platforms.forEach((platform) => {
    ctx.drawImage(platformImage, platform.x, platform.y, platform.width, platform.height);
  });
}

function createPlatforms() {
  platforms = [];
  let initialY = canvas.height - 50;

  platforms.push({
    x: canvas.width / 2 - platformWidth / 2,
    y: initialY,
    width: platformWidth,
    height: platformHeight
  });

  for (let i = 1; i < platformCount; i++) {
    platforms.push({
      x: Math.random() * (canvas.width - platformWidth),
      y: initialY - i * (canvas.height / platformCount) - (Math.random() * 20 - 10),
      width: platformWidth,
      height: platformHeight
    });
  }
}

function updatePlayerPosition() {
  if (keys.right) player.dx = player.speed;
  else if (keys.left) player.dx = -player.speed;
  else player.dx = 0;

  if (player.dx > 0) player.facingRight = true;
  else if (player.dx < 0) player.facingRight = false;

  player.x += player.dx;
  player.dy += player.gravity;
  player.y += player.dy;

  if (player.x + player.width < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.width;
}

function handleCollisions() {
  platforms.forEach((platform) => {
    if (
      player.dy > 0 &&
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y + player.height > platform.y &&
      player.y + player.height < platform.y + platform.height
    ) {
      player.dy = player.jumpStrength;
      jumpCount++;

      // Show quiz less frequently: every 7 jumps with cooldown
      if (jumpCount % 7 === 0 && !quizActive) {
        const nowTs = Date.now();
        if (nowTs - lastQuizTime >= quizCooldownMs) {
          lastQuizTime = nowTs;
          showQuiz();
        }
      }
    }
  });
}

function updatePlatformsAndScore() {
  if (player.y < canvas.height / 2 && player.dy < 0) {
    const scrollSpeed = Math.abs(player.dy);
    player.y += scrollSpeed;
    platforms.forEach((p) => (p.y += scrollSpeed));
    score += Math.floor(scrollSpeed);
    scoreEl.textContent = score;
  }

  platforms = platforms.filter((p) => p.y < canvas.height);

  if (platforms.length < platformCount) {
    const lastY = platforms[platforms.length - 1]?.y || canvas.height;
    platforms.push({
      x: Math.random() * (canvas.width - platformWidth),
      y: lastY - canvas.height / platformCount - (Math.random() * 20 - 10),
      width: platformWidth,
      height: platformHeight
    });
  }
}

function checkGameOver() {
  if (player.y > canvas.height) {
    gameOver = true;
    gameStarted = false;
    showGameOverScreen();
  }
}

function gameLoop() {
  if (gameOver || quizActive) return;
  clearCanvas();
  updatePlayerPosition();
  handleCollisions();
  updatePlatformsAndScore();
  drawPlatforms();
  drawPlayer();
  checkGameOver();
  requestAnimationFrame(gameLoop);
}

function init() {
  gameOver = false;
  score = 0;
  jumpCount = 0;
  questionsAnswered = 0;
  quizActive = false;
  scoreEl.textContent = '0';
  player.x = canvas.width / 2 - 16;
  player.y = canvas.height - 100;
  player.dx = 0;
  player.dy = 0;
  createPlatforms();
  startScreenEl.style.display = 'none';
  gameOverScreenEl.style.display = 'none';
  quizScreenEl.style.display = 'none';
  scoreEl.style.display = 'block';
  inGameExitEl.style.display = 'inline-flex';
  if (!gameStarted) {
    gameStarted = true;
    requestAnimationFrame(gameLoop);
  }
}

function showGameOverScreen() {
  scoreEl.style.display = 'none';
  finalScoreEl.textContent = score;
  gameOverScreenEl.style.display = 'flex';
  inGameExitEl.style.display = 'none';

  // Award XP based on final score (10 points of score = 1 XP)
  const xpGained = Math.floor(score / 10);
  awardXP(xpGained, 'game', `Jump - Score: ${score}`);
}

function showQuiz() {
  quizActive = true;
  scoreEl.style.display = 'none';

  // Get random question
  const question = questions[Math.floor(Math.random() * questions.length)];
  questionTextEl.textContent = question.question;

  // Clear previous buttons
  answerButtonsEl.innerHTML = '';

  // Create answer buttons
  question.answers.forEach((answer, index) => {
    const btn = document.createElement('button');
    btn.textContent = answer;
    btn.style.margin = '0';
    btn.style.width = '100%';
    btn.onclick = () => handleAnswer(index === question.correct);
    answerButtonsEl.appendChild(btn);
  });

  quizScreenEl.style.display = 'flex';
}

function handleAnswer(isCorrect) {
  // Add subtle ring pulse animation on the card
  if (isCorrect) {
    quizCardEl.classList.add('quiz-correct');
    score += 500; // Bonus points for correct answer
    scoreEl.textContent = score;
    showPointsFeedback('+50 Points!', '#22c55e');
  } else {
    quizCardEl.classList.add('quiz-incorrect');
    score -= 250; // Deduct points for wrong answer
    if (score < 0) score = 0; // Don't go below 0
    scoreEl.textContent = score;
    showPointsFeedback('-25 Points!', '#f44336');
  }

  // Wait for animation to complete before hiding quiz
  setTimeout(() => {
    quizCardEl.classList.remove('quiz-correct', 'quiz-incorrect');
    questionsAnswered++;
    hideQuiz();
  }, 600);
}

function showPointsFeedback(text, color) {
  pointsFeedbackEl.textContent = text;
  pointsFeedbackEl.style.color = color;
  pointsFeedbackEl.classList.remove('show-points');
  // Trigger reflow to restart animation
  void pointsFeedbackEl.offsetWidth;
  pointsFeedbackEl.classList.add('show-points');
}

function hideQuiz() {
  quizActive = false;
  quizScreenEl.style.display = 'none';
  scoreEl.style.display = 'block';
  requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
}

function handleKeyUp(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Local XP flash helper (for standalone page)
function showXPFlash(xp) {
  const el = document.getElementById('xpFlash');
  if (!el) return;
  const amt = Number(xp) || 0;
  if (amt <= 0) return;
  el.textContent = `+${amt} XP`;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(window.__xpFlashTimer);
  window.__xpFlashTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

startButton.addEventListener('click', () => {
  lastQuizTime = 0;
  init();
});
restartButton.addEventListener('click', init);
scoreEl.style.display = 'none';
