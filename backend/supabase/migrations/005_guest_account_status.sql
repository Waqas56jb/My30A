-- Guest accounts can be blocked by admin without deleting the stay history.
alter table guests
  add column if not exists status text not null default 'active';

alter table guests
  add column if not exists notes text;

alter table guests drop constraint if exists guests_account_status_check;
alter table guests
  add constraint guests_account_status_check check (status in ('active', 'blocked'));
