import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from leetcode_client import get_leetcode_details
from models import OARequest
from store import store
from selector import generate_selection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safely load the JSON blob into RAM on startup
    store.load_data("data/unified_questions.json")
    yield

app = FastAPI(
    title="BRIDGE_OA Backend",
    description="High-performance assessment generation API.",
    lifespan=lifespan
)

# Production CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For strict production, change to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/api/metadata", tags=["Discovery"])
async def get_metadata():
    """Returns all dynamically discovered filter options from the dataset."""
    return {
        "total_count": len(store.questions),
        "companies": sorted(list(store.companies)),
        "periods": sorted(list(store.periods)), # Newly added exposed periods
        "difficulties": ["Easy", "Medium", "Hard"]
    }

@app.post("/api/generate-oa", tags=["Core Engine"])
async def generate_oa(req: OARequest):
    """Executes the weighted selection algorithm against the parameters."""
    questions = generate_selection(req, store)
    
    if not questions:
        raise HTTPException(
            status_code=404, 
            detail="No questions found matching the requested company/period criteria."
        )
    
    return {
        "test_id": random.randint(10000, 99999),
        "count": len(questions),
        "questions": questions
    }

@app.get("/api/question/{slug}", tags=["External Bridge"])
async def fetch_details(slug: str):
    """Proxies the request to LeetCode and parses the result."""
    details = await get_leetcode_details(slug)
    if not details:
        raise HTTPException(status_code=404, detail=f"Question '{slug}' not found or unreachable.")
    return details

if __name__ == "__main__":
    import uvicorn
    # In production, use standard workers rather than reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)