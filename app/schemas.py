from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    ymin: float = Field(..., description="Top coordinate scaled 0-1000")
    xmin: float = Field(..., description="Left coordinate scaled 0-1000")
    ymax: float = Field(..., description="Bottom coordinate scaled 0-1000")
    xmax: float = Field(..., description="Right coordinate scaled 0-1000")

class DetectedObject(BaseModel):
    label: str = Field(..., description="Class or name of the detected object")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bbox: Optional[BoundingBox] = Field(None, description="Normalized bounding box coordinates")

class OCRBlock(BaseModel):
    text: str = Field(..., description="Extracted text content")
    location: str = Field(..., description="Layout region description")
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: Optional[BoundingBox] = Field(None, description="Bounding box of text block")

class ContentAnalysis(BaseModel):
    scenarios_detected: List[str] = Field(default_factory=list)
    violence: bool = Field(default=False)
    fire: bool = Field(default=False)
    smoke: bool = Field(default=False)
    weapon: bool = Field(default=False)
    accident: bool = Field(default=False)
    crowd: bool = Field(default=False)
    animal: bool = Field(default=False)
    details: str = Field(default="")

class ContentSafety(BaseModel):
    is_safe: bool = Field(default=True)
    nsfw: bool = Field(default=False)
    sensitive: bool = Field(default=False)
    violence: bool = Field(default=False)
    weapon: bool = Field(default=False)
    requires_human_review: bool = Field(default=False)
    flag_reason: Optional[str] = Field(None)

class ImageMetadata(BaseModel):
    width: int
    height: int
    format: str
    aspect_ratio: str
    dominant_colors: List[str] = Field(default_factory=list)

class ImageAnalysisResponse(BaseModel):
    id: str
    status: str
    model_used: str
    confidence_level: str
    overall_confidence: float
    caption: str
    scene: str
    objects: List[DetectedObject] = Field(default_factory=list)
    ocr: List[OCRBlock] = Field(default_factory=list)
    content_analysis: ContentAnalysis
    safety: ContentSafety
    metadata: ImageMetadata
    processing_time_ms: float
    summary: str

class BatchAnalysisRequest(BaseModel):
    urls: List[str]
    model_choice: str = Field(default="gemini-flash-2.5")

class BatchAnalysisResponse(BaseModel):
    total_images: int
    successful: int
    failed: int
    results: List[ImageAnalysisResponse]

class ModelSpec(BaseModel):
    id: str
    name: str
    provider: str
    accuracy_score: float
    avg_latency_ms: float
    description: str
    capabilities: List[str]

class ReviewItem(BaseModel):
    review_id: str
    image_id: str
    image_data_url: Optional[str] = None
    created_at: str
    status: str
    flag_reason: str
    analysis: ImageAnalysisResponse
    auditor_notes: Optional[str] = None

class ReviewAction(BaseModel):
    action: str
    auditor_notes: Optional[str] = None
