class PauseMenu {
    constructor(onResume, onSettings, onQuit) {
        this.onResume = onResume;
        this.onSettings = onSettings;
        this.onQuit = onQuit;
        this.active = true;
        this.buildDOM();
    }

    buildDOM() {
        const screen = document.createElement('div');
        screen.id = 'pause-screen';

        const panel = document.createElement('div');
        panel.id = 'pause-panel';

        const title = document.createElement('div');
        title.id = 'pause-title';
        title.textContent = 'Game Paused';
        panel.appendChild(title);

        const info = document.createElement('div');
        info.id = 'pause-info';
        info.textContent = 'Press ESC to resume';
        panel.appendChild(info);

        const resumeBtn = createButton('Back to Game', () => this.close('resume'), '');
        panel.appendChild(resumeBtn);

        const settingsBtn = createButton('Settings...', () => {
            if (this.onSettings) this.onSettings();
        }, '');
        panel.appendChild(settingsBtn);

        const quitBtn = createButton('Save and Quit to Title', () => this.close('quit'), '');
        panel.appendChild(quitBtn);

        screen.appendChild(panel);
        this.screen = screen;
        document.body.appendChild(screen);
    }

    close(action) {
        this.active = false;
        if (this.screen && this.screen.parentNode) {
            this.screen.parentNode.removeChild(this.screen);
        }
        if (action === 'resume' && this.onResume) this.onResume();
        if (action === 'quit' && this.onQuit) this.onQuit();
    }
}
