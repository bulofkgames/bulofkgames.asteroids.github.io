/* =====================================
 ASTEROIDS HTML5 — ARCADE EDITION
 Original: dmcinnes
 Remaster & Expansion:
 Leonardo Dias Gomes
 YouTube: @BULOFK
===================================== */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

/* ========= CANVAS STYLE ========= */
ctx.strokeStyle = "#fff";
ctx.fillStyle = "#fff";
ctx.lineWidth = 2;
ctx.font = "20px monospace";

/* ========= GAME STATE ========= */
const Game = {
  state: "menu",
  score: 0,
  lives: 3,
  asteroids: [],
  bullets: [],
  particles: [],
  ship: null,
  showCredits: false,
  creditTimer: 0
};

/* ========= INPUT ========= */
const KEY = {};
let SPACE_PRESSED = false;

addEventListener("keydown", e => {
  if (!KEY[e.code]) {
    if (e.code === "Space") SPACE_PRESSED = true;
  }
  KEY[e.code] = true;
});

addEventListener("keyup", e => {
  KEY[e.code] = false;
});

/* ========= UTILS ========= */
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function wrap(o) {
  if (o.x < 0) o.x += 800;
  if (o.x > 800) o.x -= 800;
  if (o.y < 0) o.y += 600;
  if (o.y > 600) o.y -= 600;
}

/* ========= PARTICLES ========= */
function Particle(x, y) {
  this.x = x;
  this.y = y;
  this.vx = rand(-4, 4);
  this.vy = rand(-4, 4);
  this.life = 30;
}

Particle.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  this.life--;
};

Particle.prototype.draw = function () {
  ctx.beginPath();
  ctx.moveTo(this.x, this.y);
  ctx.lineTo(this.x - this.vx, this.y - this.vy);
  ctx.stroke();
};

/* ========= SHIP ========= */
function Ship() {
  this.x = 400;
  this.y = 300;
  this.rot = 0;
  this.vx = 0;
  this.vy = 0;
  this.invincible = 120;
}

Ship.prototype.update = function () {
  if (KEY.ArrowLeft) this.rot -= 4;
  if (KEY.ArrowRight) this.rot += 4;

  if (KEY.ArrowUp) {
    this.vx += Math.sin(this.rot * Math.PI / 180) * 0.2;
    this.vy -= Math.cos(this.rot * Math.PI / 180) * 0.2;
  }

  if (KEY.Space && !this.cool) {
    Game.bullets.push(new Bullet(this));
    this.cool = true;
  }
  if (!KEY.Space) this.cool = false;

  this.vx *= 0.99;
  this.vy *= 0.99;
  this.x += this.vx;
  this.y += this.vy;
  wrap(this);

  if (this.invincible > 0) this.invincible--;
};

Ship.prototype.draw = function () {
  if (this.invincible > 0 && this.invincible % 20 < 10) return;

  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.rotate(this.rot * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 8);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

/* ========= BULLET ========= */
function Bullet(s) {
  this.x = s.x;
  this.y = s.y;
  this.vx = Math.sin(s.rot * Math.PI / 180) * 6;
  this.vy = -Math.cos(s.rot * Math.PI / 180) * 6;
  this.life = 60;
}

Bullet.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  this.life--;
  wrap(this);
};

Bullet.prototype.draw = function () {
  ctx.beginPath();
  ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
  ctx.stroke();
};

/* ========= ASTEROID ========= */
function Asteroid(x, y, size, isCredit = false) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.radius = size * 18;
  this.isCredit = isCredit;

  this.vx = rand(-2, 2);
  this.vy = rand(-2, 2);

  this.points = [];
  const verts = 10;
  for (let i = 0; i < verts; i++) {
    this.points.push(rand(0.6, 1.2));
  }
}

Asteroid.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  wrap(this);
};

Asteroid.prototype.draw = function () {
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.beginPath();

  for (let i = 0; i < this.points.length; i++) {
    const angle = (i / this.points.length) * Math.PI * 2;
    const r = this.radius * this.points[i];
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }

  ctx.closePath();
  ctx.strokeStyle = this.isCredit ? "#4af" : "#fff";
  ctx.stroke();
  ctx.strokeStyle = "#fff";
  ctx.restore();
};

/* ========= START ========= */
function startGame() {
  Game.state = "play";
  Game.score = 0;
  Game.lives = 3;
  Game.asteroids = [];
  Game.bullets = [];
  Game.particles = [];
  Game.ship = new Ship();
  Game.showCredits = false;

  for (let i = 0; i < 5; i++) {
    Game.asteroids.push(
      new Asteroid(rand(0,800), rand(0,600), 3)
    );
  }

  // Asteroide azul de créditos
  Game.asteroids.push(
    new Asteroid(100, 100, 2, true)
  );
}

/* ========= LOOP ========= */
function loop() {
  ctx.clearRect(0, 0, 800, 600);

  if (Game.state === "menu") {
    ctx.textAlign = "center";
    ctx.fillText("ASTEROIDS", 400, 240);
    ctx.fillText("PRESS SPACE TO START", 400, 300);

    if (SPACE_PRESSED) {
      SPACE_PRESSED = false;
      startGame();
    }
  }

  if (Game.state === "play") {
    Game.ship.update();
    Game.ship.draw();

    Game.bullets.forEach(b => b.update());
    Game.bullets.forEach(b => b.draw());

    Game.asteroids.forEach(a => a.update());
    Game.asteroids.forEach(a => a.draw());

    Game.particles = Game.particles.filter(p => p.life > 0);
    Game.particles.forEach(p => { p.update(); p.draw(); });

    Game.asteroids.forEach((a, ai) => {
      Game.bullets.forEach((b, bi) => {
        if (dist(a, b) < a.radius) {
          Game.bullets.splice(bi,1);
          Game.asteroids.splice(ai,1);

          for (let i=0;i<20;i++)
            Game.particles.push(new Particle(a.x,a.y));

          if (a.isCredit) {
            Game.showCredits = true;
            Game.creditTimer = 300;
          }
        }
      });
    });

    ctx.textAlign = "left";
    ctx.fillText("SCORE: " + Game.score, 20, 30);
    ctx.fillText("LIVES: " + Game.lives, 680, 30);

    if (Game.showCredits) {
      ctx.fillStyle = "#4af";
      ctx.fillText(
        "Asteroids (HTML5) — dmcinnes | Remaster: Leonardo Dias Gomes | YT:@BULOFK",
        20, 580
      );
      ctx.fillStyle = "#fff";
      Game.creditTimer--;
      if (Game.creditTimer <= 0) Game.showCredits = false;
    }
  }

  requestAnimationFrame(loop);
}

loop();
