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

        // Speech recognition and synthesis
        this.recognition = null;
        this.isListening = false;
        this.synthesis = window.speechSynthesis;
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.historyKey = 'lexigoHistory';
        this.historyLimit = 25;
        this.historyPreviewLimit = 5;
        this.vocabKey = 'lexigoVocab';
        this.vocabLimit = 100;
        this.lastDetectedLanguage = 'auto';

        this.init();
    }

    init() {
        this.populateLanguageDropdown();
        this.setupEventListeners();
        // Always reset to default "Select target language..." on page load
        this.resetLanguageSelection();
        this.renderHistoryPreview();
        this.renderVocabPreview();
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

        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (voiceOutputBtn) {
            voiceOutputBtn.addEventListener('click', () => this.toggleVoiceOutput());
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

        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }

        const saveVocabBtn = document.getElementById('saveVocabBtn');
        if (saveVocabBtn) {
            saveVocabBtn.addEventListener('click', () => this.handleSaveToVocab());
        }

        const clearVocabBtn = document.getElementById('clearVocabBtn');
        if (clearVocabBtn) {
            clearVocabBtn.addEventListener('click', () => this.clearVocab());
        }

        const vocabList = document.getElementById('vocabList');
        if (vocabList) {
            vocabList.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-action]');
                if (!button) return;

                const action = button.dataset.action;
                if (action === 'copy-source') {
                    this.copyArbitraryText(button.dataset.text, 'Source text copied to clipboard!');
                } else if (action === 'copy-translation') {
                    this.copyArbitraryText(button.dataset.text, 'Translated text copied to clipboard!');
                } else if (action === 'delete-entry') {
                    this.deleteVocabEntry(button.dataset.id);
                }
            });
        }

        // Initialize speech recognition
        this.initSpeechRecognition();
        
        // Load voices for text-to-speech
        this.loadVoices();
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        // This method is called to ensure voices are loaded
        // Voices might not be available immediately on page load
        if (this.synthesis) {
            const voices = this.synthesis.getVoices();
            // Voices are now loaded and available for text-to-speech
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
            this.lastDetectedLanguage = sourceLang;
            this.updateDetectedLanguage(sourceLang);
            this.saveTranslationToHistory({
                sourceText: text,
                translatedText,
                targetLanguage: lang,
                detectedLanguage: sourceLang
            });
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

        // Stop any ongoing speech recognition
        if (this.isListening && this.recognition) {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceInputButton(false);
        }

        // Stop any ongoing speech synthesis
        if (this.isSpeaking && this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateVoiceOutputButton(false);
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
        
        // Stop any ongoing speech synthesis
        if (this.isSpeaking && this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateVoiceOutputButton(false);
        }
        
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

    copyArbitraryText(text, successMessage = 'Copied to clipboard!') {
        if (!text) {
            this.showToast('Nothing to copy!', 'error');
            return;
        }

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => this.showToast(successMessage, 'success'))
                .catch(() => this.fallbackCopyText(text, successMessage));
        } else {
            this.fallbackCopyText(text, successMessage);
        }
    }

    fallbackCopyText(text, successMessage) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast(successMessage, 'success');
        } catch (error) {
            this.showToast('Copy failed. Please copy manually.', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    updateCharCount() {
        const inputText = document.getElementById('inputText');
        const charCount = document.getElementById('charCount');

        if (!inputText || !charCount) return;

        const count = inputText.value.length;
        charCount.textContent = count;

        // Remove all warning classes first
        inputText.classList.remove('warning', 'danger');

        if (count > 4500) {
            // Red danger state - 4500+ characters
            charCount.style.color = '#ef4444';
            inputText.classList.add('danger');
        } else if (count > 4000) {
            // Yellow warning state - 4000+ characters
            charCount.style.color = '#f59e0b';
            inputText.classList.add('warning');
        } else {
            // Normal state
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

    initSpeechRecognition() {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            const voiceInputBtn = document.getElementById('voiceInputBtn');
            if (voiceInputBtn) {
                voiceInputBtn.style.display = 'none';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        
        // Try to detect browser language or use English as default
        const browserLang = navigator.language || navigator.userLanguage || 'en-US';
        this.recognition.lang = browserLang;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceInputButton(true);
            this.showToast('Listening... Speak now!', 'info');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const inputText = document.getElementById('inputText');
            if (inputText) {
                const currentText = inputText.value.trim();
                // Append transcript with proper spacing
                const newText = currentText ? `${currentText} ${transcript}` : transcript;
                inputText.value = newText;
                this.updateCharCount();
                this.autoTranslate();
                this.showToast('Voice input received!', 'success');
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceInputButton(false);
            
            let errorMessage = 'Voice input failed.';
            if (event.error === 'no-speech') {
                errorMessage = 'No speech detected. Please try again.';
            } else if (event.error === 'audio-capture') {
                errorMessage = 'No microphone found. Please check your microphone.';
            } else if (event.error === 'not-allowed') {
                errorMessage = 'Microphone permission denied. Please allow microphone access.';
            }
            this.showToast(errorMessage, 'error');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceInputButton(false);
        };
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showToast('Speech recognition is not supported in your browser.', 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceInputButton(false);
            this.showToast('Voice input stopped.', 'info');
        } else {
            try {
                // Update recognition language based on browser language
                const browserLang = navigator.language || navigator.userLanguage || 'en-US';
                this.recognition.lang = browserLang;
                this.recognition.start();
            } catch (error) {
                if (error.name === 'InvalidStateError') {
                    // Recognition is already running, stop and restart
                    this.recognition.stop();
                    setTimeout(() => {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            this.showToast('Failed to start voice input.', 'error');
                        }
                    }, 100);
                } else {
                    this.showToast('Failed to start voice input. Please check microphone permissions.', 'error');
                }
            }
        }
    }

    updateVoiceInputButton(isListening) {
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (!voiceInputBtn) return;

        const icon = voiceInputBtn.querySelector('i');
        if (isListening) {
            voiceInputBtn.classList.add('listening');
            if (icon) icon.className = 'fas fa-microphone-slash';
            voiceInputBtn.title = 'Stop Listening';
        } else {
            voiceInputBtn.classList.remove('listening');
            if (icon) icon.className = 'fas fa-microphone';
            voiceInputBtn.title = 'Voice Input';
        }
    }

    toggleVoiceOutput() {
        const outputText = document.getElementById('outputText');
        if (!outputText) return;

        const text = outputText.textContent.trim();
        
        // Check if there's valid translated text
        if (!text || 
            text.includes('Translation will appear here') || 
            text.includes('Translation failed') ||
            text.includes('Please check your internet')) {
            this.showToast('No translation to read!', 'error');
            return;
        }

        if (this.isSpeaking) {
            // Stop speaking
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateVoiceOutputButton(false);
            this.showToast('Stopped reading.', 'info');
        } else {
            // Start speaking
            this.speakText(text);
        }
    }

    speakText(text) {
        if (!this.synthesis) {
            this.showToast('Text-to-speech is not supported in your browser.', 'error');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        // Get the target language to set appropriate voice
        const targetLanguage = document.getElementById('targetLanguage')?.value;
        const langCode = targetLanguage || 'en';

        const startSpeaking = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langCode;
            utterance.rate = 0.9; // Slightly slower for better comprehension
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Try to find a voice that matches the target language
            const voices = this.synthesis.getVoices();
            if (voices.length > 0) {
                const langPrefix = langCode.split('-')[0];
                const preferredVoice = voices.find(voice => 
                    voice.lang.startsWith(langCode) || 
                    voice.lang.startsWith(langPrefix)
                ) || voices.find(voice => voice.lang.includes(langPrefix));
                
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }
            }

            utterance.onstart = () => {
                this.isSpeaking = true;
                this.currentUtterance = utterance;
                this.updateVoiceOutputButton(true);
                this.showToast('Reading translation...', 'info');
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.updateVoiceOutputButton(false);
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.updateVoiceOutputButton(false);
                this.showToast('Failed to read translation.', 'error');
            };

            this.synthesis.speak(utterance);
        };

        // Wait for voices to load if needed
        const voices = this.synthesis.getVoices();
        if (voices.length === 0) {
            // Voices not loaded yet, wait a bit
            setTimeout(startSpeaking, 100);
        } else {
            startSpeaking();
        }
    }

    updateVoiceOutputButton(isSpeaking) {
        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (!voiceOutputBtn) return;

        const icon = voiceOutputBtn.querySelector('i');
        if (isSpeaking) {
            voiceOutputBtn.classList.add('speaking');
            if (icon) icon.className = 'fas fa-stop';
            voiceOutputBtn.title = 'Stop Reading';
        } else {
            voiceOutputBtn.classList.remove('speaking');
            if (icon) icon.className = 'fas fa-volume-up';
            voiceOutputBtn.title = 'Listen to Translation';
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem(this.historyKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to parse history:', error);
            return [];
        }
    }

    saveTranslationToHistory(entry) {
        if (!entry?.sourceText || !entry?.translatedText) return;

        const history = this.loadHistory()
            .filter(item => item.sourceText !== entry.sourceText || item.translatedText !== entry.translatedText);

        const record = {
            id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `hist-${Date.now()}`,
            sourceText: entry.sourceText,
            translatedText: entry.translatedText,
            targetLanguage: entry.targetLanguage,
            detectedLanguage: entry.detectedLanguage || 'auto',
            timestamp: new Date().toISOString()
        };

        history.unshift(record);
        if (history.length > this.historyLimit) {
            history.length = this.historyLimit;
        }

        localStorage.setItem(this.historyKey, JSON.stringify(history));
        this.renderHistoryPreview();
    }

    clearHistory() {
        localStorage.removeItem(this.historyKey);
        this.renderHistoryPreview();
        this.showToast('Translation history cleared.', 'success');
    }

    loadVocab() {
        try {
            const saved = localStorage.getItem(this.vocabKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to parse vocabulary:', error);
            return [];
        }
    }

    saveToVocab(entry) {
        if (!entry?.sourceText || !entry?.translatedText) return;

        let vocab = this.loadVocab()
            .filter(item => item.sourceText !== entry.sourceText || item.translatedText !== entry.translatedText);

        const record = {
            id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `vocab-${Date.now()}`,
            sourceText: entry.sourceText,
            translatedText: entry.translatedText,
            targetLanguage: entry.targetLanguage,
            detectedLanguage: entry.detectedLanguage || 'auto',
            timestamp: new Date().toISOString()
        };

        vocab.unshift(record);
        if (vocab.length > this.vocabLimit) {
            vocab.length = this.vocabLimit;
        }

        localStorage.setItem(this.vocabKey, JSON.stringify(vocab));
        this.renderVocabPreview();
    }

    clearVocab() {
        localStorage.removeItem(this.vocabKey);
        this.renderVocabPreview();
        this.showToast('Notebook cleared.', 'success');
    }

    deleteVocabEntry(id) {
        if (!id) return;
        const updated = this.loadVocab().filter(entry => entry.id !== id);
        localStorage.setItem(this.vocabKey, JSON.stringify(updated));
        this.renderVocabPreview();
        this.showToast('Word removed from notebook.', 'success');
    }

    handleSaveToVocab() {
        const inputText = document.getElementById('inputText');
        const outputText = document.getElementById('outputText');
        const targetLanguage = document.getElementById('targetLanguage');

        const source = inputText?.value.trim() || '';
        const translated = outputText?.textContent.trim() || '';

        if (!source || !translated ||
            translated.includes('Translation will appear here') ||
            translated.includes('Translation failed') ||
            translated.includes('Please check your internet')) {
            this.showToast('Nothing to save. Please translate some text first.', 'error');
            return;
        }

        const entry = {
            sourceText: source,
            translatedText: translated,
            targetLanguage: targetLanguage?.value || '',
            detectedLanguage: this.lastDetectedLanguage || 'auto'
        };

        this.saveToVocab(entry);
        this.showToast('Saved to My Words.', 'success');
    }

    renderHistoryPreview() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        const history = this.loadHistory();
        if (!history.length) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-book-open"></i>
                    <p>No translations saved yet.</p>
                </div>
            `;
            return;
        }

        const preview = history.slice(0, this.historyPreviewLimit)
            .map(item => `
                <article class="history-item">
                    <div class="history-text">
                        <span>Source</span>
                        <p>${this.escapeHtml(item.sourceText)}</p>
                    </div>
                    <div class="history-text">
                        <span>Translation</span>
                        <p>${this.escapeHtml(item.translatedText)}</p>
                    </div>
                    <div class="history-meta">
                        <div>
                            <strong>${this.getLanguageName(item.detectedLanguage)}</strong>
                            <span> → ${this.getLanguageName(item.targetLanguage)}</span>
                        </div>
                        <div class="history-timestamp">${this.formatTimestamp(item.timestamp)}</div>
                    </div>
                </article>
            `).join('');

        historyList.innerHTML = preview;
    }

    renderVocabPreview() {
        const vocabList = document.getElementById('vocabList');
        if (!vocabList) return;

        const vocab = this.loadVocab();
        if (!vocab.length) {
            vocabList.innerHTML = `
                <div class="vocab-empty">
                    <i class="fas fa-book-open"></i>
                    <p>No words saved yet.</p>
                </div>
            `;
            return;
        }

        const markup = vocab.map(item => `
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

        vocabList.innerHTML = markup;
    }

    getLanguageName(code) {
        if (!code || code === 'auto') return 'Auto';
        return this.languages[code] || code;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
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
}

let translatorInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    translatorInstance = new LexiGoTranslator();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (translatorInstance) {
        // Stop speech recognition
        if (translatorInstance.isListening && translatorInstance.recognition) {
            translatorInstance.recognition.stop();
        }
        // Stop speech synthesis
        if (translatorInstance.isSpeaking && translatorInstance.synthesis) {
            translatorInstance.synthesis.cancel();
        }
    }
});
