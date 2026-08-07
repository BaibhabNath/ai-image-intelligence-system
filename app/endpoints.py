import base64
import httpx
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Query, Header, HTTPException

from app.schemas import (
    ImageAnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    ModelSpec,
    ReviewItem,
    ReviewAction
)
from app.services.vision_engine import vision_engine
from app.services.review_queue import review_queue

router = APIRouter(prefix="/api/v1", tags=["AI Image Intelligence"])

AVAILABLE_MODELS = [
    ModelSpec(
        id="gemini-flash-2.5",
        name="Gemini 2.5 Flash Multimodal",
        provider="Google DeepMind",
        accuracy_score=0.96,
        avg_latency_ms=450.0,
        description="High-speed multimodal vision model optimized for real-time object detection, OCR layout extraction, and moderation.",
        capabilities=["Object Detection", "OCR & Layout", "Scene Understanding", "Content Moderation", "Bounding Boxes"]
    ),
    ModelSpec(
        id="gemini-pro-2.5",
        name="Gemini 2.5 Pro Multimodal",
        provider="Google DeepMind",
        accuracy_score=0.99,
        avg_latency_ms=1200.0,
        description="State-of-the-art vision model for deep, complex image understanding, subtle scenario analysis, and edge case safety detection.",
        capabilities=["Deep Scene Analysis", "Complex OCR", "Nuanced Safety Moderation", "High Precision BBoxes"]
    ),
    ModelSpec(
        id="fast-vision-local",
        name="Fast Vision Baseline Engine",
        provider="Local Heuristic Pipeline",
        accuracy_score=0.82,
        avg_latency_ms=35.0,
        description="Ultra-fast offline baseline engine for lightweight visual metric extraction without external API dependencies.",
        capabilities=["Fast Layout Detection", "Dominant Colors", "Offline Operation", "Zero API Cost"]
    )
]

@router.post("/analyze", response_model=ImageAnalysisResponse, summary="Analyze single image")
async def analyze_image(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    model_choice: str = Form("gemini-flash-2.5"),
    x_api_key: Optional[str] = Header(None)
):
    if not file and not image_url:
        raise HTTPException(status_code=400, detail="Must provide either an image file upload or an image_url.")

    image_bytes = None
    filename = "image.jpg"
    data_url = None

    if file:
        image_bytes = await file.read()
        filename = file.filename or "image.jpg"
        mime = file.content_type or "image/jpeg"
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime};base64,{b64}"
    elif image_url:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(image_url)
                resp.raise_for_status()
                image_bytes = resp.content
                filename = image_url.split("/")[-1] or "remote_image.jpg"
                mime = resp.headers.get("content-type", "image/jpeg")
                b64 = base64.b64encode(image_bytes).decode("utf-8")
                data_url = f"data:{mime};base64,{b64}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch image from URL: {e}")

    try:
        result = await vision_engine.analyze_image(
            image_bytes=image_bytes,
            filename=filename,
            model_choice=model_choice,
            custom_api_key=x_api_key
        )
        if result.safety.requires_human_review:
            review_queue.add_item(result, image_data_url=data_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal inference failure: {e}")

@router.get("/models", response_model=List[ModelSpec])
async def list_models():
    return AVAILABLE_MODELS

@router.get("/reviews", response_model=List[ReviewItem])
async def list_reviews(status: Optional[str] = Query(None)):
    return review_queue.list_items(status=status)

@router.post("/reviews/{review_id}/action", response_model=ReviewItem)
async def review_action(review_id: str, action: ReviewAction):
    updated = review_queue.process_action(review_id, action)
    if not updated:
        raise HTTPException(status_code=404, detail="Review item not found.")
    return updated
