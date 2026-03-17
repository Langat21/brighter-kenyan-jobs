
CREATE TABLE public.scraped_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text DEFAULT 'Kenya',
  description text,
  tags text[] DEFAULT '{}',
  category text,
  seniority text,
  salary_min integer,
  salary_max integer,
  source text NOT NULL,
  source_url text NOT NULL,
  posted_at timestamp with time zone,
  scraped_at timestamp with time zone NOT NULL DEFAULT now(),
  hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(hash)
);

-- Public read access (no auth needed to browse jobs)
ALTER TABLE public.scraped_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scraped jobs"
  ON public.scraped_jobs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.scraped_jobs;
