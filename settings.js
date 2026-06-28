const DEFAULT_SETTINGS = {
    renderDistance: 4,
    fov: 70,
    sensitivity: 100,
    musicVolume: 80,
    soundVolume: 80,
    showFps: true,
    showDebug: true,
};

let gameSettings = { ...DEFAULT_SETTINGS };

function loadSettings() {
    try {
        const saved = localStorage.getItem('undercrafted_settings');
        if (saved) {
            gameSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {}
    validateSettings();
}

function validateSettings() {
    gameSettings.renderDistance = clamp(gameSettings.renderDistance, 2, 8);
    gameSettings.fov = clamp(gameSettings.fov, 50, 110);
    gameSettings.sensitivity = clamp(gameSettings.sensitivity, 20, 200);
    gameSettings.musicVolume = clamp(gameSettings.musicVolume, 0, 100);
    gameSettings.soundVolume = clamp(gameSettings.soundVolume, 0, 100);
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, Math.round(val) || min));
}

function saveSettings() {
    try {
        localStorage.setItem('undercrafted_settings', JSON.stringify(gameSettings));
    } catch (e) {}
}

class Settings {
    constructor(onDone) {
        this.onDone = onDone;
        this.active = true;
        this.buildDOM();
    }

    buildDOM() {
        const screen = document.createElement('div');
        screen.id = 'settings-screen';

        const panel = document.createElement('div');
        panel.id = 'settings-panel';

        const title = document.createElement('div');
        title.id = 'settings-title';
        title.textContent = 'Settings';
        panel.appendChild(title);

        const divider1 = document.createElement('div');
        divider1.className = 'settings-divider';
        panel.appendChild(divider1);

        const sectionVideo = document.createElement('div');
        sectionVideo.className = 'settings-section-title';
        sectionVideo.textContent = 'Video';
        panel.appendChild(sectionVideo);

        this.addSlider(panel, 'Render Distance', 'renderDistance', 2, 8, 1, (v) => `${v} chunks`);
        this.addSlider(panel, 'FOV', 'fov', 50, 110, 5, (v) => `${v}\u00B0`);

        const divider2 = document.createElement('div');
        divider2.className = 'settings-divider';
        panel.appendChild(divider2);

        const sectionControls = document.createElement('div');
        sectionControls.className = 'settings-section-title';
        sectionControls.textContent = 'Controls';
        panel.appendChild(sectionControls);

        this.addSlider(panel, 'Mouse Sensitivity', 'sensitivity', 20, 200, 10, (v) => `${v}%`);

        const divider3 = document.createElement('div');
        divider3.className = 'settings-divider';
        panel.appendChild(divider3);

        const sectionAudio = document.createElement('div');
        sectionAudio.className = 'settings-section-title';
        sectionAudio.textContent = 'Audio';
        panel.appendChild(sectionAudio);

        this.addSlider(panel, 'Music Volume', 'musicVolume', 0, 100, 5, (v) => `${v}%`);
        this.addSlider(panel, 'Sound Volume', 'soundVolume', 0, 100, 5, (v) => `${v}%`);

        const divider4 = document.createElement('div');
        divider4.className = 'settings-divider';
        panel.appendChild(divider4);

        const sectionHud = document.createElement('div');
        sectionHud.className = 'settings-section-title';
        sectionHud.textContent = 'HUD';
        panel.appendChild(sectionHud);

        this.addToggle(panel, 'Show FPS', 'showFps');
        this.addToggle(panel, 'Show Debug', 'showDebug');

        const divider5 = document.createElement('div');
        divider5.className = 'settings-divider';
        panel.appendChild(divider5);

        const doneBtn = createButton('Done', () => this.close(), '');
        panel.appendChild(doneBtn);

        screen.appendChild(panel);
        this.screen = screen;
        document.body.appendChild(screen);
    }

    addSlider(panel, label, key, min, max, step, formatFn) {
        const row = document.createElement('div');
        row.className = 'settings-row';

        const labelEl = document.createElement('span');
        labelEl.className = 'settings-label';
        labelEl.textContent = label;
        row.appendChild(labelEl);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'settings-slider';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = gameSettings[key];
        row.appendChild(slider);

        const valueEl = document.createElement('span');
        valueEl.className = 'settings-value';
        valueEl.textContent = formatFn(gameSettings[key]);
        row.appendChild(valueEl);

        slider.addEventListener('input', () => {
            const val = clamp(parseInt(slider.value), min, max);
            gameSettings[key] = val;
            valueEl.textContent = formatFn(val);
            saveSettings();
        });

        panel.appendChild(row);
    }

    addToggle(panel, label, key) {
        const row = document.createElement('div');
        row.className = 'settings-row';

        const labelEl = document.createElement('span');
        labelEl.className = 'settings-label';
        labelEl.textContent = label;
        row.appendChild(labelEl);

        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'settings-toggle';

        const onBtn = createButton('ON', () => {
            gameSettings[key] = true;
            onBtn.classList.add('active');
            offBtn.classList.remove('active');
            saveSettings();
        }, '');
        const offBtn = createButton('OFF', () => {
            gameSettings[key] = false;
            offBtn.classList.add('active');
            onBtn.classList.remove('active');
            saveSettings();
        }, '');

        if (gameSettings[key]) onBtn.classList.add('active');
        else offBtn.classList.add('active');

        toggleDiv.appendChild(onBtn);
        toggleDiv.appendChild(offBtn);
        row.appendChild(toggleDiv);
        panel.appendChild(row);
    }

    close() {
        this.active = false;
        if (this.screen && this.screen.parentNode) {
            this.screen.parentNode.removeChild(this.screen);
        }
        if (this.onDone) this.onDone();
    }
}

loadSettings();
