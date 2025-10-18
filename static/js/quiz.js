// Simple Quiz client
(function() {
  const root = document.getElementById('quiz-root');
  const state = { questions: [], answers: {}, submitted: false, result: null };

  function el(html) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
  }

  function render() {
    root.innerHTML = '';

    if (state.submitted && state.result) {
      renderResults();
      return;
    }

    const header = el(`
      <div style="background:#fff;border-radius:12px;padding:1rem 1.25rem;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
          <div>
            <strong>${state.questions.length} Questions</strong>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button id="reload" class="play-button">New Quiz</button>
            <button id="submit" class="quiz-button">Submit</button>
          </div>
        </div>
      </div>
    `);

    const list = el('<div style="margin-top:1rem;display:flex;flex-direction:column;gap:1rem;"></div>');
    state.questions.forEach((q, idx) => {
      const qCard = el(`
        <div style="background:#fff;border-radius:12px;padding:1rem 1.25rem;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
          <div style="font-weight:600;margin-bottom:0.5rem;">Q${idx+1}. ${q.question}</div>
          <div>
            ${q.choices.map((c,i)=>`
              <label style="display:block;margin:0.4rem 0;cursor:pointer;">
                <input type="radio" name="q_${q.id}" value="${i}" ${state.answers[q.id]===i? 'checked':''} />
                <span style="margin-left:0.5rem;">${c}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `);
      list.appendChild(qCard);
    });

    root.appendChild(header);
    root.appendChild(list);

    document.getElementById('reload').onclick = () => startQuiz();
    document.getElementById('submit').onclick = () => submit();

    // radio change
    root.querySelectorAll('input[type="radio"]').forEach(r => {
      r.addEventListener('change', (e) => {
        const name = e.target.name; // q_<id>
        const id = parseInt(name.split('_')[1]);
        state.answers[id] = parseInt(e.target.value);
      });
    });
  }

  function renderResults() {
    const { score, total, breakdown, xp_awarded } = state.result;
    const summary = el(`
      <div style="background:#fff;border-radius:12px;padding:1rem 1.25rem;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
          <div><strong>Score:</strong> ${score}/${total}</div>
          <div><strong>XP Awarded:</strong> +${xp_awarded}</div>
          <div style="display:flex;gap:0.5rem;">
            <button id="again" class="play-button">Try Again</button>
          </div>
        </div>
      </div>
    `);

    const details = el('<div style="margin-top:1rem;display:flex;flex-direction:column;gap:1rem;"></div>');
    breakdown.forEach((b, idx) => {
      const q = state.questions.find(x => x.id === b.id);
      const chosen = state.answers[b.id];
      const correctChoice = q.choices[b.correctIndex];
      const chosenText = Number.isInteger(chosen) ? q.choices[chosen] : '(no answer)';

      const card = el(`
        <div style="background:#fff;border-radius:12px;padding:1rem 1.25rem;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
          <div style="font-weight:600;margin-bottom:0.5rem;">Q${idx+1}. ${q.question}</div>
          <div style="margin-bottom:0.5rem;${b.isCorrect ? 'color:#15803d;' : 'color:#dc2626;'}">
            ${b.isCorrect ? '✅ Correct' : '❌ Incorrect'}
          </div>
          <div><strong>Correct answer:</strong> ${correctChoice}</div>
          <div><strong>Your answer:</strong> ${chosenText}</div>
          ${b.explanation ? `<div style="margin-top:0.5rem;">${b.explanation}</div>` : ''}
        </div>
      `);
      details.appendChild(card);
    });

    root.innerHTML = '';
    root.appendChild(summary);
    root.appendChild(details);

    document.getElementById('again').onclick = () => startQuiz();
  }

  async function startQuiz() {
    state.submitted = false;
    state.answers = {};
    root.innerHTML = '<div style="text-align:center;opacity:0.7;">Loading…</div>';
    try {
      const res = await fetch('/api/quiz/start', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ count: 5 }) });
      const data = await res.json();
      state.questions = data.questions || [];
      render();
    } catch (e) {
      root.innerHTML = '<div style="text-align:center;color:#dc2626;">Failed to load quiz.</div>';
      console.error(e);
    }
  }

  async function submit() {
    const answers = Object.keys(state.answers).map(id => ({ id: parseInt(id), selectedIndex: state.answers[id] }));
    try {
      const res = await fetch('/api/quiz/submit', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ answers }) });
      const data = await res.json();
      state.submitted = true;
      state.result = data;
      render();
    } catch (e) {
      alert('Failed to submit quiz');
      console.error(e);
    }
  }

  // boot
  startQuiz();
})();
