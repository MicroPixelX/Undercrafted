class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.dayNight = null;
        this.hud = null;
        this.prevTime = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        this.gameStarted = false;
        this.gamePaused = false;
        this.pauseMenu = null;
        this.modeSelector = null;
        this.seedManager = null;
        this.animFrameId = null;
        this.blocker = null;
        this.lobby = null;

        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onResize = this._onResize.bind(this);
        this._onWebGLContextLost = this._onWebGLContextLost.bind(this);
        this._onWebGLContextRestored = this._onWebGLContextRestored.bind(this);
    }

    startApp() {
        this.seedManager = new SeedManager();
        this.modeSelector = new ModeSelector();
        this.showLobby();
    }

    showLobby() {
        this.cleanupGameSession();

        this.lobby = new Lobby(
            (config) => this.startGame(config),
            () => {
                new Settings(() => {});
            }
        );
    }

    cleanupGameSession() {
        this.gameStarted = false;
        this.gamePaused = false;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
        window.removeEventListener('resize', this._onResize);

        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
        if (this.hud) {
            this.hud.hide();
            this.hud = null;
        }
        if (this.pauseMenu) {
            this.pauseMenu = null;
        }
        if (this.world) {
            this.world.dispose();
            this.world = null;
        }
        if (this.dayNight) {
            this.dayNight.dispose();
            this.dayNight = null;
        }
        if (this.renderer) {
            this.renderer.domElement.removeEventListener('webglcontextlost', this._onWebGLContextLost);
            this.renderer.domElement.removeEventListener('webglcontextrestored', this._onWebGLContextRestored);
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }
        if (this.blocker) {
            this.blocker.remove();
            this.blocker = null;
        }

        this.scene = null;
        this.camera = null;

        const existingBlocker = document.getElementById('blocker');
        if (existingBlocker) existingBlocker.style.display = 'none';
        const existingNightOverlay = document.getElementById('night-overlay');
        if (existingNightOverlay) existingNightOverlay.remove();
    }

    startGame(config) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 40, CHUNK_SIZE * (gameSettings.renderDistance || RENDER_DISTANCE));

        this.camera = new THREE.PerspectiveCamera(
            gameSettings.fov || 70,
            window.innerWidth / window.innerHeight,
            0.1, 500
        );
        this.camera.position.set(0, 80, 0);

        try {
            this.renderer = new THREE.WebGLRenderer({ antialias: false });
        } catch (e) {
            this.showWebGLError();
            return;
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.domElement.addEventListener('webglcontextlost', this._onWebGLContextLost);
        this.renderer.domElement.addEventListener('webglcontextrestored', this._onWebGLContextRestored);
        document.body.appendChild(this.renderer.domElement);

        this.dayNight = new DayNightCycle(this.scene);

        this.world = new World(this.scene);
        this.world.noise = new SimplexNoise(config.seed);
        this.world.updateChunks(0, 0);

        this.player = new Player(this.camera, this.world);
        this.player.isLocked = false;

        this.modeSelector.setMode(config.mode);
        this.modeSelector.applyConfig(this.player);

        const spawnPos = this.player.getSpawnPosition();
        this.player.position.copy(spawnPos);
        this.player.velocity.set(0, 0, 0);
        this.player.isOnGround = false;

        this.player.onPause = () => {
            if (!this.gamePaused) this.openPauseMenu();
        };

        this.hud = new HUD();
        this.hud.show();
        this.hud.updateMode(config.mode);
        this.hud.updateSeed(config.seed);

        const existingBlocker = document.getElementById('blocker');
        if (existingBlocker) existingBlocker.style.display = 'none';

        this.blocker = document.createElement('div');
        this.blocker.id = 'game-blocker';
        this.blocker.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:100;display:flex;align-items:center;justify-content:center;';

        const clickMsg = document.createElement('div');
        clickMsg.style.cssText = "color:#fff;font-family:'Courier New',monospace;font-size:24px;cursor:pointer;text-align:center;user-select:none;";
        clickMsg.innerHTML = '<p>Click to play</p><p style="font-size:14px;color:#888;margin-top:10px;">Press ESC to pause &bull; Press F to toggle fly (Creative)</p>';
        this.blocker.appendChild(clickMsg);

        document.body.appendChild(this.blocker);

        clickMsg.addEventListener('click', () => {
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        window.addEventListener('resize', this._onResize);

        this.gameStarted = true;
        this.gamePaused = false;
        this.prevTime = performance.now();
        this.frameCount = 0;
        this.fpsTime = 0;

        this.animFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    _onPointerLockChange() {
        if (!this.renderer || !this.player) return;
        const locked = document.pointerLockElement === this.renderer.domElement;
        this.player.isLocked = locked;

        if (this.blocker) this.blocker.style.display = locked ? 'none' : 'flex';

        if (!locked && this.gameStarted && !this.gamePaused) {
            this.openPauseMenu();
        }
    }

    _onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _onWebGLContextLost(e) {
        e.preventDefault();
        this.gamePaused = true;
    }

    _onWebGLContextRestored() {
        this.gamePaused = false;
    }

    showWebGLError() {
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-family:monospace;font-size:20px;text-align:center;z-index:9999;';
        errDiv.innerHTML = '<p>WebGL is not supported or failed to initialize.<br>Please use a modern browser with GPU support.</p>';
        document.body.appendChild(errDiv);
    }

    openPauseMenu() {
        this.gamePaused = true;
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        if (this.player) this.player.isLocked = false;

        this.pauseMenu = new PauseMenu(
            () => {
                this.gamePaused = false;
                this.pauseMenu = null;
                if (this.renderer && this.renderer.domElement) {
                    this.renderer.domElement.requestPointerLock();
                }
            },
            () => {
                new Settings(() => {});
            },
            () => {
                this.gamePaused = false;
                this.gameStarted = false;
                this.pauseMenu = null;
                this.cleanupGameSession();
                this.showLobby();
            }
        );
    }

    gameLoop(timestamp) {
        if (!this.gameStarted) return;

        const time = timestamp || performance.now();
        const dt = Math.min((time - this.prevTime) / 1000, 0.1);
        this.prevTime = time;

        this.frameCount++;
        this.fpsTime += dt;
        if (this.fpsTime >= 1) {
            const fps = this.frameCount;
            if (this.hud) this.hud.updateFPS(fps);
            this.frameCount = 0;
            this.fpsTime = 0;
        }

        if (!this.gamePaused && this.player && this.world && this.dayNight) {
            this.player.update(dt);
            this.world.updateChunks(this.player.position.x, this.player.position.z);
            this.dayNight.update(dt, this.player.position);

            if (this.hud) {
                this.hud.updatePosition(this.player.position.x, this.player.position.y, this.player.position.z);

                const t = this.dayNight.getNormalizedTime();
                const hours = Math.floor(t * 24);
                const minutes = Math.floor((t * 24 - hours) * 60);
                const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                const period = this.dayNight.isDaytime() ? 'Day' : 'Night';
                this.hud.updateTime(`Time: ${timeStr} (${period})`);
            }
        }

        if (this.renderer && this.scene && this.camera) {
            try {
                this.renderer.render(this.scene, this.camera);
            } catch (e) {
                console.error('Render error:', e);
            }
        }

        this.animFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
}

const game = new Game();
game.startApp();
