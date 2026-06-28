const SPLASHES = [
    'Also try Minecraft!',
    'Voxels inside!',
    'Now with trees!',
    '100% JavaScript!',
    'Place blocks!',
    'Break blocks too!',
    'Infinite worlds!',
    'Day and night!',
    'Try Creative mode!',
    'Now with gravity!',
    'Open source!',
    'Crafting not included!',
    'Block by block!',
    'Mouse not included!',
    'Water resistant!',
    'Pixel perfect!',
    'Needs more cowbell!',
    'JEB_!',
    'As seen on TV!',
    'Limited edition!',
    'Touch friendly!',
    'Now with chunks!',
    'Semantically correct!',
    'No creepers here!',
    'Totally not a clone!',
    'Diggy diggy hole!',
    'Blocky business!',
    'Y2K compliant!',
    '8-bit approved!',
    'Insert coin!',
];

class Lobby {
    constructor(onPlay, onSettings) {
        this.onPlay = onPlay;
        this.onSettings = onSettings;
        this.seed = '';
        this.mode = 'survival';
        this.active = true;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.rotationAngle = 0;
        this.lobbyWorld = null;
        this.noise = null;
        this.ambientLight = null;
        this.sunLight = null;
        this.hemiLight = null;
        this.animFrame = null;
        this.splashIndex = Math.floor(Math.random() * SPLASHES.length);
        this.showingWorldSelect = false;

        this.buildDOM();
        this.initPanorama();
        this.animatePanorama();
    }

    buildDOM() {
        const screen = document.createElement('div');
        screen.id = 'lobby-screen';

        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'lobby-canvas-container';
        screen.appendChild(canvasContainer);

        const vignette = document.createElement('div');
        vignette.id = 'lobby-vignette';
        screen.appendChild(vignette);

        const overlay = document.createElement('div');
        overlay.id = 'lobby-overlay';
        screen.appendChild(overlay);

        const logoArea = document.createElement('div');
        logoArea.id = 'lobby-logo-area';

        const title = document.createElement('div');
        title.id = 'lobby-title';
        title.textContent = 'UNDERCRAFTED';
        logoArea.appendChild(title);

        const splash = document.createElement('div');
        splash.id = 'lobby-splash';
        splash.textContent = SPLASHES[this.splashIndex];
        logoArea.appendChild(splash);

        screen.appendChild(logoArea);

        const mainMenu = document.createElement('div');
        mainMenu.id = 'lobby-main-menu';

        const playBtn = createButton('Singleplayer', () => this.showWorldSelect(), 'large');
        mainMenu.appendChild(playBtn);

        const bottomRow = document.createElement('div');
        bottomRow.className = 'mc-btn-row';
        const settingsBtn = createButton('Settings...', () => {
            if (this.onSettings) this.onSettings();
        }, 'half');
        bottomRow.appendChild(settingsBtn);
        bottomRow.appendChild(createButton('', () => {}, 'half invisible'));
        mainMenu.appendChild(bottomRow);

        screen.appendChild(mainMenu);

        const worldSelect = document.createElement('div');
        worldSelect.id = 'lobby-world-select';

        const worldListPanel = document.createElement('div');
        worldListPanel.id = 'lobby-world-list-panel';

        const worldList = document.createElement('div');
        worldList.id = 'lobby-world-list';

        const emptyMsg = document.createElement('div');
        emptyMsg.id = 'lobby-world-empty';
        emptyMsg.textContent = 'No worlds yet. Create one below!';
        worldList.appendChild(emptyMsg);

        worldListPanel.appendChild(worldList);
        worldSelect.appendChild(worldListPanel);

        const createPanel = document.createElement('div');
        createPanel.id = 'lobby-create-panel';

        const seedRow = document.createElement('div');
        seedRow.id = 'lobby-seed-row';

        const seedLabel = document.createElement('span');
        seedLabel.id = 'lobby-seed-label';
        seedLabel.textContent = 'Seed:';
        seedRow.appendChild(seedLabel);

        const seedInput = document.createElement('input');
        seedInput.id = 'lobby-seed-input';
        seedInput.type = 'text';
        seedInput.placeholder = 'Leave empty for random';
        seedInput.addEventListener('input', (e) => {
            this.seed = e.target.value;
        });
        seedRow.appendChild(seedInput);

        const randomBtn = createButton('\u21BB', () => this.randomizeSeed(), 'small');
        randomBtn.id = 'lobby-seed-random';
        seedRow.appendChild(randomBtn);

        createPanel.appendChild(seedRow);

        const modeRow = document.createElement('div');
        modeRow.id = 'lobby-mode-row';
        const modeLabel = document.createElement('span');
        modeLabel.id = 'lobby-mode-label';
        modeLabel.textContent = 'Game Mode:';
        modeRow.appendChild(modeLabel);
        const modeRowButtons = document.createElement('div');
        modeRowButtons.className = 'mc-btn-row';
        const survivalBtn = createButton('Survival', () => this.setMode('survival'), 'half active');
        survivalBtn.id = 'mode-survival';
        const creativeBtn = createButton('Creative', () => this.setMode('creative'), 'half');
        creativeBtn.id = 'mode-creative';
        modeRowButtons.appendChild(survivalBtn);
        modeRowButtons.appendChild(creativeBtn);
        modeRow.appendChild(modeRowButtons);
        createPanel.appendChild(modeRow);

        worldSelect.appendChild(createPanel);

        const worldButtonsRow = document.createElement('div');
        worldButtonsRow.id = 'lobby-world-buttons';

        const createWorldBtn = createButton('Create New World', () => this.startGame(), 'large');
        worldButtonsRow.appendChild(createWorldBtn);

        const cancelRow = document.createElement('div');
        cancelRow.className = 'mc-btn-row';
        const cancelBtn = createButton('Cancel', () => this.hideWorldSelect(), 'half');
        cancelRow.appendChild(cancelBtn);
        cancelRow.appendChild(createButton('', () => {}, 'half invisible'));
        worldButtonsRow.appendChild(cancelRow);

        worldSelect.appendChild(worldButtonsRow);

        screen.appendChild(worldSelect);

        const dirtBanner = document.createElement('div');
        dirtBanner.id = 'lobby-dirt-banner';
        screen.appendChild(dirtBanner);

        const version = document.createElement('div');
        version.id = 'lobby-version';
        version.textContent = 'Undercrafted v0.2';
        screen.appendChild(version);

        const copyright = document.createElement('div');
        copyright.id = 'lobby-copyright';
        copyright.textContent = '\u00A9 MicroPixelX';
        screen.appendChild(copyright);

        this.screen = screen;
        this.splashEl = splash;
        this.mainMenu = mainMenu;
        this.worldSelect = worldSelect;
        this.modeButtons = { survival: survivalBtn, creative: creativeBtn };
        document.body.appendChild(screen);

        this._splashInterval = setInterval(() => {
            this.splashIndex = (this.splashIndex + 1) % SPLASHES.length;
            if (this.splashEl) {
                this.splashEl.style.opacity = '0';
                this.splashEl.style.transform = 'rotate(-15deg) scale(0.8)';
                setTimeout(() => {
                    if (this.splashEl) {
                        this.splashEl.textContent = SPLASHES[this.splashIndex];
                        this.splashEl.style.opacity = '1';
                        this.splashEl.style.transform = 'rotate(-15deg) scale(1.2)';
                        setTimeout(() => {
                            if (this.splashEl) {
                                this.splashEl.style.transform = 'rotate(-15deg) scale(1)';
                            }
                        }, 150);
                    }
                }, 200);
            }
        }, 5000);
    }

    showWorldSelect() {
        this.showingWorldSelect = true;
        this.mainMenu.style.display = 'none';
        this.worldSelect.style.display = 'flex';
    }

    hideWorldSelect() {
        this.showingWorldSelect = false;
        this.mainMenu.style.display = 'flex';
        this.worldSelect.style.display = 'none';
    }

    setMode(mode) {
        this.mode = mode;
        this.modeButtons.survival.classList.toggle('active', mode === 'survival');
        this.modeButtons.creative.classList.toggle('active', mode === 'creative');
    }

    randomizeSeed() {
        let seed = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 12; i++) {
            seed += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const input = document.getElementById('lobby-seed-input');
        if (input) input.value = seed;
        this.seed = seed;
    }

    startGame() {
        const seedValue = this.getSeedValue();
        this.destroy();
        if (this.onPlay) {
            this.onPlay({
                seed: seedValue,
                mode: this.mode,
            });
        }
    }

    getSeedValue() {
        if (!this.seed || this.seed.trim() === '') {
            return Math.floor(Math.random() * 65536);
        }
        const trimmed = this.seed.trim();
        if (!isNaN(trimmed) && trimmed.length > 0) {
            return parseInt(trimmed);
        }
        let hash = 0;
        for (let i = 0; i < trimmed.length; i++) {
            const char = trimmed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    initPanorama() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.set(0, 28, 25);

        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const container = document.getElementById('lobby-canvas-container');
        container.appendChild(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0x666666, 0.7);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfff5e0, 0.9);
        this.sunLight.position.set(40, 80, 20);
        this.scene.add(this.sunLight);

        this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b6b3e, 0.35);
        this.scene.add(this.hemiLight);

        this.noise = new SimplexNoise(42);
        this.lobbyWorld = new World(this.scene);
        this.lobbyWorld.noise = this.noise;
        this.lobbyWorld.updateChunks(0, 0);
    }

    animatePanorama() {
        const animate = () => {
            if (!this.active) return;
            this.animFrame = requestAnimationFrame(animate);

            this.rotationAngle += 0.0015;

            const radius = 25;
            const camX = Math.sin(this.rotationAngle) * radius;
            const camZ = Math.cos(this.rotationAngle) * radius;

            this.camera.position.x = camX;
            this.camera.position.z = camZ;
            this.camera.position.y = 30 + Math.sin(this.rotationAngle * 0.3) * 4;

            this.camera.lookAt(0, 22, 0);

            this.sunLight.position.x = 40 * Math.cos(this.rotationAngle * 0.2);
            this.sunLight.position.z = 40 * Math.sin(this.rotationAngle * 0.2);

            this.renderer.render(this.scene, this.camera);
        };
        animate();

        this._resizeHandler = () => {
            if (!this.renderer) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', this._resizeHandler);
    }

    destroy() {
        this.active = false;
        if (this._splashInterval) {
            clearInterval(this._splashInterval);
            this._splashInterval = null;
        }
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
        if (this.screen && this.screen.parentNode) {
            this.screen.parentNode.removeChild(this.screen);
        }
    }
}
