/* ========================================
 ASTEROIDS HTML5 — ARCADE EDITION
 Original: dmcinnes
 Remaster: Leonardo Dias Gomes
 YT: @BULOFK
======================================== */

const Game = {
  width: 800,
  height: 600,
  sprites: [],
  bullets: [],
  asteroids: [],
  lives: 3,
  score: 0,
  highScore: localStorage.getItem("highscore") || 0,
  state: "menu",
  creditsUnlocked: false,
  showCredits: false
};

/* ========= INPUT ========= */
const KEY = {};
addEventListener("keydown", e => KEY[e.code] = true);
addEventListener("keyup", e => KEY[e.code] = false);

/* ========= SOUND ========= */
const Sound = {
  shoot: new Audio("sounds/shoot.wav"),
  bang: new Audio("sounds/bang.wav"),
  ship: new Audio("sounds/ship.wav")
};

/* ========= BASE ========= */
function wrap(o) {
  if (o.x < 0) o.x += Game.width;
  if (o.x > Game.width) o.x -= Game.width;
  if (o.y < 0) o.y += Game.height;
  if (o.y > Game.height) o.y -= Game.height;
}

/* ========= SHIP ========= */
function Ship() {
  this.x = Game.width / 2;
  this.y = Game.height / 2;
  this.rot = 0;
  this.vx = 0;
  this.vy = 0;
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
    Sound.shoot.cloneNode().play();
    this.cool = true;
  }
  if (!KEY.Space) this.cool = false;

  this.vx *= 0.99;
  this.vy *= 0.99;

  this.x += this.vx;
  this.y += this.vy;
  wrap(this);
};

Ship.prototype.draw = function (c) {
  c.save();
  c.translate(this.x, this.y);
  c.rotate(this.rot * Math.PI / 180);
  c.beginPath();
  c.moveTo(0, -12);
  c.lineTo(6, 6);
  c.lineTo(-6, 6);
  c.closePath();
  c.stroke();
  c.restore();
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

Bullet.prototype.draw = function (c) {
  c.beginPath();
  c.arc(this.x, this.y, 2, 0, Math.PI * 2);
  c.stroke();
};

/* ========= ASTEROID ========= */
function Asteroid(x, y, size = 3, blue = false) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.blue = blue;
  const a = Math.random() * Math.PI * 2;
  this.vx = Math.cos(a) * 1.2;
  this.vy = Math.sin(a) * 1.2;
}

Asteroid.prototype.draw = function (c) {
  c.strokeStyle = this.blue ? "#3af" : "#fff";
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const r = this.size * 15 + Math.random() * 4;
    c.lineTo(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r);
  }
  c.closePath();
  c.stroke();
  c.strokeStyle = "#fff";
};

Asteroid.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  wrap(this);
};

/* ========= GAME LOOP ========= */
window.onload = () => {
  const canvas = document.getElementById("canvas");
  const c = canvas.getContext("2d");
  canvas.width = Game.width;
  canvas.height = Game.height;

  let ship;

  function startGame() {
    Game.state = "play";
    Game.score = 0;
    Game.lives = 3;
    Game.bullets = [];
    Game.asteroids = [];
    ship = new Ship();

    for (let i = 0; i < 5; i++)
      Game.asteroids.push(new Asteroid(Math.random()*800, Math.random()*600));
  }

  function loop() {
    c.clearRect(0,0,800,600);

    if (Game.state === "menu") {
      c.fillText("ASTEROIDS", 350, 250);
      c.fillText("PRESS SPACE TO START", 300, 300);
      if (KEY.Space) startGame();
    }

    if (Game.state === "play") {
      ship.update();
      ship.draw(c);

      Game.bullets.forEach(b => { b.update(); b.draw(c); });
      Game.asteroids.forEach(a => { a.update(); a.draw(c); });

      if (Game.score >= 5000 && !Game.creditsUnlocked) {
        Game.asteroids.push(new Asteroid(400,300,3,true));
        Game.creditsUnlocked = true;
      }

      if (Game.showCredits) {
        c.fillText("Asteroids (HTML5) — dmcinnes", 20, 560);
        c.fillText("Remaster: Leonardo Dias Gomes", 20, 580);
        c.fillText("YT: @BULOFK", 20, 600);
      }

      c.fillText("SCORE: "+Game.score, 20,20);
      c.fillText("LIVES: "+Game.lives, 700,20);
    }

    requestAnimationFrame(loop);
  }

  loop();
};
