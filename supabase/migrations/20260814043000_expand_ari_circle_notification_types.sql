-- ARI XP — keep Circle notification validation aligned with active features.
--
-- The original notification type check predates Feed comments, Challenges,
-- partner invites, and reaction achievements. Newer RPCs already emit these
-- notification types, so the stale constraint can roll back otherwise-valid
-- user actions such as posting a comment.

alter table public.ari_circle_notifications
  drop constraint if exists ari_circle_notifications_type_check;

alter table public.ari_circle_notifications
  add constraint ari_circle_notifications_type_check
  check (
    type = any (array[
      'connection_request'::text,
      'connection_accepted'::text,
      'message_request'::text,
      'message'::text,
      'love'::text,
      'profile'::text,
      'system'::text,
      'feed_comment'::text,
      'achievement_unlocked'::text,
      'challenge_entry'::text,
      'challenge_hype'::text,
      'challenge_reaction'::text,
      'challenge_vote'::text,
      'partner_invite'::text,
      'partner_invite_accepted'::text
    ])
  );
