# TABLE PEN ATTACK: Retro Arcade Redesign

Redesign the visual identity, menu composition, and in-game presentation of **Table Pen Attack** into a high-contrast, premium retro arcade game infused with school desk nostalgia (#101522 midnight navy, #F5E8CC paper cream, #FF7138 electric orange, and #3568F5 cobalt blue).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core interaction and aesthetic decisions were confirmed during the clarification interview:

- **Launch Control Scheme**: Confirmed drag-and-release slingshot flicking with an active visual trajectory guideline, dashed prediction line, and power indicator.
- **Selectable Arsenal**: Three distinct school stationery types with tailored physics profiles:
  - *Classic Ballpoint*: Balanced mass, agile handling, medium bounce.
  - *Heavy Gel Pen*: Dense mass, high knockdown momentum, slower speed.
  - *Chunky Highlighter*: Wide contact hitbox, high surface friction, drift control.
- **Audio Profile**: Synthesized Web Audio engine delivering retro 8-bit arcade bleeps, power chords, and crisp desk tap impact sounds with mute toggle.

---

### 1. Overview & Core Concept

**Table Pen Attack** simulates the classic nostalgic schoolyard pastime of flicking stationery across classroom desks to knock opponent pens off the edge. This overhaul replaces the previous generic classroom landing page with an art-directed indie arcade experience: an asymmetric split-screen title view, a floating isometric wooden desk arena with realistic edge drop-offs, vibrant ink-particle impact FX, and a sleek arcade HUD displaying scores, waves, and multiplier streaks.

- **Target Audience**: Casual arcade lovers and nostalgic gamers who appreciate quick-session, physics-driven tactical flicking.
- **Key Value**: Delivers visceral, tactile arcade satisfaction with zero dead space, rich micro-animations, and immediate replayability.

---

### 2. User Experience & Visual Design

#### Color Palette & Visual Identity
- **Canvas Base**: Deep midnight navy (`#101522`) for immersive contrast.
- **Structural Surfaces**: Warm paper cream (`#F5E8CC`) and aged desk wood grains (`#2A1E17`, `#5A3D28`).
- **High-Intent Accent**: Electric orange (`#FF7138`) reserved for primary action CTAs, launch power rings, and hit explosions.
- **Secondary Accents**: Cobalt blue (`#3568F5`) for player ink and active selections; Muted olive (`#A6AD75`) for secondary badges and stamina meters.

#### Layout Composition
- **Main Menu**: Asymmetric two-column hero layout.
  - *Left Column*: Bold condensed display title `"PEN ATTACK"`, eyebrow `"THE CLASSROOM ARCADE"`, brief gameplay hook, arcade score badges (*BEST SCORE*, *TOTAL WINS*), prominent electric-orange `"START GAME"` CTA, and secondary modal triggers (*HOW TO PLAY*, *LEADERBOARD*, *SETTINGS*).
  - *Right Column*: Floating interactive 3D/canvas stylized wooden desk board showcase with an illustrated pen hero, ruled paper lines, notebook margin doodles, and subtle idle tilt physics.
- **In-Game HUD**: Compact, non-intrusive arcade dashboard.
  - Top bar featuring floating score counter with tabular numbers, wave counter badge, and combo multiplier meter.
  - Bottom bar with quick pen switcher (Ballpoint / Gel / Highlighter), turn status indicator, and pause/restart shortcuts.
- **Game Board**: Floating classroom desk top with beveled wooden edges, pencil grooves, subtle ruler markings, and drop-off danger zones where defeated pens tumble into the navy void.

#### Interaction Design & Motion
- Drag-and-release slingshot aim with dynamic ink trail and length-scaled tension arrow.
- Satisfying collision impulse sparks, ink splatter particles, and screen shake on heavy impacts.
- Button press micro-translations (`active:translate-y-0.5`), smooth dialog overlays, and sound toggle for immediate auditory feedback.

---

### 3. Key Product Decisions & Trade-Offs

- **Physics Simulation (Custom 2D Rigid Body with Rotation)**:
  - *Decision*: Implement a specialized 2D vector physics model handling angular momentum, friction, restitution, and desk edge boundaries directly on the game canvas.
  - *Why*: Provides deterministic, zero-latency collisions without heavy external bundle bloat, ensuring 60 FPS performance on both mobile and desktop.
- **Web Audio API Synthesis**:
  - *Decision*: Generate procedural square-wave and noise bursts for flicks, wooden desk thuds, edge falls, and victory fanfares.
  - *Why*: Requires no external asset loading, eliminating broken network audio requests while guaranteeing authentic 8-bit retro responsiveness.
- **Responsive Viewport Handling**:
  - *Decision*: Maintain an automatic aspect-ratio scaling canvas container with touch and pointer event normalization.
  - *Why*: Seamlessly transitions between wide desktop dual-column displays and compact mobile screens with zero layout clipping.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      App Container                     │
│  (Theme Provider, Sound Engine, LocalStorage Stores)   │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        ┌──────▼──────┐            ┌──────▼──────┐
        │  Title Menu │            │ Active Game │
        │  (Arcade)   │            │   Canvas    │
        └──────┬──────┘            └──────┬──────┘
               │                          │
  ┌────────────┴────────────┐      ┌──────┴──────────────────┐
  │ - Hero Title & Eyebrow  │      │ - 2D Physics Engine     │
  │ - Floating Desk Board   │      │ - Arcade HUD (Wave/Pts) │
  │ - Arsenal Pen Selector  │      │ - Slingshot Aim Arrow   │
  │ - Modals (Help/Scores)  │      │ - Ink & Particle FX     │
  └─────────────────────────┘      └─────────────────────────┘
```

#### Core State Model
- `gameState`: `'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'`
- `selectedPenId`: `'ballpoint' | 'gel' | 'highlighter'`
- `score`, `wave`, `bestScore`, `totalWins`: Stored in `localStorage`
- `soundEnabled`: Toggle for Web Audio sound effects
- `penEntities`: Coordinates, velocity vectors, rotation angle, angular velocity, mass, friction, radius, and alive status on the desk.
