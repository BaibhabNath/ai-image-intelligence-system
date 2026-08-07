document.addEventListener('DOMContentLoaded', () => {
    // Navigation Tabs
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Dropzone interaction
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    let selectedFile = null;

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                dropzone.querySelector('.drop-title').textContent = `Selected: ${selectedFile.name}`;
            }
        });
    }

    // Form Submission
    const analyzeForm = document.getElementById('analyze-form');
    if (analyzeForm) {
        analyzeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const modelChoice = document.getElementById('model-select').value;
            const formData = new FormData();
            formData.append('model_choice', modelChoice);
            if (selectedFile) formData.append('file', selectedFile);

            try {
                const resp = await fetch('/api/v1/analyze', {
                    method: 'POST',
                    body: formData
                });
                const data = await resp.json();
                alert(`Analysis Finished! Scene: ${data.scene}`);
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        });
    }
});
