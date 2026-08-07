document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            navButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            if (targetTab === 'review') loadReviewQueue();
            if (targetTab === 'benchmarks') loadBenchmarks();
            if (targetTab === 'dataset') loadDataset();
        });
    });

    const inTabs = document.querySelectorAll('.in-tab');
    const inContents = document.querySelectorAll('.in-content');
    inTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-in');
            inTabs.forEach(t => t.classList.remove('active'));
            inContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`in-${target}`).classList.add('active');
        });
    });

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    let selectedFile = null;

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

    function updateDropzoneUI(filename) {
        dropzone.querySelector('.drop-title').textContent = `Selected: ${filename}`;
        dropzone.querySelector('.drop-sub').textContent = "Click or drag another to change";
    }

    const analyzeForm = document.getElementById('analyze-form');
    const btnSpinner = document.getElementById('btn-spinner');
    const btnText = document.getElementById('btn-text');

    analyzeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const modelChoice = document.getElementById('model-select').value;
        const userQuery = document.getElementById('user-query-input').value;
        const apiKey = document.getElementById('api-key-input').value;
        const urlInput = document.getElementById('url-input').value;

        if (!selectedFile && !urlInput) {
            alert('Please select an image file or enter an image URL.');
            return;
        }

        const formData = new FormData();
        formData.append('model_choice', modelChoice);
        if (userQuery.trim()) formData.append('user_query', userQuery.trim());
        if (selectedFile) formData.append('file', selectedFile);
        if (urlInput) formData.append('image_url', urlInput);

        btnSpinner.classList.remove('hidden');
        btnText.textContent = "Extracting Entity Properties...";

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
            renderResults(data, selectedFile, urlInput);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            btnSpinner.classList.add('hidden');
            btnText.textContent = "Extract Entity Properties";
        }
    });

    let currentAnalysisData = null;

    function renderResults(data, file, url) {
        currentAnalysisData = data;
        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('results-view').classList.remove('hidden');

        const qaCard = document.getElementById('query-answer-card');
        if (data.user_query_answer && data.user_query_answer.direct_answer) {
            qaCard.classList.remove('hidden');
            document.getElementById('qa-question').textContent = `Q: ${data.user_query_answer.user_query}`;
            document.getElementById('qa-answer').textContent = data.user_query_answer.direct_answer;
            document.getElementById('qa-confidence').textContent = `${data.user_query_answer.confidence} Confidence`;
        } else {
            qaCard.classList.add('hidden');
        }

        document.getElementById('res-scene').textContent = data.scene || "Visual Scene";
        document.getElementById('res-summary').textContent = data.summary;
        document.getElementById('res-caption').textContent = data.caption || "Image overview description.";
        
        const statusBadge = document.getElementById('res-status');
        statusBadge.textContent = data.status.toUpperCase();
        if (data.status === 'flagged_for_review') {
            statusBadge.classList.add('flagged');
        } else {
            statusBadge.classList.remove('flagged');
        }

        renderEntityCountsBar(data.overview ? data.overview.entity_counts : {});

        document.getElementById('m-latency').textContent = `${data.processing_time_ms} ms`;
        document.getElementById('m-confidence').textContent = `${Math.round(data.overall_confidence * 100)}%`;
        document.getElementById('m-format').textContent = `${data.metadata.format} (${data.metadata.width}x${data.metadata.height})`;
        document.getElementById('m-safety').textContent = data.safety.is_safe ? 'Safe' : 'FLAGGED';

        const previewImg = document.getElementById('preview-img');
        if (file) {
            previewImg.src = URL.createObjectURL(file);
        } else if (url) {
            previewImg.src = url;
        }

        previewImg.onload = () => {
            drawOverlays(data);
        };

        renderEntitiesAccordion(data.entities);
        renderComparisons(data.comparisons);
        renderSceneAndSpatial(data.scene_overview, data.spatial_relationships);
        renderEvidenceBreakdown(data.observed_vs_inferred);
        renderSafety(data.content_analysis, data.safety);

        document.getElementById('json-code').textContent = JSON.stringify(data, null, 2);
    }

    function renderEntityCountsBar(counts) {
        const bar = document.getElementById('entity-counts-bar');
        bar.innerHTML = '';

        const iconMap = {
            people: '👤 People',
            animals: '🐾 Animals',
            vehicles: '🚗 Vehicles',
            objects: '📦 Objects',
            buildings: '🏢 Buildings',
            plants: '🌿 Plants',
            food: '🍽️ Food',
            documents: '📄 Text/Docs',
            electronics: '📱 Electronics',
            fashion_items: '👗 Fashion'
        };

        for (const [key, count] of Object.entries(counts)) {
            if (count > 0) {
                const pill = document.createElement('span');
                pill.className = 'count-pill active-count';
                pill.textContent = `${iconMap[key] || key}: ${count}`;
                bar.appendChild(pill);
            }
        }
    }

    function renderEntitiesAccordion(entities) {
        const accordion = document.getElementById('categories-accordion');
        accordion.innerHTML = '';

        if (!entities) {
            accordion.innerHTML = '<p class="text-muted">No categorized entities returned.</p>';
            return;
        }

        const categoryConfig = [
            { key: 'people', label: '👤 People / Human Profiles', items: entities.people },
            { key: 'animals', label: '🐾 Animals', items: entities.animals },
            { key: 'vehicles', label: '🚗 Vehicles', items: entities.vehicles },
            { key: 'objects', label: '📦 Non-Living Objects', items: entities.objects },
            { key: 'buildings', label: '🏢 Buildings & Architecture', items: entities.buildings },
            { key: 'plants', label: '🌿 Plants & Vegetation', items: entities.plants },
            { key: 'food', label: '🍽️ Food & Beverages', items: entities.food },
            { key: 'documents', label: '📄 Documents & Readable Text', items: entities.documents },
            { key: 'electronics', label: '📱 Electronic Devices', items: entities.electronics },
            { key: 'fashion_items', label: '👗 Clothing & Fashion Items', items: entities.fashion_items }
        ];

        categoryConfig.forEach(cat => {
            if (cat.items && cat.items.length > 0) {
                const catGroup = document.createElement('div');
                catGroup.className = 'category-group';

                const catHeader = document.createElement('div');
                catHeader.className = 'category-header';
                catHeader.innerHTML = `<span>${cat.label}</span> <span class="pill-count">${cat.items.length}</span>`;

                const catBody = document.createElement('div');
                catBody.className = 'category-body';

                cat.items.forEach(item => {
                    const card = createEntityCard(cat.key, item);
                    catBody.appendChild(card);
                });

                catGroup.appendChild(catHeader);
                catGroup.appendChild(catBody);
                accordion.appendChild(catGroup);
            }
        });

        if (accordion.children.length === 0) {
            accordion.innerHTML = '<p class="text-muted">No specific entity profiles detected in scene.</p>';
        }
    }

    function createEntityCard(category, item) {
        const card = document.createElement('div');
        card.className = 'entity-card';

        const idStr = item.id || item.name || item.item_name || "Entity";
        const confStr = item.confidence || "High";

        let propsHTML = '';
        for (const [k, v] of Object.entries(item)) {
            if (['id', 'confidence', 'bbox'].includes(k)) continue;

            const keyFormatted = k.replace(/_/g, ' ');
            let valDisplay = v;

            if (Array.isArray(v)) {
                valDisplay = v.length > 0 ? v.join(', ') : 'None visible';
            } else if (typeof v === 'object' && v !== null) {
                valDisplay = JSON.stringify(v);
            }

            const isUnclear = String(valDisplay).toLowerCase().includes('not clearly visible') || 
                              String(valDisplay).toLowerCase().includes('cannot be determined');

            propsHTML += `
                <div class="prop-pair">
                    <span class="prop-key">${keyFormatted}</span>
                    <span class="prop-val ${isUnclear ? 'unclear' : ''}">${valDisplay || 'Not visible'}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="entity-title-bar">
                <span class="entity-name">${idStr}</span>
                <span class="entity-conf">${confStr} Confidence</span>
            </div>
            <div class="entity-props-grid">
                ${propsHTML}
            </div>
        `;

        return card;
    }

    function renderComparisons(comparisons) {
        const container = document.getElementById('comparisons-container');
        container.innerHTML = '';

        if (!comparisons || comparisons.length === 0) {
            container.innerHTML = '<p class="text-muted">No multiple entities of the same category detected for side-by-side comparison.</p>';
            return;
        }

        comparisons.forEach(comp => {
            const card = document.createElement('div');
            card.className = 'comparison-card';

            let tableHeader = `<th>Attribute</th>` + comp.compared_entities.map(e => `<th>${e}</th>`).join('');
            let tableRows = '';

            for (const [attr, vals] of Object.entries(comp.comparison_attributes)) {
                let cells = `<td><strong>${attr}</strong></td>` + vals.map(v => `<td>${v}</td>`).join('');
                tableRows += `<tr>${cells}</tr>`;
            }

            card.innerHTML = `
                <h4>⚖️ ${comp.category_name}</h4>
                <div class="table-responsive">
                    <table class="comparison-table">
                        <thead><tr>${tableHeader}</tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function renderSceneAndSpatial(sceneOverview, spatialRels) {
        if (sceneOverview) {
            document.getElementById('sc-setting').textContent = sceneOverview.environment_setting || '-';
            document.getElementById('sc-lighting').textContent = sceneOverview.lighting_exposure || '-';
            if (sceneOverview.image_composition) {
                const compStr = Object.entries(sceneOverview.image_composition).map(([k, v]) => `${k}: ${v}`).join(' | ');
                document.getElementById('sc-framing').textContent = compStr || '-';
            }
        }

        const relList = document.getElementById('spatial-relationships-list');
        relList.innerHTML = '';
        if (spatialRels && spatialRels.length > 0) {
            spatialRels.forEach(sr => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${sr.entity_a}</strong> <em>${sr.relationship}</em> <strong>${sr.entity_b}</strong>`;
                relList.appendChild(li);
            });
        } else {
            relList.innerHTML = '<li class="text-muted">No explicit spatial interaction links established.</li>';
        }
    }

    function renderEvidenceBreakdown(evi) {
        const obsList = document.getElementById('list-observed');
        const infList = document.getElementById('list-inferred');
        const unkList = document.getElementById('list-unknown');

        obsList.innerHTML = evi.directly_observed.map(i => `<li>✓ ${i}</li>`).join('') || '<li class="text-muted">None</li>';
        infList.innerHTML = evi.reasonably_inferred.map(i => `<li>💡 ${i}</li>`).join('') || '<li class="text-muted">None</li>';
        unkList.innerHTML = evi.unknown_unclear.map(i => `<li>❓ ${i}</li>`).join('') || '<li class="text-muted">None</li>';
    }

    function renderSafety(ca, sf) {
        const scDetails = document.getElementById('scenario-details');
        scDetails.innerHTML = `
            <p><strong>Scenarios Detected:</strong> ${ca.scenarios_detected.join(', ') || 'None'}</p>
            <p><strong>Narrative Explanation:</strong> ${ca.details}</p>
            <hr style="margin: 12px 0; border-color: var(--card-border)">
            <p><strong>NSFW Flag:</strong> ${sf.nsfw ? '⚠️ Flagged' : 'Passed Clean'}</p>
            <p><strong>Violence Flag:</strong> ${sf.violence ? '⚠️ Flagged' : 'Passed Clean'}</p>
            <p><strong>Weapon Flag:</strong> ${sf.weapon ? '⚠️ Flagged' : 'Passed Clean'}</p>
            <p><strong>Requires Human Audit Queue:</strong> ${sf.requires_human_review ? '⚠️ YES (Queued)' : 'No Audit Required'}</p>
        `;
    }

    function drawOverlays(data) {
        const img = document.getElementById('preview-img');
        const canvas = document.getElementById('overlay-canvas');
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colorMap = {
            people: '#3b82f6',
            animals: '#f59e0b',
            vehicles: '#ef4444',
            objects: '#10b981',
            buildings: '#8b5cf6',
            documents: '#eab308',
            electronics: '#06b6d4',
            plants: '#22c55e',
            food: '#f97316'
        };

        if (data.objects) {
            data.objects.forEach(obj => {
                if (obj.bbox) {
                    const ymin = (obj.bbox.ymin / 1000) * canvas.height;
                    const xmin = (obj.bbox.xmin / 1000) * canvas.width;
                    const ymax = (obj.bbox.ymax / 1000) * canvas.height;
                    const xmax = (obj.bbox.xmax / 1000) * canvas.width;

                    const color = colorMap[obj.category] || '#10b981';

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

                    ctx.fillStyle = color;
                    ctx.font = '11px Inter, sans-serif';
                    ctx.fillText(`${obj.label} (${Math.round(obj.confidence * 100)}%)`, xmin + 4, ymin + 14);
                }
            });
        }
    }

    document.getElementById('btn-copy-json').addEventListener('click', () => {
        if (!currentAnalysisData) return;
        navigator.clipboard.writeText(JSON.stringify(currentAnalysisData, null, 2));
        alert('Universal Analysis JSON copied to clipboard!');
    });

    async function loadReviewQueue() {
        const reviewList = document.getElementById('review-list');
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
                    <div style="display: flex; gap: 16px; align-items: center;">
                        ${item.image_data_url ? `<img src="${item.image_data_url}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">` : ''}
                        <div style="flex: 1;">
                            <h3>Review ID: ${item.review_id}</h3>
                            <p><strong>Reason:</strong> ${item.flag_reason}</p>
                            <p><strong>Model Used:</strong> ${item.analysis.model_used}</p>
                            <p><strong>Status:</strong> ${item.status}</p>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-primary" onclick="actReview('${item.review_id}', 'approve')">Approve</button>
                            <button class="btn btn-sm btn-secondary" style="margin-top: 6px; background: var(--danger)" onclick="actReview('${item.review_id}', 'reject')">Reject</button>
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
                body: JSON.stringify({ action: action, auditor_notes: `Audited via Web Studio.` })
            });
            if (resp.ok) {
                alert(`Review item ${reviewId} marked as ${action}d.`);
                loadReviewQueue();
            }
        } catch (e) {
            alert(`Failed action: ${e.message}`);
        }
    };

    async function loadBenchmarks() {
        const tbody = document.getElementById('benchmark-rows');
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
                    <td>${m.model_id.includes('flash') ? 'Optimal Balance' : (m.model_id.includes('pro') ? 'Maximum Accuracy' : 'Zero Cloud Latency')}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7">Failed to load benchmarks.</td></tr>`;
        }
    }

    function loadDataset() {
        const grid = document.getElementById('dataset-grid');
        grid.innerHTML = `
            <div class="sample-card" onclick="runSample('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600', 'How many products and shelves are visible?')">
                <img src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600" alt="Retail Supermarket">
                <div class="sample-info">
                    <div class="sample-title">Complex Supermarket Store</div>
                    <div class="sample-desc">Multi-entity: Objects, Product Layout, Text OCR, Building Interior.</div>
                </div>
            </div>
            <div class="sample-card" onclick="runSample('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'What brand is this sneaker?')">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600" alt="Product Branding">
                <div class="sample-info">
                    <div class="sample-title">Nike Sneaker Fashion Item</div>
                    <div class="sample-desc">Single-subject Fashion/Product property extraction & branding.</div>
                </div>
            </div>
            <div class="sample-card" onclick="runSample('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600', 'What are the people doing?')">
                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600" alt="Office Collaboration">
                <div class="sample-info">
                    <div class="sample-title">Multi-Person Office Collaboration</div>
                    <div class="sample-desc">Multi-person profiles, side-by-side comparison, laptops & spatial posture.</div>
                </div>
            </div>
        `;
    }

    window.runSample = (url, query) => {
        document.querySelector('[data-tab="analyzer"]').click();
        document.getElementById('url-input').value = url;
        if (query) document.getElementById('user-query-input').value = query;
        document.getElementById('btn-analyze').click();
    };
});
