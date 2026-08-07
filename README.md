# AI Image Intelligence System

An enterprise-grade, high-performance **AI Image Intelligence Service** that converts raw images into structured, machine-readable JSON insights. Supports Object Detection (with normalized bounding boxes), Layout-Aware OCR, Content & Scenario Analysis (violence, fire, weapons, crowds), Content Moderation, and a built-in Human-in-the-Loop Review Dashboard.

![Track 1 Vision System](https://img.shields.io/badge/Track-1%20AI%20Image%20Intelligence-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![Docker](https://img.shields.io/badge/Docker-Supported-blue)

---

## 📸 Key Features & Capabilities

- 🔍 **Image Understanding**: Object detection with bounding box coordinates `[ymin, xmin, ymax, xmax]`, scene recognition, captioning, and dominant color analysis.
- 📝 **Layout-Aware OCR**: Extracts text while preserving spatial layout regions.
- ⚠️ **Content Scenario Analysis**: Flags specific scenarios of interest (violence, fire, smoke, weapons, accidents, crowds, animals).
- 🛡️ **Content Safety & Moderation**: Automated NSFW and sensitive material detection.
- 🤝 **Human-in-the-Loop Audit Queue**: Borderline images are automatically routed to an interactive web moderation dashboard.
- ⚡ **Multi-Model Support**: Switch between **Gemini 2.5 Flash**, **Gemini 2.5 Pro**, and **Local Offline Vision Engine**.

---

## 🚀 Quick Start (Local Run)

### 1. Prerequisites
- Python 3.10+ installed
- (Optional) `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/)

### 2. Install & Run in 30 Seconds

```bash
# Navigate to project folder
cd C:\Users\baibh\.gemini\antigravity\scratch\ai-image-intelligence-system

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your API key
# Windows PowerShell:
$env:GEMINI_API_KEY="your_api_key_here"

# Start application
python run.py
```

Open your browser to:
- 🌐 **Web Studio Dashboard**: [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive OpenAPI Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🛡️ **Human Review Queue**: [http://localhost:8000/#review](http://localhost:8000/#review)

---

## 🐳 Docker Deployment Instructions

### Option A: Using Docker Compose (Recommended)

```bash
# Build & start container
docker-compose up --build -d

# Check running container status
docker-compose ps
```

The service will be live at `http://localhost:8000`.

### Option B: Using Standalone Docker CLI

```bash
# Build image
docker build -t ai-image-intelligence .

# Run container with API key
docker run -d -p 8000:8000 -e GEMINI_API_KEY="your_key" --name vision_service ai-image-intelligence
```

---

## ☁️ Cloud Deployment Guides

### Deploying to Google Cloud Run

```bash
# Authenticate gcloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and deploy to Cloud Run
gcloud run deploy image-intelligence-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_api_key"
```

### Deploying to Render / Railway / AWS App Runner
1. Push repository to GitHub.
2. Select **Docker Runtime**.
3. Set environment variable `GEMINI_API_KEY`.
4. Deploy!

---

## 📡 REST API Reference

### 1. Analyze Single Image
`POST /api/v1/analyze`

**cURL Example (File Upload)**:
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -F "file=@sample.jpg" \
  -F "model_choice=gemini-flash-2.5"
```

**cURL Example (Image URL)**:
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -F "image_url=https://example.com/retail.jpg" \
  -F "model_choice=gemini-flash-2.5"
```

**Sample Output JSON**:
```json
{
  "id": "img_a1b2c3d4e5f6",
  "status": "success",
  "model_used": "Google GEMINI-2.5-FLASH Multimodal Pipeline",
  "confidence_level": "High",
  "overall_confidence": 0.96,
  "caption": "A supermarket retail aisle with stacked shelf items and price tags.",
  "scene": "Retail Store Interior",
  "objects": [
    {
      "label": "Grocery Shelf",
      "confidence": 0.98,
      "bbox": { "ymin": 150, "xmin": 50, "ymax": 900, "xmax": 950 }
    }
  ],
  "ocr": [
    {
      "text": "SPECIAL OFFER $3.99",
      "location": "Upper Left Shelf Tag",
      "confidence": 0.99,
      "bbox": { "ymin": 220, "xmin": 130, "ymax": 250, "xmax": 310 }
    }
  ],
  "content_analysis": {
    "scenarios_detected": ["retail_display"],
    "violence": false,
    "fire": false,
    "smoke": false,
    "weapon": false,
    "accident": false,
    "crowd": false,
    "animal": false,
    "details": "Standard commercial retail environment."
  },
  "safety": {
    "is_safe": true,
    "nsfw": false,
    "sensitive": false,
    "violence": false,
    "weapon": false,
    "requires_human_review": false,
    "flag_reason": null
  },
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "JPEG",
    "aspect_ratio": "1.78:1",
    "dominant_colors": ["#E2E8F0", "#3182CE"]
  },
  "processing_time_ms": 420.5,
  "summary": "High-confidence detection of retail inventory items and price tag text extraction."
}
```

### 2. Batch Image Analysis
`POST /api/v1/analyze/batch`
```json
{
  "urls": [
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
  ],
  "model_choice": "gemini-flash-2.5"
}
```

### 3. List Candidate Models & Specs
`GET /api/v1/models`

### 4. Fetch Benchmarks & Evaluation Report
`GET /api/v1/eval-report`

### 5. Human Review Queue
`GET /api/v1/reviews` & `POST /api/v1/reviews/{review_id}/action`

---

## 🧪 Automated Testing

Run the Pytest test suite:
```bash
pytest tests/
```

---

## 📂 Project Structure

```
ai-image-intelligence-system/
├── app/
│   ├── main.py              # FastAPI entry point & CORS
│   ├── schemas.py           # Pydantic data schemas
│   ├── api/
│   │   └── endpoints.py     # REST API routes
│   ├── services/
│   │   ├── vision_engine.py # Gemini & Local vision pipelines
│   │   └── review_queue.py  # Human-in-the-loop audit manager
│   └── static/
│       ├── index.html       # Modern Web Studio UI
│       ├── css/style.css    # Dark mode & glassmorphism styles
│       └── js/app.js        # Canvas BBox overlay & UI logic
├── test_dataset/            # Sample dataset and outputs
├── tests/                   # Pytest automated test suite
├── Dockerfile               # Production multi-stage Docker build
├── docker-compose.yml       # One-command orchestration
├── requirements.txt         # Dependencies
├── MODEL_SELECTION.md       # Model architecture documentation
├── EVALUATION_REPORT.md     # Benchmarking & performance report
└── run.py                   # Local zero-friction runner
```

---

## 📄 License
MIT License. Built for Track 1 AI Image Intelligence System.
