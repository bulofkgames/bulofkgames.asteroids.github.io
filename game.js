/* 
========================================
 Canvas Asteroids (HTML5)
 Original code: Doug McInnes (2010)
 Fixed & restored for modern browsers by:
 Leonardo Dias Gomes
 YouTube: @BULOFK
========================================
*/

/* ================= CONSTANTS ================= */

var MAX_SPEED = 300;
var ROT_SPEED = 180;
var ACCELERATION = 200;
var FRICTION = 0.98;

/* ================= INPUT ================= */

var KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right'
};

var KEY_STATUS = {};
for (var code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

window.addEventListener('keydown', function (e) {
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = true;
  }
});

window.addEventListener('keyup', function (e) {
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = false;
  }
});

/* ================= SPRITE ================= */

function Sprite() {
  this.visible = false;

  this.x = 0;
  this.y = 0;
  this.rot = 0;
  this.scale = 1;

  this.vel = { x: 0, y: 0, rot: 0 };
  this.acc = { x: 0, y: 0 };

  this.init = function (name, points) {
    this.name = name;
    this.points = points || [];
  };

  this.run = function (delta) {
    if (!this.visible) return;
    this.move(delta);

    this.context.save();
    this.context.translate(this.x, this.y);
    this.context.rotate(this.rot * Math.PI / 180);
    this.context.scale(this.scale, this.scale);
    this.draw();
    this.context.restore();
  };

  this.move = function (delta) {

    // acceleration
    this.vel.x += this.acc.x * delta;
    this.vel.y += this.acc.y * delta;

    // friction
    this.vel.x *= FRICTION;
    this.vel.y *= FRICTION;

    // speed limit
    var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
    if (speed > MAX_SPEED) {
      var scale = MAX_SPEED / speed;
      this.vel.x *= scale;
      this.vel.y *= scale;
    }

    // movement
    this.x += this.vel.x * delta;
    this.y += this.vel.y * delta;

    // rotation
    this.rot = (this.rot + this.vel.rot * delta + 360) % 360;

    // screen wrap
    if (this.x < 0) this.x += Game.canvasWidth;
    if (this.x > Game.canvasWidth) this.x -= Game.canvasWidth;
    if (this.y < 0) this.y += Game.canvasHeight;
    if (this.y > Game.canvasHeight) this.y -= Game.canvasHeight;
  };

  this.draw = function () {
    if (!this.points.length) return;

    this.context.beginPath();
    this.context.moveTo(this.points[0], this.points[1]);

    for (var i = 2; i < this.points.length; i += 2) {
      this.context.lineTo(this.points[i], this.points[i + 1]);
    }

    this.context.closePath();
    this.context.stroke();
  };
}

/* ================= TEXT ================= */

var Text = {
  context: null,
  face: null,

  renderText: function (txt, size, x, y) {
    if (!this.face) return;

    this.context.save();
    this.context.translate(x, y);

    var scale = size * 72 / (this.face.resolution * 100);
    this.context.scale(scale, -scale);
    this.context.beginPath();

    for (var i = 0; i < txt.length; i++) {
      var g = this.face.glyphs[txt[i]];
      if (!g || !g.o) continue;

      var path = g.o.split(' ');
      for (var j = 0; j < path.length;) {
        var cmd = path[j++];
        if (cmd === 'm') this.context.moveTo(path[j++], path[j++]);
        if (cmd === 'l') this.context.lineTo(path[j++], path[j++]);
      }
      this.context.translate(g.ha || 0, 0);
    }

    this.context.stroke();
    this.context.restore();
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
  canvas.width = 800;
  canvas.height = 600;

  var ctx = canvas.getContext('2d');

  // IMPORTANT: remove visual artifacts
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  Game.canvasWidth = canvas.width;
  Game.canvasHeight = canvas.height;

  Text.context = ctx;
  Text.face = window.vector_battle || null;

  Sprite.prototype.context = ctx;

  var ship = new Sprite();
  ship.init('ship', [-6, 6, 0, -12, 6, 6]);
  ship.visible = true;
  ship.x = Game.canvasWidth / 2;
  ship.y = Game.canvasHeight / 2;

  Game.sprites.push(ship);

  let last = performance.now();

  function loop(now) {
    var delta = (now - last) / 16.666;
    last = now;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ROTATION
    if (KEY_STATUS.left) ship.vel.rot = -ROT_SPEED;
    else if (KEY_STATUS.right) ship.vel.rot = ROT_SPEED;
    else ship.vel.rot = 0;

    // ACCELERATION
    if (KEY_STATUS.up) {
      ship.acc.x = Math.sin(ship.rot * Math.PI / 180) * ACCELERATION;
      ship.acc.y = -Math.cos(ship.rot * Math.PI / 180) * ACCELERATION;
    } else {
      ship.acc.x = 0;
      ship.acc.y = 0;
    }

    for (var i = 0; i < Game.sprites.length; i++) {
      Game.sprites[i].run(delta);
    }

    Text.renderText("ASTEROIDS HTML5", 28, 180, 60);
    Text.renderText("ARROWS TO MOVE", 18, 240, 100);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
};
