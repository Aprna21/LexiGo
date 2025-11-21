// LexiGo Translator Core (translation-specific logic only)
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

        this.init();
    }

    init() {
        this.populateLanguageDropdown();
        this.setupEventListeners();
        // Always reset to default "Select target language..." on page load
        this.resetLanguageSelection();
    }

    populateLanguageDropdown() {
        const targetLanguage = document.getElementById("targetLanguage");
        if (!targetLanguage) return;

        const sortedLanguages = Object.entries(this.languages)
            .sort(([, a], [, b]) => a.localeCompare(b));

        sortedLanguages.forEach(([code, name]) => {
            const option = document.createElement("option");
            option.value = code;
            option.textContent = name;
            targetLanguage.appendChild(option);
        });
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const clearInputBtn = document.getElementById('clearInputBtn');
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', () => this.clearInput());
        }

        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyTranslation());
        }

        const clearOutputBtn = document.getElementById('clearOutputBtn');
        if (clearOutputBtn) {
            clearOutputBtn.addEventListener('click', () => this.clearOutput());
        }

        const inputText = document.getElementById('inputText');
        if (inputText) {
            inputText.addEventListener('input', () => {
                this.updateCharCount();
                this.autoTranslate();
            });
        }

        const targetLanguage = document.getElementById('targetLanguage');
        if (targetLanguage) {
            targetLanguage.addEventListener('change', () => {
                // Don't save settings - always show "Select target language..." on refresh
                this.autoTranslate();
            });
        }
    }

    autoTranslate() {
        const text = document.getElementById('inputText')?.value.trim();
        const lang = document.getElementById('targetLanguage')?.value;

        if (!text || !lang) {
            return;
        }

        clearTimeout(this.translateTimeout);
        this.translateTimeout = setTimeout(() => {
            this.translate();
        }, 500);
    }

    async translate() {
        const text = document.getElementById('inputText')?.value.trim();
        const lang = document.getElementById('targetLanguage')?.value;
        const outputText = document.getElementById('outputText');

        if (!text || !lang || !outputText) {
            return;
        }

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

            outputText.innerHTML = translatedText;
            outputText.classList.add('has-content');

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

    async detectLanguage() {
        const text = document.getElementById('inputText')?.value.trim();

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

    updateDetectedLanguage(langCode, langName = null) {
        // Reserved for UI element when language detection display is added
    }

    clearInput() {
        const inputText = document.getElementById('inputText');
        if (inputText) {
            inputText.value = '';
        }

        const outputText = document.getElementById('outputText');
        if (outputText) {
            outputText.innerHTML = `
                <div class="placeholder">
                    <i class="fas fa-arrow-up"></i>
                    <p>Translation will appear here</p>
                </div>
            `;
            outputText.classList.remove('has-content');
        }

        this.updateCharCount();
        this.updateDetectedLanguage('auto');
        this.showToast('Input cleared!', 'success');
    }

    clearOutput() {
        const outputText = document.getElementById('outputText');
        if (!outputText) return;

        outputText.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-arrow-up"></i>
                <p>Translation will appear here</p>
            </div>
        `;
        outputText.classList.remove('has-content');
        this.showToast('Translation cleared!', 'success');
    }

    async copyTranslation() {
        const outputText = document.getElementById('outputText');
        const text = outputText?.textContent.trim();

        if (!text || text.includes('Translation will appear here') || text.includes('Translation failed')) {
            this.showToast('Nothing to copy!', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Translation copied to clipboard!', 'success');
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Translation copied to clipboard!', 'success');
        }
    }

    updateCharCount() {
        const inputText = document.getElementById('inputText');
        const charCount = document.getElementById('charCount');

        if (!inputText || !charCount) return;

        const count = inputText.value.length;
        charCount.textContent = count;

        if (count > 4500) {
            charCount.style.color = '#ef4444';
        } else if (count > 4000) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = 'var(--text-muted)';
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

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

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    resetLanguageSelection() {
        // Always reset to default "Select target language..." option
        const targetLanguage = document.getElementById('targetLanguage');
        if (targetLanguage) {
            targetLanguage.value = '';
        }
        // Clear any saved settings from localStorage
        localStorage.removeItem('translatorSettings');
    }

    // Removed saveSettings() and loadSavedSettings() - language selection is not persisted
    // This ensures "Select target language..." always shows after refresh

    logout() {
        localStorage.removeItem('lexigoAuth');
        sessionStorage.removeItem('lexigoSession');
        this.showToast('Signed out securely.', 'success');
        setTimeout(() => {
            window.location.replace('auth.html');
        }, 600);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LexiGoTranslator();
});

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


