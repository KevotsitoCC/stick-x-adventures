const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#ffffff', // Fondo blanco
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Eliminar gravedad global
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  parent: 'game-container' // Contenedor donde se cargará el juego
};

const game = new Phaser.Game(config);

let player, cursors, spaceKey;
let pencil, boxes = [];
let isAttacking = false;
let walkSound, hitSound, backgroundMusic;
let pencilMovementTimer;

function preload() {
  // Cargar sprites
  this.load.spritesheet('stand', 'sprites/stand.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('walk', 'sprites/walk.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('hit', 'sprites/hit.png', { frameWidth: 64, frameHeight: 64 });

  // Cargar la imagen de la caja
  this.load.image('box', 'images/box.png'); // Ruta de la imagen de la caja

  // Cargar el sprite del lápiz
  this.load.image('pencil', 'images/pencil.png'); // Ruta del lápiz

  // Cargar sonidos
  this.load.audio('walkSound', 'sounds/walk.mp3');
  this.load.audio('hitSound', 'sounds/hit.mp3');
  this.load.audio('backgroundMusic', 'sounds/background-music.mp3');

  // Cargar imagen de fondo (cuaderno)
  this.load.image('notebookBackground', 'images/notebook.png');
}

function create() {
  // Fondo del cuaderno
  this.add.image(400, 300, 'notebookBackground').setOrigin(0.5);

  // Crear al jugador
  player = this.physics.add.sprite(100, 450, 'stand').setScale(1.5);
  player.setCollideWorldBounds(true);

  // Configurar la gravedad del jugador
  player.body.setGravityY(500); // Esto permitirá que el jugador caiga
  player.setSize(10, 60); // Reducir la hitbox del jugador

  // Animaciones
  this.anims.create({
    key: 'stand',
    frames: this.anims.generateFrameNumbers('stand', { start: 0, end: 6 }),
    frameRate: 5,
    repeat: -1,
    repeatDelay: 500
  });

  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 2 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'hit',
    frames: this.anims.generateFrameNumbers('hit', { start: 0, end: 13 }),
    frameRate: 20,
    repeat: 0
  });

  player.anims.play('stand');

  // Cargar los sonidos y ajustar su volumen
  walkSound = this.sound.add('walkSound', { volume: 0.3 });
  hitSound = this.sound.add('hitSound', { volume: 0.5 });
  backgroundMusic = this.sound.add('backgroundMusic', { volume: 0.5, loop: true });
  backgroundMusic.play();

  // Crear el lápiz (sprite) que volará arriba
  pencil = this.physics.add.sprite(400, 50, 'pencil').setScale(1.5);
  pencil.setCollideWorldBounds(true);
  pencil.body.setAllowGravity(false); // Desactivar la gravedad del lápiz para que no caiga

  // Controles
  cursors = this.input.keyboard.createCursorKeys();
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // Crear una función que dibuje las cajas cuando el lápiz se mueve
  this.time.addEvent({
    delay: 3000, // Cada 3 segundos el lápiz dibuja una caja
    callback: drawBox,
    callbackScope: this,
    loop: true
  });

  // Mover el lápiz aleatoriamente en el eje X cada cierto tiempo
  pencilMovementTimer = this.time.addEvent({
    delay: Phaser.Math.Between(1000, 3000), // Movimiento aleatorio cada 1-3 segundos
    callback: movePencilRandomly,
    callbackScope: this,
    loop: true
  });
}

function update() {
  if (isAttacking) return;

  // Movimiento del jugador
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.flipX = true;
    player.anims.play('walk', true);
    if (!walkSound.isPlaying) walkSound.play();
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.flipX = false;
    player.anims.play('walk', true);
    if (!walkSound.isPlaying) walkSound.play();
  } else {
    player.setVelocityX(0);
    player.anims.play('stand', true);
    walkSound.stop();
  }

  // Ataque del jugador
  if (spaceKey.isDown) {
    player.setVelocityX(0);
    player.anims.play('hit', true);
    setTimeout(() => hitSound.play(), 300);
    isAttacking = true;

    player.once('animationcomplete-hit', () => {
      isAttacking = false;
    });
  }

  // Colisiones entre jugador y cajas
  this.physics.world.overlap(player, boxes, destroyBox, null, this);
}

function destroyBox(player, box) {
  if (isAttacking) {
    this.time.delayedCall(400, () => {
      box.destroy();
    });
  }
}

function drawBox() {
  const box = this.physics.add.sprite(pencil.x, pencil.y, 'box');
  box.setCollideWorldBounds(true);
  box.setGravityY(300); // Gravedad para que las cajas caigan
  boxes.push(box);
}

function movePencilRandomly() {
  // Cambiar la posición del lápiz solo en el eje X
  const randomX = Phaser.Math.Between(100, 700); // Rango de movimiento en el eje X
  pencil.setPosition(randomX, 50); // El eje Y permanece constante
}
