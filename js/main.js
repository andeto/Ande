/* ============================================================
   ANDE — main.js  (home page only)
   Sections:
     1. Language & i18n
     2. UI strings
     3. Lesson registry
     4. Navigation
     5. Tag filter
     6. Difficulty picker
     7. Init
   ============================================================ */


/* ── 1. Language & i18n ───────────────────────────────────── */

const currentLang = 'de';

function t(key) {
  return UI_STRINGS[currentLang]?.[key] ?? UI_STRINGS['en']?.[key] ?? key;
}


/* ── 2. UI strings ────────────────────────────────────────── */

function applyUIStrings() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  // Difficulty picker buttons
  document.querySelectorAll('.diff-btn[data-diff-key]').forEach(btn => {
    btn.textContent = t(btn.dataset.diffKey);
  });

  // Difficulty badges
  const badgeKeys = ['badge_easy', 'badge_medium', 'badge_hard'];
  document.querySelectorAll('.difficulty-badge[data-diff]').forEach(badge => {
    badge.textContent = t(badgeKeys[parseInt(badge.dataset.diff, 10)]);
  });

  document.documentElement.lang = currentLang;
}


/* ── 3. Lesson registry ───────────────────────────────────── */

/**
 * difficulty: 0 = easy, 1 = medium, 2 = hard
 * href: path relative to index.html
 */
const LESSONS = [
  { id: 'compound-interest',  difficulty: 0, available: true,  href: 'lessons/compound-interest.html', area: 'stochastik' },
  { id: 'pythagoras',         difficulty: 0, available: false, href: '',                          area: 'geometrie'  },
  { id: 'derivative',         difficulty: 1, available: false, href: '',                          area: 'analysis'   },
  { id: 'standard-deviation', difficulty: 1, available: false, href: '',                          area: 'stochastik' },
  { id: 'logarithmen',        difficulty: 1, available: false, href: '',                          area: 'algebra'    },
  { id: 'prime-numbers',      difficulty: 2, available: false, href: '',                          area: 'algebra'    },
];

function getRandomLesson(difficulty) {
  const pool = LESSONS.filter(l => l.difficulty === difficulty && l.available);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}


/* ── 4. Navigation ────────────────────────────────────────── */

/**
 * Navigate to a lesson page.
 * @param {string}  href        - relative path to the lesson HTML
 * @param {boolean} comingSoon  - if true, show "coming soon" alert instead
 */
function goLesson(href, comingSoon) {
  if (comingSoon || !href) {
    alert(t('coming_soon'));
    return;
  }
  window.location.href = href;
}


/* ── 5. Tag filter ────────────────────────────────────────── */

let activeFilter = 'all';

/**
 * Filters visible area groups by the selected area key.
 * When 'all' is selected every group is shown.
 */
function filterArea(area) {
  activeFilter = area;

  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.area === area);
  });

  // Show / hide area groups
  document.querySelectorAll('.area-group').forEach(group => {
    const match = area === 'all' || group.dataset.area === area;
    group.style.display = match ? '' : 'none';
  });
}


/* ── 6. Difficulty picker ─────────────────────────────────── */

function openDifficultyPicker() {
  const overlay = document.getElementById('diffOverlay');
  if (!overlay) return;
  overlay.querySelector('[data-i18n="diff_prompt"]').textContent = t('diff_prompt');
  overlay.querySelectorAll('.diff-btn[data-diff-key]').forEach(btn => {
    btn.textContent = t(btn.dataset.diffKey);
  });
  overlay.classList.add('active');
}

function closeDifficultyPicker() {
  document.getElementById('diffOverlay')?.classList.remove('active');
}

function pickDifficulty(difficulty) {
  closeDifficultyPicker();
  const lesson = getRandomLesson(difficulty);
  if (!lesson) {
    alert(t('diff_none'));
    return;
  }
  goLesson(lesson.href, false);
}


/* ── 7. Init ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  applyUIStrings();

  document.getElementById('diffOverlay')?.addEventListener('click', e => {
    if (e.target.id === 'diffOverlay') closeDifficultyPicker();
  });
});
