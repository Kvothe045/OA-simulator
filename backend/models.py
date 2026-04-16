from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class OARequest(BaseModel):
    # Optional list of target companies (e.g., ["amazon", "google"])
    companies: Optional[List[str]] = Field(default=None, description="Target companies")
    
    # Optional list of periods (e.g., ["three_months", "six_months", "all"])
    periods: Optional[List[str]] = Field(default=None, description="Timeframe periods")
    
    # Total number of questions to generate if no specific distribution is provided
    total_count: int = Field(default=3, ge=1, le=50, description="Total questions to fetch")
    
    # Exact distribution of difficulties (e.g., {"Easy": 1, "Medium": 2})
    difficulty_dist: Optional[Dict[str, int]] = Field(default=None, description="Count per difficulty")
    
    # Whether to use the logarithmic weighted random selection
    weighted: bool = Field(default=True, description="Enable weighted frequency sampling")