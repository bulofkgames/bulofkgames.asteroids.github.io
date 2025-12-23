<script>
/* =====================================
 ASTEROIDS HTML5 — ARCADE REMASTER
 Original concept: dmcinnes
 Remaster + Interface: Leonardo Dias Gomes
 YouTube: @BULOFK
===================================== */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;
canvas.focus();

/* ========= INPUT (SEM SCROLL) ========= */
const KEY = {};
addEventListener("keydown", e => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))
    e.preventDefault();
  KEY[e.code] = true;
});
addEventListener("keyup", e => KEY[e.code] = false);

/* ========= GAME ========= */
const Game = {
  state: "menu",
  score: 0,
  lives: 3,
  level: 1,
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
  if(o.x<0)o.x+=800;
  if(o.x>800)o.x-=800;
  if(o.y<0)o.y+=600;
  if(o.y>600)o.y-=600;
}

/* ========= PARTICLES ========= */
function Particle(x,y){
  this.x=x; this.y=y;
  this.vx=rand(-3,3);
  this.vy=rand(-3,3);
  this.life=30;
}
Particle.prototype.update=function(){
  this.x+=this.vx;
  this.y+=this.vy;
  this.life--;
};
Particle.prototype.draw=function(){
  ctx.beginPath();
  ctx.moveTo(this.x,this.y);
  ctx.lineTo(this.x-this.vx,this.y-this.vy);
  ctx.stroke();
};

/* ========= SHIP ========= */
function Ship(){
  this.x=400; this.y=300;
  this.rot=0;
  this.vx=0; this.vy=0;
  this.inv=120;
}
Ship.prototype.update=function(){
  if(KEY.ArrowLeft) this.rot-=4;
  if(KEY.ArrowRight) this.rot+=4;
  if(KEY.ArrowUp){
    this.vx+=Math.sin(this.rot*Math.PI/180)*0.2;
    this.vy-=Math.cos(this.rot*Math.PI/180)*0.2;
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
  if(this.inv%20<10) return;
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
  this.x+=this.vx;
  this.y+=this.vy;
  this.life--;
  wrap(this);
};
Bullet.prototype.draw=function(){
  ctx.beginPath();
  ctx.arc(this.x,this.y,2,0,Math.PI*2);
  ctx.stroke();
};

/* ========= ASTEROID ========= */
function Asteroid(x,y,size,credit=false){
  this.x=x; this.y=y;
  this.size=size;
  this.radius=size*18;
  this.credit=credit;
  const a=rand(0,Math.PI*2);
  this.vx=Math.cos(a)*rand(0.5,2);
  this.vy=Math.sin(a)*rand(0.5,2);

  // Forma irregular
  this.shape=[];
  for(let i=0;i<10;i++)
    this.shape.push(rand(0.7,1.3));
}
Asteroid.prototype.update=function(){
  this.x+=this.vx;
  this.y+=this.vy;
  wrap(this);
};
Asteroid.prototype.draw=function(){
  ctx.strokeStyle=this.credit?"#4af":"white";
  ctx.beginPath();
  for(let i=0;i<this.shape.length;i++){
    const a=i/this.shape.length*Math.PI*2;
    ctx.lineTo(
      this.x+Math.cos(a)*this.radius*this.shape[i],
      this.y+Math.sin(a)*this.radius*this.shape[i]
    );
  }
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle="white";
};

/* ========= SPAWN ========= */
function spawnAsteroids(){
  for(let i=0;i<3+Game.level;i++){
    let edge=Math.floor(rand(0,4));
    let x=edge<2? (edge==0?0:800):rand(0,800);
    let y=edge>=2?(edge==2?0:600):rand(0,600);
    Game.asteroids.push(new Asteroid(x,y,3));
  }
  // Asteroide azul (créditos)
  Game.asteroids.push(new Asteroid(50,50,2,true));
}

/* ========= START ========= */
function startGame(){
  Game.state="play";
  Game.score=0;
  Game.lives=3;
  Game.level=1;
  Game.asteroids=[];
  Game.bullets=[];
  Game.particles=[];
  Game.ship=new Ship();
  Game.showCredits=false;
  spawnAsteroids();
}

/* ========= LOOP ========= */
function loop(){
  ctx.clearRect(0,0,800,600);
  ctx.strokeStyle="white";
  ctx.font="16px monospace";

  if(Game.state==="menu"){
    ctx.textAlign="center";
    ctx.fillText("ASTEROIDS",400,260);
    ctx.fillText("PRESS SPACE TO START",400,300);
    ctx.textAlign="left";
    if(KEY.Space) startGame();
  }

  if(Game.state==="play"){
    Game.ship.update(); Game.ship.draw();

    Game.bullets=Game.bullets.filter(b=>b.life>0);
    Game.bullets.forEach(b=>{b.update();b.draw();});

    Game.asteroids.forEach(a=>{a.update();a.draw();});
    Game.particles=Game.particles.filter(p=>p.life>0);
    Game.particles.forEach(p=>{p.update();p.draw();});

    Game.asteroids.forEach((a,ai)=>{
      Game.bullets.forEach((b,bi)=>{
        if(dist(a,b)<a.radius){
          Game.bullets.splice(bi,1);
          Game.asteroids.splice(ai,1);
          for(let i=0;i<20;i++)
            Game.particles.push(new Particle(a.x,a.y));

          if(a.credit) Game.showCredits=true;

          if(a.size>1){
            Game.asteroids.push(new Asteroid(a.x,a.y,a.size-1));
            Game.asteroids.push(new Asteroid(a.x,a.y,a.size-1));
          }
          Game.score+=100;
        }
      });

      if(dist(a,Game.ship)<a.radius && Game.ship.inv<=0){
        Game.lives--;
        Game.ship=new Ship();
        if(Game.lives<=0) Game.state="menu";
      }
    });

    if(Game.asteroids.length===0){
      Game.level++;
      spawnAsteroids();
    }

    ctx.fillText("SCORE: "+Game.score,20,20);
    ctx.fillText("LIVES: "+Game.lives,700,20);

    if(Game.showCredits){
      ctx.textAlign="center";
      ctx.fillText(
        "Asteroids (HTML5) — dmcinnes | Remaster: Leonardo Dias Gomes | YT @BULOFK",
        400,580
      );
      ctx.textAlign="left";
    }
  }

  requestAnimationFrame(loop);
}

loop();
</script>
