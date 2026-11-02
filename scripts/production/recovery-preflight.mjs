// CHECK ONLY: this file cannot restore, create, delete or modify database objects.
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';
import { neon } from '@neondatabase/serverless';
const ROOT=new URL('../../',import.meta.url),PROJECT='lucky-waterfall-84436365';
export function recoveryConfiguration(e,productionUrl){
  const branch=e.PLAN_RECOVERY_EXPECTED_BRANCH_ID;
  if(e.PLAN_RECOVERY_EXPECTED_PROJECT_ID!==PROJECT||!/^br-[a-z0-9-]+$/.test(branch||'')||['br-broad-pond-b3nfbi06','br-cold-sea-b33m80x4'].includes(branch))throw Error('RECOVERY_IDENTITY_INVALID_OR_PROTECTED');
  if(e.PLAN_RECOVERY_DISPOSABLE_CONFIRMED!=='yes'||e.PLAN_RECOVERY_FRESH_CREDENTIALS_CONFIRMED!=='yes')throw Error('DISPOSABLE_TARGET_AND_ISOLATED_CREDENTIAL_CONFIRMATION_REQUIRED');
  let target,source;try{target=new URL(e.PLAN_RECOVERY_DATABASE_URL);source=new URL(productionUrl);}catch{throw Error('RECOVERY_CONNECTION_INCOMPLETE');}
  if(!['postgres:','postgresql:'].includes(target.protocol)||!target.hostname.endsWith('.neon.tech')||target.hostname.includes('-pooler.')||!target.password||!target.username||!target.pathname.slice(1)||!['require','verify-full','verify-ca'].includes(target.searchParams.get('sslmode')))throw Error('RECOVERY_DIRECT_TLS_CONNECTION_REQUIRED');
  if(target.hostname.replace('-pooler.','.')===source.hostname.replace('-pooler.','.')||decodeURIComponent(target.password)===decodeURIComponent(source.password))throw Error('RECOVERY_PRODUCTION_ENDPOINT_OR_SHARED_CREDENTIAL_REJECTED');
  if(!e.PLAN_RECOVERY_EXPECTED_DATABASE||/REPLACE_/.test(e.PLAN_RECOVERY_EXPECTED_DATABASE)||decodeURIComponent(target.pathname.slice(1))!==e.PLAN_RECOVERY_EXPECTED_DATABASE)throw Error('RECOVERY_DATABASE_NOT_CONFIRMED');
  return {target,branch,project:PROJECT,database:e.PLAN_RECOVERY_EXPECTED_DATABASE};
}
async function run(){const env=parseEnv(await readFile(new URL('.env.excel-recovery.local',ROOT),'utf8')),production=parseEnv(await readFile(new URL('.env.local',ROOT),'utf8'));const c=recoveryConfiguration(env,production.DATABASE_URL),sql=neon(c.target.toString(),{fetchOptions:{signal:AbortSignal.timeout(20000)}});const [,rows]=await sql.transaction([sql.query("SELECT 1/CASE WHEN current_setting('neon.branch_id',true)=$1 AND current_setting('neon.project_id',true)=$2 AND current_database()=$3 AND current_setting('transaction_read_only')='on' THEN 1 ELSE 0 END",[c.branch,c.project,c.database]),sql.query("SELECT (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public')+(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public')+(SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public') AS public_objects")],{readOnly:true});if(Number(rows[0]?.public_objects)!==0)throw Error('RECOVERY_TARGET_NOT_EMPTY_STOP');console.log(JSON.stringify({checkOnly:true,readOnly:true,project:c.project,branch:c.branch,database:c.database,emptyPublicSchemaVerified:true,restoreExecuted:false}));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run().catch(e=>{console.error(/^[A-Z_]+$/.test(e.message)?e.message:'RECOVERY_PREFLIGHT_FAILED_RAW_DETAILS_SUPPRESSED');process.exitCode=1;});
