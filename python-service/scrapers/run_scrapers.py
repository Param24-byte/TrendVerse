import os
import json
import subprocess
import schedule
import time
from datetime import datetime

from dotenv import load_dotenv

# Load env variables from the root .env.local file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local")
load_dotenv(env_path)

COLLECTORS = {
    "github": os.getenv("BRIGHTDATA_GITHUB_SCRAPER_ID", ""),
    "hn": os.getenv("BRIGHTDATA_HACKERNEWS_SCRAPER_ID", ""),
    "ph": os.getenv("BRIGHTDATA_PRODUCTHUNT_SCRAPER_ID", ""),
    "hf": os.getenv("BRIGHTDATA_HUGGINGFACE_SCRAPER_ID", "")
}

URLS = {
    "github": "https://github.com/search?q=AI",
    "hn": "https://hn.algolia.com/?q=AI",
    "ph": "https://www.producthunt.com/search?q=AI",
    "hf": "https://huggingface.co/models?search=AI"
}

def trigger_scraper(platform, collector_id):
    target_url = URLS.get(platform)
    print(f"[{datetime.now().isoformat()}] Triggering scraper for {platform} on {target_url} ({collector_id})...")
    try:
        # We use bdata CLI to run the scraper
        # 'bdata scraper run <COLLECTOR_ID> <URL>'
        result = subprocess.run(
            ["npx.cmd", "-p", "@brightdata/cli", "bdata", "scraper", "run", collector_id, target_url],
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8"
        )
        print(f"[{platform}] Success! Data collected.")
        
        # Save output for normalization step
        output_file = f"data_{platform}_{int(time.time())}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result.stdout or "[]")
            
        print(f"[{platform}] Output saved to {output_file}")
        return output_file
        
    except subprocess.CalledProcessError as e:
        print(f"[{platform}] Failed to run scraper. Error:\n{e.stderr}")
        return None

def run_all_scrapers():
    print(f"\n--- Starting Data Extraction Pipeline ({datetime.now().isoformat()}) ---")
    for platform, collector_id in COLLECTORS.items():
        if "YOUR_" in collector_id:
            print(f"[{platform}] Skipping... Collector ID not configured.")
            continue
        
        output_file = trigger_scraper(platform, collector_id)
        if output_file:
            print(f"[{platform}] Ready for ingestion.")
            
    # Trigger ingestion
    print("\nTriggering data ingestion to Supabase...")
    try:
        from normalize import normalize_all_pending_files
        normalize_all_pending_files()
        
        # Trigger the ML Pipeline via the Next.js API
        import requests
        print("\nTriggering ML Pipeline to generate embeddings and clusters...")
        res = requests.post("http://localhost:3000/api/ml/trigger", json={"niche": "ai-tools"})
        if res.status_code == 200:
            print("ML Pipeline completed successfully!")
        else:
            print(f"ML Pipeline failed: {res.text}")
    except Exception as e:
        print(f"Error running ingestion/ML: {e}")

if __name__ == "__main__":
    # Run once immediately
    run_all_scrapers()
    
    # Schedule to run every 6 hours
    print("Scheduling scrapers to run every 6 hours...")
    schedule.every(6).hours.do(run_all_scrapers)
    
    while True:
        schedule.run_pending()
        time.sleep(60)
