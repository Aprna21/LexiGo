class LexiGoAuth {
    constructor() {
        this.statusTimeout = null;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.switchMode('signin');
    }

    cacheElements() {
        this.signinTab = document.getElementById('signinTab');
        this.signupTab = document.getElementById('signupTab');
        this.signinForm = document.getElementById('signinForm');
        this.signupForm = document.getElementById('signupForm');
        this.statusMessage = document.getElementById('statusMessage');
        this.signinGreeting = document.getElementById('signinGreeting');
        this.signupGreeting = document.getElementById('signupGreeting');
        this.passwordToggles = document.querySelectorAll('.password-toggle');
    }

    bindEvents() {
        if (this.signinTab) {
            this.signinTab.addEventListener('click', () => this.switchMode('signin'));
        }
        if (this.signupTab) {
            this.signupTab.addEventListener('click', () => this.switchMode('signup'));
        }
        if (this.signinForm) {
            this.signinForm.addEventListener('submit', (e) => this.handleSignin(e));
        }
        if (this.signupForm) {
            this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        const goToSignup = document.getElementById('goToSignup');
        if (goToSignup) {
            goToSignup.addEventListener('click', () => this.switchMode('signup'));
        }

        const goToSignin = document.getElementById('goToSignin');
        if (goToSignin) {
            goToSignin.addEventListener('click', () => this.switchMode('signin'));
        }
        const forgotLink = document.getElementById('forgotLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', (event) => {
                event.preventDefault();
                this.showStatus('Security-first: password changes are disabled once saved.', 'info');
            });
        }

        if (this.passwordToggles) {
            this.passwordToggles.forEach((toggle) => {
                toggle.addEventListener('click', () => this.togglePasswordVisibility(toggle));
            });
        }
    }

    togglePasswordVisibility(toggle) {
        const targetId = toggle.getAttribute('data-target');
        if (!targetId) return;
        const input = document.getElementById(targetId);
        if (!input) return;

        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';

        const icon = toggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye', !isHidden);
            icon.classList.toggle('fa-eye-slash', isHidden);
        }

        toggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    }

    switchMode(mode) {
        if (mode === 'signin') {
            this.signinForm.classList.remove('hidden');
            this.signupForm.classList.add('hidden');
            this.signinTab.classList.add('active');
            this.signupTab.classList.remove('active');
            this.signinTab.setAttribute('aria-selected', 'true');
            this.signupTab.setAttribute('aria-selected', 'false');
            this.signinGreeting.classList.remove('hidden');
            this.signupGreeting.classList.add('hidden');
        } else {
            this.signupForm.classList.remove('hidden');
            this.signinForm.classList.add('hidden');
            this.signupTab.classList.add('active');
            this.signinTab.classList.remove('active');
            this.signupTab.setAttribute('aria-selected', 'true');
            this.signinTab.setAttribute('aria-selected', 'false');
            this.signupGreeting.classList.remove('hidden');
            this.signinGreeting.classList.add('hidden');
        }
    }

    handleSignup(event) {
        event.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value.trim();

        if (!name || !email || !password) {
            this.showStatus('Full name, email, and password are required.', 'error');
            return;
        }

        if (!this.isValidEmail(email) || password.length < 6) {
            this.showStatus('Invalid email or password. Please check and try again.', 'error');
            return;
        }

        const existingUser = this.getStoredUser();
        if (existingUser) {
            if (existingUser.email === email) {
                this.showStatus('This account already exists. Please sign in with the saved password.', 'error');
            } else {
                this.showStatus('Only one master email can be registered on this device.', 'error');
            }
            return;
        }

        const userData = {
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('lexigoUser', JSON.stringify(userData));
        this.showStatus('Account created successfully. Please sign in to continue.', 'success');
        this.switchMode('signin');
        const signinEmailField = document.getElementById('signinEmail');
        if (signinEmailField) {
            signinEmailField.value = email;
        }
    }

    handleSignin(event) {
        event.preventDefault();
        const email = document.getElementById('signinEmail').value.trim().toLowerCase();
        const password = document.getElementById('signinPassword').value.trim();

        const storedUser = this.getStoredUser();
        if (!storedUser) {
            this.showStatus('No account found. Please create one first.', 'error');
            this.switchMode('signup');
            return;
        }

        if (storedUser.email !== email || storedUser.password !== password) {
            this.showStatus('Incorrect email or password. Access denied.', 'error');
            return;
        }

        this.persistSession();
        this.showStatus('Authentication successful. Redirecting to LexiGo...', 'success');
        setTimeout(() => {
            window.location.replace('index.html');
        }, 800);
    }

    persistSession() {
        sessionStorage.setItem('lexigoSession', 'true');
        localStorage.removeItem('lexigoAuth');
        localStorage.setItem('lexigoLastLogin', new Date().toISOString());
    }

    getStoredUser() {
        const user = localStorage.getItem('lexigoUser');
        return user ? JSON.parse(user) : null;
    }

    isValidEmail(email) {
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    }

    showStatus(message, type = 'info') {
        if (!this.statusMessage) return;
        clearTimeout(this.statusTimeout);
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusTimeout = setTimeout(() => {
            this.statusMessage.textContent = '';
            this.statusMessage.className = 'status-message';
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LexiGoAuth();
});

