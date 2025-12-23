/* 
========================================
 Canvas Asteroids (HTML5)
 Original code: Doug McInnes (2010)
 Arcade restoration by:
 Leonardo Dias Gomes
 YouTube: @BULOFK
========================================
*/

/* ================= CONSTANTS ================= */

const MAX_SPEED = 220;
const ACCELERATION = 200;
const FRICTION = 0.92;

const ROT_STEP = 4; // giro arcade preciso

const BULLET_SPEED = 500;
const BULLET_LIFE = 40;

const ASTEROID_SPEED = 60;

/* ================= INPUT ================= */

const KEY = {};

window.addEventListener("keydown", e => {
  e.preventDefault();
  KEY[e.code] = true;
});

window.addEventListener("keyup", e => {
  e.preventDefault();
  KEY[e.code] = false;
});

/* ================= GAME ================= */

const Game = {
  sprites: [],
  width: 800,
  height: 600,
  score: 0
};

/* ================= BASE SPRITE ================= */

function Sprite() {
  this.x = 0;
  this.y = 0;
  this.rot = 0;
  this.vel = { x: 0, y: 0 };
  this.points = [];
  this.visible = true;
}

Sprite.prototype.update = function () {
  this.x += this.vel.x;
  this.y += this.vel.y;

  if (this.x < 0) this.x += Game.width;
  if (this.x > Game.width) this.x -= Game.width;
  if (this.y < 0) this.y += Game.height;
  if (this.y > Game.height) this.y -= Game.height;
};

Sprite.prototype.draw = function (ctx) {
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.rotate(this.rot * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(this.points[0], this.points[1]);
  for (let i = 2; i < this.points.length; i += 2) {
    ctx.lineTo(this.points[i], this.points[i + 1]);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

/* ================= SHIP ================= */

function Ship() {
  Sprite.call(this);
  this.x = Game.width / 2;
  this.y = Game.height / 2;
  this.points = [-6, 6, 0, -12, 6, 6];
  this.cooldown = false;
}

Ship.prototype = Object.create(Sprite.prototype);

Ship.prototype.control = function () {
  if (KEY["ArrowLeft"]) this.rot -= ROT_STEP;
  if (KEY["ArrowRight"]) this.rot += ROT_STEP;

  if (KEY["ArrowUp"]) {
    this.vel.x += Math.sin(this.rot * Math.PI / 180) * ACCELERATION / 60;
    this.vel.y -= Math.cos(this.rot * Math.PI / 180) * ACCELERATION / 60;
  }

  this.vel.x *= FRICTION;
  this.vel.y *= FRICTION;

  let speed = Math.hypot(this.vel.x, this.vel.y);
  if (speed > MAX_SPEED / 60) {
    let s = (MAX_SPEED / 60) / speed;
    this.vel.x *= s;
    this.vel.y *= s;
  }

  if (KEY["Space"] && !this.cooldown) {
    Game.sprites.push(new Bullet(this));
    this.cooldown = true;
  }
  if (!KEY["Space"]) this.cooldown = false;
};

/* ================= BULLET ================= */

function Bullet(ship) {
  Sprite.call(this);
  this.x = ship.x;
  this.y = ship.y;
  this.life = BULLET_LIFE;
  this.points = [0, -2, 0, 2];

  this.vel.x = Math.sin(ship.rot * Math.PI / 180) * BULLET_SPEED / 60;
  this.vel.y = -Math.cos(ship.rot * Math.PI / 180) * BULLET_SPEED / 60;
}

Bullet.prototype = Object.create(Sprite.prototype);

Bullet.prototype.update = function () {
  this.x += this.vel.x;
  this.y += this.vel.y;
  this.life--;
  if (this.life <= 0) this.visible = false;
};

/* ================= ASTEROID ================= */

function Asteroid(x, y, size = 3) {
  Sprite.call(this);
  this.x = x;
  this.y = y;
  this.size = size;

  const angle = Math.random() * Math.PI * 2;
  this.vel.x = Math.cos(angle) * ASTEROID_SPEED / 60;
  this.vel.y = Math.sin(angle) * ASTEROID_SPEED / 60;

  this.points = [];
  const radius = size * 15;

  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 / 8) * i;
    const r = radius + Math.random() * 8;
    this.points.push(Math.cos(a) * r, Math.sin(a) * r);
  }
}

Asteroid.prototype = Object.create(Sprite.prototype);

/* ================= COLLISION ================= */

function hit(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < 20;
}

/* ================= BOOT ================= */

window.onload = () => {
  const canvas = document.getElementById("canvas");
  canvas.width = Game.width;
  canvas.height = Game.height;
  const ctx = canvas.getContext("2d");

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;

  const ship = new Ship();
  Game.sprites.push(ship);

  for (let i = 0; i < 5; i++) {
    Game.sprites.push(new Asteroid(Math.random() * 800, Math.random() * 600));
  }

  function loop() {
    ctx.clearRect(0, 0, 800, 600);

    ship.control();

    for (let i = Game.sprites.length - 1; i >= 0; i--) {
      const s = Game.sprites[i];
      s.update();
      s.draw(ctx);

      if (s instanceof Bullet) {
        for (let j = Game.sprites.length - 1; j >= 0; j--) {
          const a = Game.sprites[j];
          if (a instanceof Asteroid && hit(s, a)) {
            s.visible = false;
            a.visible = false;
            Game.score += [0, 100, 50, 20][a.size];

            if (a.size > 1) {
              Game.sprites.push(new Asteroid(a.x, a.y, a.size - 1));
              Game.sprites.push(new Asteroid(a.x, a.y, a.size - 1));
            }
          }
        }
      }

      if (!s.visible) Game.sprites.splice(i, 1);
    }

    ctx.fillText("SCORE: " + Game.score, 20, 20);

    requestAnimationFrame(loop);
  }

  loop();
};
