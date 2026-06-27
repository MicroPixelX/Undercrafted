# Undercrafted

A voxel sandbox game built with Three.js. Build, explore and don't die!

## How to Play

Open `index.html` in a modern web browser.

### Controls

| Key | Action |
|-----|--------|
| **WASD** | Move |
| **Space** | Jump |
| **Mouse** | Look around |
| **Left Click** | Break block |
| **Right Click** | Place block |
| **1-6** | Select block type |
| **Scroll** | Cycle block types |

### Block Types

1. Grass
2. Dirt
3. Stone
4. Wood
5. Leaves
6. Sand

## Features

- Procedural terrain generation with Simplex noise
- Chunk-based world with dynamic loading
- First-person movement with collision detection
- Block placing and breaking
- Trees, mountains, snow biomes, and beaches
- Fog and atmospheric lighting
- Hotbar UI with block selection

## Tech

- [Three.js](https://threejs.org/) r128 for 3D rendering
- Simplex noise for terrain generation
- Greedy face-culling for chunk mesh building
- Pure JavaScript, no build tools required
