import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RawJob {
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
}

// ── SHA-256 hash for deduplication ────────────────────────────────
async function hashJob(j: RawJob): Promise<string> {
  const data = new TextEncoder().encode(
    `${j.title}|${j.company}|${j.location}`.toLowerCase().trim()
  );
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

// ── Category detection ────────────────────────────────────────────
function detectCategory(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (/\b(developer|engineer|software|devops|frontend|backend|fullstack|data scientist|machine learning|ai\b|cloud|sre|qa|test)\b/.test(text)) return "Technology";
  if (/\b(market|seo|content|social media|brand|digital market|advertis|copywriter)\b/.test(text)) return "Marketing";
  if (/\b(accountant|finance|audit|tax|banking|cpa|financial|treasury)\b/.test(text)) return "Finance";
  if (/\b(sales|business develop|account manager|revenue|bdm)\b/.test(text)) return "Sales";
  if (/\b(design|ui|ux|graphic|creative|art director)\b/.test(text)) return "Design";
  if (/\b(nurse|doctor|clinical|pharma|medical|health|dental)\b/.test(text)) return "Healthcare";
  if (/\b(teacher|lecturer|education|instructor|tutor|academic)\b/.test(text)) return "Education";
  if (/\b(customer|support|call center|helpdesk|client service)\b/.test(text)) return "Customer Service";
  return "General";
}

// ── Seniority detection ───────────────────────────────────────────
function detectSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/\b(intern|trainee|graduate|attachment)\b/.test(t)) return "Intern";
  if (/\b(junior|entry|associate)\b/.test(t)) return "Entry";
  if (/\b(senior|lead|principal|staff)\b/.test(t)) return "Senior";
  if (/\b(manager|director|head of|vp|chief|executive|cto|ceo|cfo)\b/.test(t)) return "Executive";
  return "Mid";
}

// ── Source 1: BrighterMonday RSS / public listings ─────────────────
async function scrapeBrighterMonday(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  try {
    // BrighterMonday has a public jobs page we can parse
    const resp = await fetch("https://www.brightermonday.co.ke/jobs", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrighterJobsBot/1.0)" },
    });
    if (!resp.ok) throw new Error(`BrighterMonday ${resp.status}`);
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse BrighterMonday HTML");

    const cards = doc.querySelectorAll("div[class*='search-result'], article[class*='job'], div[class*='job-card'], div[class*='listing']");
    console.log(`BrighterMonday: found ${cards.length} card elements`);

    for (const card of cards) {
      const titleEl = card.querySelector("h3 a, h2 a, a[class*='title'], a[class*='job-title']");
      const companyEl = card.querySelector("[class*='company'], [class*='employer']");
      const locationEl = card.querySelector("[class*='location'], [class*='city']");

      if (titleEl) {
        const title = titleEl.textContent?.trim() || "";
        const href = titleEl.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `https://www.brightermonday.co.ke${href}`;

        jobs.push({
          title,
          company: companyEl?.textContent?.trim() || "Unknown",
          location: locationEl?.textContent?.trim() || "Nairobi, Kenya",
          description: "",
          tags: [],
          category: detectCategory(title, ""),
          seniority: detectSeniority(title),
          salary_min: null,
          salary_max: null,
          source: "brightermonday",
          source_url: url,
          posted_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("BrighterMonday scrape error:", e);
  }
  return jobs;
}

// ── Source 2: MyJobMag Kenya ──────────────────────────────────────
async function scrapeMyJobMag(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  try {
    const resp = await fetch("https://www.myjobmag.co.ke/jobs-in-kenya", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrighterJobsBot/1.0)" },
    });
    if (!resp.ok) throw new Error(`MyJobMag ${resp.status}`);
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse MyJobMag HTML");

    const cards = doc.querySelectorAll(".job-list-item, .mag-b, li[class*='job'], div[class*='job-list']");
    console.log(`MyJobMag: found ${cards.length} card elements`);

    for (const card of cards) {
      const titleEl = card.querySelector("h2 a, h3 a, a[class*='job-title'], a[class*='title']");
      const companyEl = card.querySelector("[class*='company'], [class*='employer']");

      if (titleEl) {
        const title = titleEl.textContent?.trim() || "";
        const href = titleEl.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `https://www.myjobmag.co.ke${href}`;

        jobs.push({
          title,
          company: companyEl?.textContent?.trim() || "Unknown",
          location: "Kenya",
          description: "",
          tags: [],
          category: detectCategory(title, ""),
          seniority: detectSeniority(title),
          salary_min: null,
          salary_max: null,
          source: "myjobmag",
          source_url: url,
          posted_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("MyJobMag scrape error:", e);
  }
  return jobs;
}

// ── Source 3: Fuzu Kenya ──────────────────────────────────────────
async function scrapeFuzu(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  try {
    const resp = await fetch("https://www.fuzu.com/kenya/jobs", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrighterJobsBot/1.0)" },
    });
    if (!resp.ok) throw new Error(`Fuzu ${resp.status}`);
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse Fuzu HTML");

    const cards = doc.querySelectorAll(".job-card, .opportunity-card, div[class*='job'], article[class*='opportunity']");
    console.log(`Fuzu: found ${cards.length} card elements`);

    for (const card of cards) {
      const titleEl = card.querySelector("h3 a, h2 a, a[class*='title']");
      const companyEl = card.querySelector("[class*='company'], [class*='employer']");

      if (titleEl) {
        const title = titleEl.textContent?.trim() || "";
        const href = titleEl.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `https://www.fuzu.com${href}`;

        jobs.push({
          title,
          company: companyEl?.textContent?.trim() || "Unknown",
          location: "Kenya",
          description: "",
          tags: [],
          category: detectCategory(title, ""),
          seniority: detectSeniority(title),
          salary_min: null,
          salary_max: null,
          source: "fuzu",
          source_url: url,
          posted_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("Fuzu scrape error:", e);
  }
  return jobs;
}

// ── Source 4: LinkedIn public Kenya jobs ───────────────────────────
async function scrapeLinkedInKenya(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  try {
    const resp = await fetch(
      "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=&location=Kenya&start=0",
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }
    );
    if (!resp.ok) throw new Error(`LinkedIn ${resp.status}`);
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse LinkedIn HTML");

    const cards = doc.querySelectorAll(".base-card, li");
    console.log(`LinkedIn Kenya: found ${cards.length} card elements`);

    for (const card of cards) {
      const titleEl = card.querySelector(".base-search-card__title, h3");
      const companyEl = card.querySelector(".base-search-card__subtitle, h4");
      const locationEl = card.querySelector(".job-search-card__location");
      const linkEl = card.querySelector("a.base-card__full-link, a[href*='jobs/view']");

      if (titleEl && linkEl) {
        const title = titleEl.textContent?.trim() || "";
        const href = linkEl.getAttribute("href") || "";

        jobs.push({
          title,
          company: companyEl?.textContent?.trim() || "Unknown",
          location: locationEl?.textContent?.trim() || "Kenya",
          description: "",
          tags: [],
          category: detectCategory(title, ""),
          seniority: detectSeniority(title),
          salary_min: null,
          salary_max: null,
          source: "linkedin",
          source_url: href,
          posted_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("LinkedIn Kenya scrape error:", e);
  }
  return jobs;
}

// ── Source 5: Arbeitnow filtered for Kenya ────────────────────────
async function scrapeArbeitnowKenya(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  try {
    const resp = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!resp.ok) throw new Error(`Arbeitnow ${resp.status}`);
    const data = await resp.json();
    for (const j of data.data || []) {
      const loc = (j.location || "").toLowerCase();
      if (loc.includes("kenya") || loc.includes("nairobi") || loc.includes("mombasa") || loc.includes("africa")) {
        jobs.push({
          title: j.title,
          company: j.company_name,
          location: j.location || "Kenya",
          description: j.description || "",
          tags: j.tags || [],
          category: detectCategory(j.title, j.description || ""),
          seniority: detectSeniority(j.title),
          salary_min: null,
          salary_max: null,
          source: "arbeitnow",
          source_url: j.url,
          posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
        });
      }
    }
  } catch (e) {
    console.error("Arbeitnow Kenya filter error:", e);
  }
  return jobs;
}

// ── Main handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting Kenya job scrape...");

    const [bmJobs, mjmJobs, fuzuJobs, liJobs, anJobs] = await Promise.all([
      scrapeBrighterMonday(),
      scrapeMyJobMag(),
      scrapeFuzu(),
      scrapeLinkedInKenya(),
      scrapeArbeitnowKenya(),
    ]);

    const allJobs = [...bmJobs, ...mjmJobs, ...fuzuJobs, ...liJobs, ...anJobs];
    console.log(
      `Scraped ${allJobs.length} Kenya jobs (BM: ${bmJobs.length}, MJM: ${mjmJobs.length}, Fuzu: ${fuzuJobs.length}, LI: ${liJobs.length}, AN: ${anJobs.length})`
    );

    if (allJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No Kenya jobs scraped", inserted: 0, duplicates: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash for dedup
    const jobsWithHash = await Promise.all(
      allJobs.map(async (j) => ({ ...j, hash: await hashJob(j) }))
    );

    // Check existing
    const hashes = jobsWithHash.map((j) => j.hash);
    const { data: existing } = await supabase
      .from("scraped_jobs")
      .select("hash")
      .in("hash", hashes);

    const existingSet = new Set((existing || []).map((e: { hash: string }) => e.hash));
    const newJobs = jobsWithHash.filter((j) => !existingSet.has(j.hash));

    console.log(`New: ${newJobs.length}, Duplicates skipped: ${allJobs.length - newJobs.length}`);

    let inserted = 0;
    if (newJobs.length > 0) {
      for (let i = 0; i < newJobs.length; i += 50) {
        const batch = newJobs.slice(i, i + 50);
        const { error } = await supabase
          .from("scraped_jobs")
          .upsert(batch, { onConflict: "hash", ignoreDuplicates: true });
        if (error) {
          console.error(`Batch upsert error at ${i}:`, error.message);
        } else {
          inserted += batch.length;
        }
      }
    }

    const result = {
      message: "Kenya scrape complete",
      scraped: allJobs.length,
      inserted,
      duplicates: allJobs.length - newJobs.length,
      sources: {
        brightermonday: bmJobs.length,
        myjobmag: mjmJobs.length,
        fuzu: fuzuJobs.length,
        linkedin: liJobs.length,
        arbeitnow_kenya: anJobs.length,
      },
    };

    console.log("Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Kenya scrape error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
