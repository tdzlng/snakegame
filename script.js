'use strict';

/* ══════════════════════════════════════════════════════════════
   SNAKE  —  Neon Arcade v3.0
   Features: sparky background · multi-cherry food · skin picker
══════════════════════════════════════════════════════════════ */

// ── CANVAS & CONSTANTS ────────────────────────────────────────
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const COLS = 20, ROWS = 20;
const CELL = canvas.width / COLS;

// Spark background canvas
const sparkCv  = document.getElementById('sparkCanvas');
const sparkCtx = sparkCv.getContext('2d');

// ── DOM ───────────────────────────────────────────────────────
const scoreEl   = document.getElementById('score');
const levelEl   = document.getElementById('level');
const cherriesEl= document.getElementById('cherries');
const bestEl    = document.getElementById('best');
const finalEl   = document.getElementById('finalScore');
const startScr  = document.getElementById('startScreen');
const overScr   = document.getElementById('overScreen');
const skinBar   = document.querySelector('.skin-bar');

// ── SNAKE SKINS ───────────────────────────────────────────────
const SKINS = [
  {
    id: 'neon',
    label: 'NEON',
    headColor: '#00ff88',
    bodyFn: (p) => {
      const g = Math.floor(255 * (1 - p * 0.55));
      return `rgb(0,${g},${Math.floor(136 * (1 - p * 0.3))})`;
    },
    glowHead: '#00ff88',
    glowBody: '#00cc6a',
    swatch: ['#00ff88', '#00cc6a'],
  },
  {
    id: 'crimson',
    label: 'CRIMSON',
    headColor: '#ff2d78',
    bodyFn: (p) => {
      const r = Math.floor(255 * (1 - p * 0.4));
      return `rgb(${r},${Math.floor(20*(1-p))},${Math.floor(60*(1-p))})`;
    },
    glowHead: '#ff2d78',
    glowBody: '#cc0044',
    swatch: ['#ff2d78', '#aa0033'],
  },
  {
    id: 'cyber',
    label: 'CYBER',
    headColor: '#00e5ff',
    bodyFn: (p) => {
      const b = Math.floor(255 * (1 - p * 0.5));
      return `rgb(0,${Math.floor(b*0.6)},${b})`;
    },
    glowHead: '#00e5ff',
    glowBody: '#0099bb',
    swatch: ['#00e5ff', '#005577'],
  },
  {
    id: 'gold',
    label: 'GOLD',
    headColor: '#ffe600',
    bodyFn: (p) => {
      const r = Math.floor(255 * (1 - p * 0.3));
      const g = Math.floor(200 * (1 - p * 0.55));
      return `rgb(${r},${g},0)`;
    },
    glowHead: '#ffe600',
    glowBody: '#cc9900',
    swatch: ['#ffe600', '#aa7700'],
  },
  {
    id: 'galaxy',
    label: 'GALAXY',
    headColor: '#bf00ff',
    bodyFn: (p) => {
      const r = Math.floor(140 * (1 - p * 0.5));
      const b = Math.floor(255 * (1 - p * 0.4));
      return `rgb(${r},0,${b})`;
    },
    glowHead: '#bf00ff',
    glowBody: '#7700cc',
    swatch: ['#bf00ff', '#550099'],
  },
  {
    id: 'matrix',
    label: 'MATRIX',
    headColor: '#39ff14',
    bodyFn: (p) => `rgb(0,${Math.floor(180*(1-p*0.7))},0)`,
    glowHead: '#39ff14',
    glowBody: '#007700',
    swatch: ['#39ff14', '#004400'],
  },
];

let currentSkin = SKINS[0];

// Build skin swatch buttons
SKINS.forEach((skin, i) => {
  const btn = document.createElement('button');
  btn.className = 'skin-btn' + (i === 0 ? ' active' : '');
  btn.title = skin.label;
  btn.style.background =
    `linear-gradient(135deg, ${skin.swatch[0]} 0%, ${skin.swatch[1]} 100%)`;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSkin = skin;
  });
  skinBar.appendChild(btn);
});

// ── CHERRY / FOOD TYPES ───────────────────────────────────────
const FOOD_TYPES = [
  // normal cherry — always present, common
  { type: 'normal', emoji: '🍒', color: '#ff2d78', glow: '#ff2d78', points: 10,  weight: 70 },
  // golden cherry — rare, big bonus
  { type: 'golden', emoji: '✨', color: '#ffe600', glow: '#ffe600', points: 50,  weight: 15 },
  // speed cherry — speeds up temporarily
  { type: 'speed',  emoji: '⚡', color: '#00e5ff', glow: '#00e5ff', points: 20,  weight: 10 },
  // skull cherry  — lose a life but massive points
  { type: 'skull',  emoji: '💀', color: '#9900ff', glow: '#bb44ff', points: 100, weight: 5  },
];

const MAX_FOOD  = 4;   // up to 4 cherries on screen at once
const FOOD_TTL  = 300; // ticks before optional cherries expire

// ── GAME STATE ────────────────────────────────────────────────
let snake, dir, nextDir, foods, score, level, lives, cherryCount;
let loop, paused, alive, baseSpeed;
let speedBoostTicks = 0;

let best = parseInt(localStorage.getItem('snakeBest') || '0');
bestEl.textContent = best;
baseSpeed = 150;

// ── SPEED PILLS ───────────────────────────────────────────────
document.querySelectorAll('.pill').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    baseSpeed = parseInt(p.dataset.speed);
    if (alive && !paused) restartLoop();
  });
});

function currentSpeed() {
  const boost = speedBoostTicks > 0 ? 0.5 : 1;
  return Math.max(30, (baseSpeed - (level - 1) * 8) * boost);
}

function restartLoop() {
  clearInterval(loop);
  loop = setInterval(tick, currentSpeed());
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  snake = [{ x:10,y:10 }, { x:9,y:10 }, { x:8,y:10 }];
  dir   = { x:1, y:0 };
  nextDir = { x:1, y:0 };
  foods = [];
  score = 0; level = 1; lives = 3; cherryCount = 0;
  paused = false; alive = true; speedBoostTicks = 0;
  scoreEl.textContent   = 0;
  levelEl.textContent   = 1;
  cherriesEl.textContent= 0;
  spawnFood(); spawnFood(); // start with 2 cherries
  restartLoop();
  draw();
}

// ── FOOD SPAWNING ─────────────────────────────────────────────
function weightedFoodType() {
  const total = FOOD_TYPES.reduce((s, f) => s + f.weight, 0);
  let r = Math.random() * total;
  for (const f of FOOD_TYPES) { r -= f.weight; if (r <= 0) return f; }
  return FOOD_TYPES[0];
}

function spawnFood() {
  if (foods.length >= MAX_FOOD) return;
  let pos, tries = 0;
  do {
    pos = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
    tries++;
  } while (
    tries < 50 &&
    (snake.some(s=>s.x===pos.x&&s.y===pos.y) ||
     foods.some(f=>f.x===pos.x&&f.y===pos.y))
  );
  const ft = weightedFoodType();
  foods.push({ ...pos, ...ft, age: 0 });
}

// ── TICK ──────────────────────────────────────────────────────
function tick() {
  if (paused || !alive) return;

  dir = { ...nextDir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver();
  // Self collision
  if (snake.some(s => s.x===head.x && s.y===head.y)) return gameOver();

  snake.unshift(head);

  // Check food
  const ateIdx = foods.findIndex(f => f.x===head.x && f.y===head.y);
  if (ateIdx !== -1) {
    const ate = foods.splice(ateIdx, 1)[0];
    handleEat(ate);
    spawnFood();
    // Occasionally spawn an extra cherry mid-game
    if (Math.random() < 0.35 && foods.length < MAX_FOOD) spawnFood();
  } else {
    snake.pop();
  }

  // Age foods — expire extras (not index 0)
  foods.forEach(f => f.age++);
  // Remove expired optional cherries (keep at least 1)
  if (foods.length > 1) {
    for (let i = foods.length - 1; i >= 1; i--) {
      if (foods[i].age > FOOD_TTL) { foods.splice(i, 1); spawnFood(); }
    }
  }
  if (foods.length === 0) spawnFood();

  // Speed boost decay
  if (speedBoostTicks > 0) {
    speedBoostTicks--;
    if (speedBoostTicks === 0) restartLoop();
  }

  draw();
}

function handleEat(ate) {
  let pts = ate.points * level;

  if (ate.type === 'skull') {
    // Skull: bonus points but flash red & temporarily halve snake
    score += pts;
    spawnScorePopup(`+${pts} 💀`, ate.x, ate.y, '#bf00ff');
    if (snake.length > 4) snake.splice(Math.ceil(snake.length/2));
    flashCanvas('rgba(150,0,255,0.3)');
  } else if (ate.type === 'speed') {
    score += pts;
    speedBoostTicks = 40;
    restartLoop();
    spawnScorePopup(`+${pts} ⚡`, ate.x, ate.y, '#00e5ff');
  } else if (ate.type === 'golden') {
    score += pts;
    spawnScorePopup(`+${pts} ✨`, ate.x, ate.y, '#ffe600');
    flashCanvas('rgba(255,230,0,0.15)');
  } else {
    score += pts;
    spawnScorePopup(`+${pts}`, ate.x, ate.y, '#ff2d78');
  }

  cherryCount++;
  scoreEl.textContent    = score;
  cherriesEl.textContent = cherryCount;

  // Pop animation
  scoreEl.classList.remove('pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('pop');
  setTimeout(() => scoreEl.classList.remove('pop'), 220);

  // Level up every 10 cherries
  if (cherryCount % 10 === 0) {
    level++;
    levelEl.textContent = level;
    restartLoop();
  }

  if (score > best) {
    best = score;
    localStorage.setItem('snakeBest', best);
    bestEl.textContent = best;
  }
}

// ── FLOATING SCORE POPUPS ─────────────────────────────────────
const popups = [];
function spawnScorePopup(text, gx, gy, color) {
  popups.push({
    text, color,
    x: gx * CELL + CELL/2,
    y: gy * CELL + CELL/2,
    vy: -1.4,
    alpha: 1.0,
    life: 45,
  });
}

function updatePopups() {
  for (let i = popups.length-1; i >= 0; i--) {
    const p = popups[i];
    p.y     += p.vy;
    p.alpha -= 1/p.life;
    p.life--;
    if (p.life <= 0) popups.splice(i, 1);
  }
}

function drawPopups() {
  popups.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.font = 'bold 11px Orbitron, monospace';
    ctx.fillStyle   = p.color;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = p.color;
    ctx.textAlign   = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  });
}

// ── CANVAS FLASH ──────────────────────────────────────────────
function flashCanvas(color) {
  let n = 0;
  const fl = setInterval(() => {
    if (n % 2 === 0) { ctx.fillStyle = color; ctx.fillRect(0,0,canvas.width,canvas.height); }
    else draw();
    n++;
    if (n > 5) clearInterval(fl);
  }, 70);
}

// ── GAME OVER ─────────────────────────────────────────────────
function gameOver() {
  alive = false;
  clearInterval(loop);
  finalEl.innerHTML =
    `SCORE: <b>${score}</b>&nbsp; · &nbsp;LEVEL: <b>${level}</b>&nbsp; · &nbsp;CHERRIES: <b>${cherryCount}</b><br>BEST: <b>${best}</b>`;
  flashCanvas('rgba(255,45,120,0.25)');
  setTimeout(() => overScr.classList.remove('hidden'), 400);
}

// ── DRAW ─────────────────────────────────────────────────────
function draw() {
  // Background
  ctx.fillStyle = '#040d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,229,255,0.035)';
  ctx.lineWidth = 0.5;
  for (let x=0; x<=COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,canvas.height); ctx.stroke();
  }
  for (let y=0; y<=ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(canvas.width,y*CELL); ctx.stroke();
  }

  // Draw all food items
  foods.forEach(f => drawFood(f));

  // Snake (tail → head)
  for (let i = snake.length-1; i >= 0; i--) {
    drawSegment(snake[i], i);
  }
  drawEyes(snake[0], dir);

  // Popups
  updatePopups();
  drawPopups();

  // Speed boost indicator
  if (speedBoostTicks > 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 12;
    ctx.shadowColor = '#00e5ff';
    ctx.strokeRect(2, 2, canvas.width-4, canvas.height-4);
    ctx.restore();
  }
}

// ── DRAW FOOD ─────────────────────────────────────────────────
function drawFood(f) {
  const t     = Date.now() / 380;
  const pulse = 0.82 + 0.18 * Math.sin(t * Math.PI * 2 + f.x * 0.7);
  const fx    = f.x * CELL + CELL/2;
  const fy    = f.y * CELL + CELL/2;
  const fr    = (CELL/2 - 2.5) * pulse;

  // Expiry fade for non-permanent cherries
  const fadeFactor = (f.type !== 'normal' && f.age > FOOD_TTL * 0.7)
    ? 1 - (f.age - FOOD_TTL * 0.7) / (FOOD_TTL * 0.3)
    : 1;

  ctx.save();
  ctx.globalAlpha = fadeFactor;

  // Outer glow aura
  const grd = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 3);
  grd.addColorStop(0, f.color + '55');
  grd.addColorStop(1, f.color + '00');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(fx, fy, fr*3, 0, Math.PI*2); ctx.fill();

  // Core circle
  ctx.shadowBlur  = 20;
  ctx.shadowColor = f.glow;
  ctx.fillStyle   = f.color;
  ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI*2); ctx.fill();

  // Inner shine
  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.arc(fx - fr*0.3, fy - fr*0.3, fr*0.3, 0, Math.PI*2); ctx.fill();

  // Emoji label for special types
  if (f.type !== 'normal') {
    ctx.globalAlpha = fadeFactor * (0.7 + 0.3*Math.sin(t*3));
    ctx.font = `${CELL*0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur  = 6;
    ctx.shadowColor = f.glow;
    ctx.fillText(f.emoji, fx, fy);
  }

  ctx.restore();
}

// ── DRAW SNAKE SEGMENT ────────────────────────────────────────
function drawSegment(seg, i) {
  const skin     = currentSkin;
  const isHead   = i === 0;
  const progress = i / Math.max(snake.length - 1, 1);

  const x   = seg.x * CELL;
  const y   = seg.y * CELL;
  const pad = isHead ? 1 : 2;
  const r   = isHead ? 5 : 3;
  const color = isHead ? skin.headColor : skin.bodyFn(progress);

  ctx.save();
  ctx.shadowBlur  = isHead ? 20 : 9;
  ctx.shadowColor = isHead ? skin.glowHead : skin.glowBody;

  roundRect(ctx, x+pad, y+pad, CELL-pad*2, CELL-pad*2, r);
  ctx.fillStyle = color;
  ctx.fill();

  // Highlight strip
  ctx.shadowBlur = 0;
  ctx.fillStyle  = `rgba(255,255,255,${isHead ? 0.3 : 0.11})`;
  roundRect(ctx, x+pad+2, y+pad+2, CELL-pad*2-4, 3, 1.5);
  ctx.fill();

  // Speed-boost shimmer on head
  if (isHead && speedBoostTicks > 0) {
    ctx.globalAlpha = 0.4 + 0.3*Math.sin(Date.now()/60);
    ctx.fillStyle   = '#00e5ff';
    roundRect(ctx, x+pad, y+pad, CELL-pad*2, CELL-pad*2, r);
    ctx.fill();
  }

  ctx.restore();
}

// ── EYES ──────────────────────────────────────────────────────
function drawEyes(head, d) {
  const cx = head.x*CELL + CELL/2;
  const cy = head.y*CELL + CELL/2;
  const eo = 4, eyeR = 2.2;
  let e1, e2;
  if      (d.x===1)  { e1={x:cx+4,y:cy-eo}; e2={x:cx+4,y:cy+eo}; }
  else if (d.x===-1) { e1={x:cx-4,y:cy-eo}; e2={x:cx-4,y:cy+eo}; }
  else if (d.y===-1) { e1={x:cx-eo,y:cy-4}; e2={x:cx+eo,y:cy-4}; }
  else               { e1={x:cx-eo,y:cy+4}; e2={x:cx+eo,y:cy+4}; }

  ctx.save();
  ctx.fillStyle = '#040810';
  ctx.beginPath(); ctx.arc(e1.x,e1.y,eyeR,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2.x,e2.y,eyeR,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(e1.x+0.5,e1.y-0.5,eyeR*0.45,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(e2.x+0.5,e2.y-0.5,eyeR*0.45,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// ── ROUND RECT ────────────────────────────────────────────────
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r,y); c.lineTo(x+w-r,y);
  c.quadraticCurveTo(x+w,y,   x+w,y+r);
  c.lineTo(x+w,y+h-r);
  c.quadraticCurveTo(x+w,y+h, x+w-r,y+h);
  c.lineTo(x+r,y+h);
  c.quadraticCurveTo(x,y+h,   x,y+h-r);
  c.lineTo(x,y+r);
  c.quadraticCurveTo(x,y,     x+r,y);
  c.closePath();
}

// ══════════════════════════════════════════════════════════════
//  SPARKY BACKGROUND — electric particles
// ══════════════════════════════════════════════════════════════
const SPARK_COLORS = ['#00ff88','#00e5ff','#ff2d78','#ffe600','#bf00ff'];
const sparks = [];
const NUM_SPARKS = 55;

function resizeSpark() {
  sparkCv.width  = window.innerWidth;
  sparkCv.height = window.innerHeight;
}
window.addEventListener('resize', resizeSpark);
resizeSpark();

function makeSpark() {
  return {
    x: Math.random() * sparkCv.width,
    y: Math.random() * sparkCv.height,
    vx: (Math.random()-0.5)*0.6,
    vy: (Math.random()-0.5)*0.6,
    r: Math.random()*1.8 + 0.4,
    color: SPARK_COLORS[Math.floor(Math.random()*SPARK_COLORS.length)],
    alpha: Math.random()*0.7+0.2,
    flicker: Math.random()*Math.PI*2,
    flickerSpeed: 0.03+Math.random()*0.05,
    trail: [],
    trailLen: Math.floor(Math.random()*18)+6,
  };
}

for (let i=0; i<NUM_SPARKS; i++) sparks.push(makeSpark());

// Lightning bolt pool
const bolts = [];
function maybeLightning() {
  if (Math.random() < 0.008) {
    bolts.push({
      x1: Math.random() * sparkCv.width,
      y1: 0,
      x2: Math.random() * sparkCv.width,
      y2: sparkCv.height,
      life: 6,
      color: SPARK_COLORS[Math.floor(Math.random()*SPARK_COLORS.length)],
      segs: Math.floor(Math.random()*6)+4,
    });
  }
}

function drawLightning(bolt) {
  const pts = [{ x:bolt.x1, y:bolt.y1 }];
  const dy  = (bolt.y2-bolt.y1)/(bolt.segs);
  for (let i=1; i<bolt.segs; i++) {
    pts.push({
      x: bolt.x1 + (bolt.x2-bolt.x1)*(i/bolt.segs) + (Math.random()-0.5)*60,
      y: bolt.y1 + dy*i,
    });
  }
  pts.push({ x:bolt.x2, y:bolt.y2 });

  sparkCtx.save();
  sparkCtx.globalAlpha = (bolt.life/6)*0.55;
  sparkCtx.strokeStyle = bolt.color;
  sparkCtx.lineWidth   = 1.5;
  sparkCtx.shadowBlur  = 18;
  sparkCtx.shadowColor = bolt.color;
  sparkCtx.beginPath();
  sparkCtx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => sparkCtx.lineTo(p.x, p.y));
  sparkCtx.stroke();
  sparkCtx.restore();
}

function animateSparks() {
  sparkCtx.clearRect(0,0,sparkCv.width,sparkCv.height);

  maybeLightning();

  // Bolts
  for (let i=bolts.length-1; i>=0; i--) {
    drawLightning(bolts[i]);
    bolts[i].life--;
    if (bolts[i].life<=0) bolts.splice(i,1);
  }

  sparks.forEach(s => {
    // Move
    s.x += s.vx;
    s.y += s.vy;
    s.flicker += s.flickerSpeed;

    // Wrap
    if (s.x<0) s.x=sparkCv.width;
    if (s.x>sparkCv.width)  s.x=0;
    if (s.y<0) s.y=sparkCv.height;
    if (s.y>sparkCv.height) s.y=0;

    // Record trail
    s.trail.push({ x:s.x, y:s.y });
    if (s.trail.length > s.trailLen) s.trail.shift();

    // Draw trail
    if (s.trail.length > 1) {
      sparkCtx.save();
      for (let i=1; i<s.trail.length; i++) {
        const prog = i/s.trail.length;
        sparkCtx.globalAlpha = prog * s.alpha * 0.45 * (0.6+0.4*Math.sin(s.flicker));
        sparkCtx.strokeStyle = s.color;
        sparkCtx.lineWidth   = s.r * prog * 0.9;
        sparkCtx.shadowBlur  = 8;
        sparkCtx.shadowColor = s.color;
        sparkCtx.beginPath();
        sparkCtx.moveTo(s.trail[i-1].x, s.trail[i-1].y);
        sparkCtx.lineTo(s.trail[i].x,   s.trail[i].y);
        sparkCtx.stroke();
      }
      sparkCtx.restore();
    }

    // Draw core dot
    sparkCtx.save();
    sparkCtx.globalAlpha = s.alpha * (0.75+0.25*Math.sin(s.flicker*2));
    sparkCtx.shadowBlur  = 14;
    sparkCtx.shadowColor = s.color;
    sparkCtx.fillStyle   = s.color;
    sparkCtx.beginPath();
    sparkCtx.arc(s.x, s.y, s.r + 0.5*Math.sin(s.flicker), 0, Math.PI*2);
    sparkCtx.fill();
    sparkCtx.restore();
  });

  requestAnimationFrame(animateSparks);
}
animateSparks();

// ── INPUT ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': if (dir.y!==1)  nextDir={x:0,y:-1}; break;
    case 'ArrowDown':  case 's': case 'S': if (dir.y!==-1) nextDir={x:0,y:1};  break;
    case 'ArrowLeft':  case 'a': case 'A': if (dir.x!==1)  nextDir={x:-1,y:0}; break;
    case 'ArrowRight': case 'd': case 'D': if (dir.x!==-1) nextDir={x:1,y:0};  break;
    case ' ':
      if (!alive) return;
      paused = !paused;
      if (!paused) restartLoop();
      break;
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});

let touchStart = null;
canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, {passive:true});
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.clientX;
  const dy = e.changedTouches[0].clientY - touchStart.clientY;
  if (Math.abs(dx)>Math.abs(dy)) {
    if (dx>20 && dir.x!==-1)  nextDir={x:1,y:0};
    if (dx<-20 && dir.x!==1)  nextDir={x:-1,y:0};
  } else {
    if (dy>20 && dir.y!==-1)  nextDir={x:0,y:1};
    if (dy<-20 && dir.y!==1)  nextDir={x:0,y:-1};
  }
  touchStart = null;
}, {passive:true});

// ── BUTTONS ──────────────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', () => {
  startScr.classList.add('hidden');
  init();
});
document.getElementById('restartBtn').addEventListener('click', () => {
  overScr.classList.add('hidden');
  init();
});

// ── INITIAL PREVIEW ───────────────────────────────────────────
snake = [{ x:10,y:10 },{ x:9,y:10 },{ x:8,y:10 }];
dir   = { x:1, y:0 };
foods = [
  { x:14, y:8,  ...FOOD_TYPES[0], age:0 },
  { x:5,  y:14, ...FOOD_TYPES[1], age:0 },
  { x:16, y:15, ...FOOD_TYPES[2], age:0 },
];
alive = false;
popups.length = 0;
draw();
