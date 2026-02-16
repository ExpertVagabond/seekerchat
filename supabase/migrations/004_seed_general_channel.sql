-- Seed a default "General Chat" channel so new users have somewhere to land
-- This channel has no created_by (system-created) and is not a DM

INSERT INTO channels (name, description, is_dm)
VALUES (
  'General Chat',
  'Welcome to SeekerChat! This is the main channel for all Saga & Seeker holders.',
  FALSE
)
ON CONFLICT DO NOTHING;
