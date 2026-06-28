# Undercrafted

A voxel sandbox game built with Three.js. Build, explore and don't die!

## How to Play

Open `index.html` in a modern web browser.

### Main Menu

- **Seed input** - Enter a seed or leave blank for random
- **Game mode** - Choose Survival or Creative
- **Settings** - Adjust render distance, FOV, sensitivity, and more

### Controls

| Key | Action |
|-----|--------|
| **WASD** | Move |
| **Space** | Jump / Fly up (Creative) |
| **Shift** | Fly down (Creative) |
| **F** | Toggle fly mode (Creative) |
| **Mouse** | Look around |
| **Left Click** | Break block |
| **Right Click** | Place block |
| **1-6** | Select block type |
| **Scroll** | Cycle block types |
| **ESC** | Pause menu |

### Block Types

1. Grass
2. Dirt
3. Stone
4. Wood
5. Leaves
6. Sand

## Features

- Minecraft-style main menu with rotating world background
- Seed-based world generation with history
- Survival and Creative game modes
- Day/night cycle with sun, moon, and stars
- Procedural terrain generation with Simplex noise
- Chunk-based world with dynamic loading
- First-person movement with collision detection
- Block placing and breaking
- Trees, mountains, snow biomes, and beaches
- Fog and atmospheric lighting
- Settings panel with persistent localStorage
- Pause menu with resume, settings, and quit to title
- HUD with crosshair, hotbar, FPS, position, and time display

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Entry point, loads all scripts/styles |
| `style.css` | Base styles |
| `buttons.css` / `buttons.js` | Minecraft-style button components |
| `lobby.css` / `lobby.js` | Main menu with rotating world panorama |
| `settings.css` / `settings.js` | Settings panel (render dist, FOV, audio) |
| `seed.js` | Seed parsing, hashing, and history |
| `modes.js` | Game mode selector (Survival/Creative) |
| `pause.css` / `pause.js` | Pause menu overlay |
| `hud.css` / `hud.js` | In-game HUD (crosshair, hotbar, debug) |
| `world.js` | World generation, chunks, Simplex noise, raycast |
| `daynight.js` | Day/night cycle, sun/moon/stars |
| `player.js` | Player movement, collision, flying, controls |
| `game.js` | Main game loop and state management |

## Tech

- [Three.js](https://threejs.org/) r128 for 3D rendering
- Simplex noise for terrain generation
- Face-culled chunk mesh building
- localStorage for settings persistence
- Pure JavaScript, no build tools required
