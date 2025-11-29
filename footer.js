document.addEventListener('DOMContentLoaded', () => {
    const mountPoint = document.getElementById('globalFooter');
    if (!mountPoint) return;

    fetch('footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load footer');
            }
            return response.text();
        })
        .then(html => {
            mountPoint.innerHTML = html;
        })
        .catch(error => {
            console.error('Footer load error:', error);
        });
});


