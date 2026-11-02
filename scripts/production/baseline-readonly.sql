-- Read-only baseline/recovery comparison. Output is private: schema and row hashes.
-- Compare source backup-window receipt with the restored database receipt using cmp.
\set ON_ERROR_STOP on
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '5s';
SELECT jsonb_agg(jsonb_build_array(table_name,column_name,ordinal_position,is_nullable,data_type,udt_name,column_default) ORDER BY table_name,ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('customers','plans','destinations','itinerary_days','places','transports','stays','foods','experiences','map_pins','destination_notes','india_guide_items','plan_documents','plan_devices') AND column_name <> 'content_version';
SELECT jsonb_agg(jsonb_build_array(c.relname,k.conname,k.contype,pg_get_constraintdef(k.oid)) ORDER BY c.relname,k.conname) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('customers','plans','destinations','itinerary_days','places','transports','stays','foods','experiences','map_pins','destination_notes','india_guide_items','plan_documents','plan_devices');
SELECT jsonb_agg(jsonb_build_array(t.typname,e.enumlabel,e.enumsortorder) ORDER BY t.typname,e.enumsortorder) FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public';
SELECT 'customers',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.customers t;
SELECT 'plans',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.plans t;
SELECT 'destinations',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.destinations t;
SELECT 'itinerary_days',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.itinerary_days t;
SELECT 'places',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.places t;
SELECT 'transports',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.transports t;
SELECT 'stays',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.stays t;
SELECT 'foods',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.foods t;
SELECT 'experiences',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.experiences t;
SELECT 'map_pins',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.map_pins t;
SELECT 'destination_notes',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.destination_notes t;
SELECT 'india_guide_items',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.india_guide_items t;
SELECT 'plan_documents',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.plan_documents t;
SELECT 'plan_devices',count(*),md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')) FROM public.plan_devices t;
COMMIT;
