// Learning.js - Learning zone functionality
document.addEventListener('DOMContentLoaded', function() {
    const lessonCards = document.querySelectorAll('.lesson-card');
    const modal = document.getElementById('lessonModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');
    const submitQuizBtn = document.getElementById('submitQuiz');
    const quizResult = document.getElementById('quizResult');
    
    let currentLesson = null;
    let selectedAnswer = null;
    
    // Lesson data (updated)
    const lessons = {
        quiz: {
            title: "Quiz",
            icon: "�",
            objectives: [
                "Check your understanding quickly",
                "Identify topics to review",
                "Earn XP for correct answers"
            ],
            quiz: {
                question: "Which budget approach is simplest for beginners?",
                options: [
                    "Zero-based budgeting",
                    "The 50/30/20 rule",
                    "Daily cash envelopes",
                    "Only track savings"
                ],
                correct: 1,
                explanation: "The 50/30/20 rule is a simple starting framework: 50% needs, 30% wants, 20% saving/debt."
            }
        },
        reading: {
            title: "Reading",
            icon: "📚",
            objectives: [
                "Learn key money concepts fast",
                "Pick up practical student tips",
                "Build confidence with short reads"
            ],
            quiz: {
                question: "What’s a good first goal for an emergency fund?",
                options: [
                    "$100",
                    "$500–$1,000",
                    "$5,000",
                    "One year of rent"
                ],
                correct: 1,
                explanation: "Many students start with $500–$1,000 and then build toward 3–6 months of expenses."
            }
        },
        simulation: {
            title: "Simulation",
            icon: "🧪",
            objectives: [
                "Practice realistic money decisions",
                "Balance trade-offs under constraints",
                "See outcome impact immediately"
            ],
            quiz: {
                question: "In a tight month, which cut is least harmful long-term?",
                options: [
                    "Skip minimum loan payment",
                    "Delay rent",
                    "Reduce eating out",
                    "Cancel health insurance"
                ],
                correct: 2,
                explanation: "Cutting discretionary spending (like eating out) avoids fees, credit damage, or risk to health."
            }
        }
    };
    
    // Add click handlers to lesson cards
    lessonCards.forEach(card => {
        card.addEventListener('click', function() {
            const lessonType = this.dataset.lesson;
            openLesson(lessonType);
        });
        
        // Add hover animation
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) rotate(2deg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotate(0deg)';
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