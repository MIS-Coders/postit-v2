CREATE TABLE IF NOT EXISTS embedding_job (
  id text PRIMARY KEY,
  document_id integer NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  message text NOT NULL,
  chunks integer,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS embedding_job_document_id_idx ON embedding_job (document_id, created_at DESC);
