# Model Selection & Architecture Rationale

## 1. Architectural Strategy

The **AI Image Intelligence System** implements a **multimodal, multi-stage vision pipeline** designed to balance state-of-the-art inference accuracy, low latency, cost efficiency, and fallback resilience.

```
                   ┌────────────────────────────────────────┐
                   │           Incoming Request             │
                   └───────────────────┬────────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
            ┌─────────────────────────┐ ┌─────────────────────────┐
            │   Gemini 2.5 Flash      │ │    Gemini 2.5 Pro       │
            │ (Fast, Multimodal API)  │ │   (Deep Precision API)  │
            └────────────┬────────────┘ └────────────┬────────────┘
                         │                           │
                         └─────────────┬─────────────┘
                                       │
                                       ▼ (Fallback / Offline)
                        ┌──────────────────────────────┐
                        │ Fast Vision Baseline Engine  │
                        │ (Local Heuristic Inspector)  │
                        └──────────────────────────────┘
```

---

## 2. Candidate Model Evaluation

### **Candidate 1: Google Gemini 2.5 Flash (Primary Production Engine)**
- **Role**: Primary real-time vision intelligence endpoint.
- **Strengths**: 
  - Sub-500ms latency for multimodal image understanding.
  - Native spatial understanding returning bounding boxes `[ymin, xmin, ymax, xmax]`.
  - Superior layout-aware OCR (preserves spatial headers vs paragraph structures).
  - Out-of-the-box scenario detection (violence, smoke, fire, weapons, crowds) with high zero-shot transfer.
- **Trade-offs**: Slightly lower precision on microscopic visual details compared to Pro model.

### **Candidate 2: Google Gemini 2.5 Pro (Deep Precision Pipeline)**
- **Role**: High-precision fallback & edge-case inspector.
- **Strengths**:
  - Top-tier precision for dense text, complex document layouts, and subtle safety moderation flags.
  - Reduced false-positive rate on safety flagging.
- **Trade-offs**: Higher latency (~1200ms) and cost per request.

### **Candidate 3: Fast Vision Baseline Engine (Local Fallback)**
- **Role**: Offline fallback and zero-cost baseline.
- **Strengths**:
  - Runs 100% locally with zero cloud dependencies or external credentials.
  - Extremely fast execution (~35ms).
  - Provides dominant color extraction, canvas dimensions, image stats, and structured schema conformity.
- **Trade-offs**: Limited to heuristic and rule-based visual signals.

---

## 3. Why This Multi-Stage Pipeline Was Selected

1. **Decoupled Architecture**: Downstream clients consume a unified JSON schema regardless of which model powers the backend.
2. **Confidence-Aware Routing & Uncertainty Quantification**: If Gemini Flash returns a confidence score `< 0.85`, the system automatically flags the item for **human-in-the-loop audit**.
3. **Resilience**: If API quotas or network drops occur, the service seamlessly degrades to the local baseline engine without throwing `500 Server Errors`.
