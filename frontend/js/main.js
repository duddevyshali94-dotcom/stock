const state = {
  target: [],
  guesses: Array.from({ length: 5 }, () => ({ h: 180, s: 50, l: 50 })),
  currentIndex: 0,
  hard: false,
  runningRound: false
};

const el = {
  soloBtn: document.querySelector('#soloBtn'),
  multiBtn: document.querySelector('#multiBtn'),
  multiplayerNote: document.querySelector('#multiplayerNote'),
  hardMode: document.querySelector('#hardMode'),
  timerRange: document.querySelector('#timerRange'),
  timerValue: document.querySelector('#timerValue'),
  startBtn: document.querySelector('#startBtn'),
  previewSection: document.querySelector('#previewSection'),
  previewPalette: document.querySelector('#previewPalette'),
  countdownText: document.querySelector('#countdownText'),
  guessSection: document.querySelector('#guessSection'),
  guessTabs: document.querySelector('#guessTabs'),
  guessSwatch: document.querySelector('#guessSwatch'),
  hue: document.querySelector('#hue'),
  sat: document.querySelector('#sat'),
  lit: document.querySelector('#lit'),
  hslReadout: document.querySelector('#hslReadout'),
  submitBtn: document.querySelector('#submitBtn'),
  resultsSection: document.querySelector('#resultsSection'),
  score: document.querySelector('#score'),
  accuracyText: document.querySelector('#accuracyText'),
  resultsGrid: document.querySelector('#resultsGrid'),
  playAgainBtn: document.querySelector('#playAgainBtn'),
  keepBtn: document.querySelector('#keepBtn')
};

const hsl = ({ h, s, l }) => `hsl(${h} ${s}% ${l}%)`;
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateTargets() {
  state.target = Array.from({ length: 5 }, () => ({
    h: random(0, 360),
    s: state.hard ? random(15, 100) : random(45, 95),
    l: state.hard ? random(10, 90) : random(35, 70)
  }));
}

function renderPreview() {
  el.previewPalette.innerHTML = '';
  state.target.forEach((color) => {
    const swatch = document.createElement('div');
    swatch.style.background = hsl(color);
    el.previewPalette.appendChild(swatch);
  });
}

function renderGuessControls() {
  el.guessTabs.innerHTML = '';
  state.guesses.forEach((_, i) => {
    const tab = document.createElement('button');
    tab.className = `tab ${state.currentIndex === i ? 'active' : ''}`;
    tab.textContent = `Color ${i + 1}`;
    tab.addEventListener('click', () => {
      state.currentIndex = i;
      loadCurrentGuess();
      renderGuessControls();
    });
    el.guessTabs.appendChild(tab);
  });
}

function loadCurrentGuess() {
  const c = state.guesses[state.currentIndex];
  el.hue.value = c.h;
  el.sat.value = c.s;
  el.lit.value = c.l;
  updateGuessPreview();
}

function updateGuessPreview() {
  const c = state.guesses[state.currentIndex];
  c.h = Number(el.hue.value);
  c.s = Number(el.sat.value);
  c.l = Number(el.lit.value);
  el.guessSwatch.style.background = hsl(c);
  el.hslReadout.textContent = `H${c.h} S${c.s} L${c.l}`;
}

function colorDelta(a, b) {
  const hueGap = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180;
  const satGap = Math.abs(a.s - b.s) / 100;
  const litGap = Math.abs(a.l - b.l) / 100;
  return (hueGap + satGap + litGap) / 3;
}

function showResults() {
  if (!state.target.length) return;
  let total = 0;
  el.resultsGrid.innerHTML = '';

  state.target.forEach((real, i) => {
    const guess = state.guesses[i];
    const perColor = Math.max(0, 10 * (1 - colorDelta(real, guess)));
    total += perColor;

    const box = document.createElement('div');
    box.className = 'result-box';
    box.innerHTML = `<div class="guess" style="background:${hsl(guess)}"></div><div class="real" style="background:${hsl(real)}"></div>`;
    box.title = `Color ${i + 1}: ${perColor.toFixed(2)}/10`;
    el.resultsGrid.appendChild(box);
  });

  el.score.textContent = total.toFixed(2);
  el.accuracyText.textContent = `Average accuracy: ${(total / 5).toFixed(2)}/10 per color`;
  el.resultsSection.classList.remove('hidden');
}

async function startRound() {
  if (state.runningRound) return;
  state.runningRound = true;
  state.hard = el.hardMode.checked;
  generateTargets();
  renderPreview();
  el.resultsSection.classList.add('hidden');
  el.guessSection.classList.add('hidden');
  el.previewSection.classList.remove('hidden');

  let remaining = Number(el.timerRange.value);
  el.countdownText.textContent = `${remaining}s`;

  await new Promise((resolve) => {
    const iv = setInterval(() => {
      remaining -= 1;
      el.countdownText.textContent = `${Math.max(remaining, 0)}s`;
      if (remaining <= 0) {
        clearInterval(iv);
        resolve();
      }
    }, 1000);
  });

  state.guesses = Array.from({ length: 5 }, () => ({ h: 180, s: 50, l: 50 }));
  state.currentIndex = 0;
  renderGuessControls();
  loadCurrentGuess();

  el.previewSection.classList.add('hidden');
  el.guessSection.classList.remove('hidden');
  state.runningRound = false;
}

el.timerRange.addEventListener('input', () => {
  el.timerValue.textContent = el.timerRange.value;
});

el.startBtn.addEventListener('click', startRound);
el.submitBtn.addEventListener('click', showResults);
el.playAgainBtn.addEventListener('click', startRound);
el.keepBtn.addEventListener('click', () => {
  el.resultsSection.classList.add('hidden');
});
el.multiBtn.addEventListener('click', () => {
  el.multiplayerNote.classList.remove('hidden');
  el.multiBtn.classList.add('active');
  el.soloBtn.classList.remove('active');
});
el.soloBtn.addEventListener('click', () => {
  el.multiplayerNote.classList.add('hidden');
  el.soloBtn.classList.add('active');
  el.multiBtn.classList.remove('active');
});
[el.hue, el.sat, el.lit].forEach((input) => input.addEventListener('input', updateGuessPreview));

updateGuessPreview();
