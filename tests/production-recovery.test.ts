import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recoveryConfiguration } from '../scripts/production/recovery-preflight.mjs';
const source='postgresql://fixture:production-fixture-password@ep-source-pooler.test.neon.tech/neondb?sslmode=require';
const fixture=()=>({PLAN_RECOVERY_DATABASE_URL:'postgresql://recovery:isolated-fixture-password@ep-recovery.test.neon.tech/recovery?sslmode=require',PLAN_RECOVERY_EXPECTED_PROJECT_ID:'lucky-waterfall-84436365',PLAN_RECOVERY_EXPECTED_BRANCH_ID:'br-disposable-test',PLAN_RECOVERY_EXPECTED_DATABASE:'recovery',PLAN_RECOVERY_DISPOSABLE_CONFIRMED:'yes',PLAN_RECOVERY_FRESH_CREDENTIALS_CONFIRMED:'yes'});
test('recovery preflight rejects production, existing staging, wrong project and missing confirmations',()=>{
  for(const branch of ['br-broad-pond-b3nfbi06','br-cold-sea-b33m80x4'])assert.throws(()=>recoveryConfiguration({...fixture(),PLAN_RECOVERY_EXPECTED_BRANCH_ID:branch},source),/PROTECTED/);
  assert.throws(()=>recoveryConfiguration({...fixture(),PLAN_RECOVERY_EXPECTED_PROJECT_ID:'wrong-project'},source),/IDENTITY_INVALID/);
  assert.throws(()=>recoveryConfiguration({...fixture(),PLAN_RECOVERY_DISPOSABLE_CONFIRMED:'no'},source),/CONFIRMATION_REQUIRED/);
  assert.equal(recoveryConfiguration(fixture(),source).database,'recovery');
});
test('recovery preflight refuses shared production credentials, pooled targets and wrong database',()=>{
  assert.throws(()=>recoveryConfiguration({...fixture(),PLAN_RECOVERY_DATABASE_URL:source},source));
  assert.throws(()=>recoveryConfiguration({...fixture(),PLAN_RECOVERY_DATABASE_URL:fixture().PLAN_RECOVERY_DATABASE_URL.replace('isolated-fixture-password','production-fixture-password')},source),/SHARED_CREDENTIAL_REJECTED/);
  assert.throws(()=>recoveryConfiguration({...fixture(),PLAN_RECOVERY_DATABASE_URL:fixture().PLAN_RECOVERY_DATABASE_URL.replace('ep-recovery.','ep-recovery-pooler.')},source),/DIRECT_TLS/);
  assert.throws(()=>recoveryConfiguration({...fixture(),PLAN_RECOVERY_EXPECTED_DATABASE:'other'},source),/DATABASE_NOT_CONFIRMED/);
});
