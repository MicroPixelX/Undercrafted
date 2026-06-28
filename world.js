const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 64;
const RENDER_DISTANCE = 4;
const WATER_LEVEL = 20;
const SEA_LEVEL = 22;

const BlockType = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    SAND: 6,
    WATER: 7,
    BEDROCK: 8,
    SNOW: 9,
};

const BlockColors = {
    [BlockType.GRASS]:   { top: 0x5ba35b, side: 0x6b8c42, bottom: 0x8b6b3e },
    [BlockType.DIRT]:    { top: 0x8b6b3e, side: 0x8b6b3e, bottom: 0x8b6b3e },
    [BlockType.STONE]:   { top: 0x888888, side: 0x808080, bottom: 0x787878 },
    [BlockType.WOOD]:    { top: 0x8b6b3e, side: 0x6b4226, bottom: 0x8b6b3e },
    [BlockType.LEAVES]:  { top: 0x2d7a2d, side: 0x2d6d2d, bottom: 0x256d25 },
    [BlockType.SAND]:    { top: 0xd4bc6a, side: 0xc4ac5a, bottom: 0xb49c4a },
    [BlockType.WATER]:   { top: 0x3366cc, side: 0x2255bb, bottom: 0x1144aa },
    [BlockType.BEDROCK]: { top: 0x333333, side: 0x2a2a2a, bottom: 0x222222 },
    [BlockType.SNOW]:    { top: 0xf0f0ff, side: 0xdddde8, bottom: 0xccccdd },
};

class SimplexNoise {
    constructor(seed = Math.random() * 65536) {
        this.seed = seed;
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807 + 0) % 2147483647;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }

    noise2D(x, y) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; }
        else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255;
        const jj = j & 255;
        const grad = (hash, gx, gy) => {
            const h = hash & 7;
            const u = h < 4 ? gx : gy;
            const v = h < 4 ? gy : gx;
            return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
        };
        let n0 = 0, n1 = 0, n2 = 0;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            t0 *= t0;
            n0 = t0 * t0 * grad(this.perm[ii + this.perm[jj]], x0, y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            t1 *= t1;
            n1 = t1 * t1 * grad(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            t2 *= t2;
            n2 = t2 * t2 * grad(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2);
        }
        return 70.0 * (n0 + n1 + n2);
    }

    octave2D(x, y, octaves, persistence, lacunarity) {
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return total / maxValue;
    }
}

class Chunk {
    constructor(cx, cz, world) {
        this.cx = cx;
        this.cz = cz;
        this.world = world;
        this.blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
        this.mesh = null;
        this.dirty = true;
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return BlockType.AIR;
        return this.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
    }

    setBlock(x, y, z, type) {
        if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return;
        this.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE] = type;
        this.dirty = true;
    }

    generate(noise) {
        const wx = this.cx * CHUNK_SIZE;
        const wz = this.cz * CHUNK_SIZE;

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = wx + x;
                const worldZ = wz + z;

                const baseHeight = noise.octave2D(worldX * 0.005, worldZ * 0.005, 4, 0.5, 2.0);
                const mountainNoise = noise.octave2D(worldX * 0.002, worldZ * 0.002, 3, 0.5, 2.0);
                const detailNoise = noise.octave2D(worldX * 0.02, worldZ * 0.02, 2, 0.5, 2.0);

                let height = SEA_LEVEL + baseHeight * 12 + detailNoise * 2;

                if (mountainNoise > 0.3) {
                    height += (mountainNoise - 0.3) * 30;
                }

                height = Math.floor(height);
                height = Math.max(1, Math.min(WORLD_HEIGHT - 2, height));

                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    let blockType = BlockType.AIR;

                    if (y === 0) {
                        blockType = BlockType.BEDROCK;
                    } else if (y < height - 4) {
                        blockType = BlockType.STONE;
                    } else if (y < height - 1) {
                        if (height <= WATER_LEVEL + 2) {
                            blockType = BlockType.SAND;
                        } else {
                            blockType = BlockType.DIRT;
                        }
                    } else if (y === height - 1) {
                        if (height < WATER_LEVEL) {
                            blockType = BlockType.SAND;
                        } else if (height > 40) {
                            blockType = BlockType.SNOW;
                        } else {
                            blockType = BlockType.GRASS;
                        }
                    } else if (y < WATER_LEVEL && y >= height) {
                        blockType = BlockType.WATER;
                    }

                    this.setBlock(x, y, z, blockType);
                }
            }
        }

        this.generateTrees(noise, wx, wz);
        this.dirty = true;
    }

    generateTrees(noise, wx, wz) {
        for (let x = 2; x < CHUNK_SIZE - 2; x++) {
            for (let z = 2; z < CHUNK_SIZE - 2; z++) {
                const worldX = wx + x;
                const worldZ = wz + z;
                const treeNoise = noise.noise2D(worldX * 0.8, worldZ * 0.8);
                if (treeNoise > 0.75) {
                    let surfaceY = -1;
                    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
                        const b = this.getBlock(x, y, z);
                        if (b === BlockType.GRASS) {
                            surfaceY = y;
                            break;
                        }
                    }
                    if (surfaceY > WATER_LEVEL && surfaceY < 38) {
                        const treeHeight = 4 + Math.floor(Math.abs(noise.noise2D(worldX * 3.7, worldZ * 3.7)) * 3);
                        for (let ty = 1; ty <= treeHeight; ty++) {
                            this.setBlock(x, surfaceY + ty, z, BlockType.WOOD);
                        }
                        const leafStart = surfaceY + treeHeight - 2;
                        const leafEnd = surfaceY + treeHeight + 1;
                        for (let ly = leafStart; ly <= leafEnd; ly++) {
                            const radius = ly === leafEnd ? 1 : 2;
                            for (let lx = -radius; lx <= radius; lx++) {
                                for (let lz = -radius; lz <= radius; lz++) {
                                    if (lx === 0 && lz === 0 && ly < leafEnd) continue;
                                    if (Math.abs(lx) === radius && Math.abs(lz) === radius && Math.random() > 0.6) continue;
                                    const bx = x + lx;
                                    const bz = z + lz;
                                    if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE) {
                                        if (this.getBlock(bx, ly, bz) === BlockType.AIR) {
                                            this.setBlock(bx, ly, bz, BlockType.LEAVES);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.noise = new SimplexNoise(42);
        this.materialCache = {};
        this.createMaterials();
    }

    createMaterials() {
        for (const [type, colors] of Object.entries(BlockColors)) {
            const t = parseInt(type);
            if (t === BlockType.WATER) {
                this.materialCache[t] = new THREE.MeshLambertMaterial({
                    color: colors.top,
                    transparent: true,
                    opacity: 0.6,
                });
            } else if (t === BlockType.LEAVES) {
                this.materialCache[t] = new THREE.MeshLambertMaterial({
                    color: colors.top,
                    transparent: true,
                    opacity: 0.85,
                });
            } else {
                this.materialCache[t] = new THREE.MeshLambertMaterial({
                    color: colors.top,
                });
            }
        }
    }

    chunkKey(cx, cz) {
        return `${cx},${cz}`;
    }

    getChunkAt(cx, cz) {
        return this.chunks.get(this.chunkKey(cx, cz));
    }

    getBlock(wx, wy, wz) {
        if (wy < 0 || wy >= WORLD_HEIGHT) return BlockType.AIR;
        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const chunk = this.getChunkAt(cx, cz);
        if (!chunk) return BlockType.AIR;
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        return chunk.getBlock(lx, wy, lz);
    }

    setBlock(wx, wy, wz, type) {
        if (wy < 0 || wy >= WORLD_HEIGHT) return;
        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const chunk = this.getChunkAt(cx, cz);
        if (!chunk) return;
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        chunk.setBlock(lx, wy, lz, type);
        if (lx === 0) { const nc = this.getChunkAt(cx - 1, cz); if (nc) nc.dirty = true; }
        if (lx === CHUNK_SIZE - 1) { const nc = this.getChunkAt(cx + 1, cz); if (nc) nc.dirty = true; }
        if (lz === 0) { const nc = this.getChunkAt(cx, cz - 1); if (nc) nc.dirty = true; }
        if (lz === CHUNK_SIZE - 1) { const nc = this.getChunkAt(cx, cz + 1); if (nc) nc.dirty = true; }
    }

    isBlockSolid(wx, wy, wz) {
        const b = this.getBlock(wx, wy, wz);
        return b !== BlockType.AIR && b !== BlockType.WATER;
    }

    updateChunks(playerX, playerZ) {
        const pcx = Math.floor(playerX / CHUNK_SIZE);
        const pcz = Math.floor(playerZ / CHUNK_SIZE);

        const neededChunks = new Set();
        for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
            for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
                if (dx * dx + dz * dz > RENDER_DISTANCE * RENDER_DISTANCE) continue;
                const cx = pcx + dx;
                const cz = pcz + dz;
                const key = this.chunkKey(cx, cz);
                neededChunks.add(key);
                if (!this.chunks.has(key)) {
                    const chunk = new Chunk(cx, cz, this);
                    chunk.generate(this.noise);
                    this.chunks.set(key, chunk);
                }
            }
        }

        for (const [key, chunk] of this.chunks) {
            if (!neededChunks.has(key)) {
                if (chunk.mesh) {
                    this.scene.remove(chunk.mesh);
                    chunk.mesh.traverse(child => {
                        if (child.geometry) child.geometry.dispose();
                    });
                }
                this.chunks.delete(key);
            }
        }

        // Build chunks nearest to player first for faster visible area loading
        const sortedChunks = Array.from(this.chunks.values())
            .filter(c => c.dirty)
            .sort((a, b) => {
                const da = Math.hypot(a.cx - pcx, a.cz - pcz);
                const db = Math.hypot(b.cx - pcx, b.cz - pcz);
                return da - db;
            });
        for (let i = 0; i < sortedChunks.length && i < 6; i++) {
            this.buildChunkMesh(sortedChunks[i]);
            sortedChunks[i].dirty = false;
        }
    }

    buildChunkMesh(chunk) {
        const vertices = {};
        const indices = {};
        const normals = {};

        for (const type of Object.keys(BlockColors)) {
            vertices[type] = [];
            indices[type] = [];
            normals[type] = [];
        }

        const cx = chunk.cx * CHUNK_SIZE;
        const cz = chunk.cz * CHUNK_SIZE;

        const faces = [
            { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], normal: [0,1,0], colorKey: 'top' },
            { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], normal: [0,-1,0], colorKey: 'bottom' },
            { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], normal: [0,0,1], colorKey: 'side' },
            { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], normal: [0,0,-1], colorKey: 'side' },
            { dir: [1, 0, 0], corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], normal: [1,0,0], colorKey: 'side' },
            { dir: [-1, 0, 0], corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], normal: [-1,0,0], colorKey: 'side' },
        ];

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const block = chunk.getBlock(x, y, z);
                    if (block === BlockType.AIR || block === BlockType.WATER) continue;

                    for (const face of faces) {
                        const nx = x + face.dir[0];
                        const ny = y + face.dir[1];
                        const nz = z + face.dir[2];

                        let neighbor;
                        if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
                            neighbor = chunk.getBlock(nx, ny, nz);
                        } else {
                            neighbor = this.getBlock(cx + nx, ny, cz + nz);
                        }

                        if (neighbor !== BlockType.AIR && neighbor !== BlockType.WATER) continue;

                        const vList = vertices[block];
                        const iList = indices[block];
                        const nList = normals[block];
                        if (!vList) continue;

                        const idx = vList.length / 3;
                        for (const corner of face.corners) {
                            vList.push(x + corner[0] + cx, y + corner[1], z + corner[2] + cz);
                            nList.push(face.normal[0], face.normal[1], face.normal[2]);
                        }
                        iList.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
                    }
                }
            }
        }

        if (chunk.mesh) {
            this.scene.remove(chunk.mesh);
            chunk.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
            });
            chunk.mesh = null;
        }

        const group = new THREE.Group();

        for (const [type, v] of Object.entries(vertices)) {
            if (v.length === 0) continue;
            const t = parseInt(type);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals[type], 3));
            geometry.setIndex(indices[type]);

            const material = this.materialCache[t];
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
        }

        const waterVerts = [];
        const waterIndices = [];
        const waterNormals = [];
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    if (chunk.getBlock(x, y, z) === BlockType.WATER) {
                        if (y + 1 < WORLD_HEIGHT && chunk.getBlock(x, y + 1, z) === BlockType.AIR) {
                            const idx = waterVerts.length / 3;
                            waterVerts.push(x + cx, y + 0.85, z + cz);
                            waterVerts.push(x + 1 + cx, y + 0.85, z + cz);
                            waterVerts.push(x + 1 + cx, y + 0.85, z + 1 + cz);
                            waterVerts.push(x + cx, y + 0.85, z + 1 + cz);
                            waterNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
                            waterIndices.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
                        }
                    }
                }
            }
        }

        if (waterVerts.length > 0) {
            const waterGeometry = new THREE.BufferGeometry();
            waterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(waterVerts, 3));
            waterGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
            waterGeometry.setIndex(waterIndices);
            const waterMesh = new THREE.Mesh(waterGeometry, this.materialCache[BlockType.WATER]);
            group.add(waterMesh);
        }

        this.scene.add(group);
        chunk.mesh = group;
    }

    raycast(origin, direction, maxDist = 8) {
        const step = 0.05;
        let prevX, prevY, prevZ;

        for (let d = 0; d < maxDist; d += step) {
            const x = Math.floor(origin.x + direction.x * d);
            const y = Math.floor(origin.y + direction.y * d);
            const z = Math.floor(origin.z + direction.z * d);

            if (x !== prevX || y !== prevY || z !== prevZ) {
                const block = this.getBlock(x, y, z);
                if (block !== BlockType.AIR && block !== BlockType.WATER) {
                    return {
                        position: { x, y, z },
                        previous: { x: prevX, y: prevY, z: prevZ },
                        blockType: block,
                    };
                }
                prevX = x;
                prevY = y;
                prevZ = z;
            }
        }
        return null;
    }
}
