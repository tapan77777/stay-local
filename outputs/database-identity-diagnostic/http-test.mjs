import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHmac, randomBytes } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
const workspace=JSON.parse(await readFile('/tmp/staylocal-diagnostic-workspace.json','utf8')).directory;
const pg=new PGlite();
await pg.exec("SELECT set_config('neon.project_id','diagnostic-local-project',false),set_config('neon.branch_id','br-diagnostic-local',false); CREATE TABLE diagnostic_canary(id int PRIMARY KEY, value text); INSERT INTO diagnostic_canary VALUES(1,'unchanged');");
const before=(await pg.query('SELECT * FROM diagnostic_canary')).rows;
await pg.exec('BEGIN READ ONLY');
await assert.rejects(pg.query("UPDATE diagnostic_canary SET value='must-not-commit' WHERE id=1"), error=>error.code==='25006');
await pg.exec('ROLLBACK');
let calls=0,mode='normal',verifiedReadonly=[];const secret=randomBytes(24).toString('hex');
const bridge=createServer(async(req,res)=>{
  if(req.headers['x-test-secret']!==secret){res.writeHead(403).end();return;}
  calls++; const chunks=[];for await(const b of req)chunks.push(b);
  try{
    assert.equal(req.headers['x-test-read-only'],'true');
    const body=JSON.parse(Buffer.concat(chunks));assert.equal(body.queries.length,2);
    assert.match(body.queries[0].query,/^SELECT set_config\('statement_timeout','5000',true\),set_config\('lock_timeout','1000',true\)$/);
    assert.equal(body.queries[1].query,"SELECT current_setting('neon.project_id',true) AS project_id,current_setting('neon.branch_id',true) AS branch_id,current_setting('transaction_read_only') AS read_only");
    assert.ok(body.queries.every(q=>!q.params?.length));
    if(mode==='failure')throw Error('synthetic-private-connection-error');
    await pg.exec('BEGIN READ ONLY');
    try{
      const results=[];
      for(const q of body.queries){const result=await pg.query(q.query,q.params);results.push({...result,rows:result.rows.map(row=>result.fields.map(field=>String(row[field.name])))});}
      const setting=(await pg.query("SELECT current_setting('transaction_read_only') AS mode")).rows[0].mode;
      assert.equal(setting,'on');verifiedReadonly.push(true);
      await pg.exec('COMMIT');res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({results}));
    }catch(e){await pg.exec('ROLLBACK');throw e;}
  }catch{res.writeHead(400,{'content-type':'application/json'}).end(JSON.stringify({message:'synthetic-private-connection-error',code:'08006'}));}
});
bridge.listen(0,'127.0.0.1');await once(bridge,'listening');
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
const base=`http://127.0.0.1:${port}`,path='/admin/diagnostics/database-identity';
const env={PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',DATABASE_URL:'postgresql://fixture:synthetic-password@isolated.invalid/test',ADMIN_PASSWORD:'synthetic-admin',ADMIN_SESSION_SECRET:randomBytes(32).toString('hex'),DIAGNOSTIC_TEST_SECRET:secret,DIAGNOSTIC_TEST_BRIDGE:`http://127.0.0.1:${bridge.address().port}`};
const server=spawn(process.execPath,['--import',new URL('./test-preload.mjs',import.meta.url).pathname,'node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:workspace,env,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);const passed=[];
function cookie(payload){const body=Buffer.from(JSON.stringify(payload)).toString('base64url');return `sl_admin=${body}.${createHmac('sha256',env.ADMIN_SESSION_SECRET).update(body).digest('base64url')}`;}
try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/admin/login')).status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,'Local Next server failed to start');
  for(const headers of [{},{cookie:'sl_admin=invalid'},{cookie:cookie({v:1,sub:'admin',iat:1,exp:2})}])assert.equal((await fetch(base+path,{headers})).status,401);
  assert.equal(calls,0);passed.push('unauthenticated, tampered and expired admin sessions blocked without database access');
  const now=Math.floor(Date.now()/1000),headers={cookie:cookie({v:1,sub:'admin',iat:now,exp:now+60})};
  const response=await fetch(base+path,{headers});assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{project_id:'diagnostic-local-project',branch_id:'br-diagnostic-local'});assert.match(response.headers.get('cache-control'),/no-store/);assert.ok(response.headers.get('vary').split(',').map(v=>v.trim()).includes('Cookie'));assert.ok(!response.headers.has('access-control-allow-origin'));passed.push('real authenticated Next route returns exactly two IDs with no-store and no CORS permission');
  assert.equal(verifiedReadonly.length,1);passed.push('Neon transaction flag is read-only and disposable PostgreSQL confirms transaction_read_only=on');
  const count=calls;assert.equal((await fetch(base+path,{method:'HEAD',headers})).status,405);assert.equal((await fetch(base+path,{method:'POST',headers})).status,405);assert.equal(calls,count);passed.push('HEAD and POST cannot execute diagnostic SQL');
  mode='failure';const failed=await fetch(base+path,{headers});assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{error:'Diagnostic unavailable.'});assert.ok(!logs.includes('synthetic-private-connection-error'));passed.push('connection errors produce a generic response without logging raw errors');
  assert.deepEqual((await pg.query('SELECT * FROM diagnostic_canary')).rows,before);passed.push('disposable database canary unchanged');
  const manifest=JSON.parse(await readFile(workspace+'/.next/server/app-paths-manifest.json','utf8'));assert.ok(!Object.keys(manifest).some(k=>k.startsWith('/admin/plans/excel/')||k.startsWith('/admin/plans/import/')));passed.push('build manifest confirms Excel import/API routes are absent');
  const nextVersion=JSON.parse(await readFile(workspace+'/node_modules/next/package.json','utf8')).version;
  const reactVersion=JSON.parse(await readFile(workspace+'/node_modules/react/package.json','utf8')).version;
  assert.equal(nextVersion,'16.4.3');assert.equal(reactVersion,'19.2.9');
  const result={passed:passed.length,checks:passed,remoteConnections:0,next:nextVersion,react:reactVersion,workspace};
  await writeFile(new URL('./http-results.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
} catch(error){console.error('Local diagnostic HTTP test failed: '+error.message);process.exitCode=1;}finally{server.kill('SIGTERM');await once(server,'exit');await new Promise(r=>bridge.close(r));await pg.close();}
