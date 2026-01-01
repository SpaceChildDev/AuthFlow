-- Syncing missing columns and policies

-- 1. Update otp_services with access_token
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='otp_services' and column_name='access_token') then
    alter table public.otp_services add column access_token text unique default null;
  end if;
end $$;

-- 2. Update otp_logs with extra metadata
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='otp_logs' and column_name='status_code') then
    alter table public.otp_logs add column status_code int;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='otp_logs' and column_name='ip_address') then
    alter table public.otp_logs add column ip_address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='otp_logs' and column_name='user_agent') then
    alter table public.otp_logs add column user_agent text;
  end if;
end $$;

-- 3. Ensure Public Lookup Policy exists
drop policy if exists "Allow public service lookup by slug" on public.otp_services;
create policy "Allow public service lookup by slug" 
on public.otp_services for select 
using (true);

-- 4. Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';
