// Learning.js - Learning zone functionality
document.addEventListener('DOMContentLoaded', function() {
    // const lessonCards = document.querySelectorAll('.lesson-card');
    const lessonRows = document.querySelectorAll('.lesson-row');
    const modal = document.getElementById('lessonModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');
    const submitQuizBtn = document.getElementById('submitQuiz');
    const quizResult = document.getElementById('quizResult');
    
    let currentLesson = null;
    let selectedAnswer = null;
    
    // Lesson data
    const lessons = {
        budgeting: {
            title: "Budgeting Basics",
            icon: "💰",
            objectives: [
                "Understand the 50/30/20 rule",
                "Learn to track income and expenses",
                "Create a personal budget plan",
                "Identify areas to cut unnecessary spending"
            ],
            quiz: {
                question: "What does the 50/30/20 rule suggest for your after-tax income?",
                options: [
                    "50% needs, 30% wants, 20% savings",
                    "50% savings, 30% needs, 20% wants",
                    "50% wants, 30% savings, 20% needs",
                    "50% housing, 30% food, 20% entertainment"
                ],
                correct: 0,
                explanation: "The 50/30/20 rule suggests allocating 50% for needs, 30% for wants, and 20% for savings and debt repayment."
            }
        },
        saving: {
            title: "Smart Saving",
            icon: "🏦",
            objectives: [
                "Set up an emergency fund",
                "Understand different types of savings accounts",
                "Learn about compound interest",
                "Create SMART savings goals"
            ],
            quiz: {
                question: "How many months of expenses should you keep in an emergency fund?",
                options: [
                    "1-2 months",
                    "3-6 months",
                    "9-12 months",
                    "24 months"
                ],
                correct: 1,
                explanation: "Financial experts recommend keeping 3-6 months of living expenses in an emergency fund for unexpected situations."
            }
        },
        investing: {
            title: "Investment Fundamentals",
            icon: "📈",
            objectives: [
                "Understand risk vs. return",
                "Learn about diversification",
                "Explore different investment types",
                "Understand compound growth"
            ],
            quiz: {
                question: "What is diversification in investing?",
                options: [
                    "Putting all money in one stock",
                    "Spreading investments across different assets",
                    "Only investing in bonds",
                    "Timing the market perfectly"
                ],
                correct: 1,
                explanation: "Diversification means spreading your investments across different types of assets to reduce risk."
            }
        },
        debt: {
            title: "Debt Management",
            icon: "🏗️",
            objectives: [
                "Understand good vs. bad debt",
                "Learn debt repayment strategies",
                "Explore debt consolidation options",
                "Improve credit score management"
            ],
            quiz: {
                question: "Which debt repayment strategy focuses on paying off the highest interest rate debt first?",
                options: [
                    "Debt snowball",
                    "Debt avalanche",
                    "Minimum payments only",
                    "Debt consolidation"
                ],
                correct: 1,
                explanation: "The debt avalanche method focuses on paying off debts with the highest interest rates first to minimize total interest paid."
            }
        }
    };
    
    // Add click handlers to lesson rows and their "Open" buttons
    // lessonCards.forEach(card => {
    //     card.addEventListener('click', function() {
    //         const lessonType = this.dataset.lesson;
    //         if (lessonType === 'reading') {
    //             window.location.href = '/reading';
    //             return;
    //         }
    //         if (lessonType === 'quiz') {
    //             window.location.href = '/quiz';
    //             return;
    //         }
    //         openLesson(lessonType);
    //     });
    // });

    lessonRows.forEach(row => {
        const handler = () => {
            const lessonType = row.dataset.lesson;
            if (lessonType === 'reading') { window.location.href = '/reading'; return; }
            if (lessonType === 'quiz')    { window.location.href = '/quiz';    return; }
            openLesson(lessonType);
        };
        const btn = row.querySelector('.open-small');
        if (btn) btn.addEventListener('click', handler);
        row.addEventListener('click', (e) => {
            if (e.target.closest('.open-small')) return; // already handled by button
            handler();
        });
    });
    
    // Modal handlers
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
        selectedAnswer = null;
        quizResult.innerHTML = '';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            selectedAnswer = null;
            quizResult.innerHTML = '';
        }
    });
    
    submitQuizBtn.addEventListener('click', submitQuiz);
    
    function openLesson(lessonType) {
        currentLesson = lessons[lessonType];
        if (!currentLesson) return;
        
        modalTitle.textContent = currentLesson.title;
        
        // Build lesson content
        const learningObjectives = document.getElementById('learningObjectives');
        learningObjectives.innerHTML = '';
        currentLesson.objectives.forEach(objective => {
            const li = document.createElement('li');
            li.textContent = objective;
            li.style.marginBottom = '0.5rem';
            learningObjectives.appendChild(li);
        });
        
        // Build quiz content
        const quizContent = document.getElementById('quizContent');
        const quiz = currentLesson.quiz;
        
        quizContent.innerHTML = `
            <div class="quiz-question">${quiz.question}</div>
            <div class="quiz-options">
                ${quiz.options.map((option, index) => `
                    <div class="quiz-option" data-index="${index}">${option}</div>
                `).join('')}
            </div>
        `;
        
        // Add option click handlers
        const options = quizContent.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.addEventListener('click', function() {
                options.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedAnswer = parseInt(this.dataset.index);
            });
        });
        
        modal.style.display = 'block';
        quizResult.innerHTML = '';
        selectedAnswer = null;
    }
    
    function submitQuiz() {
        if (selectedAnswer === null) {
            alert('Please select an answer first!');
            return;
        }
        
        const quiz = currentLesson.quiz;
        const isCorrect = selectedAnswer === quiz.correct;
        
        quizResult.className = `quiz-result ${isCorrect ? 'correct' : 'incorrect'}`;
        quizResult.innerHTML = `
            <strong>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong><br>
            ${quiz.explanation}
        `;
        
        if (isCorrect) {
            // Award XP for correct answer
            awardXP(25, 'learning', `Completed ${currentLesson.title} quiz`);
            updateLessonProgress(currentLesson.title.toLowerCase().replace(' ', '_'));
        }
        
        // Disable submit button
        submitQuizBtn.disabled = true;
        submitQuizBtn.textContent = 'Completed';
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
            if (data.success) {
                showXPGain(points);
                if (data.level_up) {
                    showLevelUp(data.new_level);
                }
            }
        })
        .catch(error => console.error('Error awarding XP:', error));
    }
    
    function showXPGain(points) {
        const xpNotification = document.createElement('div');
        xpNotification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 3000;
            animation: xpGain 2s ease-out forwards;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        `;
        xpNotification.textContent = `+${points} XP!`;
        document.body.appendChild(xpNotification);
        
        setTimeout(() => {
            xpNotification.remove();
        }, 2000);
    }
    
    function showLevelUp(newLevel) {
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
    
    function updateLessonProgress(lessonType) {
        // Update progress bar for completed lesson
        const lessonCard = document.querySelector(`[data-lesson="${lessonType}"]`);
        if (lessonCard) {
            const progressFill = lessonCard.querySelector('.progress-fill');
            const progressText = lessonCard.querySelector('.progress-text');
            
            progressFill.style.width = '100%';
            progressText.textContent = '100% Complete';
        }
    }
});

// Add CSS animations for XP and level up
const style = document.createElement('style');
style.textContent = `
    @keyframes xpGain {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -200%) scale(1);
            opacity: 0;
        }
    }
    
    @keyframes levelUp {
        0% {
            transform: translate(-50%, -50%) scale(0) rotate(-180deg);
            opacity: 0;
        }
        25% {
            transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
            opacity: 1;
        }
        75% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(0.8) rotate(0deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);