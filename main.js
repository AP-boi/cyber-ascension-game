/* =========================================================================================
   CYBER ASCENSION // main.js
   Principal 2D Platformer Game Engine & Complete Multi-Level Implementation
   Features:
   - Fixed Timestep 60FPS Game Loop with delta smoothing
   - Exhaustive AABB Collision Detection & Resolution (X/Y Axis Separation)
   - Player Physics: Acceleration, Friction, Gravity, Jump / Double Jump, State Machine
   - Enemy AI: Patrol Pathing, Ledge/Wall Turning, Stomp vs Side-Collision Detection
   - Collectibles: Bobbing Mobius Data Packets with Particle Explosion Effects
   - Camera: Smooth Viewport Tracking with Level Boundary Clamping & Screen Shake
   - Multi-Level Architecture: LevelManager with 3 Massive Hardcoded Levels
   - Physical Branching Endings in Level 3 (Upper Ascension Path vs Lower Abyssal Path)
   - Rich Parallax Background Rendering & Particle VFX System
   ========================================================================================= */

import { EventBus, AntigravitySystem, GravityZone } from './AntigravitySystem.js';

// Instantiate Antigravity & Decoupled EventBus
const eventBus = new EventBus();
const antigravitySystem = new AntigravitySystem(eventBus);

// ─── ENGINE CONSTANTS & VIRTUAL RESOLUTION ───────────────────────────────────────────────
const VIEW_WIDTH  = 1280;
const VIEW_HEIGHT = 720;
const GRAVITY     = 0.58;
const MAX_FALL    = 16;
const FRICTION    = 0.82; // Ground horizontal friction
const AIR_RESIST  = 0.92; // Air horizontal damping
const JUMP_POWER  = -13.5;
const DOUBLE_JUMP = -11.5;
const MOVE_ACCEL  = 0.95;
const MAX_SPEED   = 6.5;

// ─── DOM REFERENCES & AUDIO/UI MANAGERS ──────────────────────────────────────────────────
const canvas        = document.getElementById('gameCanvas');
const ctx           = canvas.getContext('2d');
const hudLevelTitle = document.getElementById('hud-level-title');
const hudShields    = document.getElementById('hud-shields');
const hudScore      = document.getElementById('hud-score');
const hudDash       = document.getElementById('hud-dash');
const hudGravity    = document.getElementById('hud-gravity');
const hudStatus     = document.getElementById('hud-status');
const uiModal       = document.getElementById('ui-modal');
const modalBox      = document.getElementById('modal-box-inner');
const modalTag      = document.getElementById('modal-tag');
const modalTitle    = document.getElementById('modal-title');
const modalDesc     = document.getElementById('modal-desc');
const statPackets   = document.getElementById('stat-packets');
const statEnemies   = document.getElementById('stat-enemies');
const statTime      = document.getElementById('stat-time');
const btnPrimary    = document.getElementById('modal-btn-primary');
const btnSecondary  = document.getElementById('modal-btn-secondary');

// Enable crisp pixel rendering on canvas context
ctx.imageSmoothingEnabled = false;

// ─── ASSETS / SPRITE LOADING SYSTEM WITH ASYNC HANDLING ──────────────────────────────────
const playerSprite = new Image();
const bgImage = new Image();
let bgLevel2Image = new Image();
let bgLevel3Image = new Image();
const enemySprite = new Image();
const mechSprite = new Image();
let mechSpriteProcessed = null;
const collectibleSprite = new Image();
const platformSprite = new Image();

function removeWhiteBackground(img, threshold = 210) {
  try {
    const c = document.createElement('canvas');
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return img;
    c.width = w;
    c.height = h;
    const ctxTemp = c.getContext('2d');
    ctxTemp.drawImage(img, 0, 0);
    const imgData = ctxTemp.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] >= threshold && d[i + 1] >= threshold && d[i + 2] >= threshold) {
        d[i + 3] = 0;
      }
    }
    ctxTemp.putImageData(imgData, 0, 0);
    const transparentImg = new Image();
    transparentImg.src = c.toDataURL('image/png');
    return transparentImg;
  } catch (e) {
    return img;
  }
}

const assetList = [
  { img: playerSprite, src: 'assets/player.png', name: 'Player Sprite' },
  { img: bgImage, src: 'assets/{9EFD7D5D-B23D-42D6-8302-D17C4F5197E7}.jpg', fallbackSrc: 'assets/background.png', name: 'Round 1 Background Image' },
  { img: bgLevel2Image, src: 'assets/level2_desert_bg.jpg', fallbackSrc: 'assets/Futuristic_cyberpunk_server_room…_202607280032.jpeg', name: 'Round 2 Desert Server Room Background' },
  { img: bgLevel3Image, src: 'assets/level3_glacier_bg.jpg', name: 'Round 3 Glacier Shift Background' },
  { img: enemySprite, src: 'assets/enemy.png', name: 'Enemy Sprite' },
  { img: mechSprite, src: 'assets/mech_enemy_sprite.png', fallbackSrc: 'assets/Mech_sprite_sheet_pixel_art_202607280018.png', name: 'Mech Enemy Sprite' },
  { img: collectibleSprite, src: 'assets/Glowing_data_packet_crystal_anim__202607272356-removebg-preview.png', fallbackSrc: 'assets/collectible.png', name: 'Collectible Sprite' },
  { img: platformSprite, src: 'assets/platform.png', name: 'Platform Texture' }
];

let loadedAssetsCount = 0;
let allAssetsLoaded = false;

function loadAllAssets(onComplete) {
  let completed = false;
  const totalAssets = assetList.length;

  const processAndFinish = () => {
    if (mechSprite.complete && mechSprite.naturalWidth > 0) {
      mechSpriteProcessed = removeWhiteBackground(mechSprite);
    }
    onComplete();
  };

  // Safety fallback timeout in case an image fails or network hangs
  const fallbackTimeout = setTimeout(() => {
    if (!completed) {
      completed = true;
      console.warn("Asset loading timed out. Proceeding with available textures and fallbacks.");
      allAssetsLoaded = true;
      processAndFinish();
    }
  }, 4000);

  assetList.forEach((asset) => {
    asset.img.onload = () => {
      loadedAssetsCount++;
      if (loadedAssetsCount >= totalAssets && !completed) {
        completed = true;
        clearTimeout(fallbackTimeout);
        allAssetsLoaded = true;
        processAndFinish();
      }
    };
    asset.img.onerror = () => {
      if (asset.fallbackSrc && asset.img.src.indexOf(asset.fallbackSrc) === -1) {
        console.warn(`Primary asset ${asset.src} not found. Attempting fallback: ${asset.fallbackSrc}`);
        asset.img.src = asset.fallbackSrc;
        return;
      }
      console.error(`Failed to load asset: ${asset.src}`);
      loadedAssetsCount++;
      if (loadedAssetsCount >= totalAssets && !completed) {
        completed = true;
        clearTimeout(fallbackTimeout);
        allAssetsLoaded = true;
        onComplete();
      }
    };
    asset.img.src = asset.src;
  });
}

// ─── GLOBAL GAME STATE ───────────────────────────────────────────────────────────────────
const game = {
  state: 'PLAYING', // 'PLAYING', 'LEVEL_COMPLETE', 'GAME_OVER', 'GOOD_ENDING', 'BAD_ENDING'
  currentLevelIndex: 0,
  score: 0,
  totalPacketsInLevel: 0,
  enemiesDefeated: 0,
  levelStartTime: 0,
  timeElapsed: 0,
  lastFrameTime: performance.now(),
  fps: 60,
  fpsTimer: 0,
  frameCount: 0
};

// ─── CANVAS SCALING & RESIZE HANDLER ─────────────────────────────────────────────────────
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── INPUT MANAGEMENT ────────────────────────────────────────────────────────────────────
class InputManager {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      dash: false,
      gravity: false,
      reset: false
    };
    this.justPressed = {
      jump: false,
      dash: false,
      gravity: false,
      reset: false
    };
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft')  this.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
      if (code === 'KeyW' || code === 'ArrowUp')    this.keys.up = true;
      if (code === 'KeyS' || code === 'ArrowDown')  this.keys.down = true;
      if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
        this.keys.jump = true;
        this.justPressed.jump = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyE') {
        this.keys.dash = true;
        this.justPressed.dash = true;
      }
      if (code === 'KeyG') {
        this.keys.gravity = true;
        this.justPressed.gravity = true;
      }
      if (code === 'KeyR') {
        this.keys.reset = true;
        this.justPressed.reset = true;
      }
      if (code === 'KeyM') {
        if (typeof audioManager !== 'undefined') audioManager.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft')  this.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
      if (code === 'KeyW' || code === 'ArrowUp')    this.keys.up = false;
      if (code === 'KeyS' || code === 'ArrowDown')  this.keys.down = false;
      if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
        this.keys.jump = false;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyE') {
        this.keys.dash = false;
      }
      if (code === 'KeyG') {
        this.keys.gravity = false;
      }
      if (code === 'KeyR') {
        this.keys.reset = false;
      }
    });

    // Clear keys if window loses focus
    window.addEventListener('blur', () => {
      for (const k in this.keys) this.keys[k] = false;
      for (const k in this.justPressed) this.justPressed[k] = false;
    });
  }

  clearJustPressed() {
    this.justPressed.jump = false;
    this.justPressed.dash = false;
    this.justPressed.gravity = false;
    this.justPressed.reset = false;
  }
}
const input = new InputManager();

// ─── ZERO-LATENCY WEB AUDIO API & AUDIO MANAGER ──────────────────────────────────────────
class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;
    this.masterVolume = 0.8;
    this.bgmVolume = 0.55;
    this.sfxVolume = 1.0;
    
    // Audio Buffers & HTML Audio Elements
    this.buffers = {};
    this.bgmTracks = {
      level1: new Audio('assets/level1_bgm.mp3'),
      level2: new Audio('assets/level2_bgm.mp3')
    };
    
    // Setup looping & volume for HTML5 background tracks
    for (const key in this.bgmTracks) {
      this.bgmTracks[key].loop = true;
      this.bgmTracks[key].volume = this.masterVolume * this.bgmVolume;
    }
    
    this.currentBgm = null;
    this.droneAlertCooldown = 0;
  }

  async init() {
    if (this.initialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      // Pre-load SFX buffers asynchronously for zero latency
      await this.preloadSfx('jump', 'assets/jump.wav');
      await this.preloadSfx('collect', 'assets/collect_data.wav');
      await this.preloadSfx('alert', 'assets/drone_alert.wav');
      await this.preloadSfx('boom', 'assets/boom.wav');
    }
    this.initialized = true;
    this.updateUiDisplay();
    this.playBgm(game.currentLevelIndex || 0);
  }

  async preloadSfx(name, url) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        this.buffers[name] = await this.ctx.decodeAudioData(arrayBuf);
      }
    } catch (e) {
      // Audio file not yet found on disk; will seamlessly fallback to Web Audio API synthesis
    }
  }

  playSfx(name) {
    if (!this.initialized || this.muted) return;
    
    // 1. If buffer exists, play via zero-latency AudioBufferSourceNode
    if (this.ctx && this.buffers[name]) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[name];
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = this.masterVolume * this.sfxVolume;
      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start(0);
      return;
    }

    // 2. Fallback: Web Audio API Synthesized Retro SFX (if files are missing or loading)
    if (this.ctx) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      if (name === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
        gain.gain.setValueAtTime(0.2 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (name === 'collect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.10); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.15); // C6
        gain.gain.setValueAtTime(0.3 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (name === 'alert') {
        if (now < this.droneAlertCooldown) return;
        this.droneAlertCooldown = now + 2.5; // Cooldown so alert doesn't spam
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.25 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (name === 'boom') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.45 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (name === 'dash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.35 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (name === 'gravity') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.4 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (name === 'shieldHit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.4 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (name === 'wallJump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.12);
        gain.gain.setValueAtTime(0.25 * this.masterVolume * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    }
  }

  playBgm(levelIndex) {
    if (!this.initialized) return;
    const targetTrack = (levelIndex >= 1) ? this.bgmTracks.level2 : this.bgmTracks.level1;
    if (this.currentBgm === targetTrack) return;

    // Crossfade or seamless switch
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.currentTime = 0;
    }
    this.currentBgm = targetTrack;
    if (!this.muted) {
      this.currentBgm.volume = this.masterVolume * this.bgmVolume;
      this.currentBgm.play().catch(e => {
        // Autoplay policy fallback if blocked
      });
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.currentBgm) {
      if (this.muted) {
        this.currentBgm.pause();
      } else if (this.initialized) {
        this.currentBgm.play().catch(() => {});
      }
    }
    this.updateUiDisplay();
  }

  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.currentBgm) {
      this.currentBgm.volume = this.masterVolume * this.bgmVolume;
    }
    this.updateUiDisplay();
  }

  updateUiDisplay() {
    const muteBtn = document.getElementById('btn-mute-toggle');
    if (muteBtn) {
      const volPct = Math.round(this.masterVolume * 100);
      muteBtn.textContent = this.muted ? `[M] MUTED` : `[M] VOL: ${volPct}%`;
      muteBtn.className = this.muted ? "hud-val neon-red" : "hud-val neon-cyan";
    }
  }
}
const audioManager = new AudioManager();

// ─── STORYLINE DATA STRUCTURE & DIALOGUE NODES ──────────────────────────────────────────
const storylineNodes = {
  gameStart: {
    id: 'gameStart',
    speaker: '// COMMAND OPTIC // TRANSMISSION #001',
    text: "ATTENTION CYBER-RUNNER. Sector 7 has been compromised by autonomous security drones. Your objective: infiltrate the outer perimeter, recover the 5 encrypted telemetry packets, and locate the network junction before the firewall locks us out forever. Move fast.",
    triggered: false
  },
  itemPickup: {
    id: 'itemPickup',
    speaker: '// ARCHIVE PROTOCOL // DATA ANALYSIS',
    text: "TELEMETRY PACKET ACQUIRED. These glowing crystalline cores contain fragmented AI source code and memory logs of the old world. Collect all 5 packets in this sector to decrypt the override keys for the central sanctuary.",
    triggered: false
  },
  enemyEncounter: {
    id: 'enemyEncounter',
    speaker: '// THREAT WARNING // NEURAL LINK',
    text: "ALERT! Floating security drone detected ahead. These units emit high-voltage energy shields that will terminate your neural link on contact. Execute an aerial stomp to crush their chassis from above!",
    triggered: false
  },
  levelTransition: {
    id: 'levelTransition',
    speaker: '// CENTRAL MAINFRAME JUNCTION // DETROIT-STYLE NARRATIVE CHOICE',
    text: "MAINFRAME FIREWALL BREACHED. You stand at the nexus of Sector 2. The override credentials are decrypted, but the security AI is adapting. How do you proceed with the telemetry payload?",
    triggered: false,
    choices: [
      {
        label: "[ OPTION A: HACK THE CORE (STEALTH PATH) ]",
        action: () => {
          game.narrativeChoice = 'HACK';
          bgLevel2Image.src = 'assets/level2_desert_bg.jpg';
          ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
          levelManager.loadLevel(1, 'stealth');
          game.state = 'PLAYING';
        }
      },
      {
        label: "[ OPTION B: REROUTE TO WASTELAND SERVERS ]",
        action: () => {
          game.narrativeChoice = 'WASTELAND';
          bgLevel2Image.src = 'assets/level2_desert_bg.jpg';
          ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
          levelManager.loadLevel(1, 'wasteland');
          levelManager.player.x = 100;
          levelManager.player.y = 500;
          game.state = 'PLAYING';
        }
      }
    ]
  }
};

// ─── ROBUST DIALOGUE MANAGER WITH TYPEWRITER EFFECT ─────────────────────────────────────
class DialogueManager {
  constructor() {
    this.active = false;
    this.currentNode = null;
    this.charIndex = 0;
    this.typeTimer = null;
    this.typeSpeed = 22; // ms per character
    this.isTyping = false;
    this.fullText = "";
    this.onDismissCallback = null;

    this.overlay = null;
    this.speakerEl = null;
    this.textEl = null;
    this.choicesContainer = null;
    this.btnA = null;
    this.btnB = null;
  }

  init() {
    this.overlay = document.getElementById('dialogue-overlay');
    this.speakerEl = document.getElementById('dialogue-speaker');
    this.textEl = document.getElementById('dialogue-text');
    this.choicesContainer = document.getElementById('dialogue-choices-container');
    this.btnA = document.getElementById('choice-btn-a');
    this.btnB = document.getElementById('choice-btn-b');

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.handleInput());
    }

    window.addEventListener('keydown', (e) => {
      if (this.active && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        this.handleInput();
      }
    });
  }

  trigger(nodeKey, onDismissCallback = null) {
    const node = storylineNodes[nodeKey];
    if (!node || node.triggered) return;
    
    node.triggered = true;
    this.currentNode = node;
    this.fullText = node.text;
    this.charIndex = 0;
    this.active = true;
    this.isTyping = true;
    this.onDismissCallback = onDismissCallback;

    // Pause game loop / physics updates
    game.state = 'DIALOGUE';

    if (this.speakerEl) this.speakerEl.textContent = node.speaker;
    if (this.textEl) this.textEl.textContent = "";
    if (this.choicesContainer) this.choicesContainer.classList.add('dialogue-choices-hidden');
    if (this.overlay) {
      this.overlay.style.display = 'block';
      this.overlay.classList.remove('dialogue-hidden');
    }

    if (typeof audioManager !== 'undefined') audioManager.playSfx('collect');

    this.startTypewriter();
  }

  startTypewriter() {
    if (this.typeTimer) clearInterval(this.typeTimer);
    this.isTyping = true;
    
    this.typeTimer = setInterval(() => {
      if (this.charIndex < this.fullText.length) {
        this.charIndex++;
        if (this.textEl) this.textEl.textContent = this.fullText.substring(0, this.charIndex);
      } else {
        this.completeTypewriter();
      }
    }, this.typeSpeed);
  }

  completeTypewriter() {
    if (this.typeTimer) clearInterval(this.typeTimer);
    this.isTyping = false;
    this.charIndex = this.fullText.length;
    if (this.textEl) this.textEl.textContent = this.fullText;

    // Reveal Detroit-style choices if present
    if (this.currentNode && this.currentNode.choices && this.choicesContainer) {
      this.choicesContainer.classList.remove('dialogue-choices-hidden');
      if (this.btnA && this.currentNode.choices[0]) {
        this.btnA.textContent = this.currentNode.choices[0].label;
        this.btnA.onclick = (e) => { e.stopPropagation(); this.selectChoice(0); };
      }
      if (this.btnB && this.currentNode.choices[1]) {
        this.btnB.textContent = this.currentNode.choices[1].label;
        this.btnB.onclick = (e) => { e.stopPropagation(); this.selectChoice(1); };
      }
    }
  }

  selectChoice(index) {
    if (!this.currentNode || !this.currentNode.choices || !this.currentNode.choices[index]) return;
    const choice = this.currentNode.choices[index];
    if (this.choicesContainer) {
      this.choicesContainer.classList.add('dialogue-choices-hidden');
    }
    this.active = false;
    if (this.overlay) {
      this.overlay.classList.add('dialogue-hidden');
      this.overlay.style.display = 'none';
    }
    choice.action();
  }

  handleInput() {
    if (!this.active) return;

    if (this.isTyping) {
      this.completeTypewriter();
    } else {
      // If choices are active, ignore general box click so player must click Option A or B!
      if (this.currentNode && this.currentNode.choices) return;
      this.dismiss();
    }
  }

  dismiss() {
    this.active = false;
    if (this.typeTimer) clearInterval(this.typeTimer);
    if (this.overlay) {
      this.overlay.classList.add('dialogue-hidden');
      this.overlay.style.display = 'none';
    }
    if (this.onDismissCallback) {
      const callback = this.onDismissCallback;
      this.onDismissCallback = null;
      callback();
    } else if (game.state === 'DIALOGUE') {
      game.state = 'PLAYING';
    }
  }
}
const dialogueManager = new DialogueManager();

// ─── CINEMATIC VIDEO CUTSCENE PLAYER ───────────────────────────────────────────────────
function playCutscene(videoSrc, onComplete) {
  if (typeof videoSrc === 'function') {
    onComplete = videoSrc;
    videoSrc = 'assets/level1_cutscene.mp4';
  }

  const overlay = document.getElementById('cutscene-overlay');
  const video = document.getElementById('cutscene-video');
  const skipBtn = document.getElementById('cutscene-skip-btn');

  if (!overlay || !video) {
    if (onComplete) onComplete();
    return;
  }

  game.state = 'CUTSCENE';
  overlay.style.display = 'block';
  if (videoSrc && video.src.indexOf(videoSrc) === -1) {
    video.src = videoSrc;
  }
  video.currentTime = 0;

  let finished = false;
  const finishCutscene = () => {
    if (finished) return;
    finished = true;
    video.pause();
    overlay.style.display = 'none';
    window.removeEventListener('keydown', handleKeyDown);
    if (onComplete) onComplete();
  };

  const handleKeyDown = (e) => {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
      finishCutscene();
    }
  };

  video.onended = finishCutscene;
  video.onerror = finishCutscene;
  if (skipBtn) skipBtn.onclick = finishCutscene;
  overlay.onclick = finishCutscene;
  window.addEventListener('keydown', handleKeyDown);

  video.play().catch(err => {
    console.warn("Autoplay blocked or error playing video cutscene:", err);
    video.muted = true;
    video.play().catch(() => finishCutscene());
  });
}

// ─── PARTICLE & VFX SYSTEM ───────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, vx, vy, size, color, decay, gravity = 0, glow = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.alpha = 1.0;
    this.decay = decay;
    this.gravity = gravity;
    this.glow = glow;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
    if (this.alpha < 0) this.alpha = 0;
  }

  draw(context, camera) {
    if (this.alpha <= 0) return;
    context.save();
    context.globalAlpha = this.alpha;
    if (this.glow) {
      context.shadowBlur = 12;
      context.shadowColor = this.color;
    }
    context.fillStyle = this.color;
    context.fillRect(
      Math.floor(this.x - camera.x),
      Math.floor(this.y - camera.y),
      this.size,
      this.size
    );
    context.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnExplosion(x, y, count, color, speed = 4, glow = true) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * speed) + 1;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd - 1.5; // Slight upward bias
      const size = Math.floor(Math.random() * 4) + 3;
      const decay = (Math.random() * 0.03) + 0.015;
      this.particles.push(new Particle(x, y, vx, vy, size, color, decay, 0.15, glow));
    }
  }

  spawnJumpDust(x, y) {
    for (let i = 0; i < 6; i++) {
      const vx = (Math.random() - 0.5) * 3;
      const vy = (Math.random() * -1.5) - 0.5;
      const size = Math.floor(Math.random() * 3) + 2;
      this.particles.push(new Particle(x, y, vx, vy, size, '#78a0a8', 0.04, 0, false));
    }
  }

  spawnTrail(x, y, size, color) {
    this.particles.push(new Particle(x, y, 0, 0, size, color, 0.08, 0, true));
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(context, camera) {
    for (const p of this.particles) {
      p.draw(context, camera);
    }
  }

  clear() {
    this.particles = [];
  }
}
const vfx = new ParticleSystem();

// ─── CAMERA SYSTEM WITH SMOOTH TRACKING & SCREEN SHAKE ───────────────────────────────────
class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothing = 0.085; // Lower = smoother lerp
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
  }

  follow(target, levelBounds) {
    // Target center of player with slight vertical lead
    const desiredX = target.x + (target.width / 2) - (VIEW_WIDTH / 2);
    const desiredY = target.y + (target.height / 2) - (VIEW_HEIGHT / 2) - 40;

    // Smooth linear interpolation (Lerp)
    this.x += (desiredX - this.x) * this.smoothing;
    this.y += (desiredY - this.y) * this.smoothing;

    // Clamp camera within level boundaries
    if (this.x < levelBounds.left)  this.x = levelBounds.left;
    if (this.x > levelBounds.right - VIEW_WIDTH) this.x = Math.max(levelBounds.left, levelBounds.right - VIEW_WIDTH);
    if (this.y < levelBounds.top)   this.y = levelBounds.top;
    if (this.y > levelBounds.bottom - VIEW_HEIGHT) this.y = Math.max(levelBounds.top, levelBounds.bottom - VIEW_HEIGHT);

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }
  }

  triggerShake(intensity, durationFrames) {
    this.shakeIntensity = intensity;
    this.shakeTimer = durationFrames;
  }

  getRenderOffset() {
    let offsetX = Math.floor(this.x);
    let offsetY = Math.floor(this.y);
    if (this.shakeTimer > 0) {
      offsetX += (Math.random() - 0.5) * this.shakeIntensity * 2;
      offsetY += (Math.random() - 0.5) * this.shakeIntensity * 2;
    }
    return { x: offsetX, y: offsetY };
  }
}
const camera = new Camera();

// ─── PLAYER CLASS & PHYSICS STATE MACHINE ────────────────────────────────────────────────
class Player {
  constructor(startX, startY) {
    this.startX = startX;
    this.startY = startY;
    this.width  = 34;
    this.height = 52;
    this.shields = 3;
    this.maxShields = 3;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.isDashing = false;
    this.isWallSliding = false;
    this.wallSlideSide = null;
    this.reset(startX, startY);
  }

  reset(x, y) {
    this.x = x !== undefined ? x : this.startX;
    this.y = y !== undefined ? y : this.startY;
    this.oldX = this.x;
    this.oldY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.shields = 3;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.isDashing = false;
    this.isWallSliding = false;
    this.wallSlideSide = null;
    this.isGrounded = false;
    this.jumpCount = 0;
    this.maxJumps = 2; // Double jump enabled
    this.state = 'idle'; // 'idle', 'running', 'jumping', 'falling', 'dashing', 'wallslide'
    this.facing = 'right';
    this.invincibilityTimer = 0;
    this.dead = false;
    this.animTimer = 0;
  }

  takeDamage(amount = 1, reason = "OPERATOR SHIELD BREACHED") {
    if (this.dead || this.invincibilityTimer > 0 || this.isDashing) return;
    this.shields -= amount;
    this.invincibilityTimer = 60; // 1 second invincibility frames
    camera.triggerShake(10, 20);
    vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 25, '#ff0055', 5, true);
    if (typeof audioManager !== 'undefined') audioManager.playSfx('shieldHit');
    updateHudDisplay();
    if (this.shields <= 0) {
      this.triggerDeath(reason);
    }
  }

  update(inputMgr, platforms, levelBounds) {
    if (this.dead || game.state !== 'PLAYING') return;

    this.oldX = this.x;
    this.oldY = this.y;
    this.animTimer++;

    // 0. Manual Antigravity Cyber-Implant Toggle [G Key]
    if (inputMgr.justPressed.gravity) {
      antigravitySystem.toggleImplant();
      if (typeof audioManager !== 'undefined') audioManager.playSfx('gravity');
      vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 20, '#b400ff', 4, true);
      updateHudDisplay();
    }

    const currentScale = antigravitySystem.currentScale;
    const isZeroG = antigravitySystem.isZeroG;
    const isReversed = antigravitySystem.isReversed;

    // 1. Dash Mechanics (High-Velocity Thruster Boost)
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.dashTimer > 0) {
      this.dashTimer--;
      if (this.dashTimer <= 0) this.isDashing = false;
    }

    if (inputMgr.justPressed.dash && this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 12;
      this.dashCooldown = 90; // 1.5s cooldown
      this.vx = (this.facing === 'right' ? 14 : -14);
      this.vy = 0;
      if (typeof audioManager !== 'undefined') audioManager.playSfx('dash');
      camera.triggerShake(5, 10);
      vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 15, '#00ffcc', 4, true);
      updateHudDisplay();
    }

    if (this.isDashing) {
      vfx.spawnTrail(this.x + (this.width / 2), this.y + (this.height / 2), 6, '#00ffcc');
      this.x += this.vx;
      return;
    }

    // 2. Horizontal Movement & Acceleration
    if (inputMgr.keys.left) {
      this.vx -= MOVE_ACCEL;
      this.facing = 'left';
    } else if (inputMgr.keys.right) {
      this.vx += MOVE_ACCEL;
      this.facing = 'right';
    }

    // Clamp horizontal speed
    if (this.vx > MAX_SPEED)  this.vx = MAX_SPEED;
    if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED;

    // Apply friction / damping
    if (isZeroG) {
      // Viscous Zero-G microgravity drag
      this.vx *= 0.94;
      this.vy *= 0.94;

      // Vertical micro-thrusters in Zero-G
      if (inputMgr.keys.up || inputMgr.keys.jump) this.vy -= 0.55;
      if (inputMgr.keys.down) this.vy += 0.55;
    } else if (this.isGrounded) {
      if (!inputMgr.keys.left && !inputMgr.keys.right) {
        this.vx *= FRICTION;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }
    } else {
      this.vx *= AIR_RESIST;
    }

    // 3. Wall Slide Checks
    this.isWallSliding = false;
    this.wallSlideSide = null;

    if (!this.isGrounded && !isZeroG) {
      if (inputMgr.keys.left || inputMgr.keys.right) {
        const sideCheckOffset = inputMgr.keys.left ? -2 : 2;
        const testBox = {
          x: this.x + sideCheckOffset,
          y: this.y + 4,
          width: this.width,
          height: this.height - 8
        };
        for (const plat of platforms) {
          if (plat.type === 'solid' && (
            testBox.x < plat.x + plat.width &&
            testBox.x + testBox.width > plat.x &&
            testBox.y < plat.y + plat.height &&
            testBox.y + testBox.height > plat.y
          )) {
            this.isWallSliding = true;
            this.wallSlideSide = inputMgr.keys.left ? 'left' : 'right';
            if (currentScale > 0 && this.vy > 1.8) this.vy = 1.8;
            if (currentScale < 0 && this.vy < -1.8) this.vy = -1.8;
            vfx.spawnTrail(this.wallSlideSide === 'left' ? this.x : this.x + this.width, this.y + 20, 2, '#78a0a8');
            break;
          }
        }
      }
    }

    // 4. Jumping Logic (Wall Jump, Inverted Ceiling Jump, Ground Jump, Double Jump)
    if (inputMgr.justPressed.jump) {
      if (this.isWallSliding) {
        const jumpDir = this.wallSlideSide === 'left' ? 1 : -1;
        this.vx = jumpDir * 7.5;
        this.vy = isReversed ? -JUMP_POWER : JUMP_POWER;
        this.facing = jumpDir > 0 ? 'right' : 'left';
        this.jumpCount = 1;
        this.isGrounded = false;
        this.isWallSliding = false;
        vfx.spawnJumpDust(this.x + (this.width / 2), this.y + (isReversed ? 0 : this.height));
        if (typeof audioManager !== 'undefined') audioManager.playSfx('wallJump');
      } else if (this.isGrounded) {
        this.vy = isReversed ? -JUMP_POWER : JUMP_POWER; // JUMP_POWER is negative (-13.5)
        this.isGrounded = false;
        this.jumpCount = 1;
        this.state = 'jumping';
        vfx.spawnJumpDust(this.x + (this.width / 2), this.y + (isReversed ? 0 : this.height));
        if (typeof audioManager !== 'undefined') audioManager.playSfx('jump');
      } else if (this.jumpCount < this.maxJumps && !isZeroG) {
        this.vy = isReversed ? -DOUBLE_JUMP : DOUBLE_JUMP;
        this.jumpCount++;
        this.state = 'jumping';
        vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 12, '#00ffcc', 3, true);
        if (typeof audioManager !== 'undefined') audioManager.playSfx('jump');
      }
    }

    // 5. Apply Gravity
    if (!isZeroG) {
      this.vy += GRAVITY * currentScale;
      if (Math.abs(this.vy) > MAX_FALL) this.vy = Math.sign(this.vy) * MAX_FALL;
    }

    // 6. AABB Collision Detection & Resolution (X-Axis)
    this.x += this.vx;
    for (const plat of platforms) {
      if (plat.type === 'floating') continue;
      if (this.checkAABB(plat)) {
        if (plat.type === 'hazard') {
          this.triggerDeath("CRITICAL ERROR // OPERATOR TOUCHED HAZARD TERRAIN");
          return;
        }
        if (this.vx > 0) {
          this.x = plat.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = plat.x + plat.width;
          this.vx = 0;
        }
      }
    }

    // 7. AABB Collision Detection & Resolution (Y-Axis)
    this.isGrounded = false;
    this.y += this.vy;
    for (const plat of platforms) {
      if (this.checkAABB(plat)) {
        if (plat.type === 'hazard') {
          this.triggerDeath("CRITICAL ERROR // OPERATOR FALLEN INTO HAZARD SPIKES");
          return;
        }

        if (currentScale >= -0.1) {
          // Normal Gravity Collision: Landing on top of platform when vy > 0
          if (this.vy > 0) {
            if (plat.type === 'floating') {
              if (this.oldY + this.height <= plat.y + 12) {
                this.y = plat.y - this.height;
                this.vy = 0;
                this.isGrounded = true;
                this.jumpCount = 0;
              }
            } else {
              this.y = plat.y - this.height;
              this.vy = 0;
              this.isGrounded = true;
              this.jumpCount = 0;
            }
          } else if (this.vy < 0 && plat.type !== 'floating') {
            this.y = plat.y + plat.height;
            this.vy = 0;
          }
        } else {
          // Inverted Gravity Collision: Landing on bottom of solid platform when vy < 0
          if (this.vy < 0 && plat.type !== 'floating') {
            if (this.oldY >= plat.y + plat.height - 12) {
              this.y = plat.y + plat.height;
              this.vy = 0;
              this.isGrounded = true;
              this.jumpCount = 0;
            }
          } else if (this.vy > 0 && plat.type === 'solid') {
            this.y = plat.y - this.height;
            this.vy = 0;
          }
        }
      }
    }

    // 8. Check Level Boundaries & Pit Falls
    if (this.y > levelBounds.bottom + 100 || this.y < levelBounds.top - 300) {
      this.triggerDeath("SIGNAL LOST // OPERATOR EXCEEDED BOUNDARY ABYSS");
      return;
    }
    if (this.x < levelBounds.left) this.x = levelBounds.left;

    // 9. Update Animation State Machine
    if (this.isWallSliding) {
      this.state = 'wallslide';
    } else if (!this.isGrounded) {
      this.state = (currentScale >= 0 ? (this.vy < 0 ? 'jumping' : 'falling') : (this.vy > 0 ? 'jumping' : 'falling'));
    } else if (Math.abs(this.vx) > 0.3) {
      this.state = 'running';
      if (this.animTimer % 4 === 0) {
        vfx.spawnTrail(this.x + (this.width / 2), isReversed ? this.y + 4 : this.y + this.height - 4, 3, '#00ffcc');
      }
    } else {
      this.state = 'idle';
    }

    if (this.invincibilityTimer > 0) this.invincibilityTimer--;
  }

  checkAABB(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }

  triggerDeath(reason) {
    if (this.dead) return;
    this.dead = true;
    camera.triggerShake(14, 35);
    if (typeof audioManager !== 'undefined') audioManager.playSfx('boom');
    vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 40, '#ff0055', 6, true);
    vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 25, '#ffcc00', 4, true);

    hudStatus.textContent = "SIGNAL COMPROMISED // REBOOTING...";
    hudStatus.className = "hud-val neon-red";

    setTimeout(() => {
      if (game.state === 'PLAYING') {
        levelManager.restartCurrentLevel();
      }
    }, 1200);
  }

  draw(context, camOffset) {
    if (this.dead) return;

    if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer / 4) % 2 === 0) {
      return;
    }

    const rx = Math.floor(this.x - camOffset.x);
    const ry = Math.floor(this.y - camOffset.y);
    const isReversed = antigravitySystem.isReversed;

    context.save();

    // If gravity is inverted, flip rendering upside down around center
    if (isReversed) {
      context.translate(rx + (this.width / 2), ry + (this.height / 2));
      context.scale(1, -1);
      context.translate(-(rx + (this.width / 2)), -(ry + (this.height / 2)));
    }

    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
      const cols = 8;
      const rows = 3;
      const sWidth = playerSprite.naturalWidth / cols;
      const sHeight = playerSprite.naturalHeight / rows;
      
      let row = 0;
      let col = 0;
      if (this.state === 'idle') {
        row = 0;
        col = Math.floor(this.animTimer / 12) % 6;
      } else if (this.state === 'running') {
        row = 1;
        col = Math.floor(this.animTimer / 5) % 8;
      } else {
        row = 2;
        col = Math.floor(this.animTimer / 6) % 8;
      }

      if (this.facing === 'left') {
        context.translate(rx + this.width / 2, ry + this.height / 2);
        context.scale(-1, 1);
        context.translate(-(rx + this.width / 2), -(ry + this.height / 2));
      }

      const drawW = this.width * 1.6;
      const drawH = this.height * 1.35;
      const offsetX = (drawW - this.width) / 2;
      const offsetY = (drawH - this.height);

      context.drawImage(
        playerSprite,
        col * sWidth, row * sHeight, sWidth, sHeight,
        rx - offsetX, ry - offsetY, drawW, drawH
      );
    } else {
      if (this.facing === 'right') {
        context.fillRect(rx + 14, ry + 3, 12, 6);
      } else {
        context.fillRect(rx + 8, ry + 3, 12, 6);
      }

      // Thruster Flame (when Jumping / Falling)
      if (!this.isGrounded) {
        context.fillStyle = '#ff0055';
        context.shadowColor = '#ff0055';
        const flameHeight = Math.floor(Math.random() * 8) + 6;
        context.fillRect(rx + 8, ry + this.height, 6, flameHeight);
        context.fillRect(rx + this.width - 14, ry + this.height, 6, flameHeight);
      }

      // Animated Leg Stride (when Running)
      if (this.state === 'running') {
        const stride = Math.sin(this.animTimer * 0.4) * 6;
        context.fillStyle = '#00ffcc';
        context.fillRect(rx + 6, ry + this.height - 8, 8, 8 + stride);
        context.fillRect(rx + this.width - 14, ry + this.height - 8, 8, 8 - stride);
      }
    }

    context.restore();
  }
}

// ─── PLATFORM / TERRAIN CLASS ────────────────────────────────────────────────────────────
class Platform {
  constructor(x, y, width, height, type = 'solid', label = null) {
    this.x = x;
    this.y = y;
    this.width  = width;
    this.height = height;
    this.type   = type; // 'solid', 'floating', 'hazard'
    this.label  = label;
  }

  draw(context, camOffset) {
    const rx = Math.floor(this.x - camOffset.x);
    const ry = Math.floor(this.y - camOffset.y);

    // Skip drawing if outside viewport
    if (rx + this.width < -100 || rx > VIEW_WIDTH + 100 || ry + this.height < -100 || ry > VIEW_HEIGHT + 100) {
      return;
    }

    context.save();

    if (this.type === 'solid') {
      if (platformSprite.complete && platformSprite.naturalWidth > 0) {
        // Tile the sliced server rack texture across the platform
        const cols = 4;
        const rows = 2;
        const sWidth = platformSprite.naturalWidth / cols;
        const sHeight = platformSprite.naturalHeight / rows;
        const tileSize = 40;
        for (let gx = 0; gx < this.width; gx += tileSize) {
          for (let gy = 0; gy < this.height; gy += tileSize) {
            const drawW = Math.min(tileSize, this.width - gx);
            const drawH = Math.min(tileSize, this.height - gy);
            context.drawImage(platformSprite, 0, 0, sWidth, sHeight, rx + gx, ry + gy, drawW, drawH);
          }
        }
      } else {
        // Dark Cyber Terrain with Neon Tech Grid
        context.fillStyle = '#0e1720';
        context.fillRect(rx, ry, this.width, this.height);

        // Top Edge Highlight (Teal Power Line)
        context.fillStyle = '#00ffcc';
        context.shadowBlur = 8;
        context.shadowColor = '#00ffcc';
        context.fillRect(rx, ry, this.width, 4);

        // Internal Grid Pattern
        context.shadowBlur = 0;
        context.strokeStyle = 'rgba(0, 255, 204, 0.12)';
        context.lineWidth = 1;
        context.beginPath();
        for (let gx = 40; gx < this.width; gx += 40) {
          context.moveTo(rx + gx, ry);
          context.lineTo(rx + gx, ry + this.height);
        }
        for (let gy = 40; gy < this.height; gy += 40) {
          context.moveTo(rx, ry + gy);
          context.lineTo(rx + this.width, ry + gy);
        }
        context.stroke();
      }

    } else if (this.type === 'floating') {
      if (platformSprite.complete && platformSprite.naturalWidth > 0) {
        context.globalAlpha = 0.85;
        context.drawImage(platformSprite, 0, 0, platformSprite.width, platformSprite.height, rx, ry, this.width, this.height);
        context.globalAlpha = 1.0;
      } else {
        // Floating Energy Platform (Semi-transparent cyan bridge)
        context.fillStyle = 'rgba(0, 40, 60, 0.85)';
        context.fillRect(rx, ry, this.width, this.height);

        context.strokeStyle = '#00ffcc';
        context.lineWidth = 2;
        context.shadowBlur = 10;
        context.shadowColor = '#00ffcc';
        context.strokeRect(rx + 1, ry + 1, this.width - 2, this.height - 2);

        // Pulsing center line
        context.fillStyle = '#00ff66';
        context.fillRect(rx + 10, ry + (this.height / 2) - 2, this.width - 20, 4);
      }

    } else if (this.type === 'hazard') {
      // Crimson Spikes / Data Lava
      context.fillStyle = '#1a050a';
      context.fillRect(rx, ry, this.width, this.height);

      context.fillStyle = '#ff0055';
      context.shadowBlur = 15;
      context.shadowColor = '#ff0055';
      
      // Draw spiked hazard teeth
      const toothWidth = 20;
      const count = Math.floor(this.width / toothWidth);
      context.beginPath();
      for (let i = 0; i < count; i++) {
        const tx = rx + (i * toothWidth);
        context.moveTo(tx, ry + this.height);
        context.lineTo(tx + (toothWidth / 2), ry);
        context.lineTo(tx + toothWidth, ry + this.height);
      }
      context.closePath();
      context.fill();
    }

    // Optional Signage / Tech Label above platform
    if (this.label) {
      context.shadowBlur = 10;
      context.shadowColor = '#ffcc00';
      context.fillStyle = '#ffcc00';
      context.font = '700 16px "Chakra Petch", sans-serif';
      context.textAlign = 'center';
      context.fillText(this.label, rx + (this.width / 2), ry - 15);
      context.textAlign = 'left';
    }

    context.restore();
  }
}

// ─── ENEMY AI CLASS (PATROL DRONES & HEAVY CYBORGS) ──────────────────────────────────────
class Enemy {
  constructor(x, y, patrolMinX, patrolMaxX, speed = 2.2, type = 'patrol') {
    this.x = x;
    this.y = y;
    this.width  = 38;
    this.height = 44;
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.speed  = speed;
    this.vx     = speed;
    this.vy     = 0;
    this.type   = type; // 'patrol', 'fast', 'heavy'
    this.alive  = true;
    this.oldY   = y;
    this.hoverTimer = Math.random() * 10;
    
    if (type === 'heavy') {
      this.width = 46;
      this.height = 52;
    }
  }

  update(platforms) {
    if (!this.alive) return;

    this.oldY = this.y;
    this.hoverTimer += 0.08;

    // Patrol movement back and forth
    this.x += this.vx;
    if (this.x <= this.patrolMinX) {
      this.x = this.patrolMinX;
      this.vx = Math.abs(this.speed);
    } else if (this.x + this.width >= this.patrolMaxX) {
      this.x = this.patrolMaxX - this.width;
      this.vx = -Math.abs(this.speed);
    }

    // Apply gravity to enemy so they sit on platforms
    this.vy += GRAVITY;
    this.y += this.vy;
    for (const plat of platforms) {
      if (plat.type === 'floating') continue;
      if (
        this.x < plat.x + plat.width &&
        this.x + this.width > plat.x &&
        this.y < plat.y + plat.height &&
        this.y + this.height > plat.y
      ) {
        if (this.vy > 0) {
          this.y = plat.y - this.height;
          this.vy = 0;
        }
      }
    }
  }

  checkPlayerCollision(player) {
    if (!this.alive || player.dead || player.invincibilityTimer > 0) return;

    // Proximity check for Drone Alert SFX and Dialogue lore warning
    const distSq = (player.x - this.x) ** 2 + (player.y - this.y) ** 2;
    if (distSq < 160 * 160 && typeof audioManager !== 'undefined') {
      audioManager.playSfx('alert');
    }
    if (distSq < 320 * 320 && typeof dialogueManager !== 'undefined') {
      dialogueManager.trigger('enemyEncounter');
    }

    // Check AABB intersection
    if (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    ) {
      // Determine if Stomp (Player falling and previous bottom above enemy previous top)
      const isStomping = player.vy > 0 && (player.oldY + player.height <= this.oldY + 16);

      if (isStomping) {
        // ENEMY DESTROYED!
        this.alive = false;
        player.vy = antigravitySystem.isReversed ? 11.5 : -11.5; // Stomp bounce
        player.jumpCount = 1; // Allow follow-up air jump
        game.score += 150;
        game.enemiesDefeated++;
        camera.triggerShake(6, 15);
        vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 25, '#ff0055', 5, true);
        vfx.spawnExplosion(this.x + (this.width / 2), this.y + (this.height / 2), 15, '#ffcc00', 3, true);
        if (typeof audioManager !== 'undefined') audioManager.playSfx('boom');
      } else {
        // PLAYER SHIELD DAMAGE
        player.takeDamage(1, "CRITICAL ERROR // OPERATOR SHIELD BREACHED BY DRONE");
      }
    }
  }

  draw(context, camOffset) {
    if (!this.alive) return;

    const rx = Math.floor(this.x - camOffset.x);
    const hoverY = Math.sin(this.hoverTimer) * 4;
    const ry = Math.floor(this.y + hoverY - camOffset.y);

    if (rx + this.width < -50 || rx > VIEW_WIDTH + 50) return;

    context.save();

    if ((this.type === 'heavy' || this.type === 'mech') && mechSprite.complete && mechSprite.naturalWidth > 0) {
      // Slice Mech sprite sheet (8x4 grid, 8 walk frames on top row)
      const spriteToUse = (mechSpriteProcessed && mechSpriteProcessed.complete) ? mechSpriteProcessed : mechSprite;
      const cols = 8;
      const rows = 4;
      const sWidth = (spriteToUse.naturalWidth || spriteToUse.width) / cols;
      const sHeight = (spriteToUse.naturalHeight || spriteToUse.height) / rows;
      const frame = Math.floor(this.hoverTimer * 6) % 8;
      const col = frame;
      const row = 0;
      if (this.vx < 0) {
        context.translate(rx + (this.width / 2), ry + (this.height / 2));
        context.scale(-1, 1);
        context.drawImage(
          spriteToUse,
          col * sWidth, row * sHeight, sWidth, sHeight,
          -(this.width + 20) / 2, -(this.height + 20) / 2, this.width + 20, this.height + 20
        );
      } else {
        context.drawImage(
          spriteToUse,
          col * sWidth, row * sHeight, sWidth, sHeight,
          rx - 10, ry - 10, this.width + 20, this.height + 20
        );
      }
    } else if (enemySprite.complete && enemySprite.naturalWidth > 0) {
      // Slice security drone sprite sheet (4x2 grid, 8 frames continuous animation)
      const cols = 4;
      const rows = 2;
      const sWidth = enemySprite.naturalWidth / cols;
      const sHeight = enemySprite.naturalHeight / rows;
      const frame = Math.floor(this.hoverTimer * 5) % 8;
      const col = frame % cols;
      const row = Math.floor(frame / cols);
      context.drawImage(
        enemySprite,
        col * sWidth, row * sHeight, sWidth, sHeight,
        rx - 6, ry - 6, this.width + 12, this.height + 12
      );
    } else {
      // Drone Body
      const color = this.type === 'heavy' ? '#ff0055' : '#ff3300';
      context.fillStyle = '#150508';
      context.fillRect(rx, ry, this.width, this.height);

      context.strokeStyle = color;
      context.lineWidth = 2;
      context.shadowBlur = 12;
      context.shadowColor = color;
      context.strokeRect(rx + 1, ry + 1, this.width - 2, this.height - 2);

      // Glowing Robotic Eye Scanner
      context.fillStyle = '#ffcc00';
      context.shadowColor = '#ffcc00';
      context.shadowBlur = 10;
      const eyeX = this.vx > 0 ? rx + this.width - 14 : rx + 6;
      context.fillRect(eyeX, ry + 12, 8, 8);

      // Hover Thruster Underneath
      context.fillStyle = '#00ffcc';
      context.shadowColor = '#00ffcc';
      context.fillRect(rx + 8, ry + this.height, this.width - 16, 4);
    }

    context.restore();
  }
}

// ─── COLLECTIBLE CLASS (MOBIUS DATA PACKETS) ─────────────────────────────────────────────
class Collectible {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.width  = 26;
    this.height = 26;
    this.collected = false;
    this.hoverTimer = Math.random() * 10;
  }

  update() {
    if (this.collected) return;
    this.hoverTimer += 0.06;
    this.y = this.baseY + Math.sin(this.hoverTimer) * 6;
  }

  checkPlayerCollision(player) {
    if (this.collected || player.dead) return;

    if (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    ) {
      // PACKET COLLECTED!
      this.collected = true;
      game.score += 250;
      updateHudDisplay();
      vfx.spawnExplosion(this.x + 13, this.y + 13, 20, '#00ffcc', 4, true);
      vfx.spawnExplosion(this.x + 13, this.y + 13, 10, '#ffffff', 2, true);
      if (typeof audioManager !== 'undefined') audioManager.playSfx('collect');
      if (typeof dialogueManager !== 'undefined') dialogueManager.trigger('itemPickup');
      
      // Check if all packets collected in Round 1 (End of Round 1 trigger) or 9 packets in Level 3
      const collectedCount = levelManager.collectibles.filter(c => c.collected).length;
      if (game.currentLevelIndex === 0 && collectedCount >= game.totalPacketsInLevel && typeof dialogueManager !== 'undefined') {
        setTimeout(() => {
          playCutscene(() => {
            dialogueManager.trigger('levelTransition');
          });
        }, 500);
      } else if (game.currentLevelIndex === 2 && collectedCount >= 9) {
        setTimeout(() => {
          const endingType = (player.y > 600 || game.narrativeChoice === 'WASTELAND') ? 'bad' : 'good';
          levelManager.triggerGameEnding(endingType);
        }, 500);
      }
    }
  }

  draw(context, camOffset) {
    if (this.collected) return;

    const rx = Math.floor(this.x - camOffset.x);
    const ry = Math.floor(this.y - camOffset.y);

    if (rx + this.width < -50 || rx > VIEW_WIDTH + 50) return;

    context.save();

    if (collectibleSprite.complete && collectibleSprite.naturalWidth > 0) {
      // Slice collectible data packet crystal (4x2 grid, 8 frames continuous animation)
      const cols = 4;
      const rows = 2;
      const sWidth = collectibleSprite.naturalWidth / cols;
      const sHeight = collectibleSprite.naturalHeight / rows;
      const frame = Math.floor(this.hoverTimer * 6) % 8;
      const col = frame % cols;
      const row = Math.floor(frame / cols);
      context.drawImage(
        collectibleSprite,
        col * sWidth, row * sHeight, sWidth, sHeight,
        rx - 4, ry - 4, this.width + 8, this.height + 8
      );
    } else {
      context.shadowBlur = 15;
      context.shadowColor = '#00ffcc';

      // Draw Diamond / Rhombus Packet
      context.fillStyle = '#00ffcc';
      context.beginPath();
      context.moveTo(rx + 13, ry);
      context.lineTo(rx + 26, ry + 13);
      context.lineTo(rx + 13, ry + 26);
      context.lineTo(rx, ry + 13);
      context.closePath();
      context.fill();

      // Rotating Inner Core
      context.fillStyle = '#050608';
      context.beginPath();
      context.moveTo(rx + 13, ry + 6);
      context.lineTo(rx + 20, ry + 13);
      context.lineTo(rx + 13, ry + 20);
      context.lineTo(rx + 6, ry + 13);
      context.closePath();
      context.fill();
    }

    context.restore();
  }
}

// ─── GATEWAY / PORTAL CLASS (LEVEL EXITS & BRANCHING ENDINGS) ────────────────────────────
class Gateway {
  constructor(x, y, width, height, type = 'next', targetLevel = 1, label = 'SECTOR EXIT') {
    this.x = x;
    this.y = y;
    this.width  = width;
    this.height = height;
    this.type   = type; // 'next', 'good', 'bad'
    this.targetLevel = targetLevel;
    this.label  = label;
    this.animTimer = 0;
  }

  update() {
    this.animTimer += 0.05;
    // Spawn ambient energy portal vortex particles
    if (Math.random() < 0.4) {
      const px = this.x + (Math.random() * this.width);
      const py = this.y + (Math.random() * this.height);
      const color = this.type === 'good' ? '#0088ff' : (this.type === 'bad' ? '#ff0055' : '#00ffcc');
      vfx.spawnTrail(px, py, 3, color);
    }
  }

  checkPlayerCollision(player) {
    if (player.dead || game.state !== 'PLAYING') return;

    if (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    ) {
      // GATEWAY REACHED!
      if (this.type === 'next') {
        if (game.currentLevelIndex === 0 && typeof dialogueManager !== 'undefined') {
          // Round 1 -> Round 2 Detroit Choice Narrative Bridge
          playCutscene('assets/level1_cutscene.mp4', () => {
            dialogueManager.trigger('levelTransition');
          });
        } else if (game.currentLevelIndex === 1) {
          // Level 2 -> Level 3 Transition with Level 2 Cutscene
          playCutscene('assets/level2_cutscene.mp4', () => {
            levelManager.triggerLevelComplete(this.targetLevel);
          });
        } else {
          levelManager.triggerLevelComplete(this.targetLevel);
        }
      } else if (this.type === 'good') {
        levelManager.triggerGameEnding('good');
      } else if (this.type === 'bad') {
        levelManager.triggerGameEnding('bad');
      }
    }
  }

  draw(context, camOffset) {
    const rx = Math.floor(this.x - camOffset.x);
    const ry = Math.floor(this.y - camOffset.y);

    if (rx + this.width < -100 || rx > VIEW_WIDTH + 100) return;

    context.save();

    let color = '#00ffcc';
    if (this.type === 'good') color = '#0088ff';
    if (this.type === 'bad')  color = '#ff0055';

    // Outer Portal Frame
    context.strokeStyle = color;
    context.lineWidth = 4;
    context.shadowBlur = 20;
    context.shadowColor = color;
    context.strokeRect(rx, ry, this.width, this.height);

    // Inner Pulsing Energy Field
    const alpha = (Math.sin(this.animTimer * 2) * 0.2) + 0.3;
    context.fillStyle = color;
    context.globalAlpha = alpha;
    context.fillRect(rx + 6, ry + 6, this.width - 12, this.height - 12);

    // Portal Signage Header
    context.globalAlpha = 1.0;
    context.font = '700 16px "Chakra Petch", sans-serif';
    context.textAlign = 'center';
    context.fillText(`[ ${this.label} ]`, rx + (this.width / 2), ry - 18);
    context.textAlign = 'left';

    context.restore();
  }
}

// ─── PARALLAX BACKGROUND RENDERER ────────────────────────────────────────────────────────
class BackgroundRenderer {
  constructor() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * VIEW_WIDTH * 3,
        y: Math.random() * VIEW_HEIGHT,
        size: Math.random() * 2.5 + 1,
        speed: (Math.random() * 0.15) + 0.05,
        color: Math.random() > 0.5 ? '#00ffcc' : '#0088ff'
      });
    }
  }

  draw(context, camOffset, levelIndex = 0) {
    context.save();
    
    // Dynamic Level Background Swapping (Level 2 swaps to Desert Server Room, Level 3 swaps to Glacier Shift)
    let activeBg = bgImage;
    if (levelIndex === 1 && bgLevel2Image.complete && bgLevel2Image.naturalWidth > 0) {
      activeBg = bgLevel2Image;
    } else if (levelIndex >= 2 && bgLevel3Image.complete && bgLevel3Image.naturalWidth > 0) {
      activeBg = bgLevel3Image;
    } else if (levelIndex >= 1 && bgLevel2Image.complete && bgLevel2Image.naturalWidth > 0) {
      activeBg = bgLevel2Image;
    }
    if (activeBg.complete && activeBg.naturalWidth > 0) {
      // Calculate horizontal parallax offset based on camera position (15% parallax speed)
      let px = -(camOffset.x * 0.15) % VIEW_WIDTH;
      if (px > 0) px -= VIEW_WIDTH;
      
      // Render two continuous background tiles side-by-side to prevent clipping during scrolling
      context.drawImage(activeBg, px, 0, VIEW_WIDTH, VIEW_HEIGHT);
      context.drawImage(activeBg, px + VIEW_WIDTH, 0, VIEW_WIDTH, VIEW_HEIGHT);
    } else {
      const bgGrad = context.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
      bgGrad.addColorStop(0, '#04070a');
      bgGrad.addColorStop(1, '#091018');
      context.fillStyle = bgGrad;
      context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    // Render Parallax Stars / Neon Debris
    for (const star of this.stars) {
      let sx = (star.x - (camOffset.x * star.speed)) % VIEW_WIDTH;
      if (sx < 0) sx += VIEW_WIDTH;
      let sy = star.y;

      context.fillStyle = star.color;
      context.shadowBlur = 6;
      context.shadowColor = star.color;
      context.fillRect(Math.floor(sx), Math.floor(sy), star.size, star.size);
    }

    // Distant Cyber City Skyline Silhouettes (Parallax Layer 2)
    context.shadowBlur = 0;
    context.fillStyle = '#060d14';
    const cityOffset = -(camOffset.x * 0.2) % VIEW_WIDTH;
    for (let i = -1; i < 3; i++) {
      const bx = (i * 600) + cityOffset;
      context.fillRect(bx + 50, VIEW_HEIGHT - 280, 100, 280);
      context.fillRect(bx + 180, VIEW_HEIGHT - 380, 140, 380);
      context.fillRect(bx + 350, VIEW_HEIGHT - 220, 120, 220);
      context.fillRect(bx + 490, VIEW_HEIGHT - 320, 90, 320);

      // Glowing Window Lights in Background Towers
      context.fillStyle = 'rgba(0, 255, 204, 0.25)';
      context.fillRect(bx + 210, VIEW_HEIGHT - 350, 10, 100);
      context.fillRect(bx + 250, VIEW_HEIGHT - 350, 10, 100);
      context.fillRect(bx + 515, VIEW_HEIGHT - 290, 40, 6);
      context.fillStyle = '#060d14';
    }

    context.restore();
  }
}
const backgroundRenderer = new BackgroundRenderer();

// ─── HARDCODED LEVEL DATA (3 MASSIVE PROGRESSIVE SECTORS) ────────────────────────────────
const levelData = [
  // ══════════════════════════════════════════════════════════════════════════════════════
  // LEVEL 1: "NEON OUTSKIRTS" — Tutorial & Core Mobility Gauntlet
  // ══════════════════════════════════════════════════════════════════════════════════════
  {
    title: "LEVEL 1: NEON OUTSKIRTS",
    playerStart: { x: 100, y: 500 },
    bounds: { left: 0, right: 3400, top: 0, bottom: 850 },
    platforms: [
      // Main starting ground
      new Platform(0, 640, 1100, 80, 'solid'),
      // Pit 1 gap from x:1100 to 1350
      new Platform(1350, 640, 900, 80, 'solid'),
      // Pit 2 gap from x:2250 to 2500
      new Platform(2500, 640, 900, 80, 'solid'),

      // Elevated floating tutorial platforms
      new Platform(450, 500, 180, 24, 'floating'),
      new Platform(750, 380, 180, 24, 'floating'),
      new Platform(1120, 460, 200, 24, 'floating', 'DOUBLE JUMP GAP'),
      new Platform(1550, 480, 180, 24, 'floating'),
      new Platform(1850, 360, 220, 24, 'floating'),
      new Platform(2300, 460, 180, 24, 'floating'),
      new Platform(2680, 480, 220, 24, 'floating'),
      new Platform(2950, 340, 250, 24, 'floating', 'SECTOR ARCHIVE ACCESS')
    ],
    enemies: [
      new Enemy(550, 590, 400, 950, 2.0, 'patrol'),
      new Enemy(800, 330, 750, 920, 1.5, 'patrol'),
      new Enemy(1600, 590, 1400, 2100, 2.4, 'patrol'),
      new Enemy(1900, 310, 1850, 2060, 1.8, 'patrol'),
      new Enemy(2650, 590, 2550, 3100, 2.5, 'fast')
    ],
    collectibles: [
      new Collectible(530, 440),
      new Collectible(830, 320),
      new Collectible(1210, 380), // Hovering in mid-air over pit 1
      new Collectible(1950, 300),
      new Collectible(3060, 280)
    ],
    gateways: [
      new Gateway(3060, 500, 70, 140, 'next', 1, 'PROCEED: SECTOR 02')
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════════════
  // LEVEL 2: "CYBER SPAN" — Bottomless Pits, Hazards & Precision Platforming
  // ══════════════════════════════════════════════════════════════════════════════════════
  {
    title: "LEVEL 2: CYBER SPAN",
    playerStart: { x: 100, y: 500 },
    bounds: { left: 0, right: 5000, top: 0, bottom: 900 },
    platforms: [
      // Starting checkpoint deck
      new Platform(0, 640, 800, 80, 'solid'),

      // Massive lava / pit span with stepping stone islands
      new Platform(950, 560, 180, 24, 'floating'),
      new Platform(1250, 460, 180, 24, 'floating'),
      new Platform(1550, 360, 180, 24, 'floating', 'HIGH VOLTAGE SPAN'),
      new Platform(1850, 460, 180, 24, 'floating'),
      new Platform(2150, 560, 180, 24, 'floating'),

      // Middle fortress floor with hazard spikes
      new Platform(2450, 640, 1200, 80, 'solid'),
      new Platform(2750, 615, 250, 25, 'hazard'), // Crimson spikes!
      new Platform(3150, 615, 250, 25, 'hazard'),

      // Elevated bridge over hazard spikes
      new Platform(2700, 480, 350, 24, 'floating'),
      new Platform(3100, 360, 350, 24, 'floating'),

      // Final perilous chasm jump
      new Platform(3800, 500, 200, 24, 'floating'),
      new Platform(4150, 380, 220, 24, 'floating'),
      new Platform(4500, 640, 400, 80, 'solid', 'SECTOR 03 GATE')
    ],
    gravityZones: [
      new GravityZone(1250, 200, 1100, 450, -1.0, { x: 0, y: -1 }, '▲ HIGH-VOLTAGE INVERSION FIELD ▲'),
      new GravityZone(3800, 200, 600, 400, 0.0, { x: 0, y: 0 }, '◆ ZERO-G CHASM FLOAT ◆')
    ],
    enemies: [
      new Enemy(450, 590, 300, 750, 2.5, 'fast'),
      new Enemy(1000, 510, 950, 1120, 1.6, 'patrol'),
      new Enemy(1600, 310, 1550, 1720, 2.0, 'patrol'),
      new Enemy(2500, 590, 2450, 2720, 2.8, 'fast'),
      new Enemy(2800, 430, 2700, 3030, 2.2, 'patrol'),
      new Enemy(3200, 310, 3100, 3430, 2.4, 'patrol'),
      new Enemy(4600, 590, 4520, 4850, 2.0, 'heavy')
    ],
    collectibles: [
      new Collectible(1030, 500),
      new Collectible(1630, 300),
      new Collectible(2230, 500),
      new Collectible(2860, 420),
      new Collectible(3260, 300),
      new Collectible(3890, 440),
      new Collectible(4250, 320)
    ],
    gateways: [
      new Gateway(4680, 500, 70, 140, 'next', 2, 'PROCEED: CORE DIVIDE')
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════════════════
  // LEVEL 3: "THE CORE DIVIDE" — Multi-Level Branching Endings Architecture
  // ══════════════════════════════════════════════════════════════════════════════════════
  {
    title: "LEVEL 3: THE CORE DIVIDE",
    playerStart: { x: 100, y: 500 },
    bounds: { left: 0, right: 6600, top: -600, bottom: 1700 },
    platforms: [
      // 1. Gauntlet Approach Deck
      new Platform(0, 640, 950, 80, 'solid'),
      new Platform(1100, 520, 200, 24, 'floating'),
      new Platform(1400, 400, 200, 24, 'floating'),
      new Platform(1700, 520, 200, 24, 'floating'),
      
      // 2. Mid Fortress Floor with Spikes
      new Platform(2000, 640, 1200, 80, 'solid'),
      new Platform(2250, 615, 200, 25, 'hazard'),
      new Platform(2750, 615, 200, 25, 'hazard'),
      new Platform(2200, 480, 300, 24, 'floating'),
      new Platform(2700, 360, 300, 24, 'floating'),

      // 3. THE BRANCHING JUNCTION PLATFORM (x: 3300 to 3700)
      new Platform(3300, 560, 450, 40, 'solid', 'CRITICAL SPLIT // CHOOSE YOUR PATH'),

      // ──────────────────────────────────────────────────────────────────────────────────
      // BRANCH A: THE UPPER PATH (GOOD ENDING) — Ascent to Purification Archive
      // ──────────────────────────────────────────────────────────────────────────────────
      new Platform(3850, 420, 180, 24, 'floating', '↑ UPPER ROUTE // PURIFICATION ARCHIVE'),
      new Platform(4150, 300, 180, 24, 'floating'),
      new Platform(4450, 180, 180, 24, 'floating'),
      new Platform(4750, 60, 180, 24, 'floating'),
      new Platform(5050, -60, 200, 24, 'floating'),
      new Platform(5400, -160, 220, 24, 'floating'),
      // Final Sanctuary Floor
      new Platform(5750, -260, 700, 60, 'solid', 'PURIFICATION SANCTUARY [GOOD ENDING]'),

      // ──────────────────────────────────────────────────────────────────────────────────
      // BRANCH B: THE LOWER PATH (BAD ENDING) — Descent into Abyssal Corrupted Kernel
      // ──────────────────────────────────────────────────────────────────────────────────
      new Platform(3800, 720, 280, 40, 'solid', '↓ LOWER ROUTE // CORRUPTED ABYSS'),
      new Platform(4180, 880, 600, 60, 'solid'),
      new Platform(4400, 855, 200, 25, 'hazard'), // Abyssal lava spikes
      new Platform(4900, 1040, 400, 40, 'solid'),
      new Platform(5400, 1200, 450, 60, 'solid'),
      // Final Corrupted Kernel Floor
      new Platform(5950, 1340, 600, 60, 'solid', 'ABYSSAL KERNEL CORE [BAD ENDING]')
    ],
    gravityZones: [
      new GravityZone(3250, 250, 600, 500, 0.0, { x: 0, y: 0 }, '◆ ZERO-G BRANCHING JUNCTION ◆')
    ],
    enemies: [
      // Approach Gauntlet
      new Enemy(500, 590, 400, 850, 2.5, 'fast'),
      new Enemy(2100, 590, 2020, 2220, 2.0, 'patrol'),
      new Enemy(2600, 590, 2480, 2720, 2.2, 'patrol'),
      new Enemy(2250, 430, 2200, 2480, 2.5, 'fast'),
      new Enemy(2750, 310, 2700, 2980, 2.5, 'fast'),

      // Upper Path Defenders (Fast & Sleek)
      new Enemy(4200, 250, 4150, 4320, 2.2, 'fast'),
      new Enemy(4800, 10, 4750, 4920, 2.4, 'fast'),
      new Enemy(5450, -210, 5400, 5600, 2.6, 'fast'),
      new Enemy(5900, -310, 5800, 6300, 3.0, 'heavy'), // Sanctuary Warden

      // Lower Path Defenders (Heavy & Aggressive)
      new Enemy(4220, 830, 4180, 4380, 2.0, 'heavy'),
      new Enemy(4650, 830, 4620, 4770, 2.2, 'heavy'),
      new Enemy(5000, 990, 4920, 5280, 2.5, 'heavy'),
      new Enemy(5500, 1150, 5420, 5820, 2.8, 'heavy'),
      new Enemy(6100, 1290, 5980, 6450, 3.2, 'heavy') // Abyssal Warden
    ],
    collectibles: [
      new Collectible(1190, 460),
      new Collectible(1490, 340),
      new Collectible(2340, 420),
      new Collectible(2840, 300),
      new Collectible(3510, 490), // At the Split Junction!

      // Upper Path Packets
      new Collectible(4230, 240),
      new Collectible(4830, 0),
      new Collectible(5490, -220),
      new Collectible(6050, -320),

      // Lower Path Packets
      new Collectible(4280, 820),
      new Collectible(5080, 980),
      new Collectible(5610, 1140),
      new Collectible(6240, 1280)
    ],
    gateways: [
      // Upper Good Ending Portal
      new Gateway(6200, -400, 80, 140, 'good', null, 'GOOD END // PURIFY SYSTEM'),
      // Lower Bad Ending Portal
      new Gateway(6350, 1200, 80, 140, 'bad', null, 'BAD END // ASSIMILATE CORE')
    ]
  }
];

// ─── LEVEL MANAGER CLASS ─────────────────────────────────────────────────────────────────
class LevelManager {
  constructor() {
    this.currentLevel = null;
    this.player = new Player(100, 500);
    this.gravityZones = [];
  }

  loadLevel(index, mode = null) {
    if (index >= levelData.length) {
      this.triggerGameEnding('good');
      return;
    }

    game.currentLevelIndex = index;
    const data = levelData[index];
    this.currentLevel = data;
    if (typeof audioManager !== 'undefined') audioManager.playBgm(index);

    // Reset Player & Antigravity System
    antigravitySystem.resetToDefault('levelLoad');
    this.player.reset(data.playerStart.x, data.playerStart.y);

    // Reset Camera
    camera.x = data.playerStart.x - (VIEW_WIDTH / 2);
    camera.y = data.playerStart.y - (VIEW_HEIGHT / 2);

    // Reset & Clone Entities
    this.platforms = data.platforms.map(p => new Platform(p.x, p.y, p.width, p.height, p.type, p.label));
    this.enemies   = data.enemies.map(e => new Enemy(e.x, e.y, e.patrolMinX, e.patrolMaxX, e.speed, e.type));
    this.collectibles = data.collectibles.map(c => new Collectible(c.x, c.y));
    this.gateways  = data.gateways.map(g => new Gateway(g.x, g.y, g.width, g.height, g.type, g.targetLevel, g.label));
    this.gravityZones = (data.gravityZones || []).map(z => new GravityZone(z.x, z.y, z.width, z.height, z.targetScale, z.targetVector, z.label));

    // Dynamic Map & Consequence Engine (Detroit Effect)
    if (index === 1 && mode === 'stealth') {
      this.enemies = this.enemies.filter(e => e.type !== 'heavy');
      this.platforms.push(new Platform(3000, 300, 400, 20, 'floating', '// STEALTH BRIDGE // SUPERCOMPUTER MESH'));
    } else if (index === 1 && (mode === 'assault' || mode === 'wasteland')) {
      this.enemies.push(new Enemy(2000, 400, 1800, 2400, 4.0, 'heavy'));
      this.enemies.push(new Enemy(4500, 200, 4200, 4800, 3.5, 'heavy'));
    }

    game.totalPacketsInLevel = (index === 2 ? 9 : this.collectibles.length);
    game.levelStartTime = performance.now();
    game.state = 'PLAYING';

    vfx.clear();
    updateHudDisplay();
    hideUiModal();

    if (typeof dialogueManager !== 'undefined' && index === 0) {
      setTimeout(() => dialogueManager.trigger('gameStart'), 300);
    }
  }

  restartCurrentLevel() {
    this.loadLevel(game.currentLevelIndex);
  }

  update() {
    if (game.state !== 'PLAYING') return;

    game.timeElapsed = Math.floor((performance.now() - game.levelStartTime) / 1000);

    if (input.justPressed.reset) {
      this.restartCurrentLevel();
      input.clearJustPressed();
      return;
    }

    // Update Antigravity Lerp Timestep
    antigravitySystem.update();

    // Update Environmental Gravity Zones
    for (const zone of this.gravityZones) {
      zone.update(this.player, antigravitySystem);
    }

    // Update Player Physics & Collisions
    this.player.update(input, this.platforms, this.currentLevel.bounds);

    // Update Camera to follow player
    camera.follow(this.player, this.currentLevel.bounds);

    // Update Enemies
    for (const enemy of this.enemies) {
      enemy.update(this.platforms);
      enemy.checkPlayerCollision(this.player);
    }

    // Update Collectibles
    for (const item of this.collectibles) {
      item.update();
      item.checkPlayerCollision(this.player);
    }

    // Update Gateways
    for (const gate of this.gateways) {
      gate.update();
      gate.checkPlayerCollision(this.player);
    }

    // Update Particle VFX
    vfx.update();

    updateHudDisplay();
    input.clearJustPressed();
  }

  draw() {
    const camOffset = camera.getRenderOffset();

    // 1. Draw Parallax Background
    backgroundRenderer.draw(ctx, camOffset, game.currentLevelIndex);

    // 2. Draw Environmental Gravity Zones
    for (const zone of this.gravityZones) {
      zone.draw(ctx, camOffset);
    }

    // 3. Draw Terrain / Platforms
    for (const plat of this.platforms) {
      plat.draw(ctx, camOffset);
    }

    // 4. Draw Gateways / Portals
    for (const gate of this.gateways) {
      gate.draw(ctx, camOffset);
    }

    // 5. Draw Collectible Packets
    for (const item of this.collectibles) {
      item.draw(ctx, camOffset);
    }

    // 6. Draw Patrol Enemies
    for (const enemy of this.enemies) {
      enemy.draw(ctx, camOffset);
    }

    // 7. Draw Player
    this.player.draw(ctx, camOffset);

    // 8. Draw Particle Effects
    vfx.draw(ctx, camOffset);
  }

  triggerLevelComplete(nextIndex) {
    game.state = 'LEVEL_COMPLETE';
    showTransitionModal(
      "SECTOR CLEARED",
      `Telemetry gathered from ${this.currentLevel.title}. Proceeding to next security sector...`,
      "PROCEED TO NEXT SECTOR",
      () => this.loadLevel(nextIndex),
      false
    );
  }

  triggerGameEnding(type) {
    playCutscene('assets/level3_cutscene.mp4', () => {
      if (type === 'good') {
        game.state = 'GOOD_ENDING';
        showTransitionModal(
          "GOOD ENDING ACHIEVED // SYSTEM PURIFIED",
          "You ascended the secure network spire and purged the rogue anomaly with zero corruption! The Cyber Ascension protocol is complete.",
          "REBOOT SYSTEM (PLAY AGAIN)",
          () => { game.score = 0; game.enemiesDefeated = 0; this.loadLevel(0); },
          'good'
        );
      } else {
        game.state = 'BAD_ENDING';
        showTransitionModal(
          "BAD ENDING ACHIEVED // CORRUPTED CORE",
          "You descended into the infected abyss. The rogue anomaly consumed your data packet and assimilated your consciousness into the swarm!",
          "RETRY FROM SECTOR 01",
          () => { game.score = 0; game.enemiesDefeated = 0; this.loadLevel(0); },
          'bad'
        );
      }
    });
  }
}
const levelManager = new LevelManager();

// ─── HUD & MODAL UI MANAGEMENT ───────────────────────────────────────────────────────────
function updateHudDisplay() {
  if (!levelManager.currentLevel) return;
  hudLevelTitle.textContent = levelManager.currentLevel.title;

  const player = levelManager.player;
  if (hudShields && player) {
    const s = Math.max(0, player.shields);
    const m = player.maxShields;
    const bars = '█'.repeat(s) + '░'.repeat(m - s);
    hudShields.textContent = `${bars} ${s}/${m}`;
    hudShields.className = s === 3 ? "hud-val neon-green" : (s === 2 ? "hud-val neon-yellow" : "hud-val neon-red low-shield-flash");
  }

  const collectedCount = levelManager.collectibles.filter(c => c.collected).length;
  const totalCount     = game.totalPacketsInLevel || levelManager.collectibles.length;
  hudScore.textContent   = `${String(collectedCount).padStart(2, '0')} / ${String(totalCount).padStart(2, '0')}`;

  if (hudDash && player) {
    if (player.dashCooldown <= 0) {
      hudDash.textContent = "READY";
      hudDash.className = "hud-val neon-cyan";
    } else {
      const remainingSec = (player.dashCooldown / 60).toFixed(1);
      hudDash.textContent = `${remainingSec}s`;
      hudDash.className = "hud-val neon-yellow";
    }
  }

  if (hudGravity) {
    if (antigravitySystem.isZeroG) {
      hudGravity.textContent = "ZERO-G";
      hudGravity.className = "hud-val neon-yellow";
    } else if (antigravitySystem.isReversed) {
      hudGravity.textContent = "-1.0G (CEILING)";
      hudGravity.className = "hud-val neon-purple";
    } else {
      hudGravity.textContent = "1.0G (NORMAL)";
      hudGravity.className = "hud-val neon-cyan";
    }
  }
  
  hudStatus.textContent  = `ONLINE // PTS: ${game.score}`;
  hudStatus.className    = "hud-val neon-yellow";
}

function showTransitionModal(titleText, descText, primaryBtnText, onPrimaryClick, endingType = false) {
  modalTitle.textContent = titleText;
  modalDesc.textContent  = descText;
  btnPrimary.textContent = primaryBtnText;

  // Populate Statistics
  const collectedCount = levelManager.collectibles.filter(c => c.collected).length;
  const totalCount     = game.totalPacketsInLevel || levelManager.collectibles.length;
  statPackets.textContent = `${String(collectedCount).padStart(2, '0')} / ${String(totalCount).padStart(2, '0')}`;
  statEnemies.textContent = String(game.enemiesDefeated);
  
  const mins = String(Math.floor(game.timeElapsed / 60)).padStart(2, '0');
  const secs = String(game.timeElapsed % 60).padStart(2, '0');
  statTime.textContent = `${mins}:${secs}`;

  // Apply visual styling based on ending type
  modalBox.className = "modal-box";
  if (endingType === 'good') {
    modalBox.classList.add('good-ending-box');
    modalTag.textContent = "// MISSION SUCCESS // PURIFICATION PROTOCOL";
  } else if (endingType === 'bad') {
    modalBox.classList.add('bad-ending-box');
    modalTag.textContent = "// MISSION FAILED // CORE CORRUPTION DETECTED";
  } else {
    modalTag.textContent = "// SECTOR CHECKPOINT RECORDED";
  }

  // Bind primary action button
  btnPrimary.onclick = () => {
    onPrimaryClick();
  };

  // Bind secondary restart action button
  btnSecondary.onclick = () => {
    levelManager.restartCurrentLevel();
  };

  uiModal.classList.remove('modal-hidden');
}

function hideUiModal() {
  uiModal.classList.add('modal-hidden');
}

// ─── 60FPS FIXED TIMESTEP GAME LOOP ──────────────────────────────────────────────────────
function gameLoop(timestamp) {
  // Calculate delta time for smooth 60FPS lock
  const delta = timestamp - game.lastFrameTime;
  game.lastFrameTime = timestamp;

  // FPS Counter calculation
  game.frameCount++;
  game.fpsTimer += delta;
  if (game.fpsTimer >= 1000) {
    game.fps = Math.round((game.frameCount * 1000) / game.fpsTimer);
    game.frameCount = 0;
    game.fpsTimer = 0;
  }

  // Update Game Logic
  levelManager.update();

  // Render Game Scene with Zoom-In Camera Scaling (15% Cinematic Zoom)
  ctx.save();
  const zoomScale = Math.min(canvas.width / VIEW_WIDTH, canvas.height / VIEW_HEIGHT) * 1.15;
  const offsetX = (canvas.width - VIEW_WIDTH * zoomScale) / 2;
  const offsetY = (canvas.height - VIEW_HEIGHT * zoomScale) / 2;
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoomScale, zoomScale);
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  levelManager.draw();
  ctx.restore();

  // Request next frame
  requestAnimationFrame(gameLoop);
}

// ─── INITIALIZE GAME ENGINE AFTER ASYNC ASSET LOADING ────────────────────────────────────
window.addEventListener('load', () => {
  // Display initial asset loading status on canvas
  ctx.fillStyle = '#04070a';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#00ffcc';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LOADING ASSETS // INITIALIZING CYBER ENGINE...', VIEW_WIDTH / 2, VIEW_HEIGHT / 2);

  loadAllAssets(() => {
    const audioOverlay = document.getElementById('audio-start-overlay');
    const initBtn = document.getElementById('btn-init-audio');
    const muteBtn = document.getElementById('btn-mute-toggle');
    
    if (muteBtn) {
      muteBtn.onclick = () => audioManager.toggleMute();
    }
    if (typeof dialogueManager !== 'undefined') dialogueManager.init();
    
    const startAudioAndGame = () => {
      audioManager.init();
      if (audioOverlay) audioOverlay.style.display = 'none';
      if (!game.started) {
        game.started = true;
        levelManager.loadLevel(0);
        requestAnimationFrame(gameLoop);
      }
    };

    if (initBtn) initBtn.onclick = startAudioAndGame;
    if (audioOverlay) audioOverlay.onclick = startAudioAndGame;
  });
});
