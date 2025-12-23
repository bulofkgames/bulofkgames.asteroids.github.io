/*
========================================
 Canvas Asteroids (HTML5)
 Original code: Doug McInnes (2010)
 Fixed & restored for modern browsers by:
 Leonardo Dias Gomes
 YouTube: @BULOFK
========================================
*/

var KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  70: 'f',
  71: 'g',
  72: 'h',
  77: 'm',
  80: 'p'
};

var KEY_STATUS = { keyDown: false };
for (var code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

$(window).on('keydown', function (e) {
  KEY_STATUS.keyDown = true;
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = true;
  }
}).on('keyup', function (e) {
  KEY_STATUS.keyDown = false;
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = false;
  }
});

var GRID_SIZE = 60;

/* ================= MATRIX ================= */

function Matrix(rows, columns) {
  this.data = Array.from({ length: rows }, () => new Array(columns));

  this.configure = function (rot, scale, tx, ty) {
    var r = rot * Math.PI / 180;
    var s = Math.sin(r) * scale;
    var c = Math.cos(r) * scale;
    this.set(c, -s, tx, s, c, ty);
  };

  this.set = function () {
    var k = 0;
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 3; j++) {
        this.data[i][j] = arguments[k++];
      }
    }
  };

  this.multiply = function (x, y, z) {
    return [
      this.data[0][0] * x + this.data[0][1] * y + this.data[0][2] * z,
      this.data[1][0] * x + this.data[1][1] * y + this.data[1][2] * z
    ];
  };
}

/* ================= SPRITE ================= */

function Sprite() {
  this.children = {};
  this.visible = false;
  this.reap = false;
  this.bridgesH = true;
  this.bridgesV = true;
  this.collidesWith = [];

  this.x = this.y = this.rot = 0;
  this.scale = 1;
  this.vel = { x: 0, y: 0, rot: 0 };
  this.acc = { x: 0, y: 0, rot: 0 };

  this.init = function (name, points) {
    this.name = name;
    this.points = points || [];
  };

  this.run = function (delta) {
    if (!this.visible) return;
    this.move(delta);
    this.updateGrid();
    this.context.save();
    this.configureTransform();
    this.draw();
    this.context.restore();
  };

  this.move = function (delta) {
    this.vel.x += this.acc.x * delta;
    this.vel.y += this.acc.y * delta;
    this.x += this.vel.x * delta;
    this.y += this.vel.y * delta;
    this.rot = (this.rot + this.vel.rot * delta + 360) % 360;
  };

  this.configureTransform = function () {
    this.context.translate(this.x, this.y);
    this.context.rotate(this.rot * Math.PI / 180);
    this.context.scale(this.scale, this.scale);
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
    this.context.save();
    this.context.translate(x, y);
    var scale = size * 72 / (this.face.resolution * 100);
    this.context.scale(scale, -scale);
    this.context.beginPath();
    for (var c of txt) {
      var g = this.face.glyphs[c];
      if (!g || !g.o) continue;
      var o = g.o.split(' ');
      for (var i = 0; i < o.length;) {
        var a = o[i++];
        if (a === 'm') this.context.moveTo(o[i++], o[i++]);
        if (a === 'l') this.context.lineTo(o[i++], o[i++]);
      }
      this.context.translate(g.ha || 0, 0);
    }
    this.context.fill();
    this.context.restore();
  }
};

/* ================= GAME ================= */

var Game = {
  sprites: [],
  score: 0,
  lives: 3,
  canvasWidth: 800,
  canvasHeight: 600
};

window.onload = function () {

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  Game.canvasWidth = canvas.width;
  Game.canvasHeight = canvas.height;

  Text.context = ctx;
  Text.face = vector_battle;

  Sprite.prototype.context = ctx;
  Sprite.prototype.matrix = new Matrix(2, 3);

  var ship = new Sprite();
  ship.init('ship', [-5,4,0,-12,5,4]);
  ship.visible = true;
  ship.x = Game.canvasWidth / 2;
  ship.y = Game.canvasHeight / 2;
  Game.sprites.push(ship);

  function loop() {
    ctx.clearRect(0, 0, Game.canvasWidth, Game.canvasHeight);
    for (var s of Game.sprites) s.run(1);
    Text.renderText('Press Space to Start', 32, 200, 300);
    requestAnimationFrame(loop);
  }

  loop();
};
