CREATE INDEX IF NOT EXISTS langchain_pg_embedding_full_text_idx
ON langchain_pg_embedding
USING GIN ((
  setweight(to_tsvector('simple', COALESCE(cmetadata->>'document_name', '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(cmetadata->>'document_number', '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(cmetadata->>'source', '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(document, '')), 'B')
));
