class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;
        this.position = new THREE.Vector3(0, 30, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isOnGround = false;
        this.height = 1.7;
        this.width = 0.3;
        this.speed = 5;
        this.jumpForce = 8;
        this.gravity = 20;
        this.canFly = false;
        this.isFlying = false;
        this.flySpeed = 10;
        this.selectedSlot = 0;
        this.inventory = [
            BlockType.GRASS,
            BlockType.DIRT,
            BlockType.STONE,
            BlockType.WOOD,
            BlockType.LEAVES,
            BlockType.SAND,
        ];
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.sensitivity = 0.002;
        this.isLocked = false;
        this.prevOnGround = false;

        this.initControls();
    }

    initControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code >= 'Digit1' && e.code <= 'Digit6') {
                this.selectedSlot = parseInt(e.code.charAt(5)) - 1;
                this.updateHotbar();
            }
            if (e.code === 'Escape' && this.isLocked) {
                e.preventDefault();
                if (this.onPause) this.onPause();
            }
            if (e.code === 'KeyF' && this.canFly) {
                e.preventDefault();
                this.isFlying = !this.isFlying;
                if (this.isFlying) {
                    this.velocity.y = 0;
                    this.gravity = 0;
                } else {
                    this.gravity = 20;
                }
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        document.addEventListener('mousemove', (e) => {
            if (this.isLocked) {
                const sens = gameSettings ? (gameSettings.sensitivity / 100) : 1;
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
        });
        document.addEventListener('mousedown', (e) => {
            if (this.isLocked) {
                e.preventDefault();
                if (e.button === 0) this.breakBlock();
                if (e.button === 2) this.placeBlock();
            }
        });
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('wheel', (e) => {
            if (this.isLocked) {
                this.selectedSlot = ((this.selectedSlot + Math.sign(e.deltaY)) % 6 + 6) % 6;
                this.updateHotbar();
            }
        });
    }

    updateHotbar() {
        document.querySelectorAll('.hud-slot').forEach((slot, i) => {
            slot.classList.toggle('selected', i === this.selectedSlot);
        });
    }

    breakBlock() {
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const hit = this.world.raycast(this.camera.position, dir);
        if (hit) {
            this.world.setBlock(hit.position.x, hit.position.y, hit.position.z, BlockType.AIR);
        }
    }

    placeBlock() {
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const hit = this.world.raycast(this.camera.position, dir);
        if (hit && hit.previous) {
            const px = hit.previous.x;
            const py = hit.previous.y;
            const pz = hit.previous.z;

            const playerMinX = this.position.x - this.width;
            const playerMaxX = this.position.x + this.width;
            const playerMinZ = this.position.z - this.width;
            const playerMaxZ = this.position.z + this.width;
            const playerMinY = this.position.y;
            const playerMaxY = this.position.y + this.height;

            if (px + 1 > playerMinX && px < playerMaxX &&
                py + 1 > playerMinY && py < playerMaxY &&
                pz + 1 > playerMinZ && pz < playerMaxZ) {
                return;
            }

            this.world.setBlock(px, py, pz, this.inventory[this.selectedSlot]);
        }
    }

    update(dt) {
        if (!this.isLocked) return;

        const sens = gameSettings ? (gameSettings.sensitivity / 100) : 1;
        this.rotation.y -= this.mouseDelta.x * this.sensitivity * sens;
        this.rotation.x -= this.mouseDelta.y * this.sensitivity * sens;
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;

        this.camera.rotation.copy(this.rotation);

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.rotation.y, 0)));
        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDir = new THREE.Vector3(0, 0, 0);
        if (this.keys['KeyW']) moveDir.add(forward);
        if (this.keys['KeyS']) moveDir.sub(forward);
        if (this.keys['KeyA']) moveDir.sub(right);
        if (this.keys['KeyD']) moveDir.add(right);

        if (moveDir.length() > 0) moveDir.normalize();

        const currentSpeed = this.isFlying ? this.flySpeed : this.speed;

        if (this.isFlying) {
            this.velocity.x = moveDir.x * currentSpeed;
            this.velocity.z = moveDir.z * currentSpeed;
            this.velocity.y = 0;
            if (this.keys['Space']) this.velocity.y = currentSpeed;
            if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) this.velocity.y = -currentSpeed;

            const newPos = this.position.clone();
            newPos.x += this.velocity.x * dt;
            newPos.y += this.velocity.y * dt;
            newPos.z += this.velocity.z * dt;

            this.position.copy(newPos);
        } else {
            this.velocity.x = moveDir.x * currentSpeed;
            this.velocity.z = moveDir.z * currentSpeed;

            if (this.keys['Space'] && this.isOnGround) {
                this.velocity.y = this.jumpForce;
                this.isOnGround = false;
            }

            this.velocity.y -= this.gravity * dt;

            this.isOnGround = false;
            const newPos = this.position.clone();
            newPos.x += this.velocity.x * dt;
            this.collide('x', newPos);
            newPos.y += this.velocity.y * dt;
            this.collide('y', newPos);
            newPos.z += this.velocity.z * dt;
            this.collide('z', newPos);

            this.position.copy(newPos);
        }

        if (this.position.y < -10) {
            this.position.y = 40;
            this.velocity.y = 0;
        }

        this.camera.position.copy(this.position);
        this.camera.position.y += this.height - 0.2;
    }

    collide(axis, pos) {
        const minX = pos.x - this.width;
        const maxX = pos.x + this.width;
        const minY = pos.y;
        const maxY = pos.y + this.height;
        const minZ = pos.z - this.width;
        const maxZ = pos.z + this.width;

        const startX = Math.floor(minX);
        const endX = Math.floor(maxX);
        const startY = Math.floor(minY);
        const endY = Math.floor(maxY);
        const startZ = Math.floor(minZ);
        const endZ = Math.floor(maxZ);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                for (let z = startZ; z <= endZ; z++) {
                    if (this.world.isBlockSolid(x, y, z)) {
                        const blockMinX = x;
                        const blockMaxX = x + 1;
                        const blockMinY = y;
                        const blockMaxY = y + 1;
                        const blockMinZ = z;
                        const blockMaxZ = z + 1;

                        if (maxX > blockMinX && minX < blockMaxX &&
                            maxY > blockMinY && minY < blockMaxY &&
                            maxZ > blockMinZ && minZ < blockMaxZ) {

                            if (axis === 'x') {
                                if (this.velocity.x > 0) {
                                    pos.x = blockMinX - this.width - 0.001;
                                } else {
                                    pos.x = blockMaxX + this.width + 0.001;
                                }
                                this.velocity.x = 0;
                            } else if (axis === 'y') {
                                if (this.velocity.y > 0) {
                                    pos.y = blockMinY - this.height - 0.001;
                                    this.velocity.y = 0;
                                } else {
                                    pos.y = blockMaxY + 0.001;
                                    this.velocity.y = 0;
                                    this.isOnGround = true;
                                }
                            } else if (axis === 'z') {
                                if (this.velocity.z > 0) {
                                    pos.z = blockMinZ - this.width - 0.001;
                                } else {
                                    pos.z = blockMaxZ + this.width + 0.001;
                                }
                                this.velocity.z = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    getSpawnPosition() {
        for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
            const block = this.world.getBlock(0, y, 0);
            if (block !== BlockType.AIR && block !== BlockType.WATER) {
                return new THREE.Vector3(0.5, y + 2, 0.5);
            }
        }
        return new THREE.Vector3(0.5, 30, 0.5);
    }
}
