// LexiGo Image OCR (image to text) - kept separate from core translator logic
class LexiGoImageOCR {
    constructor() {
        this.imageInputBtn = document.getElementById('imageInputBtn');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.inputText = document.getElementById('inputText');

        this.bindEvents();
    }

    bindEvents() {
        if (!this.imageInputBtn || !this.imageInput) return;

        this.imageInputBtn.addEventListener('click', () => {
            this.imageInput.click();
        });

        this.imageInput.addEventListener('change', (event) => this.handleImageInput(event));
    }

    async handleImageInput(event) {
        const input = event.target;
        const files = input.files;
        const preview = this.imagePreview;

        if (!files || !files.length) {
            this.resetPreview();
            return;
        }

        const file = files[0];

        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file.', 'error');
            input.value = '';
            return;
        }

        if (file.size > 6 * 1024 * 1024) {
            this.showToast('Image is too large. Please choose a file under 6 MB.', 'error');
            input.value = '';
            return;
        }

        try {
            await this.ensureTesseractLoaded();
        } catch (e) {
            this.showToast('Image reading engine failed to load. Please check your connection and try again.', 'error');
            return;
        }

        if (preview) {
            preview.classList.add('processing');

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result;
                preview.innerHTML = `
                    <img src="${imageUrl}" alt="Selected image for text detection">
                    <div>
                        <div class="image-preview-text-strong">Reading text from image...</div>
                        <div class="image-preview-text">Keep this tab open. This may take a few seconds.</div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }

        try {
            const { data } = await Tesseract.recognize(
                file,
                'eng',
                {
                    logger: () => { /* silence logs in UI */ }
                }
            );

            const extractedText = (data && data.text ? data.text : '').trim();

            if (!extractedText) {
                this.showToast('No clear text found in the image.', 'error');
                if (preview) {
                    preview.classList.remove('processing');
                    preview.innerHTML = `
                        <i class="fas fa-image"></i>
                        <span class="image-preview-text">No text detected. Try a clearer image.</span>
                    `;
                }
                return;
            }

            if (this.inputText) {
                this.inputText.value = extractedText;

                // Use main translator instance if available to keep behaviour consistent
                if (window.translatorInstance) {
                    window.translatorInstance.updateCharCount();
                    window.translatorInstance.autoTranslate();
                }
            }

            this.showToast('Text extracted from image!', 'success');

            if (preview) {
                preview.classList.remove('processing');
                preview.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span class="image-preview-text-strong">Image processed successfully.</span>
                `;
            }
        } catch (error) {
            console.error('Image OCR error:', error);
            this.showToast('Failed to read text from image. Please try a clearer photo.', 'error');
            this.resetPreview(true);
        } finally {
            input.value = '';
        }
    }

    ensureTesseractLoaded() {
        if (window.Tesseract) {
            return Promise.resolve();
        }

        if (this.tesseractPromise) {
            return this.tesseractPromise;
        }

        this.tesseractPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.async = true;
            script.onload = () => {
                if (window.Tesseract) {
                    resolve();
                } else {
                    reject(new Error('Tesseract not available after load'));
                }
            };
            script.onerror = () => reject(new Error('Failed to load Tesseract script'));
            document.head.appendChild(script);
        });

        return this.tesseractPromise;
    }

    resetPreview(showDefault = false) {
        if (!this.imagePreview) return;

        this.imagePreview.classList.remove('processing');
        this.imagePreview.innerHTML = `
            <i class="fas fa-image"></i>
            <span class="image-preview-text">${
                showDefault
                    ? 'Tap the camera to read text from an image.'
                    : 'Tap the camera to read text from an image.'
            }</span>
        `;
    }

    showToast(message, type = 'info') {
        // Reuse global toaster if available
        if (window.translatorInstance && typeof window.translatorInstance.showToast === 'function') {
            window.translatorInstance.showToast(message, type);
            return;
        }

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
}

document.addEventListener('DOMContentLoaded', () => {
    new LexiGoImageOCR();
});


