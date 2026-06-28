const ATLAS_SIZE = 16;
const ATLAS_COLS = 4;
const ATLAS_ROWS = 4;
const ATLAS_PX = ATLAS_SIZE * ATLAS_COLS;

const TextureType = {
    GRASS_TOP: 0,
    GRASS_SIDE: 1,
    DIRT: 2,
    STONE: 3,
    WOOD_SIDE: 4,
    WOOD_TOP: 5,
    LEAVES: 6,
    SAND: 7,
    BEDROCK: 8,
    SNOW_TOP: 9,
    SNOW_SIDE: 10,
    WATER: 11,
};

const BlockFaceTextures = {
    [BlockType.GRASS]:   { top: TextureType.GRASS_TOP,  side: TextureType.GRASS_SIDE, bottom: TextureType.DIRT },
    [BlockType.DIRT]:    { top: TextureType.DIRT,       side: TextureType.DIRT,       bottom: TextureType.DIRT },
    [BlockType.STONE]:   { top: TextureType.STONE,      side: TextureType.STONE,      bottom: TextureType.STONE },
    [BlockType.WOOD]:    { top: TextureType.WOOD_TOP,   side: TextureType.WOOD_SIDE,  bottom: TextureType.WOOD_TOP },
    [BlockType.LEAVES]:  { top: TextureType.LEAVES,     side: TextureType.LEAVES,     bottom: TextureType.LEAVES },
    [BlockType.SAND]:    { top: TextureType.SAND,       side: TextureType.SAND,       bottom: TextureType.SAND },
    [BlockType.WATER]:   { top: TextureType.WATER,      side: TextureType.WATER,      bottom: TextureType.WATER },
    [BlockType.BEDROCK]: { top: TextureType.BEDROCK,    side: TextureType.BEDROCK,    bottom: TextureType.BEDROCK },
    [BlockType.SNOW]:    { top: TextureType.SNOW_TOP,   side: TextureType.SNOW_SIDE,  bottom: TextureType.DIRT },
};

function getAtlasUV(texType) {
    const col = texType % ATLAS_COLS;
    const row = Math.floor(texType / ATLAS_COLS);
    const u0 = col / ATLAS_COLS;
    const v0 = 1 - (row + 1) / ATLAS_ROWS;
    const u1 = (col + 1) / ATLAS_COLS;
    const v1 = 1 - row / ATLAS_ROWS;
    return { u0, v0, u1, v1 };
}

function drawPixel(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function lerpHex(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex) {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return `rgb(${r},${g},${b})`;
}

function createTextureAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_PX;
    canvas.height = ATLAS_PX;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    function drawAt(slot, drawFn) {
        const col = slot % ATLAS_COLS;
        const row = Math.floor(slot / ATLAS_COLS);
        const ox = col * ATLAS_SIZE;
        const oy = row * ATLAS_SIZE;
        drawFn(ctx, ox, oy);
    }

    function noiseColor(base, variance, rng) {
        const shift = Math.floor((rng || Math.random)() * variance * 2) - variance;
        const r = Math.max(0, Math.min(255, ((base >> 16) & 0xff) + shift));
        const g = Math.max(0, Math.min(255, ((base >> 8) & 0xff) + shift));
        const b = Math.max(0, Math.min(255, (base & 0xff) + shift));
        return `rgb(${r},${g},${b})`;
    }

    function seededRandom(seed) {
        let s = seed;
        return function() {
            s = (s * 16807 + 0) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    // GRASS TOP
    drawAt(TextureType.GRASS_TOP, (ctx, ox, oy) => {
        const rng = seededRandom(111);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const v = Math.floor(rng() * 30) - 15;
                const base = rng() > 0.7 ? 0x5ba35b : 0x4a934a;
                drawPixel(ctx, ox + x, oy + y, noiseColor(base, 15, rng));
            }
        }
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x3d7a3d, 10, rng));
        }
    });

    // GRASS SIDE
    drawAt(TextureType.GRASS_SIDE, (ctx, ox, oy) => {
        const rng = seededRandom(222);
        // Grass strip top 4px
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0x5ba35b, 18, rng));
                if (rng() > 0.6 && y < 2) {
                    drawPixel(ctx, ox + x, oy + y + 1, noiseColor(0x6bb86b, 12, rng));
                }
            }
        }
        // Transition
        for (let x = 0; x < 16; x++) {
            const depth = Math.floor(rng() * 2) + 3;
            for (let y = 4; y < 4 + depth && y < 16; y++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0x5b8b3b, 14, rng));
            }
        }
        // Dirt
        for (let y = 5; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0x8b6b3e, 16, rng));
            }
        }
        for (let i = 0; i < 6; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 10) + 6;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x6b4b2e, 8, rng));
        }
    });

    // DIRT
    drawAt(TextureType.DIRT, (ctx, ox, oy) => {
        const rng = seededRandom(333);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0x8b6b3e, 18, rng));
            }
        }
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x6b4b2e, 10, rng));
        }
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(rng() * 13) + 1;
            const y = Math.floor(rng() * 13) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0xa08050, 10, rng));
        }
    });

    // STONE
    drawAt(TextureType.STONE, (ctx, ox, oy) => {
        const rng = seededRandom(444);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0x888888, 22, rng));
            }
        }
        // Cracks
        for (let i = 0; i < 4; i++) {
            const sx = Math.floor(rng() * 12) + 2;
            const sy = Math.floor(rng() * 12) + 2;
            const len = Math.floor(rng() * 4) + 2;
            const dir = rng() > 0.5;
            for (let j = 0; j < len; j++) {
                const px = dir ? sx + j : sx;
                const py = dir ? sy : sy + j;
                if (px < 16 && py < 16) drawPixel(ctx, ox + px, oy + py, noiseColor(0x666666, 10, rng));
            }
        }
        // Highlights
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0xaaaaaa, 10, rng));
        }
    });

    // WOOD SIDE (bark)
    drawAt(TextureType.WOOD_SIDE, (ctx, ox, oy) => {
        const rng = seededRandom(555);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const stripe = (y % 3 === 0) ? 0x5b3216 : 0x6b4226;
                drawPixel(ctx, ox + x, oy + y, noiseColor(stripe, 14, rng));
            }
        }
        // Vertical cracks
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(rng() * 12) + 2;
            for (let y = 0; y < 16; y++) {
                if (rng() > 0.3) drawPixel(ctx, ox + x, oy + y, noiseColor(0x4b2210, 8, rng));
            }
        }
    });

    // WOOD TOP (end grain / rings)
    drawAt(TextureType.WOOD_TOP, (ctx, ox, oy) => {
        const rng = seededRandom(666);
        const cx = 7.5, cy = 7.5;
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
                const ring = Math.floor(dist) % 3;
                const color = ring === 0 ? 0x8b6b3e : ring === 1 ? 0x6b4226 : 0x5b3216;
                drawPixel(ctx, ox + x, oy + y, noiseColor(color, 12, rng));
            }
        }
        // Center dot
        drawPixel(ctx, ox + 7, oy + 7, noiseColor(0x4b2210, 8, rng));
        drawPixel(ctx, ox + 8, oy + 7, noiseColor(0x4b2210, 8, rng));
        drawPixel(ctx, ox + 7, oy + 8, noiseColor(0x4b2210, 8, rng));
        drawPixel(ctx, ox + 8, oy + 8, noiseColor(0x4b2210, 8, rng));
    });

    // LEAVES
    drawAt(TextureType.LEAVES, (ctx, ox, oy) => {
        const rng = seededRandom(777);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const base = rng() > 0.3 ? 0x2d7a2d : 0x3d8a3d;
                drawPixel(ctx, ox + x, oy + y, noiseColor(base, 22, rng));
            }
        }
        // Dark spots
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x1d5a1d, 12, rng));
        }
        // Light spots
        for (let i = 0; i < 4; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x4d9a4d, 12, rng));
        }
    });

    // SAND
    drawAt(TextureType.SAND, (ctx, ox, oy) => {
        const rng = seededRandom(888);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0xd4bc6a, 16, rng));
            }
        }
        for (let i = 0; i < 6; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0xc4ac5a, 10, rng));
        }
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0xe4cc7a, 10, rng));
        }
    });

    // BEDROCK
    drawAt(TextureType.BEDROCK, (ctx, ox, oy) => {
        const rng = seededRandom(999);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const base = rng() > 0.5 ? 0x333333 : 0x2a2a2a;
                drawPixel(ctx, ox + x, oy + y, noiseColor(base, 18, rng));
            }
        }
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x1a1a1a, 8, rng));
        }
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x444444, 8, rng));
        }
    });

    // SNOW TOP
    drawAt(TextureType.SNOW_TOP, (ctx, ox, oy) => {
        const rng = seededRandom(1010);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0xf0f0ff, 10, rng));
            }
        }
        for (let i = 0; i < 4; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0xd8d8ee, 8, rng));
        }
    });

    // SNOW SIDE (snow on top, stone/dirt below)
    drawAt(TextureType.SNOW_SIDE, (ctx, ox, oy) => {
        const rng = seededRandom(1111);
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0xf0f0ff, 10, rng));
            }
        }
        for (let x = 0; x < 16; x++) {
            const depth = Math.floor(rng() * 2) + 2;
            for (let y = 3; y < 3 + depth && y < 16; y++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0xdddde8, 12, rng));
            }
        }
        for (let y = 5; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                drawPixel(ctx, ox + x, oy + y, noiseColor(0x8b6b3e, 16, rng));
            }
        }
    });

    // WATER
    drawAt(TextureType.WATER, (ctx, ox, oy) => {
        const rng = seededRandom(1212);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const wave = Math.sin(x * 0.8 + y * 0.4) * 20;
                const base = 0x3366cc;
                const r = Math.max(0, Math.min(255, ((base >> 16) & 0xff) + Math.floor(wave)));
                const g = Math.max(0, Math.min(255, ((base >> 8) & 0xff) + Math.floor(wave * 0.5)));
                const b = Math.max(0, Math.min(255, (base & 0xff) + Math.floor(wave * 0.3)));
                drawPixel(ctx, ox + x, oy + y, `rgb(${r},${g},${b})`);
            }
        }
        for (let i = 0; i < 4; i++) {
            const x = Math.floor(rng() * 14) + 1;
            const y = Math.floor(rng() * 14) + 1;
            drawPixel(ctx, ox + x, oy + y, noiseColor(0x4477dd, 12, rng));
        }
    });

    return canvas;
}

function createBlockTexture() {
    const atlasCanvas = createTextureAtlas();
    const texture = new THREE.CanvasTexture(atlasCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

function createBlockMaterial(texture) {
    return new THREE.MeshLambertMaterial({ map: texture });
}

function createWaterMaterial(texture) {
    return new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        opacity: 0.6,
    });
}

function createLeavesMaterial(texture) {
    return new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        opacity: 0.85,
    });
}

let _cachedAtlasCanvas = null;

function getCachedAtlasCanvas() {
    if (!_cachedAtlasCanvas) {
        _cachedAtlasCanvas = createTextureAtlas();
    }
    return _cachedAtlasCanvas;
}

function resetTextureCache() {
    _cachedAtlasCanvas = null;
}

function getHotbarIconDataURL(blockType) {
    const faceTex = BlockFaceTextures[blockType];
    if (!faceTex) return null;
    const texType = faceTex.top !== undefined ? faceTex.top : faceTex.side;
    const col = texType % ATLAS_COLS;
    const row = Math.floor(texType / ATLAS_COLS);
    const atlasCanvas = getCachedAtlasCanvas();
    const iconCanvas = document.createElement('canvas');
    iconCanvas.width = ATLAS_SIZE;
    iconCanvas.height = ATLAS_SIZE;
    const iconCtx = iconCanvas.getContext('2d');
    iconCtx.imageSmoothingEnabled = false;
    iconCtx.drawImage(
        atlasCanvas,
        col * ATLAS_SIZE, row * ATLAS_SIZE, ATLAS_SIZE, ATLAS_SIZE,
        0, 0, ATLAS_SIZE, ATLAS_SIZE
    );
    return iconCanvas.toDataURL();
}
