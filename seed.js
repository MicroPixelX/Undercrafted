class SeedManager {
    constructor() {
        this.currentSeed = 42;
        this.seedHistory = this.loadHistory();
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    parseSeed(input) {
        if (!input || input.trim() === '') {
            const random = Math.floor(Math.random() * 65536);
            this.currentSeed = random;
            this.addToHistory(random);
            return random;
        }

        const trimmed = input.trim();
        if (!isNaN(trimmed) && trimmed.length > 0 && Number(trimmed) <= 2147483647) {
            const seed = parseInt(trimmed);
            this.currentSeed = seed;
            this.addToHistory(seed);
            return seed;
        }

        const hash = this.hashString(trimmed);
        this.currentSeed = hash;
        this.addToHistory(hash);
        return hash;
    }

    generateRandom() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    addToHistory(seed) {
        if (!this.seedHistory.includes(seed)) {
            this.seedHistory.unshift(seed);
            if (this.seedHistory.length > 10) this.seedHistory.pop();
            this.saveHistory();
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('undercrafted_seeds');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [42];
    }

    saveHistory() {
        try {
            localStorage.setItem('undercrafted_seeds', JSON.stringify(this.seedHistory));
        } catch (e) {}
    }

    getSeed() {
        return this.currentSeed;
    }

    getHistory() {
        return this.seedHistory;
    }
}
