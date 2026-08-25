CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  locality_selected text NOT NULL,
  thumbs_rating text NOT NULL CHECK (thumbs_rating IN ('up','down')),
  comment text,
  email text
);
GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);