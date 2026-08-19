alter table admin_users
  add column if not exists phone text,
  add column if not exists title text,
  add column if not exists avatar_url text;
