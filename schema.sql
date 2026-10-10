CREATE TABLE IF NOT EXISTS vouches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  verified INTEGER NOT NULL DEFAULT 0,
  demo INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL,
  heart_count INTEGER NOT NULL DEFAULT 0,
  fire_count INTEGER NOT NULL DEFAULT 0,
  thumb_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_vouches_status_created ON vouches(status, created_at DESC);
CREATE TABLE IF NOT EXISTS reaction_events (
  id TEXT PRIMARY KEY,
  vouch_id TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('heart','fire','thumb')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY(vouch_id) REFERENCES vouches(id)
);
CREATE INDEX IF NOT EXISTS idx_reaction_vouch ON reaction_events(vouch_id);
CREATE TABLE IF NOT EXISTS submission_events (
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_submission_events_created ON submission_events(created_at);
