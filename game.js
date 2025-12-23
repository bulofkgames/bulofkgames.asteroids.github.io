/*
========================================
 Canvas Asteroids (HTML5)
 Original code: Doug McInnes (2010)
 Restored & fixed for modern browsers by:
 Leonardo Dias Gomes
 YouTube: @BULOFK
========================================
*/

/* ================= CONSTANTS ================= */

var MAX_SPEED = 220;
var ROT_SPEED = 180;    // degrees per "unit"
var ACCELERATION = 200; // px per "unit"
var FRICTION = 0.92;

var BULLET_SPEED = 500; // px per "unit"
var BULLET_LIFE = 60;   // frames (approx)

/* ================= INPUT ================= */

var KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right'
};

var KEY_STATUS = {};
for (var code in KEY_CODES) KEY_STATUS[KEY_CODES[code]] = false;

window.addEventListener('keydown', function (e) {
  if (KEY_CODES[e.keyCode] !== undefined) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = true;
  }
});

window.addEventListener('keyup', function (e) {
  if (KEY_CODES[e.keyCode] !== undefined) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = false;
  }
});

/* ================= SPRITE (base) ================= */

function Sprite() {
  this.visible = false;

  this.x = 0;
  this.y = 0;
  this.rot = 0;   // degrees
  this.scale = 1;

  this.vel = { x: 0, y: 0, rot: 0 };
  this.acc = { x: 0, y: 0 };

  this.name = '';
  this.points = [];

  this.init = function (name, points) {
    this.name = name || '';
    this.points = points || [];
  };

  // default run: move + transformed draw
  this.run = function (delta) {
    if (!this.visible) return;
    this.move(delta);

    // each sprite must save/restore its transform and draw isolated paths
    this.context.save();
    this.context.translate(this.x, this.y);
    this.context.rotate(this.rot * Math.PI / 180);
    this.context.scale(this.scale, this.scale);

    // ensure we don't leak a previous path
    this.context.beginPath();
    this.draw();
    // stroke() / fill() must be called inside draw() or here
    this.context.restore();
  };

  // move uses acceleration, friction, limit, wrapping
  this.move = function (delta) {
    // apply acceleration
    this.vel.x += this.acc.x * delta;
    this.vel.y += this.acc.y * delta;

    // apply friction
    this.vel.x *= FRICTION;
    this.vel.y *= FRICTION;

    // limit speed
    var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
    if (speed > MAX_SPEED) {
      var s = MAX_SPEED / speed;
      this.vel.x *= s;
      this.vel.y *= s;
    }

    // update position
    this.x += this.vel.x * delta;
    this.y += this.vel.y * delta;

    // rotate
    this.rot = (this.rot + this.vel.rot * delta + 360) % 360;

    // wrap screen
    if (this.x < 0) this.x += Game.canvasWidth;
    if (this.x > Game.canvasWidth) this.x -= Game.canvasWidth;
    if (this.y < 0) this.y += Game.canvasHeight;
    if (this.y > Game.canvasHeight) this.y -= Game.canvasHeight;
  };

  // default draw uses polyline from points
  this.draw = function () {
    if (!this.points || this.points.length === 0) return;
    var ctx = this.context;
    ctx.beginPath();
    ctx.moveTo(this.points[0], this.points[1]);
    for (var i = 2; i < this.points.length; i += 2) {
      ctx.lineTo(this.points[i], this.points[i + 1]);
    }
    ctx.closePath();
    ctx.stroke();
  };
}

/* ================= BULLET (standalone/isolated) ================= */

function Bullet(x, y, rot) {
  // don't rely on prototype draw for bullet; isolate entirely
  Sprite.call(this);
  this.init('bullet', [0, -2, 0, 2]);

  this.visible = true;
  this.x = x;
  this.y = y;
  this.rot = rot;
  this.life = BULLET_LIFE;

  // velocity in px per 'unit'
  this.vel.x = Math.sin(rot * Math.PI / 180) * BULLET_SPEED;
  this.vel.y = -Math.cos(rot * Math.PI / 180) * BULLET_SPEED;

  // override run to isolate drawing and movement (safest)
  this.run = function (delta) {
    if (!this.visible) return;

    // move bullet (no friction for classic bullet)
    this.x += this.vel.x * delta;
    this.y += this.vel.y * delta;

    this.life--;
    if (this.life <= 0) {
      this.visible = false;
      return;
    }

    // wrap
    if (this.x < 0) this.x += Game.canvasWidth;
    if (this.x > Game.canvasWidth) this.x -= Game.canvasWidth;
    if (this.y < 0) this.y += Game.canvasHeight;
    if (this.y > Game.canvasHeight) this.y -= Game.canvasHeight;

    // isolated draw
    this.context.save();
    this.context.translate(this.x, this.y);
    this.context.beginPath();
    this.context.moveTo(0, -2);
    this.context.lineTo(0, 2);
    this.context.stroke();
    this.context.restore();
  };
}

/* inherit context slot from Sprite so we can assign later */
Bullet.prototype = Object.create(Sprite.prototype);
Bullet.prototype.constructor = Bullet;

/* ================= TEXT (SAFE) ================= */
/* Simplified: use canvas text to avoid path contamination */
var Text = {
  context: null,
  face: null,

  renderText: function (txt, size, x, y) {
    if (!this.context) return;
    var ctx = this.context;
    ctx.save();
    // choose a readable font — you can change later
    ctx.font = (size + "px monospace");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(txt, x, y);
    ctx.restore();
  }
};

/* ================= GAME ================= */

var Game = {
  sprites: [],
  canvasWidth: 800,
  canvasHeight: 600
};

/* ================= BOOT ================= */

window.onload = function () {
  var canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error("canvas element with id='canvas' not found.");
    return;
  }
  canvas.width = 800;
  canvas.height = 600;

  var ctx = canvas.getContext('2d');

  // drawing style
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.fillStyle = "#ffffff";

  // important: assign to prototypes & Text
  Sprite.prototype.context = ctx;
  Bullet.prototype.context = ctx;
  Text.context = ctx;

  Game.canvasWidth = canvas.width;
  Game.canvasHeight = canvas.height;

  // create ship
  var ship = new Sprite();
  // classic small triangle: left-bottom, top, right-bottom
  ship.init('ship', [-6, 6, 0, -12, 6, 6]);
  ship.visible = true;
  ship.x = Game.canvasWidth / 2;
  ship.y = Game.canvasHeight / 2;
  ship.shooting = false; // prevent continuous fire on hold
  Game.sprites.push(ship);

  // timing
  var last = performance.now();

  function loop(now) {
    var delta = (now - last) / 16.666; // ~1 at 60fps
    if (delta <= 0) delta = 1;
    last = now;

    // reset transforms and fully clear the canvas (prevents ghosting)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // make sure path state is clean before any drawing
    ctx.beginPath();

    // CONTROLS -> update ship.vel.rot and ship.acc
    // rotation: vel.rot is degrees per unit so move() multiplies by delta
    if (KEY_STATUS.left) ship.vel.rot = -ROT_SPEED;
    else if (KEY_STATUS.right) ship.vel.rot = ROT_SPEED;
    else ship.vel.rot = 0;

    // acceleration: convert ship.rot (deg) to vector
    if (KEY_STATUS.up) {
      ship.acc.x = Math.sin(ship.rot * Math.PI / 180) * ACCELERATION;
      ship.acc.y = -Math.cos(ship.rot * Math.PI / 180) * ACCELERATION;
    } else {
      ship.acc.x = 0;
      ship.acc.y = 0;
    }

    // SHOOT (one per keypress)
    if (KEY_STATUS.space && !ship.shooting) {
      ship.shooting = true;
      var b = new Bullet(ship.x, ship.y, ship.rot);
      // ensure bullet has the same context
      b.context = ctx;
      Game.sprites.push(b);
    }
    if (!KEY_STATUS.space) ship.shooting = false;

    // UPDATE + DRAW sprites (iterate backwards to allow removal)
    for (var i = Game.sprites.length - 1; i >= 0; i--) {
      var s = Game.sprites[i];
      // give each sprite the drawing context (already on prototype but keep safe)
      s.context = ctx;
      s.run(delta);
      if (!s.visible) {
        Game.sprites.splice(i, 1);
      }
    }

    // HUD / text (safe simple text)
    Text.renderText("ASTEROIDS HTML5", 20, 10, 8);
    Text.renderText("ARROWS = MOVE | SPACE = FIRE", 14, 10, 34);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
};
