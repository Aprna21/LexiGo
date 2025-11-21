// Global theme manager for LexiGo
(function initializeRootTheme() {
    const storedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
})();

class ThemeManager {
    constructor(buttonIds = []) {
        this.buttonIds = buttonIds;
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.buttons = [];
        this.init();
    }

    init() {
        this.cacheButtons();
        this.updateIcons();
        this.attachEvents();
    }

    cacheButtons() {
        this.buttons = this.buttonIds
            .map(id => document.getElementById(id))
            .filter(Boolean);
    }

    attachEvents() {
        this.buttons.forEach((button) => {
            button.addEventListener('click', () => this.toggleTheme());
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateIcons();
    }

    updateIcons() {
        this.buttons.forEach((button) => {
            const icon = button.querySelector('i');
            if (!icon) return;
            icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.lexigoTheme = new ThemeManager(['themeToggle', 'authThemeToggle']);
});


