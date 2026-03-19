/* ─────────────────────────────────────────────────────────────────────
   Ken je Kamerlid — script.js
   Three-state quiz: cover → reveal → fact
   Data from kamerleden_basis.json — no external API.
   ───────────────────────────────────────────────────────────────────── */

/* ── App state ──────────────────────────────────────────────────────── */
let kamerleden    = [];      // full array from JSON
let queue         = [];      // shuffled index array
let queuePos      = 0;       // current position in queue
let currentMember = null;    // currently displayed MP

/* ── DOM refs ────────────────────────────────────────────────────────── */
const body        = document.body;
const statusMsg   = document.getElementById('status-msg');
const photo       = document.getElementById('photo');
const partyLogo   = document.getElementById('party-logo');
const mpName      = document.getElementById('mp-name');
const mpPartyLbl  = document.getElementById('mp-party-label');
const mpMeta      = document.getElementById('mp-meta');
const factText    = document.getElementById('fact-text');
const waBtn       = document.getElementById('wa-btn');
const copyBtn     = document.getElementById('copy-btn');
const revealBtn   = document.getElementById('reveal-btn');
const nextBtn     = document.getElementById('next-btn');
const streakEl    = document.getElementById('streak-count');

/* ── Streak (persists within session) ──────────────────────────────── */
let streak = parseInt(sessionStorage.getItem('kk-streak') || '0', 10);
streakEl.textContent = streak;

function incrementStreak() {
  streak += 1;
  sessionStorage.setItem('kk-streak', String(streak));
  streakEl.textContent = streak;
}

/* ── Shuffle / queue ─────────────────────────────────────────────────── */

/** Fisher-Yates shuffle — returns a new array. */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build (or rebuild) the shuffled index queue. */
function buildQueue() {
  queue    = shuffle(kamerleden.map((_, i) => i));
  queuePos = 0;
}

/** Pop next member from queue; reshuffles when exhausted. */
function dequeueNext() {
  if (queuePos >= queue.length) {
    buildQueue();
    // Avoid immediate repeat: if the reshuffled queue starts with the
    // same member we just showed, move them to the end.
    if (currentMember && kamerleden[queue[0]] === currentMember && queue.length > 1) {
      queue.push(queue.shift());
    }
  }
  return kamerleden[queue[queuePos++]];
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Returns '#1a1a1a' or '#ffffff' for legible text on the given hex bg. */
function contrastColor(hex) {
  if (!hex || hex.length < 7) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.52 ? '#1a1a1a' : '#ffffff';
}

/** Fallback avatar when photo is missing or fails to load. */
function avatarUrl(naam) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(naam)}&size=400&background=c8c4bc&color=555555&bold=true`;
}

/**
 * Upgrade Tweede Kamer thumbnail URLs to the original full-resolution file.
 * The JSON contains derivative URLs like /styles/thumbnail/public/path.jpg
 * Stripping the style path gives the source file at full quality.
 * Falls back to the original URL if the pattern doesn't match.
 */
function getPhotoUrl(member) {
  const url = member.kamerlid_foto;
  if (!url) return avatarUrl(member.naam);

  // Remove Drupal image style derivative path + itok token to get original file
  if (url.includes('/styles/thumbnail/public/')) {
    return url
      .replace('/styles/thumbnail/public/', '/')
      .replace(/[?&]itok=[^&]*/g, '');
  }
  return url;
}

/* ── State machine ───────────────────────────────────────────────────── */

function setState(s) {
  body.dataset.state = s;
}

/**
 * Load a member's data into the DOM without changing state.
 * Safe to call before transitioning to cover state.
 */
function loadMember(member) {
  currentMember = member;

  const kleur = member.partij_kleur || '#333333';

  // Apply party colour as CSS custom property
  body.style.setProperty('--party-color', kleur);

  // Photo — use upgraded URL with fallback chain
  const fullRes  = getPhotoUrl(member);
  const original = member.kamerlid_foto || null;
  photo.src = fullRes;
  photo.alt = member.naam;
  photo.onerror = () => {
    // Full-res failed → try original thumbnail
    if (original && photo.src !== original) {
      photo.src = original;
    } else {
      // Thumbnail also failed → avatar
      photo.src = avatarUrl(member.naam);
    }
    photo.onerror = () => {
      photo.src = avatarUrl(member.naam);
      photo.onerror = null;
    };
  };

  // Party logo
  if (member.partij_logo) {
    partyLogo.src = member.partij_logo;
    partyLogo.alt = member.partij || '';
    partyLogo.onerror = () => { partyLogo.src = ''; partyLogo.onerror = null; };
  } else {
    partyLogo.src = '';
  }

  // Identity (visible only in reveal/fact — CSS handles hiding)
  mpName.textContent     = member.naam   || '';
  mpPartyLbl.textContent = member.partij || '';

  // Age + woonplaats
  const metaParts = [];
  if (member.leeftijd)    metaParts.push(`${member.leeftijd} jaar`);
  if (member.woonplaats)  metaParts.push(member.woonplaats);
  mpMeta.textContent = metaParts.join(' · ');

  // Fact card
  factText.textContent = member.feit || '(geen feit beschikbaar)';
}

/**
 * Transition: cover → reveal → fact
 * Called when user taps "Onthullen →".
 */
function doReveal() {
  // Dismiss the first-visit hint permanently
  if (!body.hasAttribute('data-hint-dismissed')) {
    body.setAttribute('data-hint-dismissed', '1');
    sessionStorage.setItem('kk-hint-dismissed', '1');
  }

  setState('reveal');

  // After the photo+fact-card animation window, move to FACT state
  // to show the "Volgende Kamerlid →" button.
  setTimeout(() => {
    setState('fact');
    incrementStreak();
  }, 500);
}

/**
 * Transition: fact → shuffling → cover (next round).
 * Cycles through random photos with a slowing-down effect, then
 * settles on the chosen next member.
 */
function doNext() {
  const next = dequeueNext();

  // Snap to shuffling state (hides fact card and buttons instantly)
  setState('shuffling');

  // Respect reduced-motion preference — skip animation entirely
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loadMember(next);
    setState('cover');
    return;
  }

  // Shuffle timing: intervals increase (easing out) from fast → slow
  const intervals = [55, 65, 80, 105, 140, 190, 260];
  let tick = 0;

  function cycle() {
    if (tick < intervals.length) {
      // Flash a random member's photo
      const rand = kamerleden[Math.floor(Math.random() * kamerleden.length)];
      photo.src = getPhotoUrl(rand);
      photo.onerror = () => { photo.src = avatarUrl(rand.naam); photo.onerror = null; };
      setTimeout(cycle, intervals[tick++]);
    } else {
      // Animation complete — load real next member and go to cover
      loadMember(next);
      setState('cover');
    }
  }

  cycle();
}

/* ── Share ───────────────────────────────────────────────────────────── */

/** Build the shareable text as specified. */
function buildShareText() {
  if (!currentMember) return '';
  const naam = currentMember.naam  || '';
  const feit = currentMember.feit  || '';
  return `Wist jij dit al over ${naam}? 🇳🇱 ${feit} — ken jij alle kamerleden? https://kenjekamerlid.nl`;
}

waBtn.addEventListener('click', () => {
  const url = `https://wa.me/?text=${encodeURIComponent(buildShareText())}`;
  window.open(url, '_blank', 'noopener,noreferrer');
});

copyBtn.addEventListener('click', async () => {
  const text = buildShareText();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older / restricted mobile browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copyBtn.textContent = '✓ Gekopieerd!';
    copyBtn.classList.add('is-copied');
    setTimeout(() => {
      copyBtn.textContent = '📋 Kopieer';
      copyBtn.classList.remove('is-copied');
    }, 1500);
  } catch (_) {
    copyBtn.textContent = '❌ Mislukt';
    setTimeout(() => { copyBtn.textContent = '📋 Kopieer'; }, 1500);
  }
});

/* ── Button event listeners ──────────────────────────────────────────── */
revealBtn.addEventListener('click', doReveal);
nextBtn.addEventListener('click', doNext);

/* ── Data loading ────────────────────────────────────────────────────── */
async function loadData() {
  setState('loading');
  try {
    const res = await fetch('kamerleden_basis.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    kamerleden = await res.json();

    if (!Array.isArray(kamerleden) || kamerleden.length === 0) {
      throw new Error('Geen kamerleden gevonden in JSON.');
    }

    // Build shuffled queue
    buildQueue();

    // Restore hint-dismissed flag from session
    if (sessionStorage.getItem('kk-hint-dismissed')) {
      body.setAttribute('data-hint-dismissed', '1');
    }

    // Load first member and enter cover state
    loadMember(dequeueNext());
    setState('cover');

  } catch (err) {
    statusMsg.textContent = `Laden mislukt: ${err.message} — herlaad de pagina.`;
    setState('error');
  }
}

loadData();
