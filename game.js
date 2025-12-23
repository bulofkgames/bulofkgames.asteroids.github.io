/* =====================================
 ASTEROIDS HTML5 — ARCADE REMASTER
 Original concept: Atari / dmcinnes
 Modifications, Fixes & Improvements:
 Leonardo Dias Gomes — YouTube: @BULOFK
===================================== */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

/* ========= GAME STATE ========= */
const Game = {
  state: "menu",
  score: 0,
  lives: 3,
  level: 1,
  high: Number(localStorage.getItem("asteroidsHS")) || 0,
  asteroids: [],
  bullets: [],
  ship: null,
  floatingTexts: []
};

/* ========= INPUT ========= */
const KEY = {};
window.addEventListener("keydown", e => {
  if (["ArrowUp","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
  KEY[e.code] = true;
  if (e.code === "Space" && Game.state === "menu") startGame();
});
window.addEventListener("keyup", e => KEY[e.code] = false);

/* ========= UTILS ========= */
const rand = (a,b)=>Math.random()*(b-a)+a;
function wrap(o){
  if(o.x<0) o.x+=WIDTH;
  if(o.x>WIDTH) o.x-=WIDTH;
  if(o.y<0) o.y+=HEIGHT;
  if(o.y>HEIGHT) o.y-=HEIGHT;
}

/* ========= SHIP ========= */
function Ship(){
  this.x=WIDTH/2;
  this.y=HEIGHT/2;
  this.rot=0;
  this.vx=0;
  this.vy=0;
  this.cool=false;
  this.inv=120; // invencibilidade inicial
}
Ship.prototype.update=function(){
  if(KEY.ArrowLeft) this.rot-=4;
  if(KEY.ArrowRight) this.rot+=4;
  if(KEY.ArrowUp){
    this.vx+=Math.sin(this.rot*Math.PI/180)*0.25;
    this.vy-=Math.cos(this.rot*Math.PI/180)*0.25;
  }
  if(KEY.Space && !this.cool){
    Game.bullets.push(new Bullet(this));
    this.cool=true;
  }
  if(!KEY.Space) this.cool=false;

  this.vx*=0.99; this.vy*=0.99;
  this.x+=this.vx; this.y+=this.vy;
  wrap(this);

  if(this.inv>0) this.inv--;
};
Ship.prototype.draw=function(){
  if(this.inv>0 && this.inv%20<10) return;
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
  this.x=s.x; this.y=s.y;
  this.vx=Math.sin(s.rot*Math.PI/180)*7;
  this.vy=-Math.cos(s.rot*Math.PI/180)*7;
  this.life=60;
}
Bullet.prototype.update=function(){
  this.x+=this.vx; this.y+=this.vy;
  this.life--;
  wrap(this);
};
Bullet.prototype.draw=function(){
  ctx.beginPath();
  ctx.arc(this.x,this.y,2,0,Math.PI*2);
  ctx.stroke();
};

/* ========= ASTEROID ========= */
function Asteroid(x,y,size,isCredit=false){
  this.x=x; this.y=y;
  this.size=size;
  this.radius=size*18;
  this.isCredit=isCredit;
  const a=rand(0,Math.PI*2);
  const s=rand(0.6,1.4);
  this.vx=Math.cos(a)*s;
  this.vy=Math.sin(a)*s;
  this.shape=[];
  for(let i=0;i<14;i++) this.shape.push(rand(0.7,1.3));
}
Asteroid.prototype.update=function(){
  this.x+=this.vx; this.y+=this.vy;
  wrap(this);
};
Asteroid.prototype.draw=function(){
  ctx.beginPath();
  for(let i=0;i<this.shape.length;i++){
    const a=i/this.shape.length*Math.PI*2;
    const px=this.x+Math.cos(a)*this.radius*this.shape[i];
    const py=this.y+Math.sin(a)*this.radius*this.shape[i];
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
  }
  ctx.closePath();
  ctx.strokeStyle=this.isCredit?"yellow":"white";
  ctx.stroke();
};

/* ========= FLOATING TEXT ========= */
function FloatingText(text,x,y){
  this.text=text;
  this.x=x;
  this.y=y;
  this.alpha=1;
  this.life=300; // ~5s
}
FloatingText.prototype.update=function(){
  this.y-=0.3;
  this.life--;
  if(this.life<100) this.alpha=this.life/100;
};
FloatingText.prototype.draw=function(){
  ctx.globalAlpha=this.alpha;
  ctx.fillStyle="yellow";
  ctx.font="14px monospace";
  ctx.fillText(this.text,this.x,this.y);
  ctx.globalAlpha=1;
};

/* ========= GAME FLOW ========= */
function startGame(){
  Game.state="play";
  Game.score=0;
  Game.lives=3;
  Game.ship=new Ship();
  Game.bullets=[];
  Game.asteroids=[];
  Game.floatingTexts=[];
  spawnAsteroids(6);
}

function spawnAsteroids(n){
  for(let i=0;i<n;i++){
    const credit=Math.random()<0.12;
    Game.asteroids.push(
      new Asteroid(rand(0,WIDTH),rand(0,HEIGHT),3,credit)
    );
  }
}

/* ========= COLLISIONS ========= */
function checkCollisions(){
  // Bullet x Asteroid
  Game.bullets.forEach((b,bi)=>{
    Game.asteroids.forEach((a,ai)=>{
      if(Math.hypot(b.x-a.x,b.y-a.y)<a.radius){
        Game.bullets.splice(bi,1);
        Game.asteroids.splice(ai,1);

        if(a.isCredit){
          Game.score+=50;
          Game.floatingTexts.push(
            new FloatingText(
              "Credits: Asteroids (HTML5) — dmcinnes | Mods by Leonardo Dias Gomes (@BULOFK)",
              a.x,a.y
            )
          );
        } else {
          Game.score+=10;
        }
      }
    });
  });

  // Ship x Asteroid
  Game.asteroids.forEach(a=>{
    if(Game.ship.inv<=0 &&
      Math.hypot(Game.ship.x-a.x,Game.ship.y-a.y)<a.radius){
      Game.lives--;
      Game.ship=new Ship();
      if(Game.lives<=0){
        Game.state="menu";
        Game.high=Math.max(Game.high,Game.score);
        localStorage.setItem("asteroidsHS",Game.high);
      }
    }
  });
}

/* ========= HUD ========= */
function drawHUD(){
  ctx.font="16px monospace";
  ctx.fillStyle="white";
  ctx.fillText("SCORE: "+Game.score,20,30);
  ctx.fillText("LIVES: "+Game.lives,20,50);
  ctx.fillText("HIGH: "+Game.high,WIDTH-150,30);
}

/* ========= LOOP ========= */
function loop(){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.strokeStyle="white";
  ctx.fillStyle="white";

  if(Game.state==="menu"){
    ctx.textAlign="center";
    ctx.font="28px monospace";
    ctx.fillText("ASTEROIDS",WIDTH/2,260);
    ctx.font="16px monospace";
    ctx.fillText("PRESS SPACE TO START",WIDTH/2,300);
    ctx.textAlign="left";
  }

  if(Game.state==="play"){
    Game.ship.update();
    Game.ship.draw();

    Game.bullets=Game.bullets.filter(b=>b.life>0);
    Game.bullets.forEach(b=>{b.update();b.draw();});

    Game.asteroids.forEach(a=>{a.update();a.draw();});

    checkCollisions();
    drawHUD();

    Game.floatingTexts.forEach((t,i)=>{
      t.update(); t.draw();
      if(t.life<=0) Game.floatingTexts.splice(i,1);
    });
  }

  requestAnimationFrame(loop);
}

loop();
