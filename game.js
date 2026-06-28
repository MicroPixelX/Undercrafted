let scene, camera, renderer, world, player, dayNight;
let prevTime = performance.now();
let frameCount = 0;
let fpsTime = 0;
let gameStarted = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 40, CHUNK_SIZE * RENDER_DISTANCE);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 80, 0);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    dayNight = new DayNightCycle(scene);

    world = new World(scene);

    world.updateChunks(0, 0);

    player = new Player(camera, world);
    player.isLocked = false;

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        const locked = document.pointerLockElement === renderer.domElement;
        player.isLocked = locked;
        blocker.style.display = locked ? 'none' : 'flex';
        if (locked && !gameStarted) {
            gameStarted = true;
            const spawnPos = player.getSpawnPosition();
            player.position.copy(spawnPos);
            player.velocity.set(0, 0, 0);
            player.isOnGround = false;
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const dt = Math.min((time - prevTime) / 1000, 0.1);
    prevTime = time;

    frameCount++;
    fpsTime += dt;
    if (fpsTime >= 1) {
        document.getElementById('fps-counter').textContent = `FPS: ${frameCount}`;
        frameCount = 0;
        fpsTime = 0;
    }

    if (gameStarted) {
        player.update(dt);
    }

    world.updateChunks(player.position.x, player.position.z);

    dayNight.update(dt, !gameStarted ? new THREE.Vector3(0, 30, 0) : player.position);

    const pos = player.position;
    document.getElementById('position-info').textContent =
        `Pos: ${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`;
    const flightEl = document.getElementById('flight-info');
    if (flightEl) flightEl.textContent = `Flight: ${player.flying ? 'On' : 'Off'}`;

    renderer.render(scene, camera);
}

init();
