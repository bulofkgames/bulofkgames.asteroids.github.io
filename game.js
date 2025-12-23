/* =====================================
 ASTEROIDS HTML5 — ARCADE FINAL
 Original: dmcinnes
 Remaster: Leonardo Dias Gomes
 YT: @BULOFK
===================================== */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

/* ========= GAME STATE ========= */
const Game = {
  state: "menu",
  score: 0,
  lives: 3,
  asteroids: [],
  bullets: [],
  particles: [],
  ship: null
};

/* ========= INPUT ========= */
const KEY = {};
addEventListener("keydown", e => KEY[e.code] = true);
addEventListener("keyup", e => KEY[e.code] = false);

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

/* ========= PARTICLE ========= */
function Particle(x, y) {
  this.x = x;
  this.y = y;
  this.vx = rand(-3, 3);
  this.vy = rand(-3, 3);
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
  if (this.invincible % 20 < 10) return;

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
function Asteroid(x, y, size) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.radius = size * 15;
  const a = rand(0, Math.PI * 2);
  this.vx = Math.cos(a) * rand(1, 2);
  this.vy = Math.sin(a) * rand(1, 2);
}

Asteroid.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  wrap(this);
};

Asteroid.prototype.draw = function () {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    ctx.lineTo(
      this.x + Math.cos(a) * this.radius,
      this.y + Math.sin(a) * this.radius
    );
  }
  ctx.closePath();
  ctx.stroke();
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

  for (let i = 0; i < 5; i++) {
    Game.asteroids.push(new Asteroid(rand(0,800), rand(0,600), 3));
  }
}

/* ========= LOOP ========= */
function loop() {
  ctx.clearRect(0,0,800,600);

  if (Game.state === "menu") {
    ctx.fillText("ASTEROIDS", 360, 250);
    ctx.fillText("PRESS SPACE TO START", 300, 300);
    if (KEY.Space) startGame();
  }

  if (Game.state === "play") {
    Game.ship.update();
    Game.ship.draw();

    Game.bullets.forEach(b => b.update());
    Game.bullets.forEach(b => b.draw());

    Game.asteroids.forEach(a => a.update());
    Game.asteroids.forEach(a => a.draw());

    Game.particles.forEach(p => { p.update(); p.draw(); });

    // COLLISIONS
    Game.asteroids.forEach((a, ai) => {
      Game.bullets.forEach((b, bi) => {
        if (dist(a, b) < a.radius) {
          Game.bullets.splice(bi,1);
          Game.asteroids.splice(ai,1);
          Game.score += a.size === 3 ? 20 : a.size === 2 ? 50 : 100;

          for (let i=0;i<15;i++)
            Game.particles.push(new Particle(a.x,a.y));

          if (a.size > 1) {
            Game.asteroids.push(new Asteroid(a.x,a.y,a.size-1));
            Game.asteroids.push(new Asteroid(a.x,a.y,a.size-1));
          }
        }
      });

      if (dist(a, Game.ship) < a.radius && Game.ship.invincible <= 0) {
        Game.lives--;
        Game.ship = new Ship();
        if (Game.lives <= 0) Game.state = "menu";
      }
    });

    ctx.fillText("SCORE: "+Game.score, 20,20);
    ctx.fillText("LIVES: "+Game.lives, 700,20);
  }

  requestAnimationFrame(loop);
}

loop();
