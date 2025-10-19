// Crossword game: generates a fresh puzzle each time from finance terms and definitions
(function(){
  'use strict';

  // Finance vocabulary (reuse from Word Search list + definitions)
  const TERMS = [
    'BANK','LOAN','INTEREST','CREDIT','DEBT','MORTGAGE','INVESTMENT','ASSET','LIABILITY','FINANCE','RISK','INSURANCE','CAPITAL','BUDGET','SAVINGS','EXPENSE','REVENUE','PROFIT','CASH','DIVIDEND'
  ];

  const DEFINITIONS = {
    BANK: 'A financial institution that accepts deposits and lends money.',
    LOAN: 'Money borrowed that must be repaid, usually with interest.',
    INTEREST: 'The cost of borrowing money or the return on savings.',
    CREDIT: 'The ability to borrow money or access goods with the promise to pay later.',
    DEBT: 'Money owed to another party.',
    MORTGAGE: 'A loan used to purchase real estate, secured by the property.',
    INVESTMENT: 'An asset or item acquired with the goal of generating income or appreciation.',
    ASSET: 'Something of value owned by an individual or company.',
    LIABILITY: 'A company’s or person’s legal debts or obligations.',
    FINANCE: 'The management of large amounts of money.',
    RISK: 'The chance of loss or uncertainty in an investment.',
    INSURANCE: 'A contract that provides financial protection against certain losses.',
    CAPITAL: 'Wealth in the form of money or assets used to start or maintain a business.',
    BUDGET: 'A plan for income and spending over a period.',
    SAVINGS: 'Money set aside for future use.',
    EXPENSE: 'Money spent to buy goods or services.',
    REVENUE: 'Income earned from normal business activities.',
    PROFIT: 'Financial gain; revenue minus expenses.',
    CASH: 'Coins or banknotes; money in physical form.',
    DIVIDEND: 'A payment made by a corporation to its shareholders.'
  };

  // Grid config (square)
  const SIZE = 13; // generous space

  // DOM
  const startEl = document.getElementById('startScreen');
  const gameEl = document.getElementById('gameScreen');
  const overEl = document.getElementById('gameOverScreen');
  const startBtn = document.getElementById('startButton');
  const newBtn = document.getElementById('newGameButton');
  const playAgainBtn = document.getElementById('playAgainButton');
  const checkBtn = document.getElementById('checkButton');
  const gridEl = document.getElementById('crosswordGrid');
  const acrossEl = document.getElementById('acrossClues');
  const downEl = document.getElementById('downClues');
  const filledEl = document.getElementById('filledCount');
  const totalLettersEl = document.getElementById('totalLetters');
  const finalLettersEl = document.getElementById('finalLetters');
  const pointsFeedbackEl = document.getElementById('pointsFeedback');

  // State
  let grid, blocks, placements, lettersFilled, totalLetters, selectedCell = null, selectedDir = 'across';

  function showPointsFeedback(text, color){
    if (!pointsFeedbackEl) return;
    pointsFeedbackEl.textContent = text;
    pointsFeedbackEl.style.color = color || '#22c55e';
    pointsFeedbackEl.classList.remove('show-points');
    void pointsFeedbackEl.offsetWidth;
    pointsFeedbackEl.classList.add('show-points');
    // hide after ~3s to match global pattern
    clearTimeout(window.__cwPointsTimer);
    window.__cwPointsTimer = setTimeout(()=>{
      pointsFeedbackEl.classList.remove('show-points');
    }, 3000);
  }

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

  // Build an empty grid
  function makeEmpty(){
    grid = Array.from({length: SIZE}, () => Array.from({length: SIZE}, () => ''));
    blocks = Array.from({length: SIZE}, () => Array.from({length: SIZE}, () => false));
  }

  // Simple crossword placer: try to interlock words with existing letters.
  // We alternate trying across/down and greedily place where overlaps occur; fallback to open slots.
  function generatePuzzle(){
    makeEmpty();
    placements = []; // {word, row, col, dir, clueNum}

    const words = shuffle(TERMS.slice());
    let placedCount = 0;

    // place first word across in middle
    const first = words.shift();
    const startCol = Math.max(1, Math.floor((SIZE - first.length)/2));
    const mid = Math.floor(SIZE/2);
    placeWord(first, mid, startCol, 'across');
    placedCount++;

    // Try to place remaining words
    words.forEach(word => {
      if (!tryPlaceWithOverlap(word)) {
        // try random open across/down slots a few times
        for (let t=0; t<60; t++){
          const dir = Math.random() < 0.5 ? 'across' : 'down';
          const r = randInt(0, SIZE-1);
          const c = randInt(0, SIZE-1);
          if (canPlace(word, r, c, dir)) { placeWord(word, r, c, dir); return; }
        }
      }
    });

    // Black out surrounding borders for clarity (optional aesthetic)
    borderBlocks();

    // Compute clue numbering
    numberClues();

    // Derive total letters to fill (unique cells, accounting for overlaps)
    totalLetters = 0;
    for (let r=0; r<SIZE; r++){
      for (let c=0; c<SIZE; c++){
        if (grid[r][c]) totalLetters++;
      }
    }
    lettersFilled = 0;
  }

  function borderBlocks(){
    for(let r=0; r<SIZE; r++){
      for(let c=0; c<SIZE; c++){
        if (grid[r][c] === '') blocks[r][c] = true; // mark as black
      }
    }
  }

  function canPlace(word, row, col, dir){
    if (dir === 'across'){
      if (col + word.length > SIZE) return false;
      // must have clear cell before start (or edge) and after end (or edge)
      if (col > 0 && grid[row][col-1]) return false;
      const endC = col + word.length - 1;
      if (endC < SIZE-1 && grid[row][endC+1]) return false;
      for (let i=0; i<word.length; i++){
        const rr = row, cc = col+i;
        if (blocks[rr][cc]) return false; // hard block
        const ch = grid[rr][cc];
        if (ch && ch !== word[i]) return false;
        // Ensure not adjacent touching (above/below) unless overlapping
        if (!ch){
          if (rr>0 && grid[rr-1][cc]) return false;
          if (rr<SIZE-1 && grid[rr+1][cc]) return false;
        }
      }
      return true;
    } else {
      if (row + word.length > SIZE) return false;
      // must have clear cell before start (or edge) and after end (or edge)
      if (row > 0 && grid[row-1][col]) return false;
      const endR = row + word.length - 1;
      if (endR < SIZE-1 && grid[endR+1][col]) return false;
      for (let i=0; i<word.length; i++){
        const rr = row+i, cc = col;
        if (blocks[rr][cc]) return false;
        const ch = grid[rr][cc];
        if (ch && ch !== word[i]) return false;
        if (!ch){
          if (cc>0 && grid[rr][cc-1]) return false;
          if (cc<SIZE-1 && grid[rr][cc+1]) return false;
        }
      }
      return true;
    }
  }

  function placeWord(word, row, col, dir){
    for (let i=0; i<word.length; i++){
      const rr = dir==='across'? row : row+i;
      const cc = dir==='across'? col+i : col;
      grid[rr][cc] = word[i];
      blocks[rr][cc] = false;
    }
    placements.push({ word, row, col, dir, clueNum: 0 });
  }

  function tryPlaceWithOverlap(word){
    // try to find an intersecting letter with existing grid letters
    for (let r=0; r<SIZE; r++){
      for (let c=0; c<SIZE; c++){
        const ch = grid[r][c];
        for (let i=0; i<word.length; i++){
          if (word[i] === ch) {
            // attempt across with overlap at (r,c)
            const startC = c - i;
            if (startC >= 0 && canPlace(word, r, startC, 'across')){
              placeWord(word, r, startC, 'across');
              return true;
            }
            // attempt down
            const startR = r - i;
            if (startR >= 0 && canPlace(word, startR, c, 'down')){
              placeWord(word, startR, c, 'down');
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  function numberClues(){
    // Assign a single shared number to any Across/Down that start at the same cell
    // 1) collect start cells from placements
    const startsMap = new Map(); // key: "r,c" -> [placements starting here]
    placements.forEach(p => {
      p.clueNum = 0; // reset
      const key = `${p.row},${p.col}`;
      if (!startsMap.has(key)) startsMap.set(key, []);
      startsMap.get(key).push(p);
    });

    // 2) order start cells in reading order (row-major)
    const keys = Array.from(startsMap.keys());
    keys.sort((a,b) => {
      const [ar,ac] = a.split(',').map(Number);
      const [br,bc] = b.split(',').map(Number);
      return ar === br ? ac - bc : ar - br;
    });

    // 3) assign numbers
    let num = 1;
    for (const key of keys){
      const arr = startsMap.get(key);
      for (const p of arr){
        p.clueNum = num; // both across and down at same cell get same number
      }
      num++;
    }
  }

  function buildUI(){
    // grid
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${SIZE}, 36px)`;

    // Create inputs or black cells
    for (let r=0; r<SIZE; r++){
      for (let c=0; c<SIZE; c++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r; cell.dataset.c = c;
        if (!grid[r][c]){
          cell.classList.add('black');
          gridEl.appendChild(cell);
          continue;
        }
        const input = document.createElement('input');
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.inputMode = 'latin';
        input.addEventListener('input', onInput);
        input.addEventListener('focus', () => selectCell(r,c));
        cell.appendChild(input);

        // numbering label if this is a start
        const isStartAcross = (c===0 || !grid[r][c-1]) && (c<SIZE-1 && grid[r][c+1]);
        const isStartDown = (r===0 || !grid[r-1][c]) && (r<SIZE-1 && grid[r+1][c]);
        if (isStartAcross || isStartDown){
          const label = document.createElement('div');
          label.className = 'num';
          // find any placement starting here; both share same number
          const p = placements.find(pl => pl.row===r && pl.col===c && pl.clueNum>0);
          label.textContent = p ? String(p.clueNum) : '';
          cell.appendChild(label);
        }

        gridEl.appendChild(cell);
      }
    }

    // clues
    acrossEl.innerHTML = '';
    downEl.innerHTML = '';

    const byDir = { across: [], down: [] };
    for (const p of placements){ byDir[p.dir].push(p); }
  byDir.across = byDir.across.filter(p=>p.clueNum>0).sort((a,b)=>a.clueNum-b.clueNum);
  byDir.down = byDir.down.filter(p=>p.clueNum>0).sort((a,b)=>a.clueNum-b.clueNum);

    for (const p of byDir.across){
      const li = document.createElement('li');
      li.className = 'clue';
      const num = document.createElement('span');
      num.className = 'clue-num';
      num.textContent = `${p.clueNum}.`;
      const text = document.createElement('span');
      text.textContent = ` ${DEFINITIONS[p.word] || p.word}`;
      li.appendChild(num);
      li.appendChild(text);
      li.dataset.dir='across'; li.dataset.row=p.row; li.dataset.col=p.col;
      li.addEventListener('click', ()=>{ selectWord(p.row, p.col, 'across'); });
      acrossEl.appendChild(li);
    }
    for (const p of byDir.down){
      const li = document.createElement('li');
      li.className = 'clue';
      const num = document.createElement('span');
      num.className = 'clue-num';
      num.textContent = `${p.clueNum}.`;
      const text = document.createElement('span');
      text.textContent = ` ${DEFINITIONS[p.word] || p.word}`;
      li.appendChild(num);
      li.appendChild(text);
      li.dataset.dir='down'; li.dataset.row=p.row; li.dataset.col=p.col;
      li.addEventListener('click', ()=>{ selectWord(p.row, p.col, 'down'); });
      downEl.appendChild(li);
    }

    // counts
    totalLettersEl.textContent = totalLetters;
    filledEl.textContent = 0;

    // focus first cell
    const firstInput = gridEl.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  function selectCell(r,c){
    selectedCell = {r,c};
    // If the current direction is a single-letter word, prefer the other direction if it is longer
    const acrossLen = getWordPath(r,c,'across').length;
    const downLen = getWordPath(r,c,'down').length;
    if (selectedDir === 'across' && acrossLen <= 1 && downLen > 1) selectedDir = 'down';
    if (selectedDir === 'down' && downLen <= 1 && acrossLen > 1) selectedDir = 'across';
    highlightSelection();
  }

  function selectWord(r,c,dir){
    selectedDir = dir;
    selectCell(r,c);
    // focus the first input in that word
    const path = getWordPath(r,c,dir);
    if (path.length){
      const first = path[0];
      const el = getInput(first.r, first.c);
      if (el) el.focus();
    }
  }

  function getInput(r,c){
    const cell = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"] input`);
    return cell || null;
  }

  function getWordPath(r,c,dir){
    // find start
    while (true){
      const nr = dir==='across'? r : r-1;
      const nc = dir==='across'? c-1 : c;
      if (nr<0 || nc<0) break;
      if (!grid[nr]?.[nc]) break;
      r = nr; c = nc;
    }
    // collect path until end
    const path=[];
    while (grid[r]?.[c]){
      path.push({r,c});
      if (dir==='across') c++; else r++;
    }
    return path;
  }

  function highlightSelection(){
    gridEl.querySelectorAll('.cell').forEach(el=>{
      el.classList.remove('selected','highlight');
    });
    if (!selectedCell) return;
    const {r,c} = selectedCell;
    const path = getWordPath(r,c,selectedDir);
    for (const p of path){
      const el = gridEl.querySelector(`.cell[data-r="${p.r}"][data-c="${p.c}"]`);
      if (el) el.classList.add('highlight');
    }
    const curEl = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (curEl) curEl.classList.add('selected');
  }

  function onInput(e){
    const input = e.target;
    const cellEl = input.closest('.cell');
    const r = parseInt(cellEl.dataset.r,10);
    const c = parseInt(cellEl.dataset.c,10);
    const val = (input.value || '').toUpperCase();
    input.value = val.replace(/[^A-Z]/g,'');

    // Count filled letters and check completion of any word
    recalcProgress();

    // Auto advance along selectedDir
    const path = getWordPath(r,c,selectedDir);
    // find index
    const idx = path.findIndex(p=>p.r===r && p.c===c);
    if (idx>=0 && idx < path.length-1){
      const next = getInput(path[idx+1].r, path[idx+1].c);
      if (next) next.focus();
    }
  }

  // Keyboard navigation
  gridEl?.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    if (!active || active.tagName !== 'INPUT') return;
    const cellEl = active.closest('.cell');
    const r = parseInt(cellEl.dataset.r,10);
    const c = parseInt(cellEl.dataset.c,10);
    const path = getWordPath(r,c,selectedDir);
    const idx = path.findIndex(p=>p.r===r && p.c===c);

    if (e.key === 'Backspace' && !active.value && idx > 0){
      e.preventDefault();
      const prev = getInput(path[idx-1].r, path[idx-1].c);
      if (prev){ prev.focus(); prev.value=''; }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp'){
      e.preventDefault();
      let nextIdx = idx;
      const delta = (e.key==='ArrowRight'||e.key==='ArrowDown') ? 1 : -1;
      nextIdx = Math.min(Math.max(idx + delta, 0), path.length-1);
      const next = getInput(path[nextIdx].r, path[nextIdx].c);
      if (next) next.focus();
      return;
    }

    if (e.key === 'Tab'){
      e.preventDefault();
      selectedDir = selectedDir === 'across' ? 'down' : 'across';
      highlightSelection();
    }
  });

  function recalcProgress(){
    const inputs = gridEl.querySelectorAll('input');
    let filled = 0;
    inputs.forEach(i=>{ if ((i.value||'').trim()) filled++; });
    lettersFilled = filled;
    filledEl.textContent = String(filled);

    // Update clue completion and award small XP per completed word
    updateClueStates();

    if (filled >= totalLetters){
      // Validate all words match
      if (allWordsCorrect()){
        setTimeout(()=> finishGame(), 200);
      }
    }
  }

  function updateClueStates(){
    const byDir = { across: [], down: [] };
    for (const p of placements) byDir[p.dir].push(p);

    const awardPerWord = 2; // modest XP per word completed

    function checkList(list, container, dir){
      for (const p of list){
        const li = Array.from(container.children).find(el=>{
          return el.dataset.dir===dir && parseInt(el.dataset.row,10)===p.row && parseInt(el.dataset.col,10)===p.col;
        });
        if (!li) continue;
        const correct = isWordCorrect(p);
        const wasComplete = li.classList.contains('complete');
        if (correct){
          li.classList.add('complete');
          if (!wasComplete){
            showPointsFeedback(`+${awardPerWord} XP`, '#22c55e');
            if (typeof awardXP === 'function') awardXP(awardPerWord, 'game', `Crossword word: ${p.word}`);
          }
        } else {
          li.classList.remove('complete');
        }
      }
    }

    checkList(byDir.across, acrossEl, 'across');
    checkList(byDir.down, downEl, 'down');
  }

  function isWordCorrect(p){
    for (let i=0; i<p.word.length; i++){
      const rr = p.dir==='across'? p.row : p.row+i;
      const cc = p.dir==='across'? p.col+i : p.col;
      const el = getInput(rr,cc);
      const ch = (el && el.value || '').toUpperCase();
      if (ch !== p.word[i]) return false;
    }
    return true;
  }

  function allWordsCorrect(){
    return placements.every(isWordCorrect);
  }

  function finishGame(){
    // award completion XP based on unique letters (scaled)
    const completionXP = Math.max(5, Math.round(totalLetters * 0.5));
    if (typeof awardXP === 'function') awardXP(completionXP, 'game', `Crossword completed (${totalLetters} letters)`);
    if (window.showXPFlash) window.showXPFlash(completionXP);

    finalLettersEl.textContent = String(totalLetters);
    gameEl.style.display = 'none';
    overEl.style.display = 'block';
  }

  function checkAnswers(){
    // simple check, flash green for correct, tiny shake for incorrect words
    if (allWordsCorrect()){
      showPointsFeedback('All correct!', '#22c55e');
    } else {
      showPointsFeedback('Keep going…', '#93a4c8');
    }
  }

  function startGame(){
    generatePuzzle();
    buildUI();
    startEl.style.display = 'none';
    overEl.style.display = 'none';
    gameEl.style.display = 'block';
  }

  // Wire buttons
  if (startBtn) startBtn.addEventListener('click', startGame);
  if (newBtn) newBtn.addEventListener('click', startGame);
  if (playAgainBtn) playAgainBtn.addEventListener('click', startGame);
  if (checkBtn) checkBtn.addEventListener('click', checkAnswers);

})();
