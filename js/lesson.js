/* ============================================================
   ANDE — lesson.js
   Runs on every standalone lesson page (lessons/*.html).
   Expects:
     - lang.js loaded first  (provides UI_STRINGS)
     - A lesson data file loaded second (e.g. compound-interest.js)
     - A global LESSON_DATA variable pointing to the lesson object
   ============================================================ */

const currentLang = 'de';

/* ── Helpers ──────────────────────────────────────────────── */

function t(key) {
  return UI_STRINGS[currentLang]?.[key] ?? UI_STRINGS['en']?.[key] ?? key;
}

function applyUIStrings() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.documentElement.lang = currentLang;
}


/* ── Lesson renderer ──────────────────────────────────────── */

function renderLesson(lessonObj) {
  const data = lessonObj[currentLang] ?? lessonObj['en'];
  const meta = data.meta;

  document.title = meta.title + ' – Ande';
  document.getElementById('lessonTag').textContent              = meta.tag;
  document.getElementById('lessonTitle').textContent            = meta.title;
  document.getElementById('lessonLead').textContent             = meta.lead;
  document.getElementById('breadcrumb-category').textContent    = meta.category;
  document.getElementById('breadcrumb-title').textContent       = meta.title;

  // Fix back-links to point at the correct path from lessons/
  document.querySelectorAll('[data-i18n="back_curriculum"]').forEach(el => {
    if (el.tagName === 'A') el.href = '../pages/curriculum.html';
  });

  // Next-lesson button
  const btnNext = document.getElementById('btnNext');
  if (btnNext) {
    if (meta.nextHref) {
      btnNext.href        = meta.nextHref;
      btnNext.textContent = meta.next;
    } else {
      btnNext.style.display = 'none';
    }
  }

  // Render content blocks
  const body = document.getElementById('lessonBody');
  body.innerHTML = '';
  data.sections.forEach(block => body.appendChild(renderBlock(block)));

  // Init interactive demo if present
  if (data.sections.some(b => b.type === 'demo')) updateDemo();

  // Typeset any MathJax in the newly rendered lesson body
  if (window.MathJax) MathJax.typesetPromise([body]);
}

function renderBlock(block) {
  switch (block.type) {

    case 'h2': {
      const el = document.createElement('h2');
      el.textContent = block.text;
      return el;
    }

    case 'p': {
      const el = document.createElement('p');
      el.innerHTML = block.text;
      return el;
    }

    case 'intuition': {
      const el = document.createElement('div');
      el.className = 'intuition-box';
      el.innerHTML = `<div class="ib-title">${block.title}</div><p>${block.text}</p>`;
      return el;
    }

    case 'callout': {
      const el = document.createElement('div');
      el.className = 'callout';
      el.innerHTML = block.text;
      return el;
    }

    case 'math': {
      /* Use a display-math block rendered by MathJax */
      const el = document.createElement('div');
      el.className = 'math-block-display';
      // Wrap in \[ \] so MathJax renders it as display math
      el.innerHTML = `\\[${block.text}\\]`;
      return el;
    }

    case 'demo': {
      const L  = block.labels;
      const el = document.createElement('div');
      el.className      = 'demo-box';
      el.id             = 'demoBox';
      el.dataset.labels = JSON.stringify(L);
      el.innerHTML = `
        <div class="demo-title">${L.title}</div>
        <div class="demo-row">
          <label>${L.principal}</label>
          <input type="range" min="100" max="10000" step="100" value="1000" id="principal" oninput="updateDemo()">
          <span class="val">€<span id="pval">1.000</span></span>
        </div>
        <div class="demo-row">
          <label>${L.rate}</label>
          <input type="range" min="1" max="20" step="0.5" value="7" id="rate" oninput="updateDemo()">
          <span class="val"><span id="rval">7</span>%</span>
        </div>
        <div class="demo-row">
          <label>${L.years}</label>
          <input type="range" min="1" max="40" step="1" value="20" id="years" oninput="updateDemo()">
          <span class="val"><span id="yval">20</span> <span id="yearSuffix">${L.yearSuffix}</span></span>
        </div>
        <div class="result-display">
          <span class="label">${L.finalValue}</span>
          <span class="number" id="result">€3.870</span>
          <span class="unit" id="result-mult">× 3,87 ${L.multiplier}</span>
        </div>
        <div class="bar-chart-wrap" id="barChart"></div>
      `;
      return el;
    }

    case 'worked': {
      const stepsHTML = block.steps.map((s, i) => `
        <div class="we-step">
          <div class="we-num">${i + 1}</div>
          <div class="we-content">
            <div class="we-title">${s.title}</div>
            <div class="we-text">${s.text}</div>
            ${s.math ? `<div class="math-block-display">\\[${s.math}\\]</div>` : ''}
          </div>
        </div>`).join('');
      const el = document.createElement('div');
      el.className = 'worked-example';
      el.innerHTML = `<div class="we-header">${block.header}</div><div class="we-body">${stepsHTML}</div>`;
      return el;
    }

    case 'tasks': {
      const el = document.createElement('div');
      el.className = 'tasks-section';

      const itemsHTML = block.items.map((item, i) => {
        const solutionSteps = item.steps.map(s => `
          <div class="solution-step">
            <p>${s.text}</p>
            ${s.math ? `<div class="math-block-display">\\[${s.math}\\]</div>` : ''}
          </div>`).join('');

        return `
          <div class="task-item">
            <div class="task-number">${t('tasks_title')} ${i + 1}</div>
            <div class="task-question">${item.question}</div>
            <button class="task-toggle" onclick="toggleSolution(this)" data-open="false">
              ${t('tasks_show')}
            </button>
            <div class="task-solution" hidden>
              ${solutionSteps}
            </div>
          </div>`;
      }).join('');

      el.innerHTML = `<h2 class="tasks-heading">${block.header}</h2>${itemsHTML}`;
      return el;
    }

    default:
      console.warn(`[Ande] Unknown block type: "${block.type}"`);
      return document.createDocumentFragment();
  }
}

function toggleSolution(btn) {
  const solution = btn.nextElementSibling;
  const isOpen   = btn.dataset.open === 'true';
  if (isOpen) {
    solution.hidden  = true;
    btn.dataset.open = 'false';
    btn.textContent  = t('tasks_show');
  } else {
    solution.hidden  = false;
    btn.dataset.open = 'true';
    btn.textContent  = t('tasks_hide');
    if (window.MathJax) MathJax.typesetPromise([solution]);
  }
}


/* ── Interactive demo ─────────────────────────────────────── */

function updateDemo() {
  const principalEl = document.getElementById('principal');
  const rateEl      = document.getElementById('rate');
  const yearsEl     = document.getElementById('years');
  if (!principalEl || !rateEl || !yearsEl) return;

  const P = parseFloat(principalEl.value);
  const r = parseFloat(rateEl.value) / 100;
  const n = parseInt(yearsEl.value, 10);
  const A = P * Math.pow(1 + r, n);

  const demoBox        = document.getElementById('demoBox');
  const labels         = demoBox ? JSON.parse(demoBox.dataset.labels) : {};
  const multiplierWord = labels.multiplier ?? 'original';

  const mult    = A / P;
  const multStr = mult >= 100 ? Math.round(mult).toLocaleString() : mult.toFixed(2);

  document.getElementById('pval').textContent        = Math.round(P).toLocaleString('de-DE');
  document.getElementById('rval').textContent        = (r * 100).toFixed(1);
  document.getElementById('yval').textContent        = n;
  document.getElementById('result').textContent      = '€' + Math.round(A).toLocaleString('de-DE');
  document.getElementById('result-mult').textContent = '× ' + multStr + ' ' + multiplierWord;

  renderBarChart(P, r, n, labels.yearSuffix ?? 'J.');
}

function renderBarChart(P, r, n, yearSuffix) {
  const chart = document.getElementById('barChart');
  if (!chart) return;

  chart.innerHTML = '';

  const CHART_H    = 110;
  const MIN_BASE_H = 6;
  const MAX_LABELS = 10;
  const BAR_LIMIT  = 40;

  const maxGrowth = P * Math.pow(1 + r, n) - P;
  const interval  = Math.max(1, Math.ceil(n / BAR_LIMIT));
  const years     = [];

  for (let y = 0; y <= n; y += interval) years.push(y);
  if (years[years.length - 1] !== n) years.push(n);

  const labelStride = Math.ceil(years.length / MAX_LABELS);

  years.forEach((y, i) => {
    const growth  = P * Math.pow(1 + r, y) - P;
    const growthH = maxGrowth > 0
      ? Math.max(0, Math.round((growth / maxGrowth) * CHART_H))
      : 0;
    const showLabel = (i % labelStride === 0) || (i === years.length - 1);

    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `
      <div class="bar-inner bar-growth" style="height:${growthH}px"></div>
      <div class="bar-inner bar-base"   style="height:${MIN_BASE_H}px"></div>
      <div class="bar-year">${showLabel ? y + yearSuffix : ''}</div>
    `;
    chart.appendChild(col);
  });
}


/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  applyUIStrings();
  if (typeof LESSON_DATA !== 'undefined') {
    renderLesson(LESSON_DATA);
  } else {
    console.error('[Ande] LESSON_DATA not defined. Did you load the lesson data file?');
  }
});
