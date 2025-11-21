// Handles splash screen lifecycle and motion reveals shared across pages
class WelcomeExperience {
    constructor() {
        this.handleSplash();
        this.setupStaggeredReveal();
    }

    handleSplash() {
        const splash = document.getElementById('splash');
        if (!splash) return;

        document.body.classList.add('splash-lock');
        setTimeout(() => {
            splash.classList.add('splash--hidden');
            setTimeout(() => {
                document.body.classList.remove('splash-lock');
            }, 700);
        }, 3500);
    }

    setupStaggeredReveal() {
        const motionGroups = document.querySelectorAll('[data-motion-group]');
        if (!motionGroups.length) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.2 });

        motionGroups.forEach((group) => io.observe(group));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.lexigoWelcome = new WelcomeExperience();
});


