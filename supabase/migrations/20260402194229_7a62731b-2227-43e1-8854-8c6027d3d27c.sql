
CREATE TABLE public.job_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_identifier TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job views"
  ON public.job_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job views"
  ON public.job_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all job views"
  ON public.job_views FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_job_views_user_week ON public.job_views (user_id, viewed_at);
