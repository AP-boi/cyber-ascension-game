# ⚡ CYBER ASCENSION // 2D Cyberpunk Action Engine

[![GitHub Repository](https://img.shields.io/badge/GitHub-cyber--ascension--game-00ffcc?style=for-the-badge&logo=github)](https://github.com/AP-boi/cyber-ascension-game)

> **A zero-dependency, high-performance 2D cyberpunk action platformer featuring tight physics, dynamic audio synthesis, full cinematic video cutscenes, and a Detroit-style branching narrative system that physically alters the game world.**

---

## 🎮 Game Overview

**CYBER ASCENSION** is built entirely with **Vanilla JavaScript**, **HTML5 Canvas**, and **CSS3**. Infiltrate compromised security sectors, recover encrypted telemetry data packets, evade autonomous Mech wardens, experience cinematic video cutscenes between levels, and make high-stakes narrative choices that determine the ultimate fate of the cyber sanctuary.

---

## ✨ Key Features

* **🕹️ Custom 2D Physics & Motion System**:
  * Precision AABB collision detection and X/Y axis separation.
  * Variable jump height, double-jump thrusters, inertia damping, and smooth camera tracking with screen shake.

* **🎬 Integrated Full-Screen Cinematic Video Cutscenes**:
  * Custom high-octane video cutscenes play seamlessly at the end of **Level 1**, **Level 2**, and the **Level 3 Grand Finale**.
  * Supports interactive skip functionality (`[SPACE]` / `[CLICK] / [ESC]`) and graceful autoplay fallback handling.

* **🔀 Detroit-Style Narrative & Consequence System**:
  * In-game choices (*Hack the Core* vs *Reroute to Wasteland*) physically alter map architecture, enemy patrol density, environmental visual themes, and story endings.

* **🤖 Dynamic Chroma-Key Sprite Transparency**:
  * In-engine pixel analysis (`removeWhiteBackground`) strips white background borders from Mech robot sprite sheets dynamically, rendering them 100% transparent on any background.

* **🏙️ 3 Progressive Sectors & Physical Branching**:
  * **Sector 01: Neon Outskirts** — Introductory infiltration gauntlet with floating security drones and data packet recovery.
  * **Sector 02: Cyber Span / Desert Server Room** — Precision platforming across high-voltage bridges and heavy Mech assault wardens.
  * **Sector 03: The Core Divide / Glacier Shift** — Multi-tiered architectural split leading to either the **Good Ending (Purification Sanctuary)** or **Bad Ending (Abyssal Kernel Core)**.

* **🔊 Web Audio API Zero-Latency Synthesizer**:
  * Procedurally synthesized SFX for jump thrusters, data packet pickups, warning alerts, and explosive death "boom" impact sounds.
  * Level-specific background music track management with mute/volume controls.

* **🎨 Cyberpunk Aesthetic & VFX Engine**:
  * CRT scanline overlay, vignette depth shading, particle explosions, animated leg stride sprite sheets, and parallax scrolling backgrounds.

---

## 🕹️ Operator Controls

| Action | Primary Key | Alternative Key |
| :--- | :--- | :--- |
| **Move Left / Right** | `[A]` / `[D]` | `[←]` / `[→]` Arrow Keys |
| **Jump / Double Jump** | `[W]` | `[↑]` Arrow / `[Spacebar]` |
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
├── index.html        # Game viewport, HUD overlay, cutscene layer, dialogue terminal, modal UI
├── style.css         # Cyberpunk design system, neon color tokens, scanline CRT FX
├── main.js           # Core engine (60FPS game loop, physics, level manager, AI, cutscenes, SFX)
├── assets/           # Sprite sheets, MP4 cutscene videos, backgrounds, and level assets
├── .gitignore        # Git ignore rules
└── README.md         # Full project documentation
```

---

## 📜 Repository & License

- **GitHub Repository**: [https://github.com/AP-boi/cyber-ascension-game](https://github.com/AP-boi/cyber-ascension-game)
- **License**: Distributed under the MIT License.
