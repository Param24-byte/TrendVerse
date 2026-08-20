import subprocess

def heal_scraper(collector_id, break_description):
    """
    Triggers the Bright Data self-healing process for a scraper.
    """
    print(f"Triggering heal for {collector_id}: '{break_description}'")
    try:
        # bdata scraper heal <COLLECTOR_ID> "<what broke>"
        result = subprocess.run(
            ["npx.cmd", "-p", "@brightdata/cli", "bdata", "scraper", "heal", collector_id, break_description],
            capture_output=True,
            text=True,
            check=True
        )
        print("Heal triggered successfully! Output:")
        print(result.stdout)
        print("\nPlease review the proposed fix in the Bright Data UI or via CLI, and approve it.")
        print(f"Command to approve: bdata scraper approve {collector_id}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to heal scraper. Error:\n{e.stderr}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python heal.py <COLLECTOR_ID> <DESCRIPTION_OF_BREAKAGE>")
        sys.exit(1)
        
    heal_scraper(sys.argv[1], sys.argv[2])
