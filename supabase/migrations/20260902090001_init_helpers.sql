-- 20260902090001_init_helpers.sql
-- Weight — extensions and the server-authoritative row-metadata trigger.
-- Owning phase: backend-data-engineering. Forward-only (ADR-0006). No down migration.

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists "uuid-ossp";   -- uuid_generate_v5() for deterministic derived-row ids

-- ---------------------------------------------------------------------------
-- set_row_metadata(): forces created_at / updated_at / version to be
-- SERVER-authoritative on every synced row. Client-supplied values for these
-- three columns are ignored (architecture §8.4, AR-DEC-04).
--   INSERT  -> created_at = now(), updated_at = now(), version = 1
--   UPDATE  -> created_at preserved, updated_at = now(), version = OLD.version + 1
-- The unconditional version bump makes both the sync_apply() rpc AND the
-- conditional-PATCH fallback (AR-OQ-6) satisfy the optimistic-concurrency
-- invariant without extra code.
-- ---------------------------------------------------------------------------
create or replace function set_row_metadata()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    new.created_at := now();
    new.updated_at := now();
    new.version    := 1;
  elsif (tg_op = 'UPDATE') then
    new.created_at := old.created_at;
    new.updated_at := now();
    new.version    := old.version + 1;
  end if;
  return new;
end;
$$;

-- Attach set_row_metadata() to a table. Called once per synced table in the
-- schema migration.
create or replace function _attach_row_metadata(p_table regclass)
returns void
language plpgsql
as $$
begin
  execute format(
    'create trigger trg_row_metadata before insert or update on %s
       for each row execute function set_row_metadata()', p_table);
end;
$$;
