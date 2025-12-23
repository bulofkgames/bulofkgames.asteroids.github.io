/* =====================================
 ASTEROIDS HTML5 — ARCADE REMASTER
 Original concept: Atari / dmcinnes
 Remaster, Interface & Code: Leonardo Dias Gomes
===================================== */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;  // Garantir tamanho
canvas.height = 600;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const Game = {
  state: "menu",
  score: 0,
  lives: 3,
  level: 1,
  high: Number(localStorage.getItem("asteroidsHS")) || 0,
  asteroids: [],
  bullets: [],
  ship: null
};

const KEY = {};
window.addEventListener("keydown", e => {
  if (["ArrowUp","ArrowLeft","ArrowRight","Space","KeyW"].includes(e.code)) e.preventDefault();
  KEY[e.code] = true;
  if (e.code === "Space" && Game.state === "menu") startGame();
});
window.addEventListener("keyup", e => KEY[e.code] = false);

const rand = (a,b)=>Math.random()*(b-a)+a;
function wrap(o){ if(o.x<0)o.x+=WIDTH;if(o.x>WIDTH)o.x-=WIDTH;if(o.y<0)o.y+=HEIGHT;if(o.y>HEIGHT)o.y-=HEIGHT; }

function Ship(){
  this.x = WIDTH/2; this.y = HEIGHT/2; this.rot = 0; this.vx = 0; this.vy = 0; this.cool = false; this.inv = 0;
}
Ship.prototype.update = function(){
  if(KEY.ArrowLeft) this.rot -= 4;
  if(KEY.ArrowRight) this.rot += 4;
  if(KEY.ArrowUp){ this.vx += Math.sin(this.rot*Math.PI/180)*0.25; this.vy -= Math.cos(this.rot*Math.PI/180)*0.25; }
  if(KEY.Space && !this.cool){ Game.bullets.push(new Bullet(this)); this.cool = true; }
  if(!KEY.Space) this.cool = false;
  this.vx *= 0.99; this.vy *= 0.99;
  this.x += this.vx; this.y += this.vy; wrap(this);
};
Ship.prototype.draw = function(){
  ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.rot*Math.PI/180);
  ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(8,10); ctx.lineTo(-8,10); ctx.closePath(); ctx.stroke();
  ctx.restore();
};

function Bullet(s){
  this.x = s.x; this.y = s.y;
  this.vx = Math.sin(s.rot*Math.PI/180)*7;
  this.vy = -Math.cos(s.rot*Math.PI/180)*7;
  this.life = 60;
}
Bullet.prototype.update = function(){ this.x+=this.vx; this.y+=this.vy; this.life--; wrap(this); };
Bullet.prototype.draw = function(){ ctx.beginPath(); ctx.arc(this.x,this.y,2,0,Math.PI*2); ctx.stroke(); };

function Asteroid(x,y,size){
  this.x=x; this.y=y; this.size=size; this.radius=size*18;
  const a=rand(0,Math.PI*2); const speed=rand(0.6,1.4);
  this.vx=Math.cos(a)*speed; this.vy=Math.sin(a)*speed; this.shape=[]; for(let i=0;i<14;i++) this.shape.push(rand(0.7,1.3));
}
Asteroid.prototype.update = function(){ this.x+=this.vx; this.y+=this.vy; wrap(this); };
Asteroid.prototype.draw = function(){
  ctx.beginPath(); for(let i=0;i<this.shape.length;i++){
    const a=i/this.shape.length*Math.PI*2;
    const px=this.x+Math.cos(a)*this.radius*this.shape[i];
    const py=this.y+Math.sin(a)*this.radius*this.shape[i];
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.closePath(); ctx.stroke();
};

function startGame(){
  Game.state="play"; Game.score=0; Game.lives=3; Game.level=1;
  Game.ship=new Ship(); Game.bullets=[]; Game.asteroids=[];
  for(let i=0;i<5;i++) Game.asteroids.push(new Asteroid(rand(0,WIDTH), rand(0,HEIGHT),3));
}

function loop(){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.strokeStyle="white"; ctx.fillStyle="white"; ctx.font="16px monospace";

  if(Game.state==="menu"){
    ctx.textAlign="center"; ctx.font="28px monospace"; ctx.fillText("ASTEROIDS",WIDTH/2,260);
    ctx.font="16px monospace"; ctx.fillText("PRESS SPACE TO START",WIDTH/2,300);
  }

  if(Game.state==="play"){
    Game.ship.update(); Game.ship.draw();
    Game.bullets=Game.bullets.filter(b=>b.life>0); Game.bullets.forEach(b=>{b.update();b.draw();});
    Game.asteroids.forEach(a=>{a.update();a.draw();});
  }

  requestAnimationFrame(loop);
}

loop();
