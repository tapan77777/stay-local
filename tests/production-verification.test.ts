import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configuration, compareSchema } from '../scripts/production/verify-readonly.mjs';
const env = () => ({
  DATABASE_URL: 'postgresql://fixture:synthetic-fixture-password@ep-synthetic-pooler.test.neon.tech/neondb?sslmode=require',
  PLAN_PRODUCTION_DIRECT_URL: 'postgresql://fixture:synthetic-fixture-password@ep-synthetic.test.neon.tech/neondb?sslmode=require',
  PLAN_PRODUCTION_EXPECTED_BRANCH_ID: 'br-synthetic-verification-only',
  PLAN_PRODUCTION_EXPECTED_PROJECT_ID: 'synthetic-verification-only',
  PLAN_PRODUCTION_IDENTITY_CONFIRMED: 'yes',
});
test('production verification refuses missing configuration and unconfirmed mapping before connecting', () => {
  assert.throws(() => configuration({}), /CONFIGURATION_INCOMPLETE/);
  assert.throws(() => configuration({ ...env(), PLAN_PRODUCTION_IDENTITY_CONFIRMED: 'no' }), /CONFIRMATION_REQUIRED/);
  assert.equal(configuration(env()).urls.length, 2);
});
test('production verification rejects staging, mismatched endpoints, pooled direct URL and unsafe TLS', () => {
  assert.throws(() => configuration({ ...env(), PLAN_PRODUCTION_EXPECTED_BRANCH_ID: 'br-cold-sea-b33m80x4' }), /STAGING/);
  assert.throws(() => configuration({ ...env(), PLAN_PRODUCTION_DIRECT_URL: env().DATABASE_URL }), /ENDPOINTS_DO_NOT_MATCH/);
  assert.throws(() => configuration({ ...env(), PLAN_PRODUCTION_DIRECT_URL: env().PLAN_PRODUCTION_DIRECT_URL.replace('ep-synthetic.', 'ep-other.') }), /ENDPOINTS_DO_NOT_MATCH/);
  assert.throws(() => configuration({ ...env(), DATABASE_URL: env().DATABASE_URL.replace('require', 'disable') }), /INVALID_PRODUCTION_URL_OR_TLS/);
});
test('production schema comparison detects missing columns, constraints, enums and new required columns', () => {
  const col = { table_name: 'plans', column_name: 'title', data_type: 'text', udt_name: 'text', is_nullable: 'NO', column_default: "''::text" };
  const expected = { columns: [col], constraints: [{ table_name: 'plans', contype: 'p', definition: 'PRIMARY KEY (id)' }], enums: [{ typname: 'plan_status', enumlabel: 'DRAFT' }] };
  const actual = { columns: [{ ...col, data_type: 'integer' }, { ...col, column_name: 'extra', column_default: null }], constraints: [], enums: [] };
  const issues = compareSchema(expected, actual);
  assert.ok(issues.some((i: string) => i.includes('type/nullability/default')));
  assert.ok(issues.some((i: string) => i.includes('additional required')));
  assert.ok(issues.some((i: string) => i.includes('constraint missing')));
  assert.ok(issues.some((i: string) => i.includes('enum value missing')));
});
