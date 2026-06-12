create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hours numeric(10, 2) not null default 0,
  contact_name text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  contract_type text not null default 'Suporte',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  hours numeric(10, 2) not null default 0,
  agent text not null default '',
  category text not null default 'Suporte',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.services enable row level security;

drop policy if exists "Permitir leitura dos clientes" on public.clients;
create policy "Permitir leitura dos clientes"
on public.clients for select
to anon
using (true);

drop policy if exists "Permitir cadastro e edicao dos clientes" on public.clients;
create policy "Permitir cadastro e edicao dos clientes"
on public.clients for all
to anon
using (true)
with check (true);

drop policy if exists "Permitir leitura dos atendimentos" on public.services;
create policy "Permitir leitura dos atendimentos"
on public.services for select
to anon
using (true);

drop policy if exists "Permitir cadastro e edicao dos atendimentos" on public.services;
create policy "Permitir cadastro e edicao dos atendimentos"
on public.services for all
to anon
using (true)
with check (true);

insert into public.clients (
  id,
  name,
  hours,
  contact_name,
  contact_email,
  contact_phone,
  contract_type,
  notes
) values (
  '00000000-0000-4000-8000-000000000001',
  'Cliente Demonstração',
  30,
  'Contato Principal',
  'contato@cliente.com',
  '(11) 99999-0000',
  'Suporte e consultoria',
  'Use este registro como exemplo ou edite com os dados reais.'
) on conflict (id) do nothing;

insert into public.services (
  id,
  client_id,
  date,
  hours,
  agent,
  category,
  description
) values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  current_date,
  2.5,
  'Equipe Mouragrid',
  'Suporte',
  'Ajuste inicial de ambiente e validação de acesso com o cliente.'
) on conflict (id) do nothing;
