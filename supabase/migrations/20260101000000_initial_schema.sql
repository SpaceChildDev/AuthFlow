-- Initial schema for AuthFlow

-- 1. Create otp_services table
create table if not exists public.otp_services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  slug text not null unique,
  secret text not null,
  digits int default 6,
  step int default 30,
  encoding text default 'base32',
  algorithm text default 'SHA-1',
  created_at timestamp with time zone default now()
);

-- Enable RLS on otp_services
alter table public.otp_services enable row level security;

-- Policies for otp_services
create policy "Users can view their own services" 
on public.otp_services for select 
using (auth.uid() = user_id);

create policy "Users can insert their own services" 
on public.otp_services for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own services" 
on public.otp_services for update 
using (auth.uid() = user_id);

create policy "Users can delete their own services" 
on public.otp_services for delete 
using (auth.uid() = user_id);


-- 2. Create otp_logs table
create table if not exists public.otp_logs (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references public.otp_services(id) on delete cascade,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on otp_logs
alter table public.otp_logs enable row level security;

-- Policies for otp_logs
create policy "Users can view their own logs" 
on public.otp_logs for select 
using (auth.uid() = user_id);

create policy "Users can insert their own logs" 
on public.otp_logs for insert 
with check (auth.uid() = user_id);
