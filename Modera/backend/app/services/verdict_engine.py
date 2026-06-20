from app.core.database import get_db

DEFAULT_POLICIES = [
    {"category": "explicit", "flag_threshold": 40, "block_threshold": 80},
    {"category": "violence", "flag_threshold": 50, "block_threshold": 85},
    {"category": "weapons", "flag_threshold": 60, "block_threshold": 90},
    {"category": "hate", "flag_threshold": 30, "block_threshold": 75},
    {"category": "self_harm", "flag_threshold": 20, "block_threshold": 60},
    {"category": "spam", "flag_threshold": 70, "block_threshold": 95},
]

async def initialize_default_policies(db):
    """Ensures default policies exist in the database on startup or first run."""
    count = await db.policies.count_documents({})
    if count == 0:
        await db.policies.insert_many(DEFAULT_POLICIES)

async def evaluate_verdict(ai_scores: dict, db) -> str:
    """
    Compares AI scores against DB policies.
    Returns 'Blocked', 'Flagged', or 'Approved'.
    Logic: If ANY category >= block_threshold, return Blocked.
           Else if ANY category >= flag_threshold, return Flagged.
           Else return Approved.
    """
    # Quick init check (in a real app, this goes in the app startup event)
    await initialize_default_policies(db)
    
    policies = await db.policies.find().to_list(length=100)
    policy_map = {p["category"]: p for p in policies}
    
    final_verdict = "Approved"
    
    for category, score in ai_scores.items():
        if category in policy_map:
            # Score could be an int, float, etc.
            try:
                score_val = float(score)
            except (ValueError, TypeError):
                continue
                
            policy = policy_map[category]
            
            # Check block first (highest priority)
            if score_val >= policy["block_threshold"]:
                return "Blocked"
                
            # If not blocked, check if it should be flagged
            if score_val >= policy["flag_threshold"]:
                final_verdict = "Flagged"
                
    return final_verdict
