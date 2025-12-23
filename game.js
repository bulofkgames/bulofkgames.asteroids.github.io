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

/* ========= GAME STATE ========= */
const Game = {
  state: "menu",
  score: 0,
  lives: 3,
  level: 1,
  high: localStorage.getItem("asteroidsHS") || 0,
  asteroids: [],
  bullets: [],
  ship: null,
  showCredits: false,
  started: false
};

/* ========= INPUT ========= */
const KEY = {};

window.addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","Enter","KeyW"].includes(e.code)) {
    e.preventDefault();
  }

  KEY[e.code] = true;

  if (
    (e.code === "Space" || e.code === "Enter") &&
    Game.state === "menu"
  ) {
    userStart();
  }
});

window.addEventListener("keyup", e => KEY[e.code] = false);

/* ========= CLICK START (ESSENCIAL) ========= */
canvas.addEventListener("click", () => {
  if (Game.state === "menu") {
    userStart();
  }
});

/* ========= AUDIO ========= */
let AudioCtx = null;

function initAudio(){
  if (!AudioCtx) {
    AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

/* ========= START SEGURO ========= */
function userStart(){
  if (Game.started) return;

  Game.started = true;
  initAudio();
  startGame();
}

/* ========= SOUND ========= */
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
    this.vx += Math.sin(this.rot*Math.PI/180)*0.25;
    this.vy -= Math.cos(this.rot*Math.PI/180)*0.25;
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
  this.vx = Math.sin(s.rot*Math.PI/180)*7;
  this.vy = -Math.cos(s.rot*Math.PI/180)*7;
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
function Asteroid(x,y,size){
  this.x = x;
  this.y = y;
  this.size = size;
  this.radius = size*18;

  const a = rand(0,Math.PI*2);
  const speed = rand(0.6,1.5) + Game.level*0.15;
  this.vx = Math.cos(a)*speed;
  this.vy = Math.sin(a)*speed;

  this.shape=[];
  for(let i=0;i<14;i++) this.shape.push(rand(0.7,1.3));
}

Asteroid.prototype.update=function(){
  this.x+=this.vx;
  this.y+=this.vy;
  wrap(this);
};

Asteroid.prototype.draw=function(){
  ctx.beginPath();
  for(let i=0;i<this.shape.length;i++){
    const a=i/this.shape.length*Math.PI*2;
    const px=this.x+Math.cos(a)*this.radius*this.shape[i];
    const py=this.y+Math.sin(a)*this.radius*this.shape[i];
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.stroke();
};

/* ========= START ========= */
function startGame(){
  Game.state="play";
  Game.score=0;
  Game.lives=3;
  Game.level=1;
  Game.asteroids=[];
  Game.bullets=[];
  Game.ship=new Ship();
  spawnAsteroids();
}

/* ========= SPAWN ========= */
function spawnAsteroids(){
  for(let i=0;i<3+Game.level;i++){
    Game.asteroids.push(
      new Asteroid(rand(0,WIDTH), rand(0,HEIGHT), 3)
    );
  }
}

/* ========= LOOP ========= */
function loop(){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.strokeStyle="white";
  ctx.fillStyle="white";
  ctx.font="16px monospace";

  if(Game.state==="menu"){
    ctx.textAlign="center";
    ctx.font="28px monospace";
    ctx.fillText("ASTEROIDS",WIDTH/2,250);
    ctx.font="16px monospace";
    ctx.fillText("PRESS SPACE / ENTER OR CLICK",WIDTH/2,300);
    ctx.textAlign="left";
  }

  if(Game.state==="play"){
    Game.ship.update();
    Game.ship.draw();

    Game.bullets.forEach(b=>{b.update();b.draw();});
    Game.asteroids.forEach(a=>{a.update();a.draw();});
  }

  requestAnimationFrame(loop);
}

loop();
</script>
