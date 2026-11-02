import { test } from 'node:test';
import assert from 'node:assert/strict';
import { databaseIdentityDiagnostic, diagnosticHead, DIAGNOSTIC_EXPIRES_AT } from '/tmp/staylocal-original-identity-87z6lnf2/lib/plan/database-identity-diagnostic';
const active = () => DIAGNOSTIC_EXPIRES_AT - 1;
const rows = () => Promise.resolve([{ project_id: 'diagnostic-local-project', branch_id: 'br-diagnostic-local', read_only: 'on' }]);
test('unauthenticated and authentication-failure requests never query the database', async () => {
  let calls=0; const read=async()=>{calls++;return rows()};
  assert.equal((await databaseIdentityDiagnostic(async()=>false,read,active)).status,401);
  assert.equal((await databaseIdentityDiagnostic(async()=>{throw Error('private-auth-error')},read,active)).status,503);
  assert.equal(calls,0);
});
test('authenticated result contains exactly the two safe identifiers and no-cache headers', async () => {
  const response=await databaseIdentityDiagnostic(async()=>true,async()=>[{...(await rows())[0],password:'synthetic-private-sentinel',database_url:'synthetic-private-url'}],active);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{project_id:'diagnostic-local-project',branch_id:'br-diagnostic-local'});
  assert.match(response.headers.get('cache-control')!,/no-store/);assert.equal(response.headers.get('vercel-cdn-cache-control'),'no-store');assert.equal(response.headers.get('vary'),'Cookie');
});
test('missing, malformed, multiple and non-read-only identities fail closed',async()=>{
  for(const data of [[],[{}],[{...(await rows())[0],project_id:'https://private.invalid/secret'}],[{...(await rows())[0],branch_id:null}],[{...(await rows())[0],read_only:'off'}],[...(await rows()),...(await rows())]]){
    const response=await databaseIdentityDiagnostic(async()=>true,async()=>data,active);assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'Diagnostic unavailable.'});
  }
});
test('connection errors suppress raw credentials and diagnostic expiry prevents database access', async()=>{
  const error=await databaseIdentityDiagnostic(async()=>true,async()=>{throw Error('synthetic-private-password')},active);assert.equal(error.status,503);assert.ok(!(await error.text()).includes('synthetic-private'));
  let calls=0;const expired=await databaseIdentityDiagnostic(async()=>true,async()=>{calls++;return rows()},()=>DIAGNOSTIC_EXPIRES_AT);assert.equal(expired.status,404);assert.equal(calls,0);
});
test('HEAD returns no identifiers and never needs a database callback',async()=>{
  assert.equal((await diagnosticHead(async()=>false)).status,401);const response=await diagnosticHead(async()=>true);assert.equal(response.status,405);assert.equal(await response.text(),'');
});
