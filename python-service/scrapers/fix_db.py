import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import supabase

def fix_db():
    print("Fixing platforms...")
    supabase.table("posts").update({"platform": "hackernews"}).eq("platform", "hn").execute()
    supabase.table("posts").update({"platform": "producthunt"}).eq("platform", "ph").execute()
    supabase.table("posts").update({"platform": "huggingface"}).eq("platform", "hf").execute()
    
    print("Fetching velocity=0 posts...")
    res = supabase.table("posts").select("*").eq("velocity_score", 0).gt("engagement_count", 0).execute()
    posts = res.data or []
    
    print(f"Found {len(posts)} posts to fix velocity.")
    for p in posts:
        new_v = float(p.get("engagement_count", 0)) / 2.0
        supabase.table("posts").update({"velocity_score": new_v}).eq("id", p["id"]).execute()
        
    print("Done!")

if __name__ == "__main__":
    fix_db()
