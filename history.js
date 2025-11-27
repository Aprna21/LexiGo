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

class LexiGoHistory {
    constructor() {
        this.historyKey = 'lexigoHistory';
        this.languages = LEXIGO_LANGUAGES;
        this.historyListEl = document.getElementById('fullHistoryList');
        this.languageFilter = document.getElementById('languageFilter');
        this.searchInput = document.getElementById('searchHistory');
        this.clearBtn = document.getElementById('clearFullHistoryBtn');
        this.toastContainer = document.getElementById('toastContainer');
        this.init();
    }

    init() {
        this.populateLanguageFilter();
        this.attachEvents();
        this.render();
    }

    attachEvents() {
        this.languageFilter?.addEventListener('change', () => this.render());
        this.searchInput?.addEventListener('input', () => this.render());
        this.clearBtn?.addEventListener('click', () => this.clearHistory());

        this.historyListEl?.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const id = button.dataset.id;
            const action = button.dataset.action;

            if (action === 'copy-source') {
                this.copyText(button.dataset.text, 'Source text copied.');
            } else if (action === 'copy-translation') {
                this.copyText(button.dataset.text, 'Translated text copied.');
            } else if (action === 'delete-entry') {
                this.deleteEntry(id);
            }
        });
    }

    populateLanguageFilter() {
        if (!this.languageFilter) return;
        const fragment = document.createDocumentFragment();
        Object.entries(this.languages)
            .sort(([, a], [, b]) => a.localeCompare(b))
            .forEach(([code, name]) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                fragment.appendChild(option);
            });
        this.languageFilter.appendChild(fragment);
    }

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.historyKey)) || [];
        } catch (error) {
            console.error('Failed to parse history:', error);
            return [];
        }
    }

    setHistory(history) {
        localStorage.setItem(this.historyKey, JSON.stringify(history));
    }

    render() {
        if (!this.historyListEl) return;
        const filterValue = this.languageFilter?.value || 'all';
        const searchValue = (this.searchInput?.value || '').toLowerCase();
        const history = this.getHistory().filter(entry => {
            const matchesLanguage = filterValue === 'all' || entry.targetLanguage === filterValue;
            const combinedText = `${entry.sourceText} ${entry.translatedText}`.toLowerCase();
            const matchesSearch = searchValue === '' || combinedText.includes(searchValue);
            return matchesLanguage && matchesSearch;
        });

        if (!history.length) {
            this.historyListEl.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-book-open"></i>
                    <p>No translations match your filters.</p>
                </div>
            `;
            return;
        }

        this.historyListEl.innerHTML = history.map(entry => `
            <article class="history-card">
                <header>
                    <h2>${this.getLanguageName(entry.detectedLanguage)} <span>→ ${this.getLanguageName(entry.targetLanguage)}</span></h2>
                    <time class="history-timestamp">${this.formatTimestamp(entry.timestamp)}</time>
                </header>
                <div class="history-body">
                    <div class="text-block">
                        <label>Source</label>
                        <p>${this.escapeHtml(entry.sourceText)}</p>
                    </div>
                    <div class="text-block">
                        <label>Translation</label>
                        <p>${this.escapeHtml(entry.translatedText)}</p>
                    </div>
                </div>
                <footer>
                    <span>Saved locally on this device</span>
                    <div class="history-card-actions">
                        <button data-action="copy-source" data-text="${this.escapeAttr(entry.sourceText)}">
                            <i class="fas fa-copy"></i> Copy Source
                        </button>
                        <button data-action="copy-translation" data-text="${this.escapeAttr(entry.translatedText)}">
                            <i class="fas fa-copy"></i> Copy Translation
                        </button>
                        <button data-action="delete-entry" data-id="${entry.id}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </footer>
            </article>
        `).join('');
    }

    deleteEntry(id) {
        if (!id) return;
        const updated = this.getHistory().filter(entry => entry.id !== id);
        this.setHistory(updated);
        this.render();
        this.showToast('Entry removed from history.', 'success');
    }

    clearHistory() {
        localStorage.removeItem(this.historyKey);
        this.render();
        this.showToast('All translations removed.', 'success');
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
        return text.replace(/&/g, '&amp;')
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
}

document.addEventListener('DOMContentLoaded', () => {
    new LexiGoHistory();
});

