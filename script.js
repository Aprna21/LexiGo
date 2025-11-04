// Enhanced LexiGo Translator with Modern Features
class LexiGoTranslator {
    constructor() {
        this.languages = {
            "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic",
            "hy": "Armenian", "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian",
            "bn": "Bengali", "bs": "Bosnian", "bg": "Bulgarian", "ca": "Catalan",
            "ceb": "Cebuano", "ny": "Chichewa", "zh-CN": "Chinese (Simplified)",
            "zh-TW": "Chinese (Traditional)", "co": "Corsican", "hr": "Croatian",
            "cs": "Czech", "da": "Danish", "nl": "Dutch", "en": "English",
            "eo": "Esperanto", "et": "Estonian", "tl": "Filipino", "fi": "Finnish",
            "fr": "French", "fy": "Frisian", "gl": "Galician", "ka": "Georgian",
            "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole",
            "ha": "Hausa", "haw": "Hawaiian", "iw": "Hebrew", "hi": "Hindi",
            "hmn": "Hmong", "hu": "Hungarian", "is": "Icelandic", "ig": "Igbo",
            "id": "Indonesian", "ga": "Irish", "it": "Italian", "ja": "Japanese",
            "jw": "Javanese", "kn": "Kannada", "kk": "Kazakh", "km": "Khmer",
            "ko": "Korean", "ku": "Kurdish (Kurmanji)", "ky": "Kyrgyz", "lo": "Lao",
            "la": "Latin", "lv": "Latvian", "lt": "Lithuanian", "lb": "Luxembourgish",
            "mk": "Macedonian", "mg": "Malagasy", "ms": "Malay", "ml": "Malayalam",
            "mt": "Maltese", "mi": "Maori", "mr": "Marathi", "mn": "Mongolian",
            "my": "Myanmar (Burmese)", "ne": "Nepali", "no": "Norwegian", "ps": "Pashto",
            "fa": "Persian", "pl": "Polish", "pt": "Portuguese", "pa": "Punjabi",
            "ro": "Romanian", "ru": "Russian", "sm": "Samoan", "gd": "Scots Gaelic",
            "sr": "Serbian", "st": "Sesotho", "sn": "Shona", "sd": "Sindhi",
            "si": "Sinhala", "sk": "Slovak", "sl": "Slovenian", "so": "Somali",
            "es": "Spanish", "su": "Sundanese", "sw": "Swahili", "sv": "Swedish",
            "tg": "Tajik", "ta": "Tamil", "te": "Telugu", "th": "Thai",
            "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "uz": "Uzbek",
            "vi": "Vietnamese", "cy": "Welsh", "xh": "Xhosa", "yi": "Yiddish",
            "yo": "Yoruba", "zu": "Zulu"
        };
        
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.setupTheme();
        this.populateLanguageDropdown();
        this.setupEventListeners();
        this.setupAnimations();
        this.loadSavedSettings();
    }

    // Theme Management
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.setupTheme();
    }

    // Language Dropdown Population
    populateLanguageDropdown() {
        const targetLanguage = document.getElementById("targetLanguage");
        
        // Sort languages alphabetically
        const sortedLanguages = Object.entries(this.languages)
            .sort(([,a], [,b]) => a.localeCompare(b));
        
        sortedLanguages.forEach(([code, name]) => {
            const option = document.createElement("option");
            option.value = code;
            option.textContent = name;
            targetLanguage.appendChild(option);
        });
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Clear input button
        document.getElementById('clearInputBtn').addEventListener('click', () => this.clearInput());
        
        // Copy button
        document.getElementById('copyBtn').addEventListener('click', () => this.copyTranslation());
        
        // Clear output button
        document.getElementById('clearOutputBtn').addEventListener('click', () => this.clearOutput());
        
        // Character count and auto-translate on text input
        document.getElementById('inputText').addEventListener('input', () => {
            this.updateCharCount();
            this.autoTranslate();
        });
        
        // Auto-translate on language selection
        document.getElementById('targetLanguage').addEventListener('change', () => {
            this.saveSettings();
            this.autoTranslate();
        });
    }

    // Auto Translate Function
    autoTranslate() {
        const text = document.getElementById('inputText').value.trim();
        const lang = document.getElementById('targetLanguage').value;
        
        if (!text || !lang) {
            return;
        }
        
        // Add a small delay to avoid too many API calls while typing
        clearTimeout(this.translateTimeout);
        this.translateTimeout = setTimeout(() => {
            this.translate();
        }, 500);
    }

    // Translation Function
    async translate() {
        const text = document.getElementById('inputText').value.trim();
        const lang = document.getElementById('targetLanguage').value;
        const outputText = document.getElementById('outputText');

        if (!text) {
            return;
        }

        if (!lang) {
            return;
        }
        
        // Clear previous output
        outputText.innerHTML = '';
        outputText.classList.remove('has-content');

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Translation service unavailable');
            }
            
            const data = await response.json();
            const translatedText = data[0].map(item => item[0]).join('');
            
            // Display result with animation
            outputText.innerHTML = translatedText;
            outputText.classList.add('has-content');
            
            // Auto-detect source language
            const sourceLang = data[2] || 'auto';
            this.updateDetectedLanguage(sourceLang);
            
        } catch (error) {
            console.error('Translation error:', error);
            outputText.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Translation failed. Please check your internet connection and try again.</p>
                </div>
            `;
        }
    }

    // Language Detection
    async detectLanguage() {
        const text = document.getElementById('inputText').value.trim();
        
        if (!text) {
            this.showToast('Please enter text to detect language!', 'error');
            return;
        }

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();
            const detectedLang = data[2] || 'unknown';
            
            if (detectedLang !== 'auto') {
                const languageName = this.languages[detectedLang] || detectedLang;
                this.updateDetectedLanguage(detectedLang, languageName);
                this.showToast(`Language detected: ${languageName}`, 'success');
            } else {
                this.showToast('Could not detect language', 'error');
            }
        } catch (error) {
            console.error('Language detection error:', error);
            this.showToast('Language detection failed', 'error');
        }
    }

    // Update Detected Language Display
    updateDetectedLanguage(langCode, langName = null) {
        // Language detection functionality removed - no UI element to update
    }

    // Clear Input
    clearInput() {
        document.getElementById('inputText').value = '';
        document.getElementById('outputText').innerHTML = `
            <div class="placeholder">
                <i class="fas fa-arrow-up"></i>
                <p>Translation will appear here</p>
            </div>
        `;
        document.getElementById('outputText').classList.remove('has-content');
        this.updateCharCount();
        this.updateDetectedLanguage('auto');
        this.showToast('Input cleared!', 'success');
    }

    // Clear Output
    clearOutput() {
        document.getElementById('outputText').innerHTML = `
            <div class="placeholder">
                <i class="fas fa-arrow-up"></i>
                <p>Translation will appear here</p>
            </div>
        `;
        document.getElementById('outputText').classList.remove('has-content');
        this.showToast('Translation cleared!', 'success');
    }

    // Copy Translation
    async copyTranslation() {
        const outputText = document.getElementById('outputText');
        const text = outputText.textContent.trim();
        
        if (!text || text.includes('Translation will appear here') || text.includes('Translation failed')) {
            this.showToast('Nothing to copy!', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Translation copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Translation copied to clipboard!', 'success');
        }
    }

    // Character Count
    updateCharCount() {
        const inputText = document.getElementById('inputText');
        const charCount = document.getElementById('charCount');
        const count = inputText.value.length;
        
        charCount.textContent = count;
        
        // Change color based on character count
        if (count > 4500) {
            charCount.style.color = '#ef4444';
        } else if (count > 4000) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = 'var(--text-muted)';
        }
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Animations Setup
    setupAnimations() {
        // Add fade-in animation to sections
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // Settings Management
    saveSettings() {
        const settings = {
            targetLanguage: document.getElementById('targetLanguage').value,
            theme: this.currentTheme
        };
        localStorage.setItem('translatorSettings', JSON.stringify(settings));
    }

    loadSavedSettings() {
        const savedSettings = localStorage.getItem('translatorSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.targetLanguage) {
                document.getElementById('targetLanguage').value = settings.targetLanguage;
            }
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new LexiGoTranslator();
    // Splash lifecycle
    const splash = document.getElementById('splash');
    if (splash) {
        document.body.classList.add('splash-lock');
        // Ensure splash is visible for ~3.5s, then fade out and unlock
        setTimeout(() => {
            splash.classList.add('splash--hidden');
            // Remove lock after transition for accessibility
            setTimeout(() => {
                document.body.classList.remove('splash-lock');
            }, 700);
        }, 3500);
    }

    // header removed per request; no motion setup

    // Stagger reveal for translation blocks
    const motionGroups = document.querySelectorAll('[data-motion-group]');
    if (motionGroups.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.2 });

        motionGroups.forEach((group) => io.observe(group));
    }
});

// Add CSS for slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .error-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-muted);
        text-align: center;
    }
    
    .error-message i {
        font-size: 2rem;
        margin-bottom: var(--spacing-sm);
        color: #ef4444;
    }
    
    .error-message p {
        font-style: italic;
    }
`;
document.head.appendChild(style);

