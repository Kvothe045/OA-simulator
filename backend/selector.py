import random
import math
from typing import List
from models import OARequest

def _matches_criteria(q: dict, req: OARequest) -> bool:
    """Evaluates if a single question matches the complex company/period matrix."""
    companies_data = q.get("companies", {})
    
    # 1. Evaluate Company & Period Intersection
    if req.companies:
        # Check if the question belongs to requested companies
        matched_comps = [c.lower() for c in req.companies if c.lower() in companies_data]
        if not matched_comps:
            return False
        
        # If periods are also requested, ensure the specific company asked it in that period
        if req.periods:
            valid_period = any(companies_data[c].get("period") in req.periods for c in matched_comps)
            if not valid_period:
                return False

    # 2. Evaluate Period-Only (No companies requested)
    elif req.periods:
        valid_period = any(c_data.get("period") in req.periods for c_data in companies_data.values())
        if not valid_period:
            return False
            
    return True

def get_weighted_score(q_data: dict, target_companies: List[str], target_periods: List[str]) -> float:
    """Calculates logarithmic score, isolating weights to the exact requested subsets."""
    freqs = []
    companies_data = q_data.get("companies", {})
    
    # If companies specified, only look at their weights. Otherwise, look at all.
    comps_to_check = [c.lower() for c in target_companies] if target_companies else list(companies_data.keys())
    
    for c in comps_to_check:
        if c in companies_data:
            c_data = companies_data[c]
            # Discard frequencies from periods outside the user's request
            if target_periods and c_data.get("period") not in target_periods:
                continue
            freqs.append(c_data.get("frequency") or 1.0)
            
    weight = max(freqs) if freqs else 1.0
    weight = max(weight, 0.1) # Prevent ZeroDivisionError for zero-weighted items
    
    # R^(1/W) transformed to log(R)/W for floating point stability
    return math.log(random.random()) / weight

def pick_questions(pool: List[dict], count: int, req: OARequest) -> List[dict]:
    """Applies Weighted Reservoir Sampling."""
    if not pool: 
        return []
        
    num_to_pick = min(len(pool), count)
    target_comps = req.companies or []
    target_periods = req.periods or []
    
    scored = [(get_weighted_score(q, target_comps, target_periods), q) for q in pool]
    # Sort descending (closest to 0 is highest since log(R) is negative)
    scored.sort(key=lambda x: x[0], reverse=True)
    
    return [item[1] for item in scored[:num_to_pick]]

def generate_selection(req: OARequest, store) -> List[dict]:
    final_questions = []
    
    # 1. Filter the master pool based on Company & Period parameters
    source_pool = [q for q in store.questions.values() if _matches_criteria(q, req)]

    # 2. Distribution Logic
    if req.difficulty_dist:
        for diff, count in req.difficulty_dist.items():
            if count <= 0: continue
            
            diff_pool = [q for q in source_pool if q.get("difficulty") == diff]
            
            # Smart Backfill: If the filtered pool doesn't have enough questions,
            # pull remaining needed questions from the global unrestricted pool.
            if len(diff_pool) < count:
                global_diff_pool = store.difficulty_buckets.get(diff, [])
                extra_needed = count - len(diff_pool)
                # Ensure we don't pick duplicates during backfill
                existing_ids = {q.get("id") for q in diff_pool}
                extra_pool = [q for q in global_diff_pool if q.get("id") not in existing_ids]
                
                # Pick exactly what we need from the global pool and append
                diff_pool.extend(pick_questions(extra_pool, extra_needed, req))
            
            # Select the questions and add to final packet
            final_questions.extend(pick_questions(diff_pool, count, req))
    else:
        # Flat generation ignoring difficulty
        final_questions = pick_questions(source_pool, req.total_count, req)

    # Randomize order so it's not grouped by difficulty
    random.shuffle(final_questions)
    return final_questions