-- Fix infinite recursion in channel_members RLS policies
-- Problem: channel_members SELECT policy references channel_members (self-referential)
-- Solution: SECURITY DEFINER function bypasses RLS for internal membership checks

-- 1. Create helper function that runs as db owner (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_channel_member(p_channel_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_id = p_channel_id
    AND user_id = p_user_id
  );
$$;

-- 2. Drop all policies that cause recursion
DROP POLICY IF EXISTS "channels_read_member" ON channels;
DROP POLICY IF EXISTS "members_read_channel" ON channel_members;
DROP POLICY IF EXISTS "messages_read_member" ON messages;
DROP POLICY IF EXISTS "messages_insert_member" ON messages;

-- 3. Recreate policies using the SECURITY DEFINER function

-- Channels: members can read their channels
CREATE POLICY "channels_read_member" ON channels
  FOR SELECT USING (
    is_channel_member(id, auth.uid())
  );

-- Channel members: users can see members of channels they belong to
CREATE POLICY "members_read_channel" ON channel_members
  FOR SELECT USING (
    is_channel_member(channel_id, auth.uid())
  );

-- Messages: members can read messages in their channels
CREATE POLICY "messages_read_member" ON messages
  FOR SELECT USING (
    is_channel_member(channel_id, auth.uid())
  );

-- Messages: members can send messages in their channels
CREATE POLICY "messages_insert_member" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND is_channel_member(channel_id, auth.uid())
  );
