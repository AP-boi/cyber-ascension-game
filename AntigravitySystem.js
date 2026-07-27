/* =========================================================================================
   CYBER ASCENSION // AntigravitySystem.js
   Principal Gameplay Engineer Architecture & Production-Ready Physics Module
   Engine: Strict Vanilla ES6+ JavaScript / HTML5 Canvas 2D
   =========================================================================================
   
   HIGH-LEVEL ARCHITECTURE OVERVIEW:
   1. Decoupled Event System (EventBus):
      - Implements a Publisher-Subscriber pattern (`on`, `off`, `emit`).
      - Physics and state transitions never directly reference rendering, cameras, or audio.
      - Emits lifecycle events: `onGravityChanged`, `onGravityOverrideStart`, `onGravityOverrideEnd`,
        and `onGravityImplantToggle`.
        
   2. Modular Antigravity Controller (AntigravitySystem):
      - Safely manages gravity vector overrides (`gravityVector: { x, y }`) and dynamic scaling (`currentScale`).
      - Prevents jarring instant snaps by utilizing smooth linear interpolation (Lerp) over time:
        `currentScale += (targetScale - currentScale) * lerpSpeed`.
      - Manages state machine transitions between Normal Gravity (1.0, Down), Zero-G (0.0, Float),
        and Reversed Gravity (-1.0, Ceiling Walk).
        
   3. Momentum & Inertia Controls (Vector Math):
      - In Zero-G / Floaty State (`|currentScale| < 0.1`): Linear air damping (0.94) is applied uniformly
        across both X and Y velocity vectors to simulate viscous microgravity drag.
      - Directional micro-thruster forces apply acceleration vectors independent of gravity.
      - In Reversed Gravity (`currentScale < -0.1`): Normal ground friction is transferred to ceiling contacts,
        and jump impulse vectors are inverted (`vy = -JUMP_POWER * -1`).
        
   4. Kinematic Collision & Clipping Prevention (Separating Axis Theorem / AABB):
      - By resolving X-axis movement before Y-axis movement, gravity shifts never push entities into corners
        or cause diagonal clipping.
      - When gravity is inverted, ceiling collision detection (`vy < 0` against solid bottoms) dynamically
        assigns `isGrounded = true` and resets jump counters, enabling seamless ceiling locomotion.
   ========================================================================================= */

/**
 * 1. DECOUPLED EVENT BUS
 * Allows particle VFX, audio managers, and camera controllers to react dynamically to physics shifts.
 */
export class EventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event topic.
   * @param {string} event - Topic name (e.g., 'onGravityChanged')
   * @param {Function} callback - Callback execution function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Unsubscribe from an event topic.
   * @param {string} event - Topic name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Broadcast an event payload to all active subscribers.
   * @param {string} event - Topic name
   * @param {Object} payload - Decoupled data packet
   */
  emit(event, payload) {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      callback(payload);
    }
  }
}

/**
 * 2. CORE ANTIGRAVITY CONTROLLER
 * Handles vector overrides, lerp state transitions, and cyber-implant toggles.
 */
export class AntigravitySystem {
  constructor(eventBus) {
    this.events = eventBus;
    
    // Dynamic Gravity Scale (1.0 = Normal Earth/Cyber, 0.0 = Zero-G, -1.0 = Inverted Ceiling Walk)
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    
    // Normalized Gravity Direction Vector (Default: Downward along Y-axis)
    this.gravityVector = { x: 0, y: 1 };
    this.targetVector = { x: 0, y: 1 };
    
    // Smooth Interpolation factor per fixed frame (0.08 = ~12 frames to settle)
    this.lerpSpeed = 0.085;
    
    // State Boolean Flags
    this.isZeroG = false;
    this.isReversed = false;
    this.implantActive = false;
  }

  /**
   * Fixed Timestep Update Loop
   * Smoothly interpolates current gravity scale and vector toward target overrides.
   */
  update() {
    const prevScale = this.currentScale;
    
    // Lerp Vector Math: V_current = V_current + (V_target - V_current) * lerpFactor
    this.currentScale += (this.targetScale - this.currentScale) * this.lerpSpeed;
    this.gravityVector.x += (this.targetVector.x - this.gravityVector.x) * this.lerpSpeed;
    this.gravityVector.y += (this.targetVector.y - this.gravityVector.y) * this.lerpSpeed;

    // Update derived state flags with hysteresis thresholds
    this.isZeroG = Math.abs(this.currentScale) < 0.12;
    this.isReversed = this.currentScale < -0.12;

    // Emit decoupled event if gravity shifted meaningfully (> 0.002 threshold)
    if (Math.abs(this.currentScale - prevScale) > 0.002) {
      this.events.emit('onGravityChanged', {
        scale: this.currentScale,
        vector: { ...this.gravityVector },
        isZeroG: this.isZeroG,
        isReversed: this.isReversed
      });
    }
  }

  /**
   * Override gravity from environmental zones or scripted triggers.
   * @param {number} scale - Target gravity scalar (e.g., -1.0 for invert, 0.0 for float)
   * @param {number} vectorX - Horizontal directional gravity (-1 to 1)
   * @param {number} vectorY - Vertical directional gravity (-1 to 1)
   * @param {string} source - Origin identifier ('zone', 'implant', 'hazard')
   */
  setGravityOverride(scale, vectorX = 0, vectorY = 1, source = 'zone') {
    this.targetScale = scale;
    this.targetVector = { x: vectorX, y: vectorY };
    this.events.emit('onGravityOverrideStart', { scale, vectorX, vectorY, source });
  }

  /**
   * Release environmental overrides and restore default or implant state.
   * @param {string} source - Origin identifier releasing control
   */
  resetToDefault(source = 'zone') {
    if (this.implantActive) {
      this.targetScale = -1.0;
      this.targetVector = { x: 0, y: -1 };
    } else {
      this.targetScale = 1.0;
      this.targetVector = { x: 0, y: 1 };
    }
    this.events.emit('onGravityOverrideEnd', { source, restoredScale: this.targetScale });
  }

  /**
   * Toggle Player Cyber-Implant (Manual Inversion / Float capability).
   */
  toggleImplant() {
    this.implantActive = !this.implantActive;
    if (this.implantActive) {
      this.targetScale = -1.0;
      this.targetVector = { x: 0, y: -1 };
    } else {
      this.targetScale = 1.0;
      this.targetVector = { x: 0, y: 1 };
    }
    this.events.emit('onGravityImplantToggle', { active: this.implantActive, scale: this.targetScale });
  }
}

/**
 * 3. ENVIRONMENTAL ANTIGRAVITY ZONE (ENTITY)
 * AABB trigger zone that overrides player and drone gravity when inside.
 */
export class GravityZone {
  constructor(x, y, width, height, targetScale = -1.0, targetVector = { x: 0, y: -1 }, label = "INVERSION FIELD") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.targetScale = targetScale;
    this.targetVector = targetVector;
    this.label = label;
    this.playerInside = false;
  }

  /**
   * Check intersection with player and apply/release overrides.
   * @param {Object} player - Player entity with AABB bounds
   * @param {AntigravitySystem} sys - Core Antigravity system instance
   */
  update(player, sys) {
    const isIntersecting = (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    );

    if (isIntersecting && !this.playerInside) {
      this.playerInside = true;
      sys.setGravityOverride(this.targetScale, this.targetVector.x, this.targetVector.y, 'zone');
    } else if (!isIntersecting && this.playerInside) {
      this.playerInside = false;
      sys.resetToDefault('zone');
    }
  }

  /**
   * Render glowing energy field primitive with scanlines.
   * @param {CanvasRenderingContext2D} ctx - 2D Canvas Context
   * @param {Object} camOffset - Viewport translation
   */
  draw(ctx, camOffset) {
    const rx = Math.floor(this.x - camOffset.x);
    const ry = Math.floor(this.y - camOffset.y);

    if (rx + this.width < -50 || rx > 1280 + 50 || ry + this.height < -50 || ry > 720 + 50) return;

    ctx.save();
    // Semi-transparent field tint based on gravity type
    const color = this.targetScale < 0 ? 'rgba(180, 0, 255, 0.18)' : 'rgba(0, 255, 204, 0.18)';
    const borderColor = this.targetScale < 0 ? '#b400ff' : '#00ffcc';

    ctx.fillStyle = color;
    ctx.fillRect(rx, ry, this.width, this.height);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = borderColor;
    ctx.strokeRect(rx, ry, this.width, this.height);

    // Floating directional indicator arrows
    ctx.fillStyle = borderColor;
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    const arrow = this.targetScale < 0 ? '▲ INVERSION FIELD ▲' : '◆ ZERO-G FLOAT ◆';
    ctx.fillText(arrow, rx + (this.width / 2), ry + (this.height / 2));
    ctx.restore();
  }
}
