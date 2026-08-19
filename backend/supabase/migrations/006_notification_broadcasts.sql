-- Admin broadcasts (campaigns) plus Web Push subscriptions.
-- Inbox rows stay per-recipient in `notifications`; this table is the admin log.

alter table notifications
  add column if not exists campaign_id uuid;

create index if not exists notifications_campaign_idx
  on notifications (campaign_id);

create table if not exists notification_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  audience text not null check (audience in ('guest', 'host', 'partner', 'admin')),
  channel text not null check (channel in ('push', 'email', 'both')),
  status text not null check (status in ('sent', 'partial', 'failed')),
  recipients integer not null default 0,
  emailed integer not null default 0,
  failed integer not null default 0,
  failure_reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists notification_broadcasts_created_idx
  on notification_broadcasts (created_at desc);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  account_role text not null check (account_role in ('GUEST', 'HOST', 'PARTNER', 'ADMIN')),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_account_idx
  on push_subscriptions (account_id, account_role);
