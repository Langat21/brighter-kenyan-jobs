import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string | null;
  tags: string[];
  category: string | null;
  seniority: string | null;
  salary_min: number | null;
  salary_max: number | null;
  source: string;
  source_url: string;
  posted_at: string | null;
  created_at: string;
}

export function useScrapedJobs(filters?: {
  query?: string;
  category?: string;
  location?: string;
  limit?: number;
}) {
  const [jobs, setJobs] = useState<ScrapedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("scraped_jobs")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }
      if (filters?.query) {
        query = query.or(
          `title.ilike.%${filters.query}%,company.ilike.%${filters.query}%`
        );
      }

      const { data, error: err } = await query;

      if (err) {
        setError(err.message);
      } else {
        setJobs((data as unknown as ScrapedJob[]) || []);
      }
      setLoading(false);
    };

    fetchJobs();
  }, [filters?.query, filters?.category, filters?.location, filters?.limit]);

  return { jobs, loading, error };
}
