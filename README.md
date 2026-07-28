# ⚡ CYBER ASCENSION // 2D Cyberpunk Action Engine (v2.5)

[![Live Demo](https://img.shields.io/badge/PLAY_ONLINE-neondrift2.netlify.app-ff0055?style=for-the-badge&logo=netlify)](https://neondrift2.netlify.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-cyber--ascension--game-00ffcc?style=for-the-badge&logo=github)](https://github.com/AP-boi/cyber-ascension-game)
[![Engine Version](https://img.shields.io/badge/VERSION-2.5.0_STABLE-00ffcc?style=for-the-badge)](https://github.com/AP-boi/cyber-ascension-game)

> **A zero-dependency, high-performance 2D cyberpunk action platformer engine featuring an Antigravity vector controller, 3-segment Cyber Shield HP gauge, high-velocity dash thrusters, wall-jumping, dynamic audio synthesis, full cinematic video cutscenes, and a Detroit-style branching narrative system that physically alters the game world.**

---

## 🌐 Play Online (Live Demo)

🕹️ **Play immediately in your browser**: **[https://neondrift2.netlify.app](https://neondrift2.netlify.app)**

---

## 🎮 Game Overview

**CYBER ASCENSION v2.5** is built entirely with **Vanilla JavaScript (ES6 Modules)**, **HTML5 Canvas**, and **CSS3**. Infiltrate compromised security sectors, recover encrypted telemetry data packets, evade autonomous Mech wardens, navigate zero-g float fields and gravity inversion chasms, experience cinematic video cutscenes between levels, and make high-stakes narrative choices that determine the ultimate fate of the cyber sanctuary.

---

## ✨ Key Features (v2.5 Update)

* **🌌 Antigravity Vector & Locomotion Engine (`AntigravitySystem.js`)**:
  * **Lerp Vector Interpolation**: Smooth Linear Interpolation gravity transitions between standard down-gravity (`1.0G`), zero-g floating (`0.0G`), and inverted ceiling walking (`-1.0G`).
  * **Manual Implant Inversion**: Press `[G]` key to manually flip operator gravity orientation on demand.
  * **Environmental `GravityZone` AABB Triggers**: High-voltage inversion zones and zero-g float chasms dynamically alter physics when entered.
  * **Upside-Down Locomotion**: Fully inverted sprite rendering, ceiling sliding, and inverted jumping physics.

* **🛡️ 3-Segment Cyber Shield HP System**:
  * **Shield Gauge (`███ 3/3`, `██░ 2/3`, `█░░ 1/3`)**: Standard contact with drones or Mechs depletes 1 shield segment, triggering invincibility frames, screen shake, low-shield alert flashing, and spark VFX instead of instant death.

* **⚡ High-Velocity Cyber Dash & Wall Jump**:
  * **Cyber Dash Thruster**: Press `[SHIFT]` or `[E]` for rapid horizontal thrusting with cyan particle trails and real-time HUD cooldown indicator.
  * **Wall Slide & Jump**: Slide along vertical surfaces and jump off walls to reach high-altitude sectors.

* **🎬 Integrated Full-Screen Cinematic Cutscenes**:
  * High-octane video cutscenes play seamlessly at the transition of **Level 1**, **Level 2**, and the **Level 3 Grand Finale**.
  * Interactive skip controls (`[SPACE]`, `[CLICK]`, `[ESC]`) with fallback autoplay handling.

* **🔀 Detroit-Style Narrative & Consequence System**:
  * Decision checkpoints (*Hack Supercomputer Core* vs *Reroute to Wasteland*) physically reconfigure map platform layouts, enemy patrol density, visual themes, and story endings.

* **🤖 Dynamic Chroma-Key Sprite Transparency**:
  * In-engine pixel color analysis (`removeWhiteBackground`) strips white background borders from Mech robot sprite sheets in real-time.

* **🏙️ 3 Progressive Sectors & Physical Branching Endings**:
  * **Sector 01: Neon Outskirts** — High-speed infiltration gauntlet with security drones and data packet recovery.
  * **Sector 02: Cyber Span** — Inversion fields, zero-g float chasms, and heavy Mech assault wardens.
  * **Sector 03: The Core Divide** — Dual physical branching split leading to either the **Good Ending (Purification Sanctuary)** or **Bad Ending (Abyssal Kernel Core)**.

* **🔊 Web Audio API Synthesizer**:
  * Procedurally synthesized zero-latency audio SFX for thrusters, gravity shifts, dash boosts, shield impacts, data packet pickups, warning alerts, and explosive death impact sounds.

---

## 🕹️ Operator Controls

| Action | Primary Key | Alternative Key |
| :--- | :--- | :--- |
| **Move Left / Right** | `[A]` / `[D]` | `[←]` / `[→]` Arrow Keys |
| **Jump / Double Jump / Wall Jump** | `[W]` | `[↑]` Arrow / `[Spacebar]` |
| **Cyber Dash Thruster** | `[SHIFT]` | `[E]` |
| **Toggle Antigravity Implant** | `[G]` | — |
| **Skip Cinematic Cutscene** | `[Spacebar]` / `[Esc]` | Click `[SKIP]` Button |
| **Emergency Sector Reboot** | `[R]` | — |
| **Toggle Audio Mute** | `[M]` | — |

---

## 🚀 How to Run Locally

Because the engine loads custom pixel-art assets, MP4 cutscene videos, and Web Audio synthesizers, run it via a local HTTP server:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/AP-boi/cyber-ascension-game.git
   cd cyber-ascension-game
   ```

2. **Start Local HTTP Server**:
   * **Python 3**:
     ```bash
     python -m http.server 8080
     ```
   * **Node.js (`npx serve`)**:
     ```bash
     npx serve . -p 8080
     ```

3. **Open Browser**:
   Navigate to [`http://localhost:8080`](http://localhost:8080) and click **[ ENGAGE AUDIO & START ]** to initialize the engine.

---

## 🛠️ Project Architecture

```
cyber-ascension-game/
├── index.html          # Viewport, HUD overlay, cutscene layer, dialogue terminal, modal UI
├── style.css           # Cyberpunk design system, neon color tokens, scanlines, shield bars
├── main.js             # Core engine (60FPS loop, physics, level manager, AI, cutscenes, SFX)
├── AntigravitySystem.js# Antigravity vector controller, EventBus, and GravityZone entities
├── assets/             # Sprite sheets, MP4 cutscene videos, backgrounds, and level assets
├── .gitignore          # Git ignore rules
└── README.md           # Full project documentation
```

---

## 📜 Links & License

- **Live Website**: [https://neondrift2.netlify.app](https://neondrift2.netlify.app)
- **GitHub Repository**: [https://github.com/AP-boi/cyber-ascension-game](https://github.com/AP-boi/cyber-ascension-game)
- **License**: Distributed under the MIT License.

