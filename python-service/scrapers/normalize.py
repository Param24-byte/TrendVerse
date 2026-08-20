import json
import os
import glob
from datetime import datetime, timezone
import uuid
import sys

# Add parent directory to path so we can import db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import supabase

def map_bright_data_to_supabase(platform, record, niche="AI"):
    """
    Maps a single record from Bright Data JSON into the Supabase 'posts' schema.
    NOTE: You may need to adjust the dictionary keys based on the exact 
    JSON schema your specific Scraper Studio templates output.
    """
    
    # Generic mapping fallbacks
    title = record.get("title") or record.get("name") or record.get("heading") or record.get("model_title") or record.get("repository_title") or "Untitled"
    caption = record.get("caption") or record.get("description") or record.get("text") or ""
    
    # Engagement mapping
    engagement_count = record.get("engagement_count") or record.get("stars") or record.get("upvotes") or 0
    velocity_score = record.get("velocity_score") or record.get("velocity") or 0.0
    
    # Hashtags/Topics
    hashtags = record.get("hashtags") or record.get("topics") or []
    if isinstance(hashtags, str):
        hashtags = [h.strip() for h in hashtags.split(",")]
        
    posted_at = record.get("posted_at") or record.get("created_at") or datetime.now(timezone.utc).isoformat()
    
    url = record.get("url") or record.get("link") or record.get("product_page_url") or ""
    
    return {
        "id": f"{platform}-{uuid.uuid4().hex[:8]}", # Generate a unique ID if one isn't provided
        "niche": niche,
        "platform": platform,
        "title": title[:255],  # Truncate to avoid DB length errors
        "caption": caption,
        "url": url[:1000],
        "hashtags": hashtags,
        "engagement_count": int(engagement_count) if str(engagement_count).isdigit() else 0,
        "velocity_score": float(velocity_score) if str(velocity_score).replace('.', '', 1).isdigit() else 0.0,
        "posted_at": posted_at,
        "scraped_at": datetime.now(timezone.utc).isoformat()
    }

def process_file(file_path):
    print(f"Processing {file_path}...")
    
    # Determine platform from filename (e.g. data_github_12345.json)
    filename = os.path.basename(file_path)
    platform = "unknown"
    for p in ["github", "hn", "ph", "hf"]:
        if f"_{p}_" in filename:
            platform = p
            break
            
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    # Bright Data usually returns a list of records
    if not isinstance(data, list):
        data = [data]
        
    records_to_insert = []
    for item in data:
        # We pass 'ai-tools' as a default niche for now since our run_scrapers.py searches for AI
        mapped = map_bright_data_to_supabase(platform, item, niche="ai-tools")
        records_to_insert.append(mapped)
        
    if records_to_insert:
        print(f"Inserting {len(records_to_insert)} records into Supabase for {platform}...")
        try:
            # Batch insert
            result = supabase.table("posts").insert(records_to_insert).execute()
            print("Successfully inserted!")
        except Exception as e:
            print(f"Error inserting to Supabase: {e}")
    else:
        print("No valid records found in file.")

def normalize_all_pending_files():
    # Find all data_*.json files in the current directory
    files = glob.glob("data_*.json")
    if not files:
        print("No data files found to process.")
        return
        
    for file in files:
        process_file(file)
        # Move or delete file after processing to avoid reprocessing
        os.rename(file, f"{file}.processed")
        print(f"Marked {file} as processed.\n")

if __name__ == "__main__":
    normalize_all_pending_files()
