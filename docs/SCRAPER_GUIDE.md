# Job Scraper Guide for BrighterJobs

Server-side Python scraper for populating job listings from Kenyan job boards.

## Prerequisites

```bash
pip install requests beautifulsoup4 schedule
```

## Scraper Script

```python
import requests
from bs4 import BeautifulSoup
import time
import json
from datetime import datetime

SUPABASE_URL = "https://zyjkubdhwfwaieerudfn.supabase.co"
SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY"  # Use service role for server-side inserts
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; BrighterJobsBot/1.0)"}


def scrape_brightermonday():
    """Scrape jobs from brightermonday.co.ke"""
    jobs = []
    for page in range(1, 6):
        url = f"https://www.brightermonday.co.ke/jobs?page={page}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            for card in soup.select("div.search-result"):
                title_el = card.select_one("h3 a, .search-result__job-title a")
                company_el = card.select_one(".search-result__company, .company-name")
                location_el = card.select_one(".search-result__location, .location")
                if title_el:
                    jobs.append({
                        "title": title_el.get_text(strip=True),
                        "company": company_el.get_text(strip=True) if company_el else "Unknown",
                        "location": location_el.get_text(strip=True) if location_el else "Kenya",
                        "source": "brightermonday",
                        "url": "https://www.brightermonday.co.ke" + title_el.get("href", ""),
                        "scraped_at": datetime.utcnow().isoformat(),
                    })
            time.sleep(2)  # Be respectful
        except Exception as e:
            print(f"BrighterMonday page {page} error: {e}")
    return jobs


def scrape_myjobmag():
    """Scrape jobs from myjobmag.co.ke"""
    jobs = []
    for page in range(1, 6):
        url = f"https://www.myjobmag.co.ke/jobs-in-kenya?page={page}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            for card in soup.select(".job-list-item, .mag-b"):
                title_el = card.select_one("h2 a, .job-title a")
                company_el = card.select_one(".company-name, .employer")
                if title_el:
                    jobs.append({
                        "title": title_el.get_text(strip=True),
                        "company": company_el.get_text(strip=True) if company_el else "Unknown",
                        "location": "Kenya",
                        "source": "myjobmag",
                        "url": "https://www.myjobmag.co.ke" + title_el.get("href", ""),
                        "scraped_at": datetime.utcnow().isoformat(),
                    })
            time.sleep(2)
        except Exception as e:
            print(f"MyJobMag page {page} error: {e}")
    return jobs


def scrape_fuzu():
    """Scrape jobs from fuzu.com"""
    jobs = []
    for page in range(1, 6):
        url = f"https://www.fuzu.com/kenya/jobs?page={page}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            for card in soup.select(".job-card, .opportunity-card"):
                title_el = card.select_one("h3 a, .title a")
                company_el = card.select_one(".company, .employer")
                if title_el:
                    jobs.append({
                        "title": title_el.get_text(strip=True),
                        "company": company_el.get_text(strip=True) if company_el else "Unknown",
                        "location": "Kenya",
                        "source": "fuzu",
                        "url": "https://www.fuzu.com" + title_el.get("href", ""),
                        "scraped_at": datetime.utcnow().isoformat(),
                    })
            time.sleep(2)
        except Exception as e:
            print(f"Fuzu page {page} error: {e}")
    return jobs


def scrape_linkedin():
    """Scrape public LinkedIn job listings for Kenya"""
    jobs = []
    url = "https://www.linkedin.com/jobs/search/?location=Kenya&position=1&pageNum=0"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        for card in soup.select(".base-card"):
            title_el = card.select_one(".base-search-card__title")
            company_el = card.select_one(".base-search-card__subtitle")
            location_el = card.select_one(".job-search-card__location")
            link_el = card.select_one("a.base-card__full-link")
            if title_el:
                jobs.append({
                    "title": title_el.get_text(strip=True),
                    "company": company_el.get_text(strip=True) if company_el else "Unknown",
                    "location": location_el.get_text(strip=True) if location_el else "Kenya",
                    "source": "linkedin",
                    "url": link_el.get("href", "") if link_el else "",
                    "scraped_at": datetime.utcnow().isoformat(),
                })
    except Exception as e:
        print(f"LinkedIn error: {e}")
    return jobs


def save_to_supabase(jobs):
    """Insert scraped jobs into the database"""
    if not jobs:
        return
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/scraped_jobs",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        json=jobs,
    )
    print(f"Saved {len(jobs)} jobs — status {resp.status_code}")


def run_all():
    print(f"[{datetime.utcnow()}] Starting scrape...")
    all_jobs = []
    all_jobs.extend(scrape_brightermonday())
    all_jobs.extend(scrape_myjobmag())
    all_jobs.extend(scrape_fuzu())
    all_jobs.extend(scrape_linkedin())
    print(f"Scraped {len(all_jobs)} jobs total")
    save_to_supabase(all_jobs)


if __name__ == "__main__":
    run_all()
```

## Running on a Schedule

### Option A: Cron (Linux/Render)
```bash
# Run every 6 hours
0 */6 * * * cd /path/to/scraper && python scraper.py >> scraper.log 2>&1
```

### Option B: Python schedule
```python
import schedule
schedule.every(6).hours.do(run_all)
while True:
    schedule.run_pending()
    time.sleep(60)
```

## Notes

- CSS selectors may change — inspect the target sites periodically
- LinkedIn rate-limits aggressively; add longer delays or use their API
- Use `Prefer: resolution=merge-duplicates` to avoid duplicate inserts (requires a unique constraint on `url` in your `scraped_jobs` table)
- Consider adding a `scraped_jobs` table with columns: `id`, `title`, `company`, `location`, `source`, `url`, `scraped_at`
