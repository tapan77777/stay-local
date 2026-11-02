-- PREPARED ONLY. Requires separate explicit production approval, verified target,
-- successful production backup/recovery receipt, and an admin edit freeze.
-- Invoke using psql --no-psqlrc --set ON_ERROR_STOP=on --file THIS_FILE.
-- Never use --single-transaction: this wrapper owns its transaction.
\set ON_ERROR_STOP on
\if :{?expected_branch_id}
\else
  \echo 'STOP: expected_branch_id is required.'
  \quit 2
\endif
\if :{?expected_project_id}
\else
  \echo 'STOP: expected_project_id is required.'
  \quit 2
\endif
\if :{?approved_release}
\else
  \echo 'STOP: approved_release is required after explicit owner approval.'
  \quit 2
\endif
BEGIN;
SET LOCAL search_path = public, pg_catalog;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SELECT CASE WHEN current_setting('server_version_num')::int >= 170000
  THEN set_config('transaction_timeout','300s',true) END;
SELECT set_config('staylocal.expected_branch', :'expected_branch_id', true),
       set_config('staylocal.expected_project', :'expected_project_id', true),
       set_config('staylocal.approved_release', :'approved_release', true);
DO $$ BEGIN
  IF current_setting('staylocal.approved_release') = ''
    OR current_setting('staylocal.expected_branch') !~ '^br-[a-z0-9-]+$'
    OR current_setting('staylocal.expected_branch') = 'br-cold-sea-b33m80x4'
    OR current_setting('neon.branch_id', true) IS DISTINCT FROM current_setting('staylocal.expected_branch')
    OR current_setting('neon.project_id', true) IS DISTINCT FROM current_setting('staylocal.expected_project')
  THEN RAISE EXCEPTION 'PRODUCTION_RELEASE_IDENTITY_OR_APPROVAL_MISSING'; END IF;
END $$;
SELECT pg_advisory_xact_lock(1937006969, 6);
\ir ../../lib/plan/schema-6-excel.sql
DO $$ BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='plans' AND column_name='content_version' AND data_type='bigint' AND is_nullable='NO') <> 1
    OR to_regclass('public.plan_excel_previews') IS NULL
    OR to_regclass('public.plan_excel_revisions') IS NULL
    OR (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND t.tgname IN ('sl_excel_plan_version','sl_excel_child_version') AND t.tgenabled='O' AND NOT t.tgisinternal) <> 12
    OR to_regprocedure('public.sl_excel_guard(uuid)') IS NULL
    OR to_regprocedure('public.sl_excel_plan_version()') IS NULL
    OR to_regprocedure('public.sl_excel_child_version()') IS NULL
  THEN RAISE EXCEPTION 'EXCEL_POSTCONDITION_FAILED'; END IF;
END $$;
COMMIT;
