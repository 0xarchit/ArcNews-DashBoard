-- Create a security definer function to check if a username exists
create or replace function public.check_username_exists(uname text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where username = uname);
$$;

-- Allow public roles to execute the function
grant execute on function public.check_username_exists(text) to anon, authenticated;
