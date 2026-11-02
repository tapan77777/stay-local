-- PREPARED ONLY. Run after explicit credential/grant approval and Schema-6.
-- Does not create a role/password, change ownership, or touch customer rows.
\set ON_ERROR_STOP on
\if :{?approved_rotation}
\else
  \echo 'STOP: explicit rotation/grant approval is required.'
  \quit 2
\endif
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SELECT set_config('staylocal.approved_rotation', :'approved_rotation', true);
DO $$ BEGIN
  IF current_setting('staylocal.approved_rotation')=''
    OR current_setting('neon.project_id',true) IS DISTINCT FROM 'lucky-waterfall-84436365'
    OR current_setting('neon.branch_id',true) IS DISTINCT FROM 'br-broad-pond-b3nfbi06'
    OR current_database()<>'neondb'
  THEN RAISE EXCEPTION 'PRODUCTION_IDENTITY_OR_APPROVAL_MISSING'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='staylocal_app_release' AND rolcanlogin)
  THEN RAISE EXCEPTION 'NEW_APP_ROLE_NOT_PROVISIONED'; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='staylocal_app_release' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls))
    OR pg_has_role('staylocal_app_release','neon_superuser','MEMBER')
  THEN RAISE EXCEPTION 'APP_ROLE_MUST_NOT_HAVE_ADMIN_MEMBERSHIP'; END IF;
  IF to_regclass('public.plan_excel_previews') IS NULL OR to_regclass('public.plan_excel_revisions') IS NULL
    OR to_regprocedure('public.sl_excel_guard(uuid)') IS NULL
  THEN RAISE EXCEPTION 'SCHEMA_6_REQUIRED_BEFORE_RUNTIME_GRANTS'; END IF;
END $$;
GRANT CONNECT ON DATABASE neondb TO staylocal_app_release;
GRANT USAGE ON SCHEMA public TO staylocal_app_release;
GRANT USAGE ON TYPE public.plan_status TO staylocal_app_release;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE
  public.customers,public.plans,public.destinations,public.itinerary_days,
  public.places,public.transports,public.stays,public.foods,public.experiences,
  public.map_pins,public.destination_notes,public.india_guide_items,
  public.plan_documents,public.plan_devices,
  public.plan_excel_previews,public.plan_excel_revisions
TO staylocal_app_release;
GRANT EXECUTE ON FUNCTION public.sl_excel_guard(uuid),public.sl_excel_plan_version(),public.sl_excel_child_version()
TO staylocal_app_release;
COMMIT;
