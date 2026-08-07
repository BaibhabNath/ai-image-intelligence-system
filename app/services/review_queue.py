import uuid
import datetime
from typing import List, Optional, Dict
from app.schemas import ReviewItem, ImageAnalysisResponse, ReviewAction

class ReviewQueueManager:
    def __init__(self):
        self._queue: Dict[str, ReviewItem] = {}

    def add_item(self, analysis: ImageAnalysisResponse, image_data_url: Optional[str] = None) -> ReviewItem:
        review_id = f"rev_{uuid.uuid4().hex[:10]}"
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
