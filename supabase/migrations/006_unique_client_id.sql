-- Add unique constraint on client_id for message deduplication
-- Clients generate a UUID per message; if the same UUID arrives twice, reject the duplicate

DROP INDEX IF EXISTS idx_messages_client_id;
CREATE UNIQUE INDEX idx_messages_client_id ON messages(client_id) WHERE client_id IS NOT NULL;
