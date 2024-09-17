let targets = [
  { x: 580, y: 280 },
  { x: 363, y: 290 },
  { x: 363, y: 250 },
  { x: 263, y: 260 },
  { x: 265, y: 225 }
];
let currentTargetIndex = 0;
let targetReached = false;
let targetLocation = false;

function preload() {
  this.load.image('tree', './assets/Oak_Tree.png');
  this.load.image('tree1', './assets/spr_tree1.png');
  this.load.image('tree2', './assets/spr_tree2.png');
  this.load.image('tree3', './assets/spr_tree3.png');
  this.load.image('overworld', './assets/map2.png');
  this.load.spritesheet('player', '/assets/Player.png', { frameWidth: 32, frameHeight: 32 });
  // this.load.image('wood', '/assets/wood.png');
  this.load.spritesheet('house', './assets/wood.png', {
    frameWidth: 128,
    frameHeight: 128,
  });
}



function create() {
  // Ensure overworld background is preloaded
  this.add.image(400, 300, 'overworld');
  
  // Player sprite setup
  this.player = this.physics.add.sprite(580, 200, 'player').setDepth(2);
  this.player.setSize(16, 20).setOffset(8, 5);
  
  // Call external creation functions
  createAnimation.call(this);
  createTrees.call(this);
  createHouse.call(this);
  
  // Setup keyboard inputs
  this.cursors = this.input.keyboard.createCursorKeys();
  this.pathGraphics = this.add.graphics();
  
  // Zoom the camera
  this.cameras.main.setZoom(2);

  // Automatically follow player
  this.cameras.main.startFollow(this.player); // Automatically follow player when game starts

  // Make camera follow player on pointer click (convert to world coordinates)
  this.input.on('pointerdown', (pointer) => {
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const distance = Phaser.Math.Distance.Between(worldX, worldY, this.player.x, this.player.y);

    if (distance < 50) {
      this.cameras.main.startFollow(this.player); // This can still trigger on click
    }
  });

  // Set world bounds (optional, if you have a larger world map)
  this.physics.world.setBounds(0, 0, 1600, 1200);  // Adjust to your world size
  this.cameras.main.setBounds(0, 0, 1600, 1200);   // Same bounds for the camera

  // HUD elements (stamina, logs, level)
  this.stamina = 100;
  this.level = 1.9;
  this.collectedLog = 0;
  this.logCollectable = 0;

  // Display texts
  this.staminaText = this.add.text(10, 10, `Stamina: ${this.stamina}`, { fontSize: '16px', fill: '#fff' });
  this.collectedLogText = this.add.text(10, 30, `Collected logs: ${this.collectedLog}`, { fontSize: '16px', fill: '#fff' });
  this.droppedLogText = this.add.text(10, 50, `Dropped logs: ${this.logCollectable}`, { fontSize: '16px', fill: '#fff' });
  this.levelText = this.add.text(10, 70, `Level: ${this.level}`, { fontSize: '16px', fill: '#fff' });

  this.cutTimerText = this.add.text(10, 90, '', { fontSize: '16px', fill: '#fff' });
  this.playerRest = this.add.text(10, 110, '', { fontSize: '16px', fill: '#fff' });
}



function createTrees() {
  this.trees = [];
  const maxTrees = 4;
  const treeMargin = 50;
  const treeImages = ['tree', 'tree1', 'tree2', 'tree3'];
  const log = [];

  for (let i = 0; i < maxTrees; i++) {
    let randomX, randomY, isPositionValid;
    do {
      randomX = Phaser.Math.Between(200, 250);
      randomY = Phaser.Math.Between(80, 200);
      isPositionValid = this.trees.every(tree => Phaser.Math.Distance.Between(randomX, randomY, tree.x, tree.y) >= treeMargin);
    } while (!isPositionValid);

    const randomTreeImage = Phaser.Utils.Array.GetRandom(treeImages);
    const tree = this.add.image(randomX, randomY, randomTreeImage).setScale(1).setDepth(1);
    this.trees.push(tree);
    // const wood = this.add.sprite(randomX, randomY, 'wood').setScale(1);
    // log.push(wood);
  }
}

function createAnimation() {
  const directions = ['down', 'left', 'right', 'up'];
  directions.forEach((direction, index) => {
    this.anims.create({
      key: `walk-${direction}`,
      frames: this.anims.generateFrameNumbers('player', { start: index * 4, end: index * 4 + 3 }),
      frameRate: 10,
      repeat: -1
    });
  });
}

function playWalkAnimation(normalizedX, normalizedY) {
  if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
    this.player.anims.play(normalizedX > 0 ? 'walk-right' : 'walk-left', true);
  } else {
    this.player.anims.play(normalizedY > 0 ? 'walk-down' : 'walk-up', true);
  }
}

function startChoppingTree(nearestTree) {
  this.player.setVelocity(0);
  this.player.anims.stop();

  if (this.stamina > 0) {
    this.player.anims.play('new-chopping', true); // Play the new chopping animation

    if (!this.timerEvent) {
      let countdown = 8;
      this.cutTimerText.setText(`Cutting: ${countdown} seconds`);

      this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
          countdown--;
          this.cutTimerText.setText(`Cutting: ${countdown} seconds`);
          if (countdown <= 0) {
            completeChoppingTree.call(this, nearestTree);


          }
        },
        callbackScope: this,
        loop: true,
      });
    }
  }
}

function completeChoppingTree(nearestTree) {
  this.cutTimerText.setText('Tree cut down!');
  nearestTree.destroy();
  this.timerEvent.remove(false);
  this.timerEvent = null;
  this.player.anims.stop();
  this.trees = this.trees.filter((t) => t !== nearestTree);

  // Reduce stamina by 10 after cutting a tree
  this.stamina -= 10;
  this.stamina = Phaser.Math.Clamp(this.stamina, 0, this.defaultStamina); // Adjust the clamp to use defaultStamina
  this.staminaText.setText(`Stamina: ${this.stamina}`);

  this.collectedLog += 1;
  this.collectedLogText.setText(`Collected log: ${this.collectedLog}`);

  // Increase the level by 0.1
  this.level += 0.10;
  this.levelText.setText(`Level: ${this.level.toFixed(1)}`);

  if (this.stamina === 0) {
    this.time.delayedCall(10000, () => {
      if (this.level.toFixed(0) >= 2) {
        this.defaultStamina += 10; 
      }

      this.stamina = this.defaultStamina;

      console.log(`Restored stamina: ${this.stamina}`);
      this.staminaText.setText(`Stamina: ${this.stamina.toFixed(0)}`);
      this.playerRest.setText('');
    });
  }

  // Respawn the tree after it's cut down
  respawnTree.call(this);
}


const SPEED = 30;

function goToPath() {
  if (currentTargetIndex >= targets.length) {
    this.player.setVelocity(0);
    return;
  }

  const targetX = targets[currentTargetIndex].x;
  const targetY = targets[currentTargetIndex].y;
  const directionX = targetX - this.player.x;
  const directionY = targetY - this.player.y;
  const distance = Math.sqrt(directionX * directionX + directionY * directionY);

  if (distance > 5) {
    const moveX = (directionX / distance) * SPEED;
    const moveY = (directionY / distance) * SPEED;
    this.player.setVelocityX(moveX);
    this.player.setVelocityY(moveY);
    playWalkAnimation.call(this, moveX, moveY);
    targetReached = false;
  } else if (!targetReached) {
    this.player.setVelocity(0);
    this.player.anims.stop();
    this.player.setTexture('player', 0);

    currentTargetIndex++;
    targetReached = true;
    console.log(`Target reached: ${currentTargetIndex}`);

    if (currentTargetIndex >= targets.length) {
      targetLocation = true;
    }
  }
}

function update() {
  if (targetLocation) {
    handlePlayerMovement.call(this);
  } else {
    goToPath.call(this);
  }

  // Update labels
  this.staminaText.setText(`Stamina: ${this.stamina}`);
  this.collectedLogText.setText(`Collected logs: ${this.collectedLog}`);
  this.droppedLogText.setText(`Dropped logs: ${this.logCollectable}`);
}

function respawnTree() {
  const treeRespawnDelay = 15000; // 15 seconds
  const treeMargin = 50; // Minimum distance between trees
  const obstacleMargin = 400; // Minimum distance between trees and obstacles
  const treeImages = ['tree', 'tree1', 'tree2', 'tree3'];

  this.time.delayedCall(treeRespawnDelay, () => {
    let randomX, randomY, isPositionValid;

    do {
      randomX = Phaser.Math.Between(200, 250); // Adjust bounds to match `createTrees`
      randomY = Phaser.Math.Between(80, 150);  // Adjust bounds to match `createTrees`

      // Check that the new position is far enough from other trees
      isPositionValid = this.trees.every((tree) => {
        const distance = Phaser.Math.Distance.Between(randomX, randomY, tree.x, tree.y);
        return distance >= treeMargin;
      });

      // Check that the new position is far enough from the water tile (or other obstacles)
      if (isPositionValid && this.waterTile) {
        const distanceToWater = Phaser.Math.Distance.Between(randomX, randomY, this.waterTile.x, this.waterTile.y);
        isPositionValid = distanceToWater >= obstacleMargin;
      }
      
      // Optionally, add more checks for other obstacles if needed
      if (isPositionValid && this.otherObstacles) {
        isPositionValid = this.otherObstacles.every((obstacle) => {
          const distanceToObstacle = Phaser.Math.Distance.Between(randomX, randomY, obstacle.x, obstacle.y);
          return distanceToObstacle >= obstacleMargin;
        });
      }
      
    } while (!isPositionValid);

    // Respawn the tree in a valid location
    const randomTreeImage = Phaser.Utils.Array.GetRandom(treeImages);
    const newTree = this.add.image(randomX, randomY, randomTreeImage).setScale(1).setDepth(1);
    this.trees.push(newTree);
  });
}

function handlePlayerMovement() {
  const cursors = this.input.keyboard.createCursorKeys();
  let isPlayerMoving = false;
  const visionDistance = 1000;
  let nearestTree = null;
  let minDistance = visionDistance;

  this.trees.forEach(tree => {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, tree.x, tree.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearestTree = tree;
    }
  });

  const speed = 30;
  this.pathGraphics.clear();

  if (this.returningToCampfire) {
    moveToStorageRoom.call(this, speed);
    const distanceToCampfire = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.houseLocationX, this.houseLocationY);
    if (distanceToCampfire < 1) {
      this.returningToCampfire = false;
      this.collectedLog = 0;
      this.cutTimerText.setText('Logs dropped off!');
      this.collectedLogText.setText(`Collected logs: ${this.collectedLog}`);
      this.logCollectable += 1;
      this.level += 0.1;
      this.levelText.setText(`Level: ${this.level.toFixed(1)}`);
      this.droppedLogText.setText(`Dropped logs: ${this.logCollectable}`);
    }
    this.pathGraphics.lineStyle(2, 0xff0000);
    this.pathGraphics.lineBetween(this.player.x, this.player.y, this.houseLocationX, this.houseLocationY);
  } else if (this.stamina === 0) {
    this.cutTimerText.setText('Not enough stamina. WoodCutter Resting...');
    moveToCampfire.call(this, speed);
    this.pathGraphics.lineStyle(2, 0xff0000);
    this.pathGraphics.lineBetween(this.player.x, this.player.y, this.campLocationX, this.campLocationY);
  } else if (this.collectedLog === 3) {
    this.cutTimerText.setText('Returning to house log to drop logs...');
    this.returningToCampfire = true;
  } else if (nearestTree) {
    moveToTree.call(this, nearestTree, speed);
    isPlayerMoving = true;

    const cutDistance = 10;
    if (minDistance < cutDistance) {
      startChoppingTree.call(this, nearestTree);
    }
    this.pathGraphics.lineStyle(2, 0x00ff00);
    this.pathGraphics.lineBetween(this.player.x, this.player.y, nearestTree.x, nearestTree.y);
  }

  // if (this.waterTile) {
  //   const distanceToWaterTile = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.waterTile.x, this.waterTile.y);
  //   const detectionRadius = 50;

  //   if (distanceToWaterTile < detectionRadius) {
  //     console.log('Obstacle detected: water_tile');
  //     avoidObstacle.call(this, this.waterTile, speed);
  //   }
  // } else {
  //   console.error('Water tile is not defined');
  // }
}

// function avoidObstacle(obstacle, speed) {
//   const angleToObstacle = Phaser.Math.Angle.Between(this.player.x, this.player.y, obstacle.x, obstacle.y);
//   const avoidAngle = angleToObstacle + Phaser.Math.DegToRad(90);
//   const newVelocityX = Math.cos(avoidAngle) * speed;
//   const newVelocityY = Math.sin(avoidAngle) * speed;
//   this.player.setVelocity(newVelocityX, newVelocityY);
// }

function createHouse() {
  this.houseLocationX = 200;
  this.houseLocationY = 400;

  this.house = this.add
    .sprite(this.houseLocationX, this.houseLocationY, 'house')
    .setOrigin(0.5, 0.5)
    .setScale(1.2);
}

function moveToStorageRoom(speed) {
  const directionX = this.houseLocationX - this.player.x;
  const directionY = this.houseLocationY - this.player.y;
  const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
  const normalizedX = directionX / magnitude;
  const normalizedY = directionY / magnitude;
  this.player.setVelocity(normalizedX * 30, normalizedY * 30);
  playWalkAnimation.call(this, normalizedX, normalizedY);
}

function moveToCampfire(speed) {
  const directionX = this.campLocationX - this.player.x;
  const directionY = this.campLocationY - this.player.y;
  const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
  const normalizedX = directionX / magnitude;
  const normalizedY = directionY / magnitude;
  this.player.setVelocity(normalizedX * speed, normalizedY * speed);
  playWalkAnimation.call(this, normalizedX, normalizedY);
}

function moveToTree(nearestTree, speed) {
  const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearestTree.x, nearestTree.y);
  this.player.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  playWalkAnimation.call(this, Math.cos(angle), Math.sin(angle));
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
