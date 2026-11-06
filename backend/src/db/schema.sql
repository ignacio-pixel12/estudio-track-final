-- ============================================================
-- Estudio Track · Esquema PostgreSQL
-- Idempotente: se puede correr varias veces.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  color       text not null default '#6366f1' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at  timestamptz not null default now()
);

create table if not exists tasks (
  id                   uuid primary key default gen_random_uuid(),
  subject_id           uuid not null references subjects(id) on delete cascade,
  title                text not null check (char_length(title) between 3 and 120),
  status               text not null default 'pendiente'
                       check (status in ('pendiente', 'en_progreso', 'completada')),
  estimated_pomodoros  int not null default 1 check (estimated_pomodoros between 1 and 50),
  notes                text check (char_length(notes) <= 500),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  completed_at         timestamptz
);

create table if not exists pomodoro_sessions (
  id                uuid primary key default gen_random_uuid(),
  task_id           uuid not null references tasks(id) on delete cascade,
  type              text not null default 'focus' check (type in ('focus', 'break')),
  duration_minutes  int not null check (duration_minutes > 0 and duration_minutes <= 120),
  started_at        timestamptz not null default now(),
  ended_at          timestamptz
);

-- Índices pensados para las consultas reales de la app
create index if not exists idx_tasks_subject   on tasks (subject_id);
create index if not exists idx_tasks_status    on tasks (status);
create index if not exists idx_tasks_created   on tasks (created_at desc);
create index if not exists idx_sessions_task   on pomodoro_sessions (task_id);
create index if not exists idx_sessions_type   on pomodoro_sessions (type);

-- Mantener updated_at al día sin depender del backend
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
before update on tasks
for each row execute function touch_updated_at();
