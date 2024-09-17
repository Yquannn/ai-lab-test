"use strict";

var targets = [{
  x: 580,
  y: 280
}, {
  x: 363,
  y: 290
}, {
  x: 363,
  y: 250
}, {
  x: 263,
  y: 260
}, {
  x: 265,
  y: 225
}];
var currentTargetIndex = 0;
var targetReached = false;
var targetLocation = false;

function preload() {
  this.load.image('tree', './assets/Oak_Tree.png');
  this.load.image('tree1', './assets/spr_tree1.png');
  this.load.image('tree2', './assets/spr_tree2.png');
  this.load.image('tree3', './assets/spr_tree3.png');
  this.load.image('overworld', './assets/map2.png');
  this.load.spritesheet('player', '/assets/Player.png', {
    frameWidth: 32,
    frameHeight: 32
  }); // this.load.image('wood', '/assets/wood.png');

  this.load.spritesheet('house', './assets/wood.png', {
    frameWidth: 128,
    frameHeight: 128
  });
}

function create() {
  var _this = this;

  // Ensure overworld background is preloaded
  this.add.image(400, 300, 'overworld'); // Player sprite setup

  this.player = this.physics.add.sprite(580, 200, 'player').setDepth(2);
  this.player.setSize(16, 20).setOffset(8, 5); // Call external creation functions

  createAnimation.call(this);
  createTrees.call(this);
  createHouse.call(this); // Setup keyboard inputs

  this.cursors = this.input.keyboard.createCursorKeys();
  this.pathGraphics = this.add.graphics(); // Zoom the camera

  this.cameras.main.setZoom(2); // Automatically follow player

  this.cameras.main.startFollow(this.player); // Automatically follow player when game starts
  // Make camera follow player on pointer click (convert to world coordinates)

  this.input.on('pointerdown', function (pointer) {
    var worldX = pointer.worldX;
    var worldY = pointer.worldY;
    var distance = Phaser.Math.Distance.Between(worldX, worldY, _this.player.x, _this.player.y);

    if (distance < 50) {
      _this.cameras.main.startFollow(_this.player); // This can still trigger on click

    }
  }); // Set world bounds (optional, if you have a larger world map)

  this.physics.world.setBounds(0, 0, 1600, 1200); // Adjust to your world size

  this.cameras.main.setBounds(0, 0, 1600, 1200); // Same bounds for the camera
  // HUD elements (stamina, logs, level)

  this.stamina = 100;
  this.level = 1.9;
  this.collectedLog = 0;
  this.logCollectable = 0; // Display texts

  this.staminaText = this.add.text(10, 10, "Stamina: ".concat(this.stamina), {
    fontSize: '16px',
    fill: '#fff'
  });
  this.collectedLogText = this.add.text(10, 30, "Collected logs: ".concat(this.collectedLog), {
    fontSize: '16px',
    fill: '#fff'
  });
  this.droppedLogText = this.add.text(10, 50, "Dropped logs: ".concat(this.logCollectable), {
    fontSize: '16px',
    fill: '#fff'
  });
  this.levelText = this.add.text(10, 70, "Level: ".concat(this.level), {
    fontSize: '16px',
    fill: '#fff'
  });
  this.cutTimerText = this.add.text(10, 90, '', {
    fontSize: '16px',
    fill: '#fff'
  });
  this.playerRest = this.add.text(10, 110, '', {
    fontSize: '16px',
    fill: '#fff'
  });
}

function createTrees() {
  var _this2 = this;

  this.trees = [];
  var maxTrees = 4;
  var treeMargin = 50;
  var treeImages = ['tree', 'tree1', 'tree2', 'tree3'];
  var log = [];

  var _loop = function _loop(i) {
    var randomX = void 0,
        randomY = void 0,
        isPositionValid = void 0;

    do {
      randomX = Phaser.Math.Between(200, 250);
      randomY = Phaser.Math.Between(80, 200);
      isPositionValid = _this2.trees.every(function (tree) {
        return Phaser.Math.Distance.Between(randomX, randomY, tree.x, tree.y) >= treeMargin;
      });
    } while (!isPositionValid);

    var randomTreeImage = Phaser.Utils.Array.GetRandom(treeImages);

    var tree = _this2.add.image(randomX, randomY, randomTreeImage).setScale(1).setDepth(1);

    _this2.trees.push(tree); // const wood = this.add.sprite(randomX, randomY, 'wood').setScale(1);
    // log.push(wood);

  };

  for (var i = 0; i < maxTrees; i++) {
    _loop(i);
  }
}

function createAnimation() {
  var _this3 = this;

  var directions = ['down', 'left', 'right', 'up'];
  directions.forEach(function (direction, index) {
    _this3.anims.create({
      key: "walk-".concat(direction),
      frames: _this3.anims.generateFrameNumbers('player', {
        start: index * 4,
        end: index * 4 + 3
      }),
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
  var _this4 = this;

  this.player.setVelocity(0);
  this.player.anims.stop();

  if (this.stamina > 0) {
    this.player.anims.play('new-chopping', true); // Play the new chopping animation

    if (!this.timerEvent) {
      var countdown = 8;
      this.cutTimerText.setText("Cutting: ".concat(countdown, " seconds"));
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: function callback() {
          countdown--;

          _this4.cutTimerText.setText("Cutting: ".concat(countdown, " seconds"));

          if (countdown <= 0) {
            completeChoppingTree.call(_this4, nearestTree);
          }
        },
        callbackScope: this,
        loop: true
      });
    }
  }
}

function completeChoppingTree(nearestTree) {
  var _this5 = this;

  this.cutTimerText.setText('Tree cut down!');
  nearestTree.destroy();
  this.timerEvent.remove(false);
  this.timerEvent = null;
  this.player.anims.stop();
  this.trees = this.trees.filter(function (t) {
    return t !== nearestTree;
  }); // Reduce stamina by 10 after cutting a tree

  this.stamina -= 10;
  this.stamina = Phaser.Math.Clamp(this.stamina, 0, this.defaultStamina); // Adjust the clamp to use defaultStamina

  this.staminaText.setText("Stamina: ".concat(this.stamina));
  this.collectedLog += 1;
  this.collectedLogText.setText("Collected log: ".concat(this.collectedLog)); // Increase the level by 0.1

  this.level += 0.10;
  this.levelText.setText("Level: ".concat(this.level.toFixed(1)));

  if (this.stamina === 0) {
    this.time.delayedCall(10000, function () {
      if (_this5.level.toFixed(0) >= 2) {
        _this5.defaultStamina += 10;
      }

      _this5.stamina = _this5.defaultStamina;
      console.log("Restored stamina: ".concat(_this5.stamina));

      _this5.staminaText.setText("Stamina: ".concat(_this5.stamina.toFixed(0)));

      _this5.playerRest.setText('');
    });
  } // Respawn the tree after it's cut down


  respawnTree.call(this);
}

var SPEED = 30;

function goToPath() {
  if (currentTargetIndex >= targets.length) {
    this.player.setVelocity(0);
    return;
  }

  var targetX = targets[currentTargetIndex].x;
  var targetY = targets[currentTargetIndex].y;
  var directionX = targetX - this.player.x;
  var directionY = targetY - this.player.y;
  var distance = Math.sqrt(directionX * directionX + directionY * directionY);

  if (distance > 5) {
    var moveX = directionX / distance * SPEED;
    var moveY = directionY / distance * SPEED;
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
    console.log("Target reached: ".concat(currentTargetIndex));

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
  } // Update labels


  this.staminaText.setText("Stamina: ".concat(this.stamina));
  this.collectedLogText.setText("Collected logs: ".concat(this.collectedLog));
  this.droppedLogText.setText("Dropped logs: ".concat(this.logCollectable));
}

function respawnTree() {
  var _this6 = this;

  var treeRespawnDelay = 15000; // 15 seconds

  var treeMargin = 50; // Minimum distance between trees

  var obstacleMargin = 400; // Minimum distance between trees and obstacles

  var treeImages = ['tree', 'tree1', 'tree2', 'tree3'];
  this.time.delayedCall(treeRespawnDelay, function () {
    var randomX, randomY, isPositionValid;

    do {
      randomX = Phaser.Math.Between(200, 250); // Adjust bounds to match `createTrees`

      randomY = Phaser.Math.Between(80, 150); // Adjust bounds to match `createTrees`
      // Check that the new position is far enough from other trees

      isPositionValid = _this6.trees.every(function (tree) {
        var distance = Phaser.Math.Distance.Between(randomX, randomY, tree.x, tree.y);
        return distance >= treeMargin;
      }); // Check that the new position is far enough from the water tile (or other obstacles)

      if (isPositionValid && _this6.waterTile) {
        var distanceToWater = Phaser.Math.Distance.Between(randomX, randomY, _this6.waterTile.x, _this6.waterTile.y);
        isPositionValid = distanceToWater >= obstacleMargin;
      } // Optionally, add more checks for other obstacles if needed


      if (isPositionValid && _this6.otherObstacles) {
        isPositionValid = _this6.otherObstacles.every(function (obstacle) {
          var distanceToObstacle = Phaser.Math.Distance.Between(randomX, randomY, obstacle.x, obstacle.y);
          return distanceToObstacle >= obstacleMargin;
        });
      }
    } while (!isPositionValid); // Respawn the tree in a valid location


    var randomTreeImage = Phaser.Utils.Array.GetRandom(treeImages);

    var newTree = _this6.add.image(randomX, randomY, randomTreeImage).setScale(1).setDepth(1);

    _this6.trees.push(newTree);
  });
}

function handlePlayerMovement() {
  var _this7 = this;

  var cursors = this.input.keyboard.createCursorKeys();
  var isPlayerMoving = false;
  var visionDistance = 1000;
  var nearestTree = null;
  var minDistance = visionDistance;
  this.trees.forEach(function (tree) {
    var distance = Phaser.Math.Distance.Between(_this7.player.x, _this7.player.y, tree.x, tree.y);

    if (distance < minDistance) {
      minDistance = distance;
      nearestTree = tree;
    }
  });
  var speed = 30;
  this.pathGraphics.clear();

  if (this.returningToCampfire) {
    moveToStorageRoom.call(this, speed);
    var distanceToCampfire = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.houseLocationX, this.houseLocationY);

    if (distanceToCampfire < 1) {
      this.returningToCampfire = false;
      this.collectedLog = 0;
      this.cutTimerText.setText('Logs dropped off!');
      this.collectedLogText.setText("Collected logs: ".concat(this.collectedLog));
      this.logCollectable += 1;
      this.level += 0.1;
      this.levelText.setText("Level: ".concat(this.level.toFixed(1)));
      this.droppedLogText.setText("Dropped logs: ".concat(this.logCollectable));
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
    var cutDistance = 10;

    if (minDistance < cutDistance) {
      startChoppingTree.call(this, nearestTree);
    }

    this.pathGraphics.lineStyle(2, 0x00ff00);
    this.pathGraphics.lineBetween(this.player.x, this.player.y, nearestTree.x, nearestTree.y);
  } // if (this.waterTile) {
  //   const distanceToWaterTile = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.waterTile.x, this.waterTile.y);
  //   const detectionRadius = 50;
  //   if (distanceToWaterTile < detectionRadius) {
  //     console.log('Obstacle detected: water_tile');
  //     avoidObstacle.call(this, this.waterTile, speed);
  //   }
  // } else {
  //   console.error('Water tile is not defined');
  // }

} // function avoidObstacle(obstacle, speed) {
//   const angleToObstacle = Phaser.Math.Angle.Between(this.player.x, this.player.y, obstacle.x, obstacle.y);
//   const avoidAngle = angleToObstacle + Phaser.Math.DegToRad(90);
//   const newVelocityX = Math.cos(avoidAngle) * speed;
//   const newVelocityY = Math.sin(avoidAngle) * speed;
//   this.player.setVelocity(newVelocityX, newVelocityY);
// }


function createHouse() {
  this.houseLocationX = 200;
  this.houseLocationY = 400;
  this.house = this.add.sprite(this.houseLocationX, this.houseLocationY, 'house').setOrigin(0.5, 0.5).setScale(1.2);
}

function moveToStorageRoom(speed) {
  var directionX = this.houseLocationX - this.player.x;
  var directionY = this.houseLocationY - this.player.y;
  var magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
  var normalizedX = directionX / magnitude;
  var normalizedY = directionY / magnitude;
  this.player.setVelocity(normalizedX * 30, normalizedY * 30);
  playWalkAnimation.call(this, normalizedX, normalizedY);
}

function moveToCampfire(speed) {
  var directionX = this.campLocationX - this.player.x;
  var directionY = this.campLocationY - this.player.y;
  var magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
  var normalizedX = directionX / magnitude;
  var normalizedY = directionY / magnitude;
  this.player.setVelocity(normalizedX * speed, normalizedY * speed);
  playWalkAnimation.call(this, normalizedX, normalizedY);
}

function moveToTree(nearestTree, speed) {
  var angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearestTree.x, nearestTree.y);
  this.player.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  playWalkAnimation.call(this, Math.cos(angle), Math.sin(angle));
}

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    "default": 'arcade',
    arcade: {
      gravity: {
        y: 0
      },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
var game = new Phaser.Game(config);