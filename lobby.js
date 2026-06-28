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

        const content = document.createElement('div');
        content.id = 'lobby-content';

        const title = document.createElement('div');
        title.id = 'lobby-title';
        title.textContent = 'UNDERCRAFTED';
        content.appendChild(title);

        const subtitle = document.createElement('div');
        subtitle.id = 'lobby-subtitle';
        subtitle.textContent = 'A Voxel Sandbox Game';
        content.appendChild(subtitle);

        const modePanel = document.createElement('div');
        modePanel.id = 'lobby-mode-panel';
        const modeLabel = document.createElement('div');
        modeLabel.className = 'mode-label';
        modeLabel.textContent = 'Game Mode:';
        modePanel.appendChild(modeLabel);

        const survivalBtn = createButton('Survival', () => this.setMode('survival'), 'half active');
        survivalBtn.id = 'mode-survival';
        const creativeBtn = createButton('Creative', () => this.setMode('creative'), 'half');
        creativeBtn.id = 'mode-creative';
        modePanel.appendChild(createButtonRow([survivalBtn, creativeBtn]));
        content.appendChild(modePanel);

        const seedPanel = document.createElement('div');
        seedPanel.id = 'lobby-seed-panel';
        const seedWrapper = document.createElement('div');
        seedWrapper.id = 'seed-input-wrapper';
        const seedLabel = document.createElement('label');
        seedLabel.textContent = 'Seed:';
        seedLabel.setAttribute('for', 'seed-input');
        seedWrapper.appendChild(seedLabel);
        const seedInput = document.createElement('input');
        seedInput.id = 'seed-input';
        seedInput.type = 'text';
        seedInput.placeholder = 'Random';
        seedInput.addEventListener('input', (e) => {
            this.seed = e.target.value;
        });
        seedWrapper.appendChild(seedInput);
        const randomBtn = createButton('\u21BB', () => this.randomizeSeed(), 'small');
        randomBtn.id = 'seed-random-btn';
        seedWrapper.appendChild(randomBtn);
        seedPanel.appendChild(seedWrapper);
        content.appendChild(seedPanel);

        const menuButtons = document.createElement('div');
        menuButtons.id = 'lobby-menu-buttons';
        const playBtn = createButton('Singleplayer', () => this.startGame(), '');
        menuButtons.appendChild(playBtn);
        const settingsBtn = createButton('Settings...', () => { if (this.onSettings) this.onSettings(); }, '');
        menuButtons.appendChild(settingsBtn);
        content.appendChild(menuButtons);

        screen.appendChild(content);

        const version = document.createElement('div');
        version.id = 'lobby-version';
        version.textContent = 'Undercrafted v0.2';
        screen.appendChild(version);

        const copyright = document.createElement('div');
        copyright.id = 'lobby-copyright';
        copyright.textContent = '\u00A9 MicroPixelX';
        screen.appendChild(copyright);

        const hint = document.createElement('div');
        hint.id = 'lobby-panorama-hint';
        hint.textContent = 'World rotates in background';
        screen.appendChild(hint);

        this.screen = screen;
        this.modeButtons = { survival: survivalBtn, creative: creativeBtn };
        document.body.appendChild(screen);
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
        document.getElementById('seed-input').value = seed;
        this.seed = seed;
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
        this.scene.fog = new THREE.Fog(0x87ceeb, 10, 60);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.set(0, 30, 0);

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

            this.rotationAngle += 0.001;
            const radius = 0;
            const camX = Math.sin(this.rotationAngle) * radius;
            const camZ = Math.cos(this.rotationAngle) * radius;

            this.camera.position.x = camX;
            this.camera.position.z = camZ;
            this.camera.position.y = 32 + Math.sin(this.rotationAngle * 0.3) * 2;

            this.camera.rotation.y = this.rotationAngle;
            this.camera.rotation.x = -0.25 + Math.sin(this.rotationAngle * 0.5) * 0.05;

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

    destroy() {
        this.active = false;
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
