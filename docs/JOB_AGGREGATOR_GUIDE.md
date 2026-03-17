# Production Job Aggregation System — Node.js Deployment Guide

> Deploy this on your **Render** server (or any Node.js host) alongside your M-PESA backend.  
> Ingests **1000+ jobs/day** from APIs, job boards, and ATS systems.

## Architecture

```
/job-aggregator
├── /scrapers
│   ├── /apis         # Remotive, Arbeitnow
│   ├── /boards       # RemoteOK, BrighterMonday, MyJobMag
│   └── /ats          # Greenhouse, Lever, Workable
├── /pipeline
│   ├── normalizer.ts
│   ├── deduplicator.ts
│   ├── enricher.ts
│   └── publisher.ts
├── /queue
│   └── queues.ts
├── /workers
│   ├── scraperWorker.ts
│   ├── enrichmentWorker.ts
│   └── publisherWorker.ts
├── /scheduler
│   └── cron.ts
├── /types
│   └── job.ts
├── package.json
└── tsconfig.json
```

---

## 1. Setup

```bash
mkdir job-aggregator && cd job-aggregator
npm init -y
npm install axios cheerio playwright bullmq ioredis node-cron dotenv
npm install -D typescript @types/node ts-node
npx tsc --init
```

**.env**
```env
SUPABASE_URL=https://zyjkubdhwfwaieerudfn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key  # For AI enrichment
```

---

## 2. Types — `/types/job.ts`

```typescript
export interface Job {
  id?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  tags: string[];
  category: string;
  seniority: string;
  salary_min: number | null;
  salary_max: number | null;
  source: string;
  source_url: string;
  posted_at: string | null;
  hash?: string;
}

export interface EnrichmentResult {
  category: string;
  seniority: string;
  techStack: string[];
  salaryEstimate: { min: number; max: number } | null;
}

export interface ScraperResult {
  source: string;
  jobs: Job[];
  errors: string[];
  duration: number;
}
```

---

## 3. API Scrapers — `/scrapers/apis/`

### `remotive.ts`
```typescript
import axios from "axios";
import { Job } from "../../types/job";

export async function scrapeRemotive(): Promise<Job[]> {
  const { data } = await axios.get("https://remotive.com/api/remote-jobs?limit=200", {
    timeout: 15000,
  });
  return (data.jobs || []).map((j: any) => ({
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || "Remote",
    description: j.description || "",
    tags: j.tags || [],
    category: j.category || "",
    seniority: "",
    salary_min: null,
    salary_max: null,
    source: "remotive",
    source_url: j.url,
    posted_at: j.publication_date || null,
  }));
}
```

### `arbeitnow.ts`
```typescript
import axios from "axios";
import { Job } from "../../types/job";

export async function scrapeArbeitnow(): Promise<Job[]> {
  const jobs: Job[] = [];
  for (let page = 1; page <= 5; page++) {
    const { data } = await axios.get(
      `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
      { timeout: 15000 }
    );
    for (const j of data.data || []) {
      jobs.push({
        title: j.title,
        company: j.company_name,
        location: j.location || "Remote",
        description: j.description || "",
        tags: j.tags || [],
        category: "",
        seniority: "",
        salary_min: null,
        salary_max: null,
        source: "arbeitnow",
        source_url: j.url,
        posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      });
    }
    await delay(2000); // Rate limit
  }
  return jobs;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
```

---

## 4. Board Scrapers — `/scrapers/boards/`

### `remoteok.ts`
```typescript
import axios from "axios";
import { Job } from "../../types/job";

export async function scrapeRemoteOK(): Promise<Job[]> {
  const { data } = await axios.get("https://remoteok.com/api", {
    headers: { "User-Agent": "BrighterJobs/1.0" },
    timeout: 15000,
  });
  return data.slice(1).filter((j: any) => j.position).map((j: any) => ({
    title: j.position,
    company: j.company || "Unknown",
    location: j.location || "Remote",
    description: j.description || "",
    tags: j.tags || [],
    category: "",
    seniority: "",
    salary_min: j.salary_min ? Number(j.salary_min) : null,
    salary_max: j.salary_max ? Number(j.salary_max) : null,
    source: "remoteok",
    source_url: j.url || `https://remoteok.com/l/${j.id}`,
    posted_at: j.date || null,
  }));
}
```

### `brightermonday.ts` (Cheerio)
```typescript
import axios from "axios";
import * as cheerio from "cheerio";
import { Job } from "../../types/job";

export async function scrapeBrighterMonday(): Promise<Job[]> {
  const jobs: Job[] = [];
  for (let page = 1; page <= 5; page++) {
    try {
      const { data: html } = await axios.get(
        `https://www.brightermonday.co.ke/jobs?page=${page}`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; BrighterJobsBot/1.0)" }, timeout: 15000 }
      );
      const $ = cheerio.load(html);
      $("div.search-result").each((_, el) => {
        const titleEl = $(el).find("h3 a, .search-result__job-title a");
        const companyEl = $(el).find(".search-result__company, .company-name");
        const locationEl = $(el).find(".search-result__location, .location");
        if (titleEl.length) {
          jobs.push({
            title: titleEl.text().trim(),
            company: companyEl.text().trim() || "Unknown",
            location: locationEl.text().trim() || "Kenya",
            description: "",
            tags: [],
            category: "",
            seniority: "",
            salary_min: null,
            salary_max: null,
            source: "brightermonday",
            source_url: "https://www.brightermonday.co.ke" + (titleEl.attr("href") || ""),
            posted_at: null,
          });
        }
      });
      await delay(3000);
    } catch (e: any) {
      console.error(`BrighterMonday page ${page}:`, e.message);
    }
  }
  return jobs;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
```

---

## 5. ATS Scrapers — `/scrapers/ats/`

### `greenhouse.ts`
```typescript
import axios from "axios";
import { Job } from "../../types/job";

// Add companies you want to track
const GREENHOUSE_COMPANIES = [
  "twilio", "figma", "hashicorp", "gitlab", "cloudflare",
  "brex", "gusto", "notion", "linear", "vercel"
];

export async function scrapeGreenhouse(): Promise<Job[]> {
  const jobs: Job[] = [];
  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const { data } = await axios.get(
        `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
        { timeout: 15000 }
      );
      for (const j of data.jobs || []) {
        const loc = j.location?.name || "Remote";
        jobs.push({
          title: j.title,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: loc,
          description: "",
          tags: [],
          category: "",
          seniority: "",
          salary_min: null,
          salary_max: null,
          source: "greenhouse",
          source_url: j.absolute_url || `https://boards.greenhouse.io/${company}/jobs/${j.id}`,
          posted_at: j.updated_at || null,
        });
      }
      await delay(2000);
    } catch (e: any) {
      console.error(`Greenhouse [${company}]:`, e.message);
    }
  }
  return jobs;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
```

### `lever.ts`
```typescript
import axios from "axios";
import { Job } from "../../types/job";

const LEVER_COMPANIES = [
  "netflix", "spotify", "stripe", "github", "atlassian",
  "coinbase", "databricks", "plaid", "airtable", "retool"
];

export async function scrapeLever(): Promise<Job[]> {
  const jobs: Job[] = [];
  for (const company of LEVER_COMPANIES) {
    try {
      const { data } = await axios.get(
        `https://api.lever.co/v0/postings/${company}?mode=json`,
        { timeout: 15000 }
      );
      for (const j of data || []) {
        jobs.push({
          title: j.text,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: j.categories?.location || "Remote",
          description: j.descriptionPlain || "",
          tags: [],
          category: j.categories?.team || "",
          seniority: j.categories?.commitment || "",
          salary_min: null,
          salary_max: null,
          source: "lever",
          source_url: j.hostedUrl || `https://jobs.lever.co/${company}/${j.id}`,
          posted_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
        });
      }
      await delay(2000);
    } catch (e: any) {
      console.error(`Lever [${company}]:`, e.message);
    }
  }
  return jobs;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
```

### `workable.ts` (Playwright — dynamic rendering)
```typescript
import { chromium, Browser } from "playwright";
import { Job } from "../../types/job";

const WORKABLE_COMPANIES = [
  "sentry", "figma", "datadog", "cockroachlabs", "miro"
];

export async function scrapeWorkable(): Promise<Job[]> {
  const jobs: Job[] = [];
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    });

    for (const company of WORKABLE_COMPANIES) {
      try {
        const page = await context.newPage();
        await page.goto(`https://apply.workable.com/${company}/`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Wait for job cards to render
        await page.waitForSelector("[data-ui='job']", { timeout: 10000 }).catch(() => {});

        const pageJobs = await page.evaluate((src: string) => {
          const cards = document.querySelectorAll("[data-ui='job']");
          return Array.from(cards).map((card) => {
            const titleEl = card.querySelector("a, h3");
            const locEl = card.querySelector("[data-ui='job-location']");
            return {
              title: titleEl?.textContent?.trim() || "",
              location: locEl?.textContent?.trim() || "Remote",
              url: (titleEl as HTMLAnchorElement)?.href || "",
            };
          });
        }, company);

        for (const pj of pageJobs) {
          if (pj.title) {
            jobs.push({
              title: pj.title,
              company: company.charAt(0).toUpperCase() + company.slice(1),
              location: pj.location,
              description: "",
              tags: [],
              category: "",
              seniority: "",
              salary_min: null,
              salary_max: null,
              source: "workable",
              source_url: pj.url || `https://apply.workable.com/${company}/`,
              posted_at: null,
            });
          }
        }

        await page.close();
        await delay(3000);
      } catch (e: any) {
        console.error(`Workable [${company}]:`, e.message);
      }
    }
  } finally {
    if (browser) await browser.close();
  }
  return jobs;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
```

---

## 6. Pipeline — `/pipeline/`

### `deduplicator.ts`
```typescript
import { createHash } from "crypto";
import { Job } from "../types/job";

export function generateHash(job: Job): string {
  const input = `${job.title}|${job.company}|${job.location}`.toLowerCase().trim();
  return createHash("md5").update(input).digest("hex");
}

export function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const hash = generateHash(job);
    if (seen.has(hash)) return false;
    seen.add(hash);
    job.hash = hash;
    return true;
  });
}
```

### `normalizer.ts`
```typescript
import { Job } from "../types/job";

export function normalizeJob(job: Job): Job {
  return {
    ...job,
    title: job.title.trim().replace(/\s+/g, " "),
    company: job.company.trim(),
    location: normalizeLocation(job.location),
    description: (job.description || "").slice(0, 10000), // Cap length
    tags: (job.tags || []).map((t) => t.toLowerCase().trim()),
  };
}

function normalizeLocation(loc: string): string {
  const l = loc.toLowerCase().trim();
  if (l.includes("remote") || l.includes("anywhere")) return "Remote";
  if (l.includes("nairobi")) return "Nairobi, Kenya";
  if (l.includes("mombasa")) return "Mombasa, Kenya";
  if (l.includes("kenya")) return loc.trim();
  return loc.trim();
}
```

### `enricher.ts` (AI-powered)
```typescript
import axios from "axios";
import { Job, EnrichmentResult } from "../types/job";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function enrichJob(job: Job): Promise<EnrichmentResult> {
  if (!OPENAI_API_KEY) {
    return { category: job.category || "General", seniority: job.seniority || "Mid", techStack: job.tags, salaryEstimate: null };
  }

  try {
    const { data } = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analyze this job and return JSON: { "category": "Technology|Marketing|Finance|Sales|Design|Healthcare|Education|Customer Service|General", "seniority": "Entry|Mid|Senior|Executive", "techStack": ["skill1","skill2"], "salaryEstimate": { "min": number, "max": number } | null }`,
          },
          {
            role: "user",
            content: `Title: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description?.slice(0, 2000)}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }, timeout: 15000 }
    );

    return JSON.parse(data.choices[0].message.content);
  } catch (e: any) {
    console.error("Enrichment error:", e.message);
    return { category: "General", seniority: "Mid", techStack: job.tags, salaryEstimate: null };
  }
}
```

### `publisher.ts`
```typescript
import axios from "axios";
import { Job } from "../types/job";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function publishJobs(jobs: Job[]): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;

  // Insert in batches of 100
  for (let i = 0; i < jobs.length; i += 100) {
    const batch = jobs.slice(i, i + 100);
    try {
      const resp = await axios.post(
        `${SUPABASE_URL}/rest/v1/scraped_jobs`,
        batch,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          timeout: 30000,
        }
      );
      inserted += batch.length;
    } catch (e: any) {
      console.error(`Publish batch error:`, e.response?.data || e.message);
      errors += batch.length;
    }
  }

  return { inserted, errors };
}
```

---

## 7. Queue System — `/queue/queues.ts`

```typescript
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const scrapeQueue = new Queue("scrapeQueue", { connection });
export const enrichQueue = new Queue("enrichQueue", { connection });
export const publishQueue = new Queue("publishQueue", { connection });

export { connection };
```

---

## 8. Workers — `/workers/`

### `scraperWorker.ts`
```typescript
import { Worker } from "bullmq";
import { connection, enrichQueue } from "../queue/queues";
import { scrapeRemotive } from "../scrapers/apis/remotive";
import { scrapeArbeitnow } from "../scrapers/apis/arbeitnow";
import { scrapeRemoteOK } from "../scrapers/boards/remoteok";
import { scrapeBrighterMonday } from "../scrapers/boards/brightermonday";
import { scrapeGreenhouse } from "../scrapers/ats/greenhouse";
import { scrapeLever } from "../scrapers/ats/lever";
import { normalizeJob } from "../pipeline/normalizer";
import { deduplicateJobs, generateHash } from "../pipeline/deduplicator";

const scraperWorker = new Worker(
  "scrapeQueue",
  async (job) => {
    console.log(`[Scraper] Starting scrape run...`);
    const start = Date.now();

    const results = await Promise.allSettled([
      scrapeRemotive(),
      scrapeArbeitnow(),
      scrapeRemoteOK(),
      scrapeBrighterMonday(),
      scrapeGreenhouse(),
      scrapeLever(),
      // Add scrapeWorkable() if Playwright is installed
    ]);

    const allJobs = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<any>).value);

    const normalized = allJobs.map(normalizeJob);
    const unique = deduplicateJobs(normalized);

    console.log(`[Scraper] Scraped: ${allJobs.length}, Unique: ${unique.length}, Duration: ${Date.now() - start}ms`);

    // Send unique jobs to enrichment queue
    for (const j of unique) {
      await enrichQueue.add("enrich", j, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      });
    }

    return { scraped: allJobs.length, unique: unique.length };
  },
  { connection, concurrency: 1 }
);

scraperWorker.on("failed", (job, err) => {
  console.error(`[Scraper] Job ${job?.id} failed:`, err.message);
});
```

### `enrichmentWorker.ts`
```typescript
import { Worker } from "bullmq";
import { connection, publishQueue } from "../queue/queues";
import { enrichJob } from "../pipeline/enricher";
import { Job } from "../types/job";

const enrichmentWorker = new Worker(
  "enrichQueue",
  async (job) => {
    const rawJob: Job = job.data;
    const enrichment = await enrichJob(rawJob);

    const enrichedJob = {
      ...rawJob,
      category: enrichment.category,
      seniority: enrichment.seniority,
      tags: [...new Set([...(rawJob.tags || []), ...enrichment.techStack])],
      salary_min: rawJob.salary_min || enrichment.salaryEstimate?.min || null,
      salary_max: rawJob.salary_max || enrichment.salaryEstimate?.max || null,
    };

    await publishQueue.add("publish", enrichedJob, {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
    });

    return enrichedJob;
  },
  {
    connection,
    concurrency: 5, // Process 5 enrichments in parallel
    limiter: { max: 10, duration: 60000 }, // Rate limit: 10/min for OpenAI
  }
);

enrichmentWorker.on("failed", (job, err) => {
  console.error(`[Enrichment] Job ${job?.id} failed:`, err.message);
});
```

### `publisherWorker.ts`
```typescript
import { Worker } from "bullmq";
import { connection } from "../queue/queues";
import { publishJobs } from "../pipeline/publisher";
import { Job } from "../types/job";

const batch: Job[] = [];
let batchTimer: NodeJS.Timeout | null = null;

async function flushBatch() {
  if (batch.length === 0) return;
  const toPublish = batch.splice(0, batch.length);
  const result = await publishJobs(toPublish);
  console.log(`[Publisher] Published ${result.inserted} jobs, ${result.errors} errors`);
}

const publisherWorker = new Worker(
  "publishQueue",
  async (job) => {
    batch.push(job.data);

    // Flush every 50 jobs or after 10s
    if (batch.length >= 50) {
      await flushBatch();
    } else if (!batchTimer) {
      batchTimer = setTimeout(async () => {
        await flushBatch();
        batchTimer = null;
      }, 10000);
    }
  },
  { connection, concurrency: 1 }
);

publisherWorker.on("failed", (job, err) => {
  console.error(`[Publisher] Job ${job?.id} failed:`, err.message);
});
```

---

## 9. Scheduler — `/scheduler/cron.ts`

```typescript
import cron from "node-cron";
import { scrapeQueue } from "../queue/queues";

// Run every 4 hours
cron.schedule("0 */4 * * *", async () => {
  console.log(`[Scheduler] Triggering scrape at ${new Date().toISOString()}`);
  await scrapeQueue.add("scheduled-scrape", {}, {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
  });
});

console.log("[Scheduler] Cron job registered: every 4 hours");
```

---

## 10. Entry Point — `index.ts`

```typescript
import "dotenv/config";

// Start workers (they auto-listen)
import "./workers/scraperWorker";
import "./workers/enrichmentWorker";
import "./workers/publisherWorker";

// Start scheduler
import "./scheduler/cron";

// Initial run
import { scrapeQueue } from "./queue/queues";
scrapeQueue.add("initial-scrape", {}).then(() => {
  console.log("[Init] Initial scrape job queued");
});

console.log("🚀 Job Aggregator running");
```

---

## 11. Render Deployment

**`package.json`** scripts:
```json
{
  "scripts": {
    "start": "ts-node index.ts",
    "build": "tsc",
    "dev": "ts-node-dev index.ts"
  }
}
```

On Render:
1. Create a **Background Worker** service
2. Set **Build Command**: `npm install && npx playwright install chromium && npm run build`
3. Set **Start Command**: `npm start`
4. Add environment variables from `.env`
5. Add a **Redis** instance and link `REDIS_URL`

---

## Adding New Scrapers

Create a new file in the appropriate `/scrapers/` subfolder:

```typescript
import { Job } from "../../types/job";

export async function scrapeNewSource(): Promise<Job[]> {
  // Fetch, parse, return Job[]
  return [];
}
```

Then import it in `scraperWorker.ts` and add to the `Promise.allSettled` array.

---

## Monitoring Checklist

- [ ] Check Redis queue lengths: `scrapeQueue.getJobCounts()`
- [ ] Monitor failed jobs: `enrichQueue.getFailed()`  
- [ ] Log scraped/inserted/duplicate counts per run
- [ ] Set up alerts for consecutive failures
- [ ] Monitor API rate limits (RemoteOK, LinkedIn are aggressive)
