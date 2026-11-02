import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { baseline } from '../scripts/production/backup-snapshot.mjs';
test('production backup baseline parses real JSON values and detects changed content', async()=>{
  const pg=new PGlite();
  try {
    for(const name of ['schema.sql','schema-2a.sql','schema-3-devices.sql','schema-4-module-images.sql','schema-5-profile-photo.sql'])await pg.exec(await readFile('lib/plan/'+name,'utf8'));
    await pg.exec("INSERT INTO customers(id,name,email) VALUES('00000000-0000-4000-8000-000000000001','Backup fixture','backup@example.invalid'); INSERT INTO plans(customer_id,private_token,title) VALUES('00000000-0000-4000-8000-000000000001','synthetic-backup-fixture','Before')");
    const session={query:async(text:string)=>(await pg.query<{value:unknown}>(text)).rows[0].value};
    const before=await baseline(session);assert.equal(Object.keys(before.fingerprint).length,14);assert.equal(before.fingerprint.customers.count,1);assert.equal(before.fingerprint.plans.count,1);assert.equal(before.schema.columns.length,178);assert.ok(before.schema.constraints.length>0);assert.ok(before.schema.indexes.length>0);
    await pg.exec("UPDATE plans SET title='After'");const after=await baseline(session);assert.notEqual(before.fingerprint.plans.hash,after.fingerprint.plans.hash);
  } finally { await pg.close(); }
});
test('backup baseline refuses empty or incorrectly wrapped psql JSON',async()=>{
  await assert.rejects(baseline({query:async()=>({})}),/BASELINE_PROTOCOL_INVALID/);
  await assert.rejects(baseline({query:async()=>({value:{}})}),/BASELINE_PROTOCOL_INVALID/);
});
