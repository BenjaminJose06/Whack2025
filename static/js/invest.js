// Investing & Credit: compound growth vs debt
(function(){
  'use strict';

  const amountEl = document.getElementById('amount');
  const rateEl = document.getElementById('rate');
  const yearsEl = document.getElementById('years');
  const freqEl = document.getElementById('frequency');
  const showDebtEl = document.getElementById('showDebt');
  const updateBtn = document.getElementById('updateBtn');
  const resetBtn = document.getElementById('resetBtn');
  const chartCanvas = document.getElementById('growthChart');

  const finalSavingsEl = document.getElementById('finalSavings');
  const savingsInterestEl = document.getElementById('savingsInterest');
  const debtStatEl = document.getElementById('debtStat');
  const debtLegendEl = document.getElementById('debtLegend');
  const finalDebtEl = document.getElementById('finalDebt');
  const debtInterestEl = document.getElementById('debtInterest');

  let chart;

  function sanitizePositiveNum(el, fallback){
    const v = parseFloat(el.value);
    return isFinite(v) && v >= 0 ? v : fallback;
  }

  function computeSeries(principal, aprPct, years, n){
    // Return monthly/yearly points across the duration (aligned to n frequency)
    const r = aprPct / 100;
    const stepsPerYear = Math.max(1, Math.round(n));
    const totalSteps = Math.floor(years * stepsPerYear);
    const labels = [];
    const values = [];
    for (let s=0; s<= totalSteps; s++){
      const tYears = s / stepsPerYear;
      const amount = principal * Math.pow(1 + r/stepsPerYear, s);
      labels.push(tYears.toFixed(2));
      values.push(amount);
    }
    return { labels, values };
  }

  function formatMoney(x){
    return x.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  function makeDataset(label, data, color, fill){
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: color.replace('1)', '.15)'),
      tension: 0.25,
      borderWidth: 3,
      pointRadius: 0,
      fill: fill ? 'origin' : false,
    };
  }

  function update(){
    const P = sanitizePositiveNum(amountEl, 1000);
    const r = sanitizePositiveNum(rateEl, 5);
    const y = sanitizePositiveNum(yearsEl, 10);
    const n = sanitizePositiveNum(freqEl, 12);
    const showDebt = !!showDebtEl.checked;

    const savings = computeSeries(P, r, y, n);
    const debt = showDebt ? computeSeries(P, r, y, n) : null; // same math, different framing

    // Build/Update Chart
    const labels = savings.labels.map(v => parseFloat(v));

    const datasets = [
      makeDataset('Savings', savings.values, 'rgba(34,197,94,1)', true),
    ];
    if (showDebt) datasets.push(makeDataset('Debt', debt.values, 'rgba(239,68,68,1)', false));

    if (!chart){
      chart = new Chart(chartCanvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: 'Years' }, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#cfe0ff' } },
            y: { title: { display: true, text: 'Balance (USD)' }, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#cfe0ff' } }
          },
          plugins: {
            legend: { display: true, labels: { color: '#cfe0ff' } },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}` } }
          },
          layout: { padding: 8 },
          color: '#cfe0ff'
        }
      });
    } else {
      chart.data.labels = labels;
      chart.data.datasets = datasets;
      chart.update();
    }

    // Stats
    const finalSavings = savings.values[savings.values.length-1];
    finalSavingsEl.textContent = formatMoney(finalSavings);
    savingsInterestEl.textContent = `Interest earned: ${formatMoney(finalSavings - P)}`;

    if (showDebt){
      debtLegendEl.style.display = '';
      debtStatEl.style.display = '';
      const finalDebt = debt.values[debt.values.length-1];
      finalDebtEl.textContent = formatMoney(finalDebt);
      debtInterestEl.textContent = `Interest charged: ${formatMoney(finalDebt - P)}`;
    } else {
      debtLegendEl.style.display = 'none';
      debtStatEl.style.display = 'none';
    }
  }

  function reset(){
    amountEl.value = 1000;
    rateEl.value = 5;
    yearsEl.value = 10;
    freqEl.value = 12;
    showDebtEl.checked = false;
    update();
  }

  // Wire
  updateBtn.addEventListener('click', update);
  resetBtn.addEventListener('click', reset);
  amountEl.addEventListener('input', () => {});
  rateEl.addEventListener('input', () => {});
  yearsEl.addEventListener('input', () => {});
  freqEl.addEventListener('change', () => {});
  showDebtEl.addEventListener('change', update);

  // First render
  window.addEventListener('load', update);
})();
