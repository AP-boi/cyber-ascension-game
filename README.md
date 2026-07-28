# ⚡ CYBER ASCENSION // 2D Cyberpunk Action Engine

[![Live Demo](https://img.shields.io/badge/PLAY_ONLINE-neondrift2.netlify.app-ff0055?style=for-the-badge&logo=netlify)](https://neondrift2.netlify.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-cyber--ascension--game-00ffcc?style=for-the-badge&logo=github)](https://github.com/AP-boi/cyber-ascension-game)

> **A zero-dependency, high-performance 2D cyberpunk action platformer featuring an Antigravity vector engine, Cyber Shield HP gauge, high-velocity dash thrusters, wall-jumping, dynamic audio synthesis, full cinematic video cutscenes, and a Detroit-style branching narrative system that physically alters the game world.**

---

## 🌐 Play Online (Live Demo)

🕹️ **Play immediately in your browser**: **[https://neondrift2.netlify.app](https://neondrift2.netlify.app)**

---

## 🎮 Game Overview

**CYBER ASCENSION** is built entirely with **Vanilla JavaScript (ES6 Modules)**, **HTML5 Canvas**, and **CSS3**. Infiltrate compromised security sectors, recover encrypted telemetry data packets, evade autonomous Mech wardens, navigate zero-g float fields and gravity inversion chasms, experience cinematic video cutscenes between levels, and make high-stakes narrative choices that determine the ultimate fate of the cyber sanctuary.

---

## ✨ Key Features

* **🌌 Antigravity Vector & Ceiling Locomotion Engine (`AntigravitySystem.js`)**:
  * Smooth Linear Interpolation (Lerp) gravity transitions between normal down-gravity (`1.0G`), zero-g floating (`0.0G`), and inverted ceiling walking (`-1.0G`).
  * Cyber-Implant Manual Inversion (`[G]` key) and environmental `GravityZone` AABB trigger fields.
  * Inverted ceiling locomotion physics with upside-down sprite rendering and ceiling jumping.

* **🛡️ 3-Segment Cyber Shield HP System**:
  * Operators have a 3-segment Shield gauge (`███ 3/3`). Contact with drones reduces 1 shield segment, triggering invincibility frames, screen shake, and spark VFX instead of instant death.

* **⚡ Cyber Dash & Wall Jump Mobility**:
  * **Cyber Dash Thruster**: Press `[SHIFT]` or `[E]` for high-velocity horizontal dashing with cyan particle trail and cooldown meter.
  * **Wall Jump & Slide**: Slide along vertical surfaces and jump off walls to reach high sectors.

* **🎬 Integrated Full-Screen Cinematic Video Cutscenes**:
  * Custom high-octane video cutscenes play seamlessly at the end of **Level 1**, **Level 2**, and the **Level 3 Grand Finale**.
  * Supports interactive skip functionality (`[SPACE]` / `[CLICK]` / `[ESC]`) and graceful autoplay fallback handling.

* **🔀 Detroit-Style Narrative & Consequence System**:
  * In-game choices (*Hack the Core* vs *Reroute to Wasteland*) physically alter map architecture, enemy patrol density, environmental visual themes, and story endings.

* **🤖 Dynamic Chroma-Key Sprite Transparency**:
  * In-engine pixel analysis (`removeWhiteBackground`) strips white background borders from Mech robot sprite sheets dynamically.

* **🏙️ 3 Progressive Sectors & Physical Branching**:
  * **Sector 01: Neon Outskirts** — Infiltration gauntlet with security drones and data packet recovery.
  * **Sector 02: Cyber Span** — High-voltage inversion fields, zero-g chasms, and heavy Mech assault wardens.
  * **Sector 03: The Core Divide** — Zero-g branching split leading to either the **Good Ending (Purification Sanctuary)** or **Bad Ending (Abyssal Kernel Core)**.

* **🔊 Web Audio API Zero-Latency Synthesizer**:
  * Procedurally synthesized SFX for jump thrusters, antigravity shifts, dash boosts, shield hits, wall jumps, data packet pickups, warning alerts, and explosive death "boom" impact sounds.

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

Because the game loads custom pixel-art assets, MP4 cutscenes, and audio tracks, run it via a local HTTP web server:

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
   Navigate to [`http://localhost:8080`](http://localhost:8080) and click **[ ENGAGE AUDIO & START ]** to launch the engine.

---

## 🛠️ Project Structure

```
cyber-ascension-game/
├── index.html          # Game viewport, HUD overlay, cutscene layer, dialogue terminal, modal UI
├── style.css           # Cyberpunk design system, neon color tokens, scanline CRT FX, shield bars
├── main.js             # Core engine (60FPS game loop, physics, level manager, AI, cutscenes, SFX)
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
