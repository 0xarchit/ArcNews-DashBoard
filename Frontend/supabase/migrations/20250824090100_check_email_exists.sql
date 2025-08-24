-- Create a security definer function to check if an email exists in auth.users
create or replace function public.check_email_exists(mail text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from auth.users where email = mail);
$$;

-- Allow public roles to execute the function
grant execute on function public.check_email_exists(text) to anon, authenticated;
