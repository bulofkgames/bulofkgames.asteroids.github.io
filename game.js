<script>
/* =====================================
 ASTEROIDS HTML5 — ARCADE REMASTER
 Original concept: Atari / dmcinnes
 Remaster, Interface & Code:
 Leonardo Dias Gomes
 YouTube: @BULOFK
===================================== */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 600;

canvas.width = WIDTH;
canvas.height = HEIGHT;

/* ========= INPUT ========= */
const KEY = {};

window.addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyW"].includes(e.code)) {
    e.preventDefault();
  }

  KEY[e.code] = true;

  if (e.code === "Space" && Game.state === "menu") {
    initAudio();
    startGame();
  }
});

window.addEventListener("keyup", e => KEY[e.code] = false);

/* ========= AUDIO ========= */
let AudioCtx = null;

function initAudio(){
  if (!AudioCtx) {
    AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function beep(freq, time=0.05){
  if (!AudioCtx) return;
  const o = AudioCtx.createOscillator();
  const g = AudioCtx.createGain();
  o.connect(g);
  g.connect(AudioCtx.destination);
  o.type = "square";
  o.frequency.value = freq;
  g.gain.value = 0.05;
  o.start();
  o.stop(AudioCtx.currentTime + time);
}

/* ========= GAME STATE ========= */
const Game = {
  state: "menu",
  score: 0,
  lives: 3,
  level: 1,
  high: localStorage.getItem("asteroidsHS") || 0,
  asteroids: [],
  bullets: [],
  particles: [],
  ship: null,
  showCredits: false
};

/* ========= UTILS ========= */
const rand = (a,b)=>Math.random()*(b-a)+a;
const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function wrap(o){
  if(o.x < 0) o.x += WIDTH;
  if(o.x > WIDTH) o.x -= WIDTH;
  if(o.y < 0) o.y += HEIGHT;
  if(o.y > HEIGHT) o.y -= HEIGHT;
}

/* ========= SHIP ========= */
function Ship(){
  this.x = WIDTH/2;
  this.y = HEIGHT/2;
  this.rot = 0;
  this.vx = 0;
  this.vy = 0;
  this.inv = 120;
  this.cool = false;
  this.warpCool = 0;
}

Ship.prototype.update = function(){
  if(KEY.ArrowLeft) this.rot -= 4;
  if(KEY.ArrowRight) this.rot += 4;

  if(KEY.ArrowUp){
    this.vx += Math.sin(this.rot*Math.PI/180) * 0.25;
    this.vy -= Math.cos(this.rot*Math.PI/180) * 0.25;
  }

  if(KEY.Space && !this.cool){
    Game.bullets.push(new Bullet(this));
    beep(800,0.04);
    this.cool = true;
  }
  if(!KEY.Space) this.cool = false;

  if(KEY.KeyW && this.warpCool <= 0){
    this.x = rand(0,WIDTH);
    this.y = rand(0,HEIGHT);
    this.warpCool = 90;
    beep(120,0.1);
  }
  if(this.warpCool > 0) this.warpCool--;

  this.vx *= 0.99;
  this.vy *= 0.99;
  this.x += this.vx;
  this.y += this.vy;
  wrap(this);

  if(this.inv > 0) this.inv--;
};

Ship.prototype.draw = function(){
  if(this.inv % 20 < 10) return;

  ctx.save();
  ctx.translate(this.x,this.y);
  ctx.rotate(this.rot*Math.PI/180);
  ctx.beginPath();
  ctx.moveTo(0,-12);
  ctx.lineTo(8,10);
  ctx.lineTo(-8,10);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

/* ========= BULLET ========= */
function Bullet(s){
  this.x = s.x;
  this.y = s.y;
  this.vx = Math.sin(s.rot*Math.PI/180) * 7;
  this.vy = -Math.cos(s.rot*Math.PI/180) * 7;
  this.life = 60;
}
Bullet.prototype.update = function(){
  this.x += this.vx;
  this.y += this.vy;
  this.life--;
  wrap(this);
};
Bullet.prototype.draw = function(){
  ctx.beginPath();
  ctx.arc(this.x,this.y,2,0,Math.PI*2);
  ctx.stroke();
};

/* ========= ASTEROID ========= */
function Asteroid(x,y,size,credit=false){
  this.x = x;
  this.y = y;
  this.size = size;
  this.radius = size * 18;
  this.credit = credit;

  const a = rand(0,Math.PI*2);
  const speed = rand(0.6,1.5) + Game.level * 0.15;
  this.vx = Math.cos(a) * speed;
  this.vy = Math.sin(a) * speed;

  this.shape = [];
  for(let i=0;i<14;i++){
    this.shape.push(rand(0.7,1.3));
  }
}

Asteroid.prototype.update = function(){
  this.x += this.vx;
  this.y += this.vy;
  wrap(this);
};

Asteroid.prototype.draw = function(){
  ctx.strokeStyle = this.credit ? "#4af" : "white";
  ctx.beginPath();
  for(let i=0;i<this.shape.length;i++){
    const a = i / this.shape.length * Math.PI * 2;
    const px = this.x + Math.cos(a) * this.radius * this.shape[i];
    const py = this.y + Math.sin(a) * this.radius * this.shape[i];
    if(i === 0) ctx.moveTo(px,py);
    else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = "white";
};

/* ========= SPAWN ========= */
function spawnAsteroids(){
  for(let i=0;i<3+Game.level;i++){
    let edge = Math.floor(rand(0,4));
    let x = edge < 2 ? (edge === 0 ? 0 : WIDTH) : rand(0,WIDTH);
    let y = edge >= 2 ? (edge === 2 ? 0 : HEIGHT) : rand(0,HEIGHT);
    Game.asteroids.push(new Asteroid(x,y,3));
  }
  Game.asteroids.push(new Asteroid(60,60,2,true));
}

/* ========= START ========= */
function startGame(){
  Game.state = "play";
  Game.score = 0;
  Game.lives = 3;
  Game.level = 1;
  Game.asteroids = [];
  Game.bullets = [];
  Game.ship = new Ship();
  Game.showCredits = false;
  spawnAsteroids();
}

/* ========= LOOP ========= */
function loop(){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";

  if(Game.state === "menu"){
    ctx.textAlign = "center";
    ctx.font = "28px monospace";
    ctx.fillText("ASTEROIDS", WIDTH/2, 250);
    ctx.font = "16px monospace";
    ctx.fillText("PRESS SPACE TO START", WIDTH/2, 300);
    ctx.fillText("ARROWS MOVE  |  SPACE FIRE  |  W WARP", WIDTH/2, 330);
    ctx.textAlign = "left";
  }

  if(Game.state === "play"){
    Game.ship.update();
    Game.ship.draw();

    for(let i=Game.bullets.length-1;i>=0;i--){
      const b = Game.bullets[i];
      b.update();
      b.draw();
      if(b.life <= 0) Game.bullets.splice(i,1);
    }

    for(let i=Game.asteroids.length-1;i>=0;i--){
      const a = Game.asteroids[i];
      a.update();
      a.draw();

      for(let j=Game.bullets.length-1;j>=0;j--){
        const b = Game.bullets[j];
        if(dist(a,b) < a.radius){
          Game.bullets.splice(j,1);
          Game.asteroids.splice(i,1);
          beep(200,0.08);

          if(a.credit) Game.showCredits = true;

          if(a.size > 1){
            Game.asteroids.push(new Asteroid(a.x,a.y,a.size-1));
            Game.asteroids.push(new Asteroid(a.x,a.y,a.size-1));
          }
          Game.score += 100;
          break;
        }
      }

      if(dist(a,Game.ship) < a.radius && Game.ship.inv <= 0){
        Game.lives--;
        beep(80,0.2);
        Game.ship = new Ship();
        if(Game.lives <= 0){
          if(Game.score > Game.high){
            Game.high = Game.score;
            localStorage.setItem("asteroidsHS",Game.high);
          }
          Game.state = "menu";
        }
      }
    }

    if(Game.asteroids.length === 0){
      Game.level++;
      spawnAsteroids();
    }

    ctx.fillText("SCORE: " + Game.score, 20, 20);
    ctx.fillText("HI: " + Game.high, WIDTH/2 - 40, 20);
    ctx.fillText("LIVES: " + Game.lives, WIDTH - 120, 20);

    if(Game.showCredits){
      ctx.textAlign="center";
      ctx.font="12px monospace";
      ctx.fillText(
        "Asteroids (HTML5) — Original: Atari / dmcinnes | Remaster: Leonardo Dias Gomes | YT @BULOFK",
        WIDTH/2, HEIGHT - 10
      );
      ctx.textAlign="left";
    }
  }

  requestAnimationFrame(loop);
}

loop();
</script>
