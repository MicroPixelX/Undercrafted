class DayNightCycle {
    constructor(scene) {
        this.scene = scene;
        this.time = 0.25;
        this.dayLength = 600;
        this.paused = false;

        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.sunLight.position.set(50, 100, 30);
        scene.add(this.sunLight);

        this.ambientLight = new THREE.AmbientLight(0x444444, 0.6);
        scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b6b3e, 0.3);
        scene.add(this.hemiLight);

        this.sunGroup = new THREE.Group();
        this.sunMesh = new THREE.Mesh(
            new THREE.SphereGeometry(8, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffdd44 })
        );
        this.sunGroup.add(this.sunMesh);

        const sunGlowGeo = new THREE.SphereGeometry(12, 16, 16);
        const sunGlowMat = new THREE.MeshBasicMaterial({
            color: 0xffee88,
            transparent: true,
            opacity: 0.15,
        });
        this.sunGroup.add(new THREE.Mesh(sunGlowGeo, sunGlowMat));
        scene.add(this.sunGroup);

        this.moonGroup = new THREE.Group();
        this.moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(5, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xddeeff })
        );
        this.moonGroup.add(this.moonMesh);
        const moonGlowGeo = new THREE.SphereGeometry(8, 16, 16);
        const moonGlowMat = new THREE.MeshBasicMaterial({
            color: 0xaabbdd,
            transparent: true,
            opacity: 0.08,
        });
        this.moonGroup.add(new THREE.Mesh(moonGlowGeo, moonGlowMat));
        scene.add(this.moonGroup);

        this.starGroup = new THREE.Group();
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1500;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = 300 + Math.random() * 100;
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.cos(phi);
            starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true });
        this.stars = new THREE.Points(starGeo, starMat);
        this.starGroup.add(this.stars);
        this.starGroup.visible = false;
        scene.add(this.starGroup);

        this.skyColors = {
            day: new THREE.Color(0x87ceeb),
            sunset: new THREE.Color(0xff7744),
            night: new THREE.Color(0x0a0a2e),
            dawn: new THREE.Color(0xffaa66),
        };

        this.fogColors = {
            day: new THREE.Color(0x87ceeb),
            sunset: new THREE.Color(0xdd6633),
            night: new THREE.Color(0x080820),
            dawn: new THREE.Color(0xcc8844),
        };

        this.sunColors = {
            day: new THREE.Color(0xffffff),
            sunset: new THREE.Color(0xff8844),
            night: new THREE.Color(0x445577),
            dawn: new THREE.Color(0xffaa66),
        };

        this.starOverlay = document.createElement('div');
        this.starOverlay.id = 'night-overlay';
        document.body.appendChild(this.starOverlay);

        this.timeDisplay = document.createElement('span');
        this.timeDisplay.id = 'time-display';
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.appendChild(this.timeDisplay);
        }
    }

    dispose() {
        if (this.starOverlay && this.starOverlay.parentNode) {
            this.starOverlay.parentNode.removeChild(this.starOverlay);
        }
        if (this.timeDisplay && this.timeDisplay.parentNode) {
            this.timeDisplay.parentNode.removeChild(this.timeDisplay);
        }
        if (this.scene) {
            this.scene.remove(this.sunGroup);
            this.scene.remove(this.moonGroup);
            this.scene.remove(this.starGroup);
            this.scene.remove(this.sunLight);
            this.scene.remove(this.ambientLight);
            this.scene.remove(this.hemiLight);
        }
        if (this.starGroup) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }
        this.sunMesh.geometry.dispose();
        this.sunMesh.material.dispose();
        this.moonMesh.geometry.dispose();
        this.moonMesh.material.dispose();
    }

    getNormalizedTime() {
        return this.time % 1.0;
    }

    isDaytime() {
        const t = this.getNormalizedTime();
        return t > 0.2 && t < 0.8;
    }

    update(dt, playerPos) {
        if (!this.paused) {
            this.time += dt / this.dayLength;
            this.time %= 1.0;
        }

        const t = this.getNormalizedTime();
        const sunAngle = t * Math.PI * 2 - Math.PI / 2;
        const skyRadius = 200;

        const sunX = Math.cos(sunAngle) * skyRadius;
        const sunY = Math.sin(sunAngle) * skyRadius;

        this.sunGroup.position.set(playerPos.x + sunX, playerPos.y + sunY, playerPos.z);
        this.moonGroup.position.set(playerPos.x - sunX, playerPos.y - sunY, playerPos.z);
        this.starGroup.position.set(playerPos.x, playerPos.y, playerPos.z);

        this.sunLight.position.set(sunX, sunY, 30);

        let skyColor, fogColor, sunColor, ambientIntensity, sunIntensity, hemiIntensity;
        let starOpacity;

        if (t < 0.2 || t > 0.85) {
            const blend = t < 0.2
                ? (t - 0.0) / 0.2
                : 1.0 - (t - 0.85) / 0.15;
            const b = Math.max(0, Math.min(1, blend));

            if (t < 0.2) {
                const dawnBlend = Math.max(0, (t - 0.1) / 0.1);
                skyColor = this.lerpColor(this.skyColors.night, this.skyColors.dawn, dawnBlend);
                fogColor = this.lerpColor(this.fogColors.night, this.fogColors.dawn, dawnBlend);
                sunColor = this.lerpColor(this.sunColors.night, this.sunColors.dawn, dawnBlend);
            } else {
                const duskBlend = Math.max(0, (t - 0.85) / 0.1);
                skyColor = this.lerpColor(this.skyColors.dawn, this.skyColors.night, duskBlend);
                fogColor = this.lerpColor(this.fogColors.dawn, this.fogColors.night, duskBlend);
                sunColor = this.lerpColor(this.sunColors.dawn, this.sunColors.night, duskBlend);
            }

            ambientIntensity = 0.15 + b * 0.35;
            sunIntensity = b * 0.4;
            hemiIntensity = 0.05 + b * 0.2;
            starOpacity = 1.0 - b;
        } else if (t < 0.3) {
            const b = (t - 0.2) / 0.1;
            skyColor = this.lerpColor(this.skyColors.dawn, this.skyColors.day, b);
            fogColor = this.lerpColor(this.fogColors.dawn, this.fogColors.day, b);
            sunColor = this.lerpColor(this.sunColors.dawn, this.sunColors.day, b);
            ambientIntensity = 0.5 + b * 0.3;
            sunIntensity = 0.4 + b * 0.5;
            hemiIntensity = 0.25 + b * 0.15;
            starOpacity = 0;
        } else if (t < 0.7) {
            skyColor = this.skyColors.day;
            fogColor = this.fogColors.day;
            sunColor = this.sunColors.day;
            ambientIntensity = 0.8;
            sunIntensity = 0.9;
            hemiIntensity = 0.4;
            starOpacity = 0;
        } else if (t < 0.8) {
            const b = (t - 0.7) / 0.1;
            skyColor = this.lerpColor(this.skyColors.day, this.skyColors.sunset, b);
            fogColor = this.lerpColor(this.fogColors.day, this.fogColors.sunset, b);
            sunColor = this.lerpColor(this.sunColors.day, this.sunColors.sunset, b);
            ambientIntensity = 0.8 - b * 0.3;
            sunIntensity = 0.9 - b * 0.5;
            hemiIntensity = 0.4 - b * 0.15;
            starOpacity = b * 0.3;
        } else {
            const b = (t - 0.8) / 0.05;
            skyColor = this.lerpColor(this.skyColors.sunset, this.skyColors.night, Math.min(1, b));
            fogColor = this.lerpColor(this.fogColors.sunset, this.fogColors.night, Math.min(1, b));
            sunColor = this.lerpColor(this.sunColors.sunset, this.sunColors.night, Math.min(1, b));
            ambientIntensity = 0.5 - b * 0.35;
            sunIntensity = 0.4 - b * 0.3;
            hemiIntensity = 0.25 - b * 0.2;
            starOpacity = 0.3 + b * 0.7;
        }

        this.scene.background = skyColor;
        this.scene.fog.color = fogColor;

        this.sunLight.intensity = sunIntensity;
        this.sunLight.color = sunColor;
        this.ambientLight.intensity = ambientIntensity;
        this.hemiLight.intensity = hemiIntensity;
        this.hemiLight.color = skyColor;

        this.starGroup.visible = starOpacity > 0.05;
        this.stars.material.opacity = Math.max(0, Math.min(1, starOpacity));
        this.stars.material.transparent = true;

        const nightOverlayAlpha = Math.max(0, (1 - ambientIntensity / 0.8) * 0.4);
        this.starOverlay.style.opacity = nightOverlayAlpha;

        const hours = Math.floor(t * 24);
        const minutes = Math.floor((t * 24 - hours) * 60);
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const period = this.isDaytime() ? 'Day' : 'Night';
        this.timeDisplay.textContent = `Time: ${timeStr} (${period})`;
    }

    lerpColor(c1, c2, t) {
        const result = new THREE.Color();
        result.r = c1.r + (c2.r - c1.r) * t;
        result.g = c1.g + (c2.g - c1.g) * t;
        result.b = c1.b + (c2.b - c1.b) * t;
        return result;
    }
}
