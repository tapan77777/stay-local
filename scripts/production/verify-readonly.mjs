// No .env.local/process.env fallback and no migration or application imports.
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { PGlite } from '@electric-sql/pglite';
const root = new URL('../../', import.meta.url);
const tables = ['customers','plans','destinations','itinerary_days','places','transports','stays','foods','experiences','map_pins','destination_notes','india_guide_items','plan_documents','plan_devices'];
export function configuration(env) {
  const required = ['DATABASE_URL','PLAN_PRODUCTION_DIRECT_URL','PLAN_PRODUCTION_EXPECTED_BRANCH_ID','PLAN_PRODUCTION_EXPECTED_PROJECT_ID'];
  if (required.some(k => !env[k] || /REPLACE_|PLACEHOLDER/.test(env[k]))) throw Error('PRODUCTION_CONFIGURATION_INCOMPLETE');
  if (env.PLAN_PRODUCTION_IDENTITY_CONFIRMED !== 'yes') throw Error('OWNER_PRODUCTION_MAPPING_CONFIRMATION_REQUIRED');
  if (!/^br-[a-z0-9-]+$/.test(env.PLAN_PRODUCTION_EXPECTED_BRANCH_ID) || env.PLAN_PRODUCTION_EXPECTED_BRANCH_ID === 'br-cold-sea-b33m80x4') throw Error('PRODUCTION_BRANCH_INVALID_OR_STAGING');
  const urls = [env.DATABASE_URL, env.PLAN_PRODUCTION_DIRECT_URL].map(value => {
    let u; try { u = new URL(value); } catch { throw Error('INVALID_PRODUCTION_URL'); }
    if (!['postgres:','postgresql:'].includes(u.protocol) || !u.hostname.endsWith('.neon.tech') || !u.username || !u.password || !u.pathname.slice(1) || !['require','verify-full','verify-ca'].includes(u.searchParams.get('sslmode')) || (u.port && u.port !== '5432')) throw Error('INVALID_PRODUCTION_URL_OR_TLS');
    return u;
  });
  const [pooled,direct] = urls;
  if (!pooled.hostname.includes('-pooler.') || direct.hostname.includes('-pooler.') || pooled.hostname.replace('-pooler.','.') !== direct.hostname || pooled.pathname !== direct.pathname || pooled.username !== direct.username) throw Error('PRODUCTION_ENDPOINTS_DO_NOT_MATCH');
  return { env, urls };
}
const schemaQuery = `SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`;
const constraintsQuery = `SELECT c.relname AS table_name,k.contype,pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY c.relname,k.contype,definition`;
const enumsQuery = `SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder`;
export function compareSchema(expected, actual) {
  const issues=[];
  for (const table of tables) {
    const wanted=expected.columns.filter(c=>c.table_name===table), present=actual.columns.filter(c=>c.table_name===table);
    if (!present.length) { issues.push(`${table}: missing table`); continue; }
    for (const c of wanted) {
      const a=present.find(x=>x.column_name===c.column_name);
      if (!a) issues.push(`${table}.${c.column_name}: missing column`);
      else if (['data_type','udt_name','is_nullable','column_default'].some(k=>a[k]!==c[k])) issues.push(`${table}.${c.column_name}: type/nullability/default differs from baseline`);
    }
    for (const c of present) if (!wanted.some(w=>w.column_name===c.column_name) && c.column_name!=='content_version' && c.is_nullable==='NO' && c.column_default===null) issues.push(`${table}.${c.column_name}: additional required column without default`);
  }
  for (const c of expected.constraints.filter(c=>tables.includes(c.table_name))) if (!actual.constraints.some(a=>a.table_name===c.table_name&&a.contype===c.contype&&a.definition===c.definition)) issues.push(`${c.table_name}: baseline ${c.contype} constraint missing or differs`);
  for (const e of expected.enums) if (!actual.enums.some(a=>a.typname===e.typname&&a.enumlabel===e.enumlabel)) issues.push(`${e.typname}: baseline enum value missing`);
  return issues;
}
async function run() {
  const config=configuration(parseEnv(await readFile(new URL('.env.excel-production.local',root),'utf8')));
  if (!process.argv.includes('--connect')) { console.log(JSON.stringify({configuration:'PASS',connected:false,next:'Use --connect only after owner mapping confirmation; all remote transactions are read-only.'})); return; }
  const clients=config.urls.map(u=>neon(u.toString(),{fetchOptions:{signal:AbortSignal.timeout(30000)}}));
  // Verify BOTH identities before querying schema. No credential probing of other hosts.
  for (const client of clients) {
    const [rows]=await client.transaction([client.query("SELECT current_setting('neon.branch_id',true) AS branch,current_setting('neon.project_id',true) AS project,current_database() AS database,current_setting('transaction_read_only') AS read_only,current_setting('server_version_num')::int AS version")],{readOnly:true});
    const r=rows[0];
    if (r?.branch!==config.env.PLAN_PRODUCTION_EXPECTED_BRANCH_ID||r?.project!==config.env.PLAN_PRODUCTION_EXPECTED_PROJECT_ID||r?.database!==decodeURIComponent(config.urls[0].pathname.slice(1))||r?.read_only!=='on'||r?.version<130000) throw Error('PRODUCTION_IDENTITY_MISMATCH_STOPPED');
  }
  const pg=new PGlite(); let expected;
  try {
    for (const name of ['schema.sql','schema-2a.sql','schema-3-devices.sql','schema-4-module-images.sql','schema-5-profile-photo.sql']) await pg.exec(await readFile(new URL('lib/plan/'+name,root),'utf8'));
    expected={columns:(await pg.query(schemaQuery)).rows,constraints:(await pg.query(constraintsQuery)).rows,enums:(await pg.query(enumsQuery)).rows};
  } finally { await pg.close(); }
  // Assert identity again in the SAME read-only transaction as schema inspection.
  const client=clients[1];
  const guard=`SELECT 1 / CASE WHEN current_setting('neon.branch_id',true)=$1 AND current_setting('neon.project_id',true)=$2 AND current_setting('transaction_read_only')='on' THEN 1 ELSE 0 END AS identity_ok`;
  const [,,columns,constraints,enums,functions,triggers,privileges]=await client.transaction([
    client.query(guard,[config.env.PLAN_PRODUCTION_EXPECTED_BRANCH_ID,config.env.PLAN_PRODUCTION_EXPECTED_PROJECT_ID]),
    client.query("SELECT set_config('statement_timeout','30000',true),set_config('lock_timeout','5000',true)"),
    client.query(schemaQuery),client.query(constraintsQuery),client.query(enumsQuery),
    client.query("SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'sl_excel_%'"),
    client.query("SELECT c.relname AS table_name,t.tgname,t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal"),
    client.query("SELECT table_name,(has_table_privilege(quote_ident(table_schema)||'.'||quote_ident(table_name),'SELECT') AND has_table_privilege(quote_ident(table_schema)||'.'||quote_ident(table_name),'INSERT') AND has_table_privilege(quote_ident(table_schema)||'.'||quote_ident(table_name),'UPDATE') AND has_table_privilege(quote_ident(table_schema)||'.'||quote_ident(table_name),'DELETE')) AS content_privileges FROM information_schema.tables WHERE table_schema='public'")
  ],{readOnly:true});
  const issues=compareSchema(expected,{columns,constraints,enums});
  if (columns.some(c=>c.column_name==='content_version'&&c.table_name==='plans')||columns.some(c=>c.table_name.startsWith('plan_excel_'))||functions.length||triggers.some(t=>t.tgname.startsWith('sl_excel_'))) issues.push('Schema-6 objects already present: inspect complete definitions before migration; do not infer compatibility');
  for (const table of tables) if (!privileges.some(p=>p.table_name===table&&p.content_privileges)) issues.push(`${table}: application content privileges not confirmed`);
  console.log(JSON.stringify({identity:'PASS',branch:config.env.PLAN_PRODUCTION_EXPECTED_BRANCH_ID,project:config.env.PLAN_PRODUCTION_EXPECTED_PROJECT_ID,connectionsVerified:2,readOnly:true,baselineTables:tables.filter(t=>columns.some(c=>c.table_name===t)).length,schemaCompatibility:issues.length?'REVIEW_REQUIRED':'PASS',issues,existingCustomTriggers:triggers.map(t=>({table:t.table_name,name:t.tgname,enabled:t.tgenabled})),limitations:'Does not prove credential revocation, backup/recovery, migration-role DDL privileges or external writer compatibility.'},null,2));
  if (issues.length) process.exitCode=1;
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) run().catch(error=>{console.error(JSON.stringify({connectedSchemaVerified:false,reason:/^[A-Z_]+$/.test(error.message)?error.message:'READ_ONLY_VERIFICATION_FAILED_DETAILS_SUPPRESSED'}));process.exitCode=1;});
