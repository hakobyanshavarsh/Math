# MathVision

Interactive visual platform for learning double integrals. Plain HTML + CSS + JS, no build step.

## Run
Open `index.html` (or run `npx serve`). Without Supabase it runs in demo mode.
GitHub Pages: Settings -> Pages -> Deploy from a branch -> `main` / root.

## Connect Supabase
1. Create a project at supabase.com.
2. In the SQL Editor run:

```sql
create table progress (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  exercise_id text not null,
  correct boolean not null default false,
  attempts int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, exercise_id)
);
alter table progress enable row level security;
create policy "own rows" on progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
3. Put `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `config.js`.
4. Authentication -> Providers -> Email (turn off "Confirm email" for testing).
5. Authentication -> URL Configuration: add your GitHub Pages URL.
