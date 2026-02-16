-- Enable Supabase Realtime on messages and channel_members tables
-- This powers live chat updates via WebSocket subscriptions

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;
