let scene, camera, renderer, world, player;
let prevTime = performance.now();
let frameCount = 0;
let fpsTime = 0;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 40, CHUNK_SIZE * RENDER_DISTANCE);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 30);
    scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b6b3e, 0.4);
    scene.add(hemiLight);

    world = new World(scene);

    world.updateChunks(0, 0);

    player = new Player(camera, world);
    const spawnPos = player.getSpawnPosition();
    player.position.copy(spawnPos);
    player.isOnGround = false;

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        player.isLocked = document.pointerLockElement === renderer.domElement;
        blocker.style.display = player.isLocked ? 'none' : 'flex';
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

    player.update(dt);

    world.updateChunks(player.position.x, player.position.z);

    const pos = player.position;
    document.getElementById('position-info').textContent =
        `Pos: ${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`;

    renderer.render(scene, camera);
}

init();
