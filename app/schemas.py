from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    ymin: float = Field(..., description="Top coordinate scaled 0-1000")
    xmin: float = Field(..., description="Left coordinate scaled 0-1000")
    ymax: float = Field(..., description="Bottom coordinate scaled 0-1000")
    xmax: float = Field(..., description="Right coordinate scaled 0-1000")

# --- Entity Profiles ---

class PersonProfile(BaseModel):
    id: str = Field(..., description="e.g. Person 1")
    apparent_gender_presentation: Optional[str] = Field(default="Not clearly visible")
    apparent_age_range: Optional[str] = Field(default="Cannot be determined")
    age_category: Optional[str] = Field(default="Cannot be determined")
    
    # Facial Characteristics
    face_shape: Optional[str] = Field(default="Not clearly visible")
    skin_tone_complexion: Optional[str] = Field(default="Not clearly visible")
    hair_color: Optional[str] = Field(default="Not clearly visible")
    hair_length: Optional[str] = Field(default="Not clearly visible")
    hair_texture: Optional[str] = Field(default="Not clearly visible")
    hairstyle: Optional[str] = Field(default="Not clearly visible")
    eyebrow_shape: Optional[str] = Field(default="Not clearly visible")
    eye_color: Optional[str] = Field(default="Not clearly visible")
    facial_hair: Optional[str] = Field(default="Not clearly visible")
    facial_expression: Optional[str] = Field(default="Not clearly visible")
    gaze_direction: Optional[str] = Field(default="Not clearly visible")
    glasses_eyewear: Optional[str] = Field(default="Not clearly visible")
    visible_marks: Optional[str] = Field(default="Not clearly visible")
    
    # Physical Appearance
    relative_height_category: Optional[str] = Field(default="Cannot be determined from this image")
    body_build: Optional[str] = Field(default="Not clearly visible")
    posture: Optional[str] = Field(default="Not clearly visible")
    pose: Optional[str] = Field(default="Not clearly visible")
    
    # Clothing & Accessories
    clothing_summary: Optional[str] = Field(default="Not clearly visible")
    headwear: Optional[str] = Field(default="None visible")
    top_garment: Optional[str] = Field(default="Not clearly visible")
    bottom_garment: Optional[str] = Field(default="Not clearly visible")
    footwear: Optional[str] = Field(default="Not clearly visible")
    accessories: List[str] = Field(default_factory=list)
    
    # Activity & Spatial
    activity: Optional[str] = Field(default="Not clearly visible")
    spatial_position: Optional[str] = Field(default="Center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class AnimalProfile(BaseModel):
    id: str = Field(..., description="e.g. Animal 1")
    species: str = Field(default="Not clearly visible")
    animal_type: str = Field(default="Unknown")
    breed: Optional[str] = Field(default="Cannot be determined")
    domestic_or_wild: Optional[str] = Field(default="Cannot be determined")
    approx_size: Optional[str] = Field(default="Not clearly visible")
    coat_skin_pattern: Optional[str] = Field(default="Not clearly visible")
    color: Optional[str] = Field(default="Not clearly visible")
    distinguishing_features: Optional[str] = Field(default="Not clearly visible")
    pose_behavior: Optional[str] = Field(default="Not clearly visible")
    spatial_position: Optional[str] = Field(default="Center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class VehicleProfile(BaseModel):
    id: str = Field(..., description="e.g. Vehicle 1")
    vehicle_type: str = Field(default="Vehicle")
    make_brand: Optional[str] = Field(default="Cannot be determined")
    model: Optional[str] = Field(default="Cannot be determined")
    body_style: Optional[str] = Field(default="Not clearly visible")
    color: Optional[str] = Field(default="Not clearly visible")
    visible_wheels: Optional[str] = Field(default="Not clearly visible")
    license_plate_info: Optional[str] = Field(default="Not clearly visible")
    condition: Optional[str] = Field(default="Not clearly visible")
    activity_state: Optional[str] = Field(default="Parked / Stationary")
    spatial_position: Optional[str] = Field(default="Center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class ObjectProfile(BaseModel):
    id: str = Field(..., description="e.g. Object 1")
    name: str = Field(..., description="Object name")
    category: str = Field(default="General Object")
    shape: Optional[str] = Field(default="Not clearly visible")
    color: Optional[str] = Field(default="Not clearly visible")
    material_texture: Optional[str] = Field(default="Not clearly visible")
    brand_logo: Optional[str] = Field(default="Cannot be determined")
    functional_use: Optional[str] = Field(default="Not clearly visible")
    condition: Optional[str] = Field(default="Not clearly visible")
    spatial_position: Optional[str] = Field(default="Center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class BuildingProfile(BaseModel):
    id: str = Field(..., description="e.g. Building 1")
    building_type: str = Field(default="Structure")
    architectural_style: Optional[str] = Field(default="Not clearly visible")
    visible_floors: Optional[str] = Field(default="Cannot be determined")
    exterior_materials: Optional[str] = Field(default="Not clearly visible")
    roof_type: Optional[str] = Field(default="Not clearly visible")
    colors: Optional[str] = Field(default="Not clearly visible")
    signage_logos: Optional[str] = Field(default="Not clearly visible")
    condition: Optional[str] = Field(default="Not clearly visible")
    spatial_position: Optional[str] = Field(default="Background")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class PlantProfile(BaseModel):
    id: str = Field(..., description="e.g. Plant 1")
    plant_type: str = Field(default="Plant / Vegetation")
    possible_species: Optional[str] = Field(default="Cannot be determined")
    leaf_flower_color: Optional[str] = Field(default="Not clearly visible")
    growth_pattern: Optional[str] = Field(default="Not clearly visible")
    indoor_outdoor_context: Optional[str] = Field(default="Outdoor")
    spatial_position: Optional[str] = Field(default="Background")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class FoodProfile(BaseModel):
    id: str = Field(..., description="e.g. Food 1")
    item_name: str = Field(default="Food / Beverage Item")
    category: str = Field(default="Prepared Dish")
    visible_ingredients: List[str] = Field(default_factory=list)
    presentation_container: Optional[str] = Field(default="Not clearly visible")
    portion_size_est: Optional[str] = Field(default="Cannot be determined")
    cooking_style: Optional[str] = Field(default="Not clearly visible")
    spatial_position: Optional[str] = Field(default="Center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class DocumentTextProfile(BaseModel):
    id: str = Field(..., description="e.g. Text Block 1")
    document_type: str = Field(default="Signboard / Label / Document")
    extracted_text: str = Field(..., description="Readable text snippet")
    heading_labels: Optional[str] = Field(default="Not clearly visible")
    readability_status: str = Field(default="Fully readable")
    language_script: Optional[str] = Field(default="English")
    spatial_position: Optional[str] = Field(default="Top-center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class ElectronicDeviceProfile(BaseModel):
    id: str = Field(..., description="e.g. Device 1")
    device_category: str = Field(default="Electronic Device")
    brand_manufacturer: Optional[str] = Field(default="Cannot be determined")
    model_series: Optional[str] = Field(default="Cannot be determined")
    color_finish: Optional[str] = Field(default="Not clearly visible")
    visible_features: Optional[str] = Field(default="Not clearly visible")
    screen_status: Optional[str] = Field(default="Not clearly visible")
    spatial_position: Optional[str] = Field(default="Center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class ClothingItemProfile(BaseModel):
    id: str = Field(..., description="e.g. Fashion Item 1")
    item_type: str = Field(default="Garment / Accessory")
    color_pattern: Optional[str] = Field(default="Not clearly visible")
    material_appearance: Optional[str] = Field(default="Not clearly visible")
    style_fit: Optional[str] = Field(default="Not clearly visible")
    brand_logo: Optional[str] = Field(default="Cannot be determined")
    condition: Optional[str] = Field(default="Good condition")
    spatial_position: Optional[str] = Field(default="Center")
    confidence: str = Field(default="High")
    bbox: Optional[BoundingBox] = None

class DetectedEntities(BaseModel):
    people: List[PersonProfile] = Field(default_factory=list)
    animals: List[AnimalProfile] = Field(default_factory=list)
    vehicles: List[VehicleProfile] = Field(default_factory=list)
    objects: List[ObjectProfile] = Field(default_factory=list)
    buildings: List[BuildingProfile] = Field(default_factory=list)
    plants: List[PlantProfile] = Field(default_factory=list)
    food: List[FoodProfile] = Field(default_factory=list)
    documents: List[DocumentTextProfile] = Field(default_factory=list)
    electronics: List[ElectronicDeviceProfile] = Field(default_factory=list)
    fashion_items: List[ClothingItemProfile] = Field(default_factory=list)

class SceneOverview(BaseModel):
    scene_type: str = Field(default="General Visual Scene")
    main_subjects: List[str] = Field(default_factory=list)
    environment_setting: str = Field(default="Indoor / Outdoor Scene")
    lighting_exposure: str = Field(default="Balanced Natural Lighting")
    image_composition: Dict[str, str] = Field(default_factory=dict)
    important_interactions: List[str] = Field(default_factory=list)

class SpatialRelationship(BaseModel):
    entity_a: str = Field(..., description="Subject 1")
    relationship: str = Field(..., description="e.g. Standing beside, Holding, Behind")
    entity_b: str = Field(..., description="Subject 2 / Object")

class ObservedVsInferred(BaseModel):
    directly_observed: List[str] = Field(default_factory=list)
    reasonably_inferred: List[str] = Field(default_factory=list)
    unknown_unclear: List[str] = Field(default_factory=list)

class EntityComparison(BaseModel):
    category_name: str = Field(..., description="e.g. People Comparison, Vehicle Comparison")
    compared_entities: List[str] = Field(..., description="e.g. ['Person 1', 'Person 2']")
    comparison_attributes: Dict[str, List[str]] = Field(default_factory=dict)

class UserQueryAnswer(BaseModel):
    user_query: str
    direct_answer: str
    confidence: str = Field(default="High")

class ContentAnalysis(BaseModel):
    scenarios_detected: List[str] = Field(default_factory=list)
    violence: bool = Field(default=False)
    fire: bool = Field(default=False)
    smoke: bool = Field(default=False)
    weapon: bool = Field(default=False)
    accident: bool = Field(default=False)
    crowd: bool = Field(default=False)
    animal: bool = Field(default=False)
    details: str = Field(default="No hazardous scenarios detected.")

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

class ImageOverview(BaseModel):
    image_type: str = Field(default="General Photograph")
    main_scene: str = Field(default="Unspecified Scene")
    primary_subjects: List[str] = Field(default_factory=list)
    entity_counts: Dict[str, int] = Field(default_factory=dict)

class DetectedObject(BaseModel):
    label: str = Field(...)
    category: str = Field(default="objects")
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: Optional[BoundingBox] = None
    is_hazard: bool = Field(default=False)
    attributes: Dict[str, str] = Field(default_factory=dict)

class OCRBlock(BaseModel):
    text: str = Field(...)
    location: str = Field(...)
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: Optional[BoundingBox] = None

class ImageAnalysisResponse(BaseModel):
    id: str
    status: str
    model_used: str
    confidence_level: str
    overall_confidence: float
    caption: str
    scene: str
    overview: ImageOverview
    entities: DetectedEntities = Field(default_factory=DetectedEntities)
    scene_overview: SceneOverview = Field(default_factory=SceneOverview)
    spatial_relationships: List[SpatialRelationship] = Field(default_factory=list)
    observed_vs_inferred: ObservedVsInferred = Field(default_factory=ObservedVsInferred)
    comparisons: List[EntityComparison] = Field(default_factory=list)
    user_query_answer: Optional[UserQueryAnswer] = None
    objects: List[DetectedObject] = Field(default_factory=list)
    ocr: List[OCRBlock] = Field(default_factory=list)
    content_analysis: ContentAnalysis = Field(default_factory=ContentAnalysis)
    safety: ContentSafety = Field(default_factory=ContentSafety)
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
