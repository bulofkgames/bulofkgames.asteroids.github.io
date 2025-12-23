/*
========================================
 Canvas Asteroids (HTML5)
 Baseado no Asteroids clássico
 Correção total e modernização:
 Leonardo Dias Gomes (@BULOFK)
========================================
*/

/* ================= CONSTANTES ================= */

const MAX_SPEED = 220;
const ROT_SPEED = 180;
const ACCELERATION = 200;
const FRICTION = 0.92;

const BULLET_SPEED = 500;
const BULLET_LIFE = 60;

const ASTEROID_SPEED = 60;
const ASTEROID_COUNT = 5;

/* ================= INPUT ================= */

const KEY = {};
window.addEventListener("keydown", e => KEY[e.code] = true);
window.addEventListener("keyup", e => KEY[e.code] = false);

/* ================= CANVAS ================= */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

ctx.strokeStyle = "#fff";
ctx.lineWidth = 2;

/* ================= GAME STATE ================= */

let bullets = [];
let asteroids = [];
let score = 0;

/* ================= SHIP ================= */

const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  rot: 0,
  velX: 0,
  velY: 0,
  shooting: false
};

/* ================= BULLET ================= */

function shoot() {
  bullets.push({
    x: ship.x,
    y: ship.y,
    vx: Math.sin(ship.rot) * BULLET_SPEED,
    vy: -Math.cos(ship.rot) * BULLET_SPEED,
    life: BULLET_LIFE
  });
}

/* ================= ASTEROID ================= */

function spawnAsteroid() {
  const angle = Math.random() * Math.PI * 2;
  asteroids.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: Math.cos(angle) * ASTEROID_SPEED,
    vy: Math.sin(angle) * ASTEROID_SPEED,
    r: 30
  });
}

for (let i = 0; i < ASTEROID_COUNT; i++) spawnAsteroid();

/* ================= UPDATE ================= */

function update(delta) {

  // ROTATION
  if (KEY["ArrowLeft"]) ship.rot -= ROT_SPEED * delta;
  if (KEY["ArrowRight"]) ship.rot += ROT_SPEED * delta;

  // ACCELERATION
  if (KEY["ArrowUp"]) {
    ship.velX += Math.sin(ship.rot) * ACCELERATION * delta;
    ship.velY -= Math.cos(ship.rot) * ACCELERATION * delta;
  }

  // FRICTION
  ship.velX *= FRICTION;
  ship.velY *= FRICTION;

  // LIMIT SPEED
  const speed = Math.hypot(ship.velX, ship.velY);
  if (speed > MAX_SPEED) {
    ship.velX *= MAX_SPEED / speed;
    ship.velY *= MAX_SPEED / speed;
  }

  ship.x += ship.velX * delta;
  ship.y += ship.velY * delta;

  wrap(ship);

  // SHOOT
  if (KEY["Space"] && !ship.shooting) {
    ship.shooting = true;
    shoot();
  }
  if (!KEY["Space"]) ship.shooting = false;

  // BULLETS
  bullets = bullets.filter(b => {
    b.x += b.vx * delta;
    b.y += b.vy * delta;
    b.life--;
    wrap(b);
    return b.life > 0;
  });

  // ASTEROIDS
  asteroids.forEach(a => {
    a.x += a.vx * delta;
    a.y += a.vy * delta;
    wrap(a);
  });

  // COLLISION
  bullets.forEach((b, bi) => {
    asteroids.forEach((a, ai) => {
      if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
        bullets.splice(bi, 1);
        asteroids.splice(ai, 1);
        score += 100;
        spawnAsteroid();
      }
    });
  });
}

/* ================= DRAW ================= */

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.rot);
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawShip();

  // BULLETS
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + b.vx * 0.02, b.y + b.vy * 0.02);
    ctx.stroke();
  });

  // ASTEROIDS
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // SCORE
  ctx.font = "16px monospace";
  ctx.fillText("SCORE: " + score, 10, 20);
}

/* ================= UTILS ================= */

function wrap(o) {
  if (o.x < 0) o.x += canvas.width;
  if (o.x > canvas.width) o.x -= canvas.width;
  if (o.y < 0) o.y += canvas.height;
  if (o.y > canvas.height) o.y -= canvas.height;
}

/* ================= LOOP ================= */

let last = performance.now();
function loop(now) {
  const delta = (now - last) / 1000;
  last = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
