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

    // Drag & Dropzone
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    let selectedFile = null;

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
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

    // Form Submission
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

    let currentAnalysisData = null;

    function renderResults(data, file, url) {
        currentAnalysisData = data;
        const emptyState = document.getElementById('empty-state');
        const resultsView = document.getElementById('results-view');
        
        if (emptyState) emptyState.classList.add('hidden');
        if (resultsView) resultsView.classList.remove('hidden');

        document.getElementById('res-summary').textContent = data.summary;
        document.getElementById('res-caption').textContent = data.caption || "Image description generated successfully.";
        
        const resStatus = document.getElementById('res-status');
        if (resStatus) {
            resStatus.textContent = data.status.toUpperCase();
            if (data.status === 'flagged_for_review') resStatus.classList.add('flagged');
            else resStatus.classList.remove('flagged');
        }

        // Render Minute Details Grid
        const minuteGrid = document.getElementById('minute-grid');
        if (minuteGrid && data.minute_details) {
            minuteGrid.innerHTML = '';
            Object.entries(data.minute_details).forEach(([key, val]) => {
                const item = document.createElement('div');
                item.className = 'minute-item';
                item.innerHTML = `<span class="minute-key">${key}</span><span class="minute-val">${val}</span>`;
                minuteGrid.appendChild(item);
            });
        }

        document.getElementById('m-latency').textContent = `${data.processing_time_ms} ms`;
        document.getElementById('m-confidence').textContent = `${Math.round(data.overall_confidence * 100)}%`;
        document.getElementById('m-scene').textContent = data.scene;
        document.getElementById('m-safety').textContent = data.safety.is_safe ? 'Safe' : 'FLAGGED';

        const previewImg = document.getElementById('preview-img');
        if (previewImg) {
            if (file) previewImg.src = URL.createObjectURL(file);
            else if (url) previewImg.src = url;
            previewImg.onload = () => drawOverlays(data);
        }

        const listObjects = document.getElementById('list-objects');
        if (listObjects) {
            listObjects.innerHTML = '';
            document.getElementById('count-objects').textContent = data.objects.length;
            data.objects.forEach(obj => {
                const li = document.createElement('li');
                const badgeColor = obj.is_hazard ? '#ef4444' : '#10b981';
                li.innerHTML = `<span><strong style="color: ${badgeColor}">${obj.is_hazard ? '🔴' : '🟢'} ${obj.label}</strong></span> <span>Conf: ${Math.round(obj.confidence * 100)}%</span>`;
                listObjects.appendChild(li);
            });
        }

        const listOcr = document.getElementById('list-ocr');
        if (listOcr) {
            listOcr.innerHTML = '';
            document.getElementById('count-ocr').textContent = data.ocr.length;
            data.ocr.forEach(ocr => {
                const li = document.createElement('li');
                li.innerHTML = `<span>🟣 "${ocr.text}" (${ocr.location})</span> <span>Conf: ${Math.round(ocr.confidence * 100)}%</span>`;
                listOcr.appendChild(li);
            });
        }

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

        // Draw Objects: Green for Normal, Red for Hazard
        data.objects.forEach(obj => {
            if (obj.bbox) {
                const ymin = (obj.bbox.ymin / 1000) * canvas.height;
                const xmin = (obj.bbox.xmin / 1000) * canvas.width;
                const ymax = (obj.bbox.ymax / 1000) * canvas.height;
                const xmax = (obj.bbox.xmax / 1000) * canvas.width;

                const color = obj.is_hazard ? '#ef4444' : '#10b981';
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

                ctx.fillStyle = color;
                ctx.fillRect(xmin, ymin > 20 ? ymin - 20 : ymin, ctx.measureText(obj.label).width + 50, 20);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillText(`${obj.label} (${Math.round(obj.confidence * 100)}%)`, xmin + 4, ymin > 20 ? ymin - 6 : ymin + 14);
            }
        });

        // Draw OCR: Purple Dashed Bounding Boxes
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

    // Auto-load Review Queue, Benchmarks & Dataset on init
    async function loadReviewQueue() {
        const reviewList = document.getElementById('review-list');
        if (!reviewList) return;
        reviewList.innerHTML = '<p class="text-muted">Loading pending reviews...</p>';

        try {
            const resp = await fetch('/api/v1/reviews');
            const reviews = await resp.json();
            document.getElementById('review-count').textContent = reviews.length;

            if (reviews.length === 0) {
                reviewList.innerHTML = '<p class="text-muted">No items pending in the review queue.</p>';
                return;
            }

            reviewList.innerHTML = '';
            reviews.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '16px';
                card.innerHTML = `
                    <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                        ${item.image_data_url ? `<img src="${item.image_data_url}" style="width: 110px; height: 110px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border-color);">` : ''}
                        <div style="flex: 1;">
                            <h3 style="font-size: 15px; font-weight: 700; color: #f8fafc;">Review ID: ${item.review_id}</h3>
                            <p style="font-size: 13px; color: var(--warning); margin-top: 4px;"><strong>Flag Reason:</strong> ${item.flag_reason}</p>
                            <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;"><strong>Model Engine:</strong> ${item.analysis.model_used}</p>
                            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;"><strong>Status:</strong> <span class="badge">${item.status.toUpperCase()}</span></p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-sm btn-primary" onclick="actReview('${item.review_id}', 'approve')">Approve</button>
                            <button class="btn btn-sm" style="background: var(--danger); color: white;" onclick="actReview('${item.review_id}', 'reject')">Reject</button>
                        </div>
                    </div>
                `;
                reviewList.appendChild(card);
            });
        } catch (e) {
            reviewList.innerHTML = `<p class="text-muted">Failed to load review queue: ${e.message}</p>`;
        }
    }

    window.actReview = async (reviewId, action) => {
        try {
            const resp = await fetch(`/api/v1/reviews/${reviewId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action, auditor_notes: `Audited by human reviewer.` })
            });
            if (resp.ok) {
                alert(`Review item ${reviewId} successfully ${action}d!`);
                loadReviewQueue();
            }
        } catch (e) {
            alert(`Failed: ${e.message}`);
        }
    };

    async function loadBenchmarks() {
        const tbody = document.getElementById('benchmark-rows');
        if (!tbody) return;
        try {
            const resp = await fetch('/api/v1/eval-report');
            const data = await resp.json();
            tbody.innerHTML = '';
            data.metrics.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${m.name}</strong></td>
                    <td>${(m.object_detection_mAP * 100).toFixed(1)}%</td>
                    <td>${(m.ocr_word_error_rate * 100).toFixed(1)}%</td>
                    <td>${(m.safety_recall * 100).toFixed(1)}%</td>
                    <td>${m.p95_latency_ms} ms</td>
                    <td>${m.avg_cost_per_1k}</td>
                    <td><span class="badge" style="color: #38bdf8">${m.model_id.includes('flash') ? 'Optimal Speed & Cost' : (m.model_id.includes('pro') ? 'Maximum Accuracy' : 'Offline Zero Cost')}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7">Failed to load benchmarks.</td></tr>`;
        }
    }

    function loadDataset() {
        const grid = document.getElementById('dataset-grid');
        if (!grid) return;
        grid.innerHTML = `
            <div class="sample-card" onclick="runSample('https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800', 'car.jpg')">
                <img src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800" alt="Sports Automobile">
                <div class="sample-info">
                    <div class="sample-title">Automobile & Vehicle Inspection</div>
                    <div class="sample-desc">Extracts Brand, Model, Color, Wheel/Tire Specs, and Condition.</div>
                </div>
            </div>
            <div class="sample-card" onclick="runSample('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800', 'supermarket.jpg')">
                <img src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800" alt="Supermarket Store">
                <div class="sample-info">
                    <div class="sample-title">Retail Supermarket Store</div>
                    <div class="sample-desc">Tests Object Detection, Shelf Inventory, and Price Tag OCR.</div>
                </div>
            </div>
            <div class="sample-card" onclick="runSample('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'sneaker.jpg')">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" alt="Nike Sneaker">
                <div class="sample-info">
                    <div class="sample-title">Nike Red Sneaker</div>
                    <div class="sample-desc">Tests Brand Logo Detection, Primary Finish, and Footwear Specs.</div>
                </div>
            </div>
        `;
    }

    window.runSample = (url, name) => {
        document.querySelector('[data-tab="analyzer"]').click();
        document.getElementById('url-input').value = url;
        document.getElementById('btn-analyze').click();
    };

    // Auto-init review queue count and dataset on startup
    loadReviewQueue();
    loadBenchmarks();
    loadDataset();
});
