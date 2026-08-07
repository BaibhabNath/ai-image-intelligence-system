document.addEventListener('DOMContentLoaded', () => {
    // Navigation Tabs
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            navButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(`tab-${targetTab}`);
            if (targetPane) targetPane.classList.add('active');

            if (targetTab === 'review') loadReviewQueue();
            if (targetTab === 'benchmarks') loadBenchmarks();
            if (targetTab === 'dataset') loadDataset();
        });
    });

    // Insights Inner Tabs
    const inTabs = document.querySelectorAll('.in-tab');
    const inContents = document.querySelectorAll('.in-content');
    inTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-in');
            inTabs.forEach(t => t.classList.remove('active'));
            inContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetContent = document.getElementById(`in-${target}`);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // Drag & Dropzone Setup
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    let selectedFile = null;

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                selectedFile = e.dataTransfer.files[0];
                updateDropzoneUI(selectedFile.name);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                updateDropzoneUI(selectedFile.name);
            }
        });
    }

    function updateDropzoneUI(filename) {
        const title = dropzone.querySelector('.drop-title');
        const sub = dropzone.querySelector('.drop-sub');
        if (title) title.textContent = `Selected: ${filename}`;
        if (sub) sub.textContent = "Click or drag another image to replace";
    }

    // Form Submission Handler
    const analyzeForm = document.getElementById('analyze-form');
    const btnSpinner = document.getElementById('btn-spinner');
    const btnText = document.getElementById('btn-text');

    if (analyzeForm) {
        analyzeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const modelSelect = document.getElementById('model-select');
            const apiKeyInput = document.getElementById('api-key-input');
            const urlInput = document.getElementById('url-input');

            const modelChoice = modelSelect ? modelSelect.value : "gemini-flash-2.5";
            const apiKey = apiKeyInput ? apiKeyInput.value : "";
            const urlVal = urlInput ? urlInput.value : "";

            if (!selectedFile && !urlVal) {
                alert('Please select an image file or enter an image URL.');
                return;
            }

            const formData = new FormData();
            formData.append('model_choice', modelChoice);
            if (selectedFile) formData.append('file', selectedFile);
            if (urlVal) formData.append('image_url', urlVal);

            if (btnSpinner) btnSpinner.classList.remove('hidden');
            if (btnText) btnText.textContent = "Analyzing Image...";

            try {
                const headers = {};
                if (apiKey.trim()) headers['X-API-Key'] = apiKey.trim();

                const resp = await fetch('/api/v1/analyze', {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });

                if (!resp.ok) {
                    const err = await resp.json();
                    throw new Error(err.detail || 'Analysis request failed.');
                }

                const data = await resp.json();
                renderResults(data, selectedFile, urlVal);
            } catch (error) {
                alert(`Analysis Error: ${error.message}`);
            } finally {
                if (btnSpinner) btnSpinner.classList.add('hidden');
                if (btnText) btnText.textContent = "Run Intelligence Pipeline";
            }
        });
    }

    // Render Analysis Results & Canvas Overlays
    let currentAnalysisData = null;

    function renderResults(data, file, url) {
        currentAnalysisData = data;
        const emptyState = document.getElementById('empty-state');
        const resultsView = document.getElementById('results-view');
        
        if (emptyState) emptyState.classList.add('hidden');
        if (resultsView) resultsView.classList.remove('hidden');

        // Text & Badges
        const resSummary = document.getElementById('res-summary');
        const resCaption = document.getElementById('res-caption');
        const resStatus = document.getElementById('res-status');

        if (resSummary) resSummary.textContent = data.summary;
        if (resCaption) resCaption.textContent = data.caption || "Image description generated successfully.";
        
        if (resStatus) {
            resStatus.textContent = data.status.toUpperCase();
            if (data.status === 'flagged_for_review') {
                resStatus.classList.add('flagged');
            } else {
                resStatus.classList.remove('flagged');
            }
        }

        // Metrics Pills
        const mLatency = document.getElementById('m-latency');
        const mConfidence = document.getElementById('m-confidence');
        const mScene = document.getElementById('m-scene');
        const mSafety = document.getElementById('m-safety');

        if (mLatency) mLatency.textContent = `${data.processing_time_ms} ms`;
        if (mConfidence) mConfidence.textContent = `${Math.round(data.overall_confidence * 100)}%`;
        if (mScene) mScene.textContent = data.scene;
        if (mSafety) mSafety.textContent = data.safety.is_safe ? 'Safe' : 'FLAGGED';

        // Preview Image & Canvas Overlays
        const previewImg = document.getElementById('preview-img');
        if (previewImg) {
            if (file) {
                previewImg.src = URL.createObjectURL(file);
            } else if (url) {
                previewImg.src = url;
            }

            previewImg.onload = () => {
                drawOverlays(data);
            };
        }

        // Object Detection List
        const listObjects = document.getElementById('list-objects');
        const countObjects = document.getElementById('count-objects');
        if (listObjects) {
            listObjects.innerHTML = '';
            if (countObjects) countObjects.textContent = data.objects.length;
            data.objects.forEach(obj => {
                const li = document.createElement('li');
                li.innerHTML = `<span><strong>${obj.label}</strong></span> <span>Conf: ${Math.round(obj.confidence * 100)}%</span>`;
                listObjects.appendChild(li);
            });
        }

        // OCR List
        const listOcr = document.getElementById('list-ocr');
        const countOcr = document.getElementById('count-ocr');
        if (listOcr) {
            listOcr.innerHTML = '';
            if (countOcr) countOcr.textContent = data.ocr.length;
            data.ocr.forEach(ocr => {
                const li = document.createElement('li');
                li.innerHTML = `<span>"${ocr.text}" (${ocr.location})</span> <span>Conf: ${Math.round(ocr.confidence * 100)}%</span>`;
                listOcr.appendChild(li);
            });
        }

        // Raw JSON Output
        const jsonCode = document.getElementById('json-code');
        if (jsonCode) jsonCode.textContent = JSON.stringify(data, null, 2);
    }

    function drawOverlays(data) {
        const img = document.getElementById('preview-img');
        const canvas = document.getElementById('overlay-canvas');
        if (!img || !canvas) return;

        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Object Bounding Boxes (Green)
        data.objects.forEach(obj => {
            if (obj.bbox) {
                const ymin = (obj.bbox.ymin / 1000) * canvas.height;
                const xmin = (obj.bbox.xmin / 1000) * canvas.width;
                const ymax = (obj.bbox.ymax / 1000) * canvas.height;
                const xmax = (obj.bbox.xmax / 1000) * canvas.width;

                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 2;
                ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillText(`${obj.label} (${Math.round(obj.confidence * 100)}%)`, xmin + 4, ymin + 16);
            }
        });

        // Draw OCR Bounding Boxes (Purple)
        data.ocr.forEach(ocr => {
            if (ocr.bbox) {
                const ymin = (ocr.bbox.ymin / 1000) * canvas.height;
                const xmin = (ocr.bbox.xmin / 1000) * canvas.width;
                const ymax = (ocr.bbox.ymax / 1000) * canvas.height;
                const xmax = (ocr.bbox.xmax / 1000) * canvas.width;

                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);
                ctx.setLineDash([]);
            }
        });
    }

    // Copy JSON Button
    const copyBtn = document.getElementById('btn-copy-json');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!currentAnalysisData) return;
            navigator.clipboard.writeText(JSON.stringify(currentAnalysisData, null, 2));
            alert('Analysis JSON copied to clipboard!');
        });
    }
});
