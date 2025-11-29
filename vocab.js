const LEXIGO_LANGUAGES = {
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

class LexiGoVocab {
    constructor() {
        this.vocabKey = 'lexigoVocab';
        this.languages = LEXIGO_LANGUAGES;
        this.vocabListEl = document.getElementById('vocabList');
        this.clearBtn = document.getElementById('clearVocabBtn');
        this.toastContainer = document.getElementById('toastContainer');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.init();
    }

    init() {
        this.attachEvents();
        this.render();
    }

    attachEvents() {
        this.clearBtn?.addEventListener('click', () => this.clearVocab());

        this.vocabListEl?.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            if (action === 'copy-source') {
                this.copyText(button.dataset.text, 'Source text copied.');
            } else if (action === 'copy-translation') {
                this.copyText(button.dataset.text, 'Translated text copied.');
            } else if (action === 'delete-entry') {
                this.deleteEntry(button.dataset.id);
            }
        });

        this.logoutBtn?.addEventListener('click', () => this.logout());
    }

    getVocab() {
        try {
            return JSON.parse(localStorage.getItem(this.vocabKey)) || [];
        } catch (error) {
            console.error('Failed to parse vocab:', error);
            return [];
        }
    }

    setVocab(vocab) {
        localStorage.setItem(this.vocabKey, JSON.stringify(vocab));
    }

    render() {
        if (!this.vocabListEl) return;
        const vocab = this.getVocab();

        if (!vocab.length) {
            this.vocabListEl.innerHTML = `
                <div class="vocab-empty">
                    <i class="fas fa-book-open"></i>
                    <p>No words saved yet.</p>
                </div>
            `;
            return;
        }

        this.vocabListEl.innerHTML = vocab.map(item => `
            <article class="vocab-item">
                <div class="vocab-word">
                    <h4>${this.escapeHtml(item.translatedText)}</h4>
                    <p>${this.escapeHtml(item.sourceText)}</p>
                </div>
                <div class="vocab-meta">
                    <span>${this.getLanguageName(item.detectedLanguage)} → ${this.getLanguageName(item.targetLanguage)}</span>
                    <span class="vocab-time">${this.formatTimestamp(item.timestamp)}</span>
                </div>
                <div class="vocab-actions">
                    <button type="button" data-action="copy-source" data-text="${this.escapeAttr(item.sourceText)}" title="Copy source">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button type="button" data-action="copy-translation" data-text="${this.escapeAttr(item.translatedText)}" title="Copy translation">
                        <i class="fas fa-language"></i>
                    </button>
                    <button type="button" data-action="delete-entry" data-id="${item.id}" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </article>
        `).join('');
    }

    clearVocab() {
        localStorage.removeItem(this.vocabKey);
        this.render();
        this.showToast('Notebook cleared.', 'success');
    }

    deleteEntry(id) {
        if (!id) return;
        const updated = this.getVocab().filter(entry => entry.id !== id);
        this.setVocab(updated);
        this.render();
        this.showToast('Word removed from notebook.', 'success');
    }

    copyText(text, successMessage) {
        if (!text) {
            this.showToast('Nothing to copy.', 'error');
            return;
        }

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => this.showToast(successMessage, 'success'))
                .catch(() => this.fallbackCopy(text, successMessage));
        } else {
            this.fallbackCopy(text, successMessage);
        }
    }

    fallbackCopy(text, successMessage) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            this.showToast(successMessage, 'success');
        } catch (error) {
            this.showToast('Copy failed. Please copy manually.', 'error');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    getLanguageName(code) {
        if (!code || code === 'auto') return 'Auto';
        return this.languages[code] || code;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttr(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'fas fa-check-circle' :
            type === 'error' ? 'fas fa-exclamation-circle' :
                'fas fa-info-circle';

        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;

        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

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
    new LexiGoVocab();
});


