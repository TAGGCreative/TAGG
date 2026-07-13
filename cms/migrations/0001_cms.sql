CREATE TABLE IF NOT EXISTS content_documents (
  key TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  revision_id TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS revisions_created_at_idx
ON revisions(created_at DESC);

CREATE TABLE IF NOT EXISTS processing_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  asset_role TEXT NOT NULL,
  object_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('uploading', 'waiting', 'processing', 'ready', 'error')),
  progress INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  lease_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS processing_jobs_status_idx
ON processing_jobs(status, created_at);

CREATE TABLE IF NOT EXISTS access_users (
  email TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
