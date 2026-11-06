import * as THREE from 'three';
import { WorldGenerator } from './world/WorldGenerator.js';
import { Player } from './entities/Player.js';
import { Eagle } from './entities/Eagle.js';
import { Coin } from './entities/Coin.js';
import { InputManager } from './systems/InputManager.js';
import { CameraController } from './systems/CameraController.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ScoreManager } from './systems/ScoreManager.js';
import { CoinManager } from './systems/CoinManager.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { AudioManager } from './systems/AudioManager.js';
import { CharacterManager } from './characters/CharacterManager.js';
import { UIManager } from './ui/UIManager.js';
import { THEMES, setTheme, currentTheme } from './world/themes.js';
import {
  TILE_SIZE,
  EAGLE_IDLE_TIME,
  COIN_SPAWN_CHANCE,
  DIFFICULTY_SPEED_INCREASE,
  DIFFICULTY_MAX_MULTIPLIER,
} from './constants.js';
import { randomInt } from './utils/mathHelpers.js';

export class Game {
  constructor() {
    this.state = 'title'; // 'title' | 'playing' | 'gameover' | 'characters' | 'gumball'
    this.idleTimer = 0;
    this.speedMultiplier = 1.0;
    this.coins = [];
    this._lastTime = performance.now();

    // ── Three.js Setup ───────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x70c1b3);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // ── Lighting ─────────────────────────────────────────────
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    this.dirLight.position.set(20, 35, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    const d = 25;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // ── Game Subsystems ──────────────────────────────────────
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();
    this.cameraController = new CameraController(this.camera);
    this.collisionSystem = new CollisionSystem();
    this.scoreManager = new ScoreManager();
    this.coinManager = new CoinManager();
    this.characterManager = new CharacterManager();
    this.particleSystem = new ParticleSystem(this.scene);
    this.worldGenerator = new WorldGenerator(this.scene);
    this.player = new Player(this.scene);
    this.eagle = new Eagle(this.scene);
    this.uiManager = new UIManager(this);

    // Apply currently selected character & theme
    this._applySelectedCharacter();

    // ── Input binding ────────────────────────────────────────
    this.inputManager.onInput((direction) => this._handleInput(direction));

    // ── Window Resize ────────────────────────────────────────
    window.addEventListener('resize', () => this._onResize());

    // Initialize world with initial rows
    this.worldGenerator.generate(0);

    // Show initial UI
    this.goToTitle();

    // Start loop
    requestAnimationFrame((t) => this._loop(t));
  }

  // ── Character & Theme ───────────────────────────────────────

  _applySelectedCharacter() {
    const selected = this.characterManager.getSelected();
    const mesh = this.characterManager.createMesh(selected.id);
    this.player.setMesh(mesh);

    // Apply theme
    const themeName = this.characterManager.getTheme(selected.id);
    setTheme(themeName);
    const th = currentTheme;
    if (th) {
      this.scene.background = new THREE.Color(th.sky);
      if (th.fog) {
        this.scene.fog = new THREE.FogExp2(th.fog, 0.02);
      } else {
        this.scene.fog = null;
      }
    }
  }

  // ── State Transitions ───────────────────────────────────────

  goToTitle() {
    this.state = 'title';
    this.uiManager.showTitle(this.scoreManager.getHighScore());
    this.cameraController.reset();
  }

  startGame() {
    this.audioManager.initContext();
    this.state = 'playing';
    this.scoreManager.reset();
    this.player.reset();
    this.eagle.reset();
    this.particleSystem.clear();
    this._clearCoins();

    this.worldGenerator.reset();
    this.worldGenerator.generate(0);
    this._spawnCoinsForInitialRows();

    this.cameraController.reset();
    this.idleTimer = 0;
    this.speedMultiplier = 1.0;

    this.uiManager.showPlaying();
    this.uiManager.updateScore(0);
    this.uiManager.updateCoins(this.coinManager.coins);
  }

  retry() {
    this.startGame();
  }

  showCharacters() {
    this.state = 'characters';
    this.uiManager.showCharacterSelect(
      this.characterManager.getAllCharacters(),
      this.characterManager.selectedId,
      (id) => {
        this.characterManager.select(id);
        this._applySelectedCharacter();
      }
    );
  }

  showGumball() {
    this.state = 'gumball';
    this.uiManager.showGumball(
      this.coinManager,
      this.characterManager,
      (unlockedChar) => {
        this.audioManager.playNewHighScore();
        this.characterManager.select(unlockedChar.id);
        this._applySelectedCharacter();
      }
    );
  }

  // ── Input Handling ──────────────────────────────────────────

  _handleInput(direction) {
    this.audioManager.initContext();

    if (this.state === 'title') {
      this.startGame();
      return;
    }

    if (this.state !== 'playing' || this.player.isHopping || this.player.isDead) {
      return;
    }

    let dx = 0;
    let dz = 0;

    switch (direction) {
      case 'forward':  dz = -1; break;
      case 'backward': dz = 1;  break;
      case 'left':     dx = -1; break;
      case 'right':    dx = 1;  break;
    }

    const targetX = this.player.gridX + dx;
    const targetZ = this.player.gridZ + dz;

    // Boundaries: clamp X to lane width (±8)
    if (targetX < -8 || targetX > 8) return;

    // Do not allow walking too far backwards
    const playerRowIndex = Math.abs(this.player.gridZ);
    if (dz > 0 && targetZ > 0) return;

    // Check obstacle blockage
    if (this.collisionSystem.isBlocked(targetX, targetZ, this.worldGenerator)) {
      return; // Can't hop into trees or rocks
    }

    // Perform hop
    this.player.hop(dx, dz);
    this.audioManager.playHop();
    this.particleSystem.spawnHopDust(
      this.player.mesh.position.x,
      0,
      this.player.mesh.position.z
    );

    // Reset eagle anti-idle timer on forward hop
    if (dz < 0) {
      this.idleTimer = 0;
    }
  }

  // ── Coin Spawning ───────────────────────────────────────────

  _spawnCoinsForInitialRows() {
    for (let r = 2; r < 20; r++) {
      this._trySpawnCoinAtRow(r);
    }
  }

  _trySpawnCoinAtRow(rowIndex) {
    if (Math.random() < COIN_SPAWN_CHANCE) {
      const row = this.worldGenerator.getRow(rowIndex);
      if (row && !row.isWater) {
        const x = randomInt(-5, 5);
        if (!row.obstacles || !row.obstacles.includes(x)) {
          const coin = new Coin(this.scene, x, -rowIndex);
          this.coins.push({ coin, rowIndex, x });
        }
      }
    }
  }

  _clearCoins() {
    for (const c of this.coins) {
      c.coin.dispose();
    }
    this.coins.length = 0;
  }

  // ── Game Loop ───────────────────────────────────────────────

  _loop(timestamp) {
    requestAnimationFrame((t) => this._loop(t));

    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.1);
    this._lastTime = timestamp;

    this._update(dt);
    this._render();
  }

  _update(dt) {
    const playerWorldPos = this.player.getWorldPosition();
    const playerRowIndex = Math.abs(this.player.gridZ);

    // ── Update Camera ──
    this.cameraController.update(dt, playerWorldPos.x, playerWorldPos.z);

    // ── Update Particles ──
    this.particleSystem.update(dt);

    // ── Update World ──
    this.worldGenerator.update(dt, this.speedMultiplier);

    // ── Update Coins ──
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.coin.update(dt);

      // Check coin collection if playing
      if (this.state === 'playing' && !c.coin.collected) {
        const distSq =
          Math.pow(playerWorldPos.x - c.x, 2) +
          Math.pow(playerWorldPos.z - (-c.rowIndex), 2);
        if (distSq < 0.5) {
          c.coin.collect();
          this.coinManager.addCoin();
          this.audioManager.playCoin();
          this.particleSystem.spawnCoinSparkle(c.x, 0.5, -c.rowIndex);
          this.uiManager.updateCoins(this.coinManager.coins);
        }
      }

      // Dispose coins far behind
      if (c.rowIndex < playerRowIndex - 8) {
        c.coin.dispose();
        this.coins.splice(i, 1);
      }
    }

    if (this.state !== 'playing') {
      return;
    }

    // ── Advance Player Hop ──
    const hopCompleted = this.player.update(dt);

    // ── Trigger Rail Warnings for tracks ahead ──
    for (let r = playerRowIndex; r <= playerRowIndex + 6; r++) {
      const row = this.worldGenerator.getRow(r);
      if (row && typeof row.triggerWarning === 'function') {
        if (!row.trainActive && !row.trainWarning && row.canTrigger) {
          row.triggerWarning();
          this.audioManager.playTrainWarning();
        }
      }
    }

    // ── Check Hop Landing Collision ──
    if (hopCompleted) {
      // Ensure world has rows ahead
      const oldLast = this.worldGenerator.lastGeneratedRow;
      this.worldGenerator.generate(playerRowIndex);
      for (let r = oldLast + 1; r <= this.worldGenerator.lastGeneratedRow; r++) {
        this._trySpawnCoinAtRow(r);
      }

      // Update score
      const currentScore = playerRowIndex;
      if (this.scoreManager.updateScore(currentScore)) {
        this.uiManager.updateScore(this.scoreManager.getScore());
        // Dynamic difficulty
        this.speedMultiplier = Math.min(
          DIFFICULTY_MAX_MULTIPLIER,
          1.0 + currentScore * DIFFICULTY_SPEED_INCREASE
        );
      }

      // Check collision on landing
      const collision = this.collisionSystem.checkCollision(this.player, this.worldGenerator);
      if (collision) {
        this._handlePlayerDeath(collision);
        return;
      }
    }

    // ── Continuous Hazard Collision (Cars / Trains hitting stationary player) ──
    if (!this.player.isDead) {
      const contCol = this.collisionSystem.checkContinuous(this.player, this.worldGenerator);
      if (contCol) {
        this._handlePlayerDeath(contCol);
        return;
      }
    }

    // ── River Log Floating ──
    if (!this.player.isHopping && !this.player.isDead) {
      const currentRow = this.worldGenerator.getRow(playerRowIndex);
      if (currentRow && currentRow.isWater && typeof currentRow.getLogSpeed === 'function') {
        const logSpeed = currentRow.getLogSpeed(this.player.gridX);
        if (logSpeed !== 0) {
          this.player.gridX += logSpeed * this.speedMultiplier * dt;
          this.player.mesh.position.x = this.player.gridX * TILE_SIZE;

          // Check if carried off-screen
          if (Math.abs(this.player.gridX) > 10.5) {
            this._handlePlayerDeath('water');
            return;
          }
        }
      }
    }

    // ── Anti-Idle Eagle ──
    if (!this.player.isDead) {
      this.idleTimer += dt * 1000;
      if (this.idleTimer >= EAGLE_IDLE_TIME && !this.eagle.active) {
        this.eagle.activate(playerWorldPos);
        this.audioManager.playEagle();
      }
    }

    // ── Update Eagle ──
    if (this.eagle.active) {
      const eagleStatus = this.eagle.update(dt);
      if (eagleStatus === 'grabbed' && !this.player.isDead) {
        this._handlePlayerDeath('eagle');
      }
    }
  }

  _handlePlayerDeath(type) {
    if (this.player.isDead) return;

    this.player.die(type);

    const pos = this.player.getWorldPosition();
    if (type === 'water') {
      this.audioManager.playSplash();
      this.particleSystem.spawnSplash(pos.x, 0, pos.z);
    } else if (type === 'vehicle' || type === 'train') {
      this.audioManager.playDeath();
      this.particleSystem.spawnSplat(pos.x, 0.4, pos.z);
    } else if (type === 'eagle') {
      this.audioManager.playEagle();
    }

    const isNewHigh = this.scoreManager.isNewHighScore();
    this.scoreManager.saveHighScore();
    if (isNewHigh) {
      this.audioManager.playNewHighScore();
    }

    // Show Game Over UI after short pause
    setTimeout(() => {
      this.state = 'gameover';
      this.uiManager.showGameOver(
        this.scoreManager.getScore(),
        this.scoreManager.getHighScore(),
        isNewHigh
      );
    }, 800);
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

