import os
import json
import subprocess
import schedule
import time
from datetime import datetime

# Placeholders for the Bright Data Collector IDs
# You can replace these with your actual collector IDs from Scraper Studio
COLLECTORS = {
    "github": "c_msyyxluo2hcfkfh8j8",
    "hn": "c_msyzjh9ya77jf5luh",
    "ph": "c_msyzuyr028tbdopz9l",
    "hf": "c_msz029zd1aifrjnz2f"
}

def trigger_scraper(platform, collector_id):
    print(f"[{datetime.now().isoformat()}] Triggering scraper for {platform} ({collector_id})...")
    try:
        # We use bdata CLI to run the scraper
        # 'bdata scraper run <COLLECTOR_ID>'
        result = subprocess.run(
            ["npx.cmd", "-p", "@brightdata/cli", "bdata", "scraper", "run", collector_id],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"[{platform}] Success! Data collected.")
        
        # Save output for normalization step
        output_file = f"data_{platform}_{int(time.time())}.json"
        with open(output_file, "w") as f:
            f.write(result.stdout)
            
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
            # TODO: trigger normalize.py or ingest directly to Supabase
            print(f"[{platform}] Ready for ingestion.")

if __name__ == "__main__":
    # Run once immediately
    run_all_scrapers()
    
    # Schedule to run every 6 hours
    print("Scheduling scrapers to run every 6 hours...")
    schedule.every(6).hours.do(run_all_scrapers)
    
    while True:
        schedule.run_pending()
        time.sleep(60)
