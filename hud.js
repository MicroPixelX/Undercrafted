class HUD {
    constructor() {
        this.container = null;
        this.blockTypes = [
            { type: BlockType.GRASS, name: 'grass' },
            { type: BlockType.DIRT, name: 'dirt' },
            { type: BlockType.STONE, name: 'stone' },
            { type: BlockType.WOOD, name: 'wood' },
            { type: BlockType.LEAVES, name: 'leaves' },
            { type: BlockType.SAND, name: 'sand' },
        ];
        this.els = {};
        this.build();
    }

    build() {
        const container = document.createElement('div');
        container.id = 'hud-container';

        const crosshair = document.createElement('div');
        crosshair.id = 'hud-crosshair';
        container.appendChild(crosshair);

        const hotbar = document.createElement('div');
        hotbar.id = 'hud-hotbar';
        this.slotEls = [];
        this.blockTypes.forEach((bt, i) => {
            const slot = document.createElement('div');
            slot.className = `hud-slot ${i === 0 ? 'selected' : ''}`;
            const num = document.createElement('span');
            num.className = 'hud-slot-num';
            num.textContent = i + 1;
            slot.appendChild(num);
            const icon = document.createElement('span');
            icon.className = 'hud-block-icon';
            const dataURL = getHotbarIconDataURL(bt.type);
            if (dataURL) {
                icon.style.backgroundImage = `url(${dataURL})`;
                icon.style.backgroundSize = 'cover';
                icon.style.imageRendering = 'pixelated';
            }
            slot.appendChild(icon);
            hotbar.appendChild(slot);
            this.slotEls.push(slot);
        });
        container.appendChild(hotbar);

        const debug = document.createElement('div');
        debug.id = 'hud-debug';
        const fps = document.createElement('span');
        fps.id = 'hud-fps';
        fps.textContent = 'FPS: 0';
        debug.appendChild(fps);
        const pos = document.createElement('span');
        pos.id = 'hud-pos';
        pos.textContent = 'Pos: 0, 0, 0';
        debug.appendChild(pos);
        const time = document.createElement('span');
        time.id = 'hud-time';
        time.className = 'time-display-hud';
        time.textContent = 'Time: 00:00 (Day)';
        debug.appendChild(time);
        container.appendChild(debug);

        const modeIndicator = document.createElement('div');
        modeIndicator.id = 'hud-mode-indicator';
        modeIndicator.textContent = 'Survival';
        container.appendChild(modeIndicator);

        const seedDisplay = document.createElement('div');
        seedDisplay.id = 'hud-seed-display';
        seedDisplay.textContent = 'Seed: 42';
        container.appendChild(seedDisplay);

        this.container = container;
        this.els.fps = fps;
        this.els.pos = pos;
        this.els.time = time;
        this.els.mode = modeIndicator;
        this.els.seed = seedDisplay;
    }

    show() {
        if (this.container && !this.container.parentNode) {
            document.body.appendChild(this.container);
        }
    }

    hide() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    updateSelectedSlot(index) {
        this.slotEls.forEach((el, i) => {
            el.classList.toggle('selected', i === index);
        });
    }

    updateFPS(fps) {
        if (this.els.fps) this.els.fps.textContent = `FPS: ${fps}`;
    }

    updatePosition(x, y, z) {
        if (this.els.pos) this.els.pos.textContent = `Pos: ${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)}`;
    }

    updateTime(text) {
        if (this.els.time) this.els.time.textContent = text;
    }

    updateMode(mode) {
        if (this.els.mode) this.els.mode.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }

    updateSeed(seed) {
        if (this.els.seed) this.els.seed.textContent = `Seed: ${seed}`;
    }

    updateHotbar(inventory) {
        this.blockTypes = inventory.map((bt, i) => {
            const existing = this.blockTypes.find(b => b.type === bt);
            if (existing) return existing;
            const newItem = { type: bt, name: 'unknown' };
            if (this.slotEls[i]) {
                const icon = this.slotEls[i].querySelector('.hud-block-icon');
                if (icon) {
                    const dataURL = getHotbarIconDataURL(bt);
                    if (dataURL) {
                        icon.style.backgroundImage = `url(${dataURL})`;
                        icon.style.backgroundSize = 'cover';
                        icon.style.imageRendering = 'pixelated';
                    }
                }
            }
            return newItem;
        });
    }
}
