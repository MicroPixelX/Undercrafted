class ModeSelector {
    constructor() {
        this.modes = {
            survival: {
                name: 'Survival',
                description: 'Gather resources, build, and survive',
                icon: '\u2694',
                playerSpeed: 5,
                gravity: 20,
                canFly: false,
                canBreak: true,
                canPlace: true,
                health: true,
            },
            creative: {
                name: 'Creative',
                description: 'Unlimited blocks, free building',
                icon: '\u2728',
                playerSpeed: 8,
                gravity: 0,
                canFly: true,
                canBreak: true,
                canPlace: true,
                health: false,
            },
        };
        this.currentMode = 'survival';
    }

    setMode(mode) {
        if (this.modes[mode]) {
            this.currentMode = mode;
        }
    }

    getMode() {
        return this.currentMode;
    }

    getConfig() {
        return this.modes[this.currentMode];
    }

    applyConfig(player) {
        const config = this.getConfig();
        player.speed = config.playerSpeed;
        player.canFly = config.canFly;
        if (config.canFly) {
            player.gravity = 0;
            player.jumpForce = 0;
        } else {
            player.gravity = 20;
            player.jumpForce = 8;
        }
    }
}
