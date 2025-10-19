// Library Quiz Logic (extracted from quiz.html)
// Depends on DOM elements with ids: question, options, feedback, score
// Uses global helpers: showXPFlash (optional), updateUserStats (optional)

const quiz = [
  { question: "What does APR stand for?", options: ["Annual Percentage Rate", "Average Payment Ratio", "Account Payback Rate", "Automatic Payment Request"], answer: 0 },
  { question: "Which one is considered 'good debt'?", options: ["High-interest credit card", "Student loan", "Gambling loan", "Payday loan"], answer: 1 },
  { question: "What is a credit score used for?", options: ["Determining your favorite color", "Approving loans or credit", "Setting tax rates", "Tracking shopping history"], answer: 1 },
  { question: "What happens if you miss a credit card payment?", options: ["Nothing happens", "You earn bonus points", "You may be charged a late fee", "Your credit score increases"], answer: 2 },
  { question: "What is a budget?", options: ["A shopping list", "A plan for spending and saving money", "A type of loan", "A credit card"], answer: 1 },
  { question: "What does 'interest' mean on a loan?", options: ["Free money", "The cost of borrowing money", "A discount", "A reward"], answer: 1 },
];

let current = 0;
let score = 0;
let isAnswering = false;

let questionEl = document.getElementById('question');
let optionsDiv = document.getElementById('options');
let feedbackEl = document.getElementById('feedback');
let scoreEl = document.getElementById('score');

function loadQuestion() {
  if (current >= quiz.length) {
    showCompletion();
    return;
  }
  const q = quiz[current];
  questionEl.textContent = q.question;
  optionsDiv.innerHTML = '';
  feedbackEl.textContent = '';
  isAnswering = false;
  q.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option-btn';
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(index);
    optionsDiv.appendChild(btn);
  });
}

function checkAnswer(selected) {
  if (isAnswering) return;
  isAnswering = true;
  const correct = quiz[current].answer;
  if (selected === correct) {
    feedbackEl.textContent = 'Correct!';
    feedbackEl.className = 'quiz-feedback correct';
    score += 100;
    scoreEl.textContent = score;
    setTimeout(() => { current++; loadQuestion(); }, 700);
  } else {
    feedbackEl.textContent = 'Wrong! Try again.';
    feedbackEl.className = 'quiz-feedback incorrect';
    score = Math.max(0, score - 25);
    scoreEl.textContent = score;
    setTimeout(() => { feedbackEl.textContent = ''; isAnswering = false; }, 600);
  }
}

function showCompletion() {
  const container = document.querySelector('.quiz-card');
  const earnedXP = Math.floor(score / 10); // align with games: score -> XP
  container.innerHTML = `
    <div class="completion">
      <h2>Quiz Complete!</h2>
      <p class="final-score">Final Score: ${score}</p>
      <p>You answered all ${quiz.length} questions.</p>
      <button id="playAgain" class="play-button" type="button">Play Again</button>
      <a href="/learn" class="play-button" style="margin-left: 0.5rem;">Back to Learning</a>
    </div>
  `;
  // Post XP to backend
  fetch('/api/add_xp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xp: earnedXP, activity_type: 'learning', details: 'Completed quiz' })
  })
  .then(res => res.json())
  .then((data) => {
    // Flash +XP (prefer server value if provided)
    const xp = (data && typeof data.xp === 'number') ? data.xp : earnedXP;
    if (typeof showXPFlash === 'function') showXPFlash(xp);
    if (typeof updateUserStats === 'function') updateUserStats();
  })
  .catch(() => {});
  document.getElementById('playAgain').addEventListener('click', () => {
    current = 0; score = 0; scoreEl.textContent = '0';
    document.querySelector('.quiz-card').innerHTML = `
      <div class="quiz-header">
        <div class="score-display">Score: <span id="score">0</span></div>
      </div>
      <div class="quiz-body">
        <h2 id="question">Loading...</h2>
        <div class="quiz-options" id="options"></div>
        <div class="quiz-feedback" id="feedback"></div>
      </div>`;
    // Rebind elements
    questionEl = document.getElementById('question');
    optionsDiv = document.getElementById('options');
    feedbackEl = document.getElementById('feedback');
    scoreEl = document.getElementById('score');
    loadQuestion();
  });
}

loadQuestion();
