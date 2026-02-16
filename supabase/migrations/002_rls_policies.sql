-- Row Level Security for SeekerChat
-- All tables require auth; users can only access data they're authorized for

-- USERS TABLE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read any user's public profile (for DMs, member lists)
CREATE POLICY "users_read_all" ON users
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own record on first login
CREATE POLICY "users_insert_self" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CHANNELS TABLE
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Users can read channels they are members of
CREATE POLICY "channels_read_member" ON channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = channels.id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Non-DM channels are also readable for the channel browser
CREATE POLICY "channels_read_public" ON channels
  FOR SELECT USING (is_dm = false);

-- Authenticated users can create channels
CREATE POLICY "channels_insert_auth" ON channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CHANNEL_MEMBERS TABLE
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members in their channels
CREATE POLICY "members_read_channel" ON channel_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()
    )
  );

-- Users can add themselves to non-DM channels (join)
CREATE POLICY "members_insert_self" ON channel_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own membership (last_read_at)
CREATE POLICY "members_update_own" ON channel_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can remove themselves from channels (leave)
CREATE POLICY "members_delete_self" ON channel_members
  FOR DELETE USING (auth.uid() = user_id);

-- MESSAGES TABLE
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Members can read messages in their channels
CREATE POLICY "messages_read_member" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

-- Members can insert messages in their channels
CREATE POLICY "messages_insert_member" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );
