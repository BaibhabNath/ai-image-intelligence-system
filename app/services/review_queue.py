import uuid
import datetime
from typing import List, Optional, Dict
from app.schemas import (
    ReviewItem, ImageAnalysisResponse, ReviewAction,
    ContentAnalysis, ContentSafety, ImageMetadata, DetectedObject, BoundingBox
)

class ReviewQueueManager:
    def __init__(self):
        self._queue: Dict[str, ReviewItem] = {}
        self._seed_demo_items()

    def _seed_demo_items(self):
        demo_1 = ImageAnalysisResponse(
            id="img_demo_001",
            status="flagged_for_review",
            model_used="Google GEMINI-2.5-FLASH Multimodal",
            confidence_level="High",
            overall_confidence=0.91,
            caption="Workplace surveillance snapshot detecting structural smoke & crowded industrial floor.",
            scene="Industrial Warehouse Floor",
            minute_details={
                "Facility Type": "Distribution Warehouse",
                "Hazard Level": "Moderate Risk",
                "Occupancy": "High (14 personnel detected)",
                "Air Quality": "Smoke dispersion detected in Zone B",
                "Recommended Action": "Deploy ventilation audit"
            },
            objects=[
                DetectedObject(label="Industrial Forklift", confidence=0.95, bbox=BoundingBox(ymin=300, xmin=200, ymax=800, xmax=700), is_hazard=False),
                DetectedObject(label="Zone B Smoke Haze", confidence=0.89, bbox=BoundingBox(ymin=50, xmin=100, ymax=350, xmax=900), is_hazard=True)
            ],
            ocr=[],
            content_analysis=ContentAnalysis(scenarios_detected=["smoke", "crowd"], smoke=True, crowd=True, details="Smoke haze detected in upper ventilation zone."),
            safety=ContentSafety(is_safe=False, requires_human_review=True, flag_reason="Environmental Smoke Hazard Flagged"),
            metadata=ImageMetadata(width=1920, height=1080, format="JPEG", aspect_ratio="1.78:1", dominant_colors=["#1E293B", "#334155"]),
            processing_time_ms=420.5,
            summary="Flagged for auditor verification due to localized smoke detection."
        )

        demo_2 = ImageAnalysisResponse(
            id="img_demo_002",
            status="flagged_for_review",
            model_used="Google GEMINI-2.5-PRO Deep Inspection",
            confidence_level="High",
            overall_confidence=0.97,
            caption="Vehicle damage appraisal scan identifying front bumper fracture and tire rim scuffing.",
            scene="Automotive Inspection Bay",
            minute_details={
                "Make & Brand": "Tesla",
                "Model": "Model 3 Performance",
                "Color": "Deep Pearl White",
                "Tire Size": "235/35 R20 Michelin Pilot Sport",
                "Wheel Condition": "Outer Rim Scuffed (Left Front)",
                "Damage Type": "Front Bumper Lower Grille Crack"
            },
            objects=[
                DetectedObject(label="Tesla Model 3 Body", confidence=0.98, bbox=BoundingBox(ymin=150, xmin=100, ymax=850, xmax=900), is_hazard=False),
                DetectedObject(label="Front Bumper Fracture", confidence=0.92, bbox=BoundingBox(ymin=650, xmin=350, ymax=820, xmax=650), is_hazard=True)
            ],
            ocr=[],
            content_analysis=ContentAnalysis(scenarios_detected=["accident", "vehicle_damage"], accident=True, details="Bumper collision damage detected."),
            safety=ContentSafety(is_safe=False, requires_human_review=True, flag_reason="Automotive Insurance Claim Damage Audit"),
            metadata=ImageMetadata(width=1280, height=720, format="PNG", aspect_ratio="1.78:1", dominant_colors=["#F8FAFC", "#0F172A"]),
            processing_time_ms=980.2,
            summary="Vehicle damage assessment requiring manual insurance adjuster verification."
        )

        self.add_item(demo_1, image_data_url="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400")
        self.add_item(demo_2, image_data_url="https://images.unsplash.com/photo-1563720223185-11003d516935?w=400")

    def add_item(self, analysis: ImageAnalysisResponse, image_data_url: Optional[str] = None) -> ReviewItem:
        review_id = f"rev_{uuid.uuid4().hex[:8]}"
        item = ReviewItem(
            review_id=review_id,
            image_id=analysis.id,
            image_data_url=image_data_url,
            created_at=datetime.datetime.utcnow().isoformat() + "Z",
            status="pending",
            flag_reason=analysis.safety.flag_reason or "Flagged for human-in-the-loop review.",
            analysis=analysis
        )
        self._queue[review_id] = item
        return item

    def list_items(self, status: Optional[str] = None) -> List[ReviewItem]:
        items = list(self._queue.values())
        if status:
            return [i for i in items if i.status == status]
        return items

    def get_item(self, review_id: str) -> Optional[ReviewItem]:
        return self._queue.get(review_id)

    def process_action(self, review_id: str, action_data: ReviewAction) -> Optional[ReviewItem]:
        item = self._queue.get(review_id)
        if not item:
            return None
        
        if action_data.action.lower() == "approve":
            item.status = "approved"
            item.analysis.status = "success"
            item.analysis.safety.requires_human_review = False
        elif action_data.action.lower() == "reject":
            item.status = "rejected"
            item.analysis.status = "rejected_by_moderator"
            item.analysis.safety.is_safe = False

        item.auditor_notes = action_data.auditor_notes
        return item

review_queue = ReviewQueueManager()
