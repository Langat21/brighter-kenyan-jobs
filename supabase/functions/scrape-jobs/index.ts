import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Unified job shape ──────────────────────────────────────────────
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

// ── MD5 hash for deduplication ─────────────────────────────────────
async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function hashJob(j: RawJob): Promise<string> {
  return hashText(`${j.title}|${j.company}|${j.location}`.toLowerCase().trim());
}

// ── Source: Remotive (REST API) ────────────────────────────────────
async function scrapeRemotive(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  try {
    const resp = await fetch("https://remotive.com/api/remote-jobs?limit=100");
    if (!resp.ok) throw new Error(`Remotive ${resp.status}`);
    const data = await resp.json();
    for (const j of data.jobs || []) {
      jobs.push({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || "Remote",
        description: j.description || "",
        tags: j.tags || [],
        category: j.category || "General",
        seniority: "",
        salary_min: null,
        salary_max: null,
        source: "remotive",
        source_url: j.url,
        posted_at: j.publication_date || null,
      });
    }
  } catch (e) {
    console.error("Remotive scrape error:", e);
  }
  return jobs;
}

// ── Source: Arbeitnow (REST API) ───────────────────────────────────
async function scrapeArbeitnow(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  try {
    const resp = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!resp.ok) throw new Error(`Arbeitnow ${resp.status}`);
    const data = await resp.json();
    for (const j of data.data || []) {
      jobs.push({
        title: j.title,
        company: j.company_name,
        location: j.location || "Remote",
        description: j.description || "",
        tags: j.tags || [],
        category: j.category || "General",
        seniority: "",
        salary_min: null,
        salary_max: null,
        source: "arbeitnow",
        source_url: j.url,
        posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      });
    }
  } catch (e) {
    console.error("Arbeitnow scrape error:", e);
  }
  return jobs;
}

// ── Source: RemoteOK — currently blocked (403), kept as placeholder ──

// ── Main handler ───────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting job scrape...");

    // Fetch from all sources in parallel
    const [remotiveJobs, arbeitnowJobs] = await Promise.all([
      scrapeRemotive(),
      scrapeArbeitnow(),
    ]);

    const allJobs = [...remotiveJobs, ...arbeitnowJobs];
    console.log(`Scraped ${allJobs.length} total jobs (Remotive: ${remotiveJobs.length}, Arbeitnow: ${arbeitnowJobs.length})`);

    if (allJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No jobs scraped", inserted: 0, duplicates: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash all jobs for dedup
    const jobsWithHash = await Promise.all(
      allJobs.map(async (j) => ({ ...j, hash: await hashJob(j) }))
    );

    // Get existing hashes to skip duplicates
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
      // Insert in batches of 50 with upsert to handle race conditions
      for (let i = 0; i < newJobs.length; i += 50) {
        const batch = newJobs.slice(i, i + 50);
        const { error, count } = await supabase
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
      message: "Scrape complete",
      scraped: allJobs.length,
      inserted,
      duplicates: allJobs.length - newJobs.length,
      sources: {
        remotive: remotiveJobs.length,
        arbeitnow: arbeitnowJobs.length,
        remoteok: remoteokJobs.length,
      },
    };

    console.log("Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Scrape error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
