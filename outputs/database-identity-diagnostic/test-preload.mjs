// Local test only. Refuses all non-loopback network requests except fake Neon,
// whose SQL is forwarded to an authenticated disposable PGlite bridge.
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
  const target=new URL(typeof input==='string'||input instanceof URL?String(input):input.url);
  if(target.hostname==='api.invalid'){
    const headers=new Headers(init?.headers);
    if(!headers.get('Neon-Connection-String')?.includes('@isolated.invalid/'))throw Error('TEST_REFUSED_UNEXPECTED_DATABASE');
    return originalFetch(process.env.DIAGNOSTIC_TEST_BRIDGE,{...init,headers:{'x-test-secret':process.env.DIAGNOSTIC_TEST_SECRET,'x-test-read-only':headers.get('Neon-Batch-Read-Only')||''}});
  }
  if(['127.0.0.1','localhost','[::1]'].includes(target.hostname))return originalFetch(input,init);
  throw Error('TEST_REFUSED_REMOTE_NETWORK');
};
