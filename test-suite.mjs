import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nacl = require('tweetnacl');
const bs58 = require('bs58').default || require('bs58');
const { Buffer } = require('buffer');

const SUPABASE_URL = 'https://knffubovjrgumchjqaih.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZmZ1Ym92anJndW1jaGpxYWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTg1ODQsImV4cCI6MjA4NjgzNDU4NH0.htjtBP8q2QZJA4AAzSGrahvG_Ipdw-sV4phSsauWLqY';

let passed = 0, failed = 0;
function test(name, ok) {
  if (ok) { console.log('  PASS', name); passed++; }
  else { console.log('  FAIL', name); failed++; }
}

async function run() {
  console.log('=== SECURITY TESTS ===');

  // 1. Bad signature rejected
  let r = await fetch(SUPABASE_URL + '/functions/v1/wallet-auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: 'fake', message: 'fake', signature: 'fake' })
  });
  test('Bad signature → 401', r.status === 401);

  // 2. Missing fields rejected
  r = await fetch(SUPABASE_URL + '/functions/v1/wallet-auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: 'test' })
  });
  test('Missing fields → 400', r.status === 400);

  // 3. Anon cannot insert users
  r = await fetch(SUPABASE_URL + '/rest/v1/users', {
    method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: 'ATTACKER', genesis_token_type: 'saga', genesis_token_mint: 'fake' })
  });
  test('Anon insert user blocked (RLS)', r.status === 401 || r.status === 403);

  // 4. Anon cannot read messages (no membership)
  r = await fetch(SUPABASE_URL + '/rest/v1/messages?select=id&limit=1', { headers: { 'apikey': ANON_KEY } });
  let data = await r.json();
  test('Anon messages empty (RLS)', r.status === 200 && data.length === 0);

  // 5. Anon CAN read public channels
  r = await fetch(SUPABASE_URL + '/rest/v1/channels?select=name&is_dm=eq.false', { headers: { 'apikey': ANON_KEY } });
  data = await r.json();
  test('Anon sees public channels', r.status === 200 && data.length > 0);

  // 6. CORS preflight
  r = await fetch(SUPABASE_URL + '/functions/v1/wallet-auth', {
    method: 'OPTIONS',
    headers: { 'Origin': 'https://seekerchat.app', 'Access-Control-Request-Method': 'POST' }
  });
  test('CORS preflight → 200', r.status === 200);

  console.log('\n=== AUTH FLOW TESTS ===');

  // 7. Full auth with valid keypair
  const keypair = nacl.sign.keyPair();
  const wallet = bs58.encode(keypair.publicKey);
  const msg = 'seekerchat.app wants you to sign in with your Solana account:\n' +
    wallet + '\n\nSign in to SeekerChat\n\nNonce: abc\nIssued At: 2026-02-16T20:00:00Z';
  const sig = bs58.encode(nacl.sign.detached(new TextEncoder().encode(msg), keypair.secretKey));

  r = await fetch(SUPABASE_URL + '/functions/v1/wallet-auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: wallet, message: msg, signature: sig })
  });
  let auth = await r.json();
  test('Valid signature → 200 + JWT', r.status === 200 && Boolean(auth.access_token));
  test('Returns user_id UUID', /^[0-9a-f-]{36}$/.test(auth.user_id));

  // 8. JWT claims
  const payload = JSON.parse(Buffer.from(auth.access_token.split('.')[1], 'base64url').toString());
  test('JWT role = authenticated', payload.role === 'authenticated');
  test('JWT sub = user_id', payload.sub === auth.user_id);
  test('JWT wallet matches', payload.wallet_address === wallet);
  test('JWT expiry ~7 days', payload.exp - payload.iat === 604800);

  // 9. Same wallet re-auth → same user
  r = await fetch(SUPABASE_URL + '/functions/v1/wallet-auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: wallet, message: msg, signature: sig })
  });
  let auth2 = await r.json();
  test('Re-auth same wallet → same user_id', auth2.user_id === auth.user_id);

  console.log('\n=== AUTHENTICATED ACCESS TESTS ===');
  const authHeaders = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + auth.access_token };

  // 10. Auth user sees channels
  r = await fetch(SUPABASE_URL + '/rest/v1/channels?select=id,name', { headers: authHeaders });
  data = await r.json();
  test('Auth user sees General Chat', data.some(c => c.name === 'General Chat'));

  // 11. User profile exists
  r = await fetch(SUPABASE_URL + '/rest/v1/users?select=id,wallet_address&wallet_address=eq.' + wallet, { headers: authHeaders });
  data = await r.json();
  test('User record in DB', data.length === 1 && data[0].wallet_address === wallet);

  // 12. Join General Chat (no return=representation — PostgREST SELECT races with just-inserted row)
  const channelId = '637da102-b9e2-4257-8b91-50d97aee78df';
  r = await fetch(SUPABASE_URL + '/rest/v1/channel_members', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel_id: channelId, user_id: auth.user_id, role: 'member' })
  });
  test('Join General Chat', r.status === 201);

  // 13. Send message
  const clientId = crypto.randomUUID();
  r = await fetch(SUPABASE_URL + '/rest/v1/messages', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel_id: channelId, sender_id: auth.user_id, content: 'Hello SeekerChat!', client_id: clientId })
  });
  test('Send message', r.status === 201);

  // 14. Read messages
  r = await fetch(SUPABASE_URL + '/rest/v1/messages?select=id,content,sender_id&channel_id=eq.' + channelId + '&order=created_at.desc&limit=1', { headers: authHeaders });
  data = await r.json();
  test('Read messages', data.length > 0 && data[0].content === 'Hello SeekerChat!');

  // 15. Dedup via client_id
  r = await fetch(SUPABASE_URL + '/rest/v1/messages', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel_id: channelId, sender_id: auth.user_id, content: 'Dupe!', client_id: clientId })
  });
  test('Duplicate client_id rejected', r.status !== 201);

  // 16. Can't send as another user
  r = await fetch(SUPABASE_URL + '/rest/v1/messages', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel_id: channelId, sender_id: '00000000-0000-0000-0000-000000000000', content: 'Impersonation!' })
  });
  test('Cannot impersonate sender (RLS)', r.status !== 201);

  console.log('\n=== HELIUS RPC TESTS ===');

  // 17. Helius health
  r = await fetch('https://mainnet.helius-rpc.com/?api-key=021dc255-a17b-47d8-b5b4-c915ee29efff', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' })
  });
  data = await r.json();
  test('Helius RPC healthy', data.result === 'ok');

  // 18. DAS searchAssets
  r = await fetch('https://mainnet.helius-rpc.com/?api-key=021dc255-a17b-47d8-b5b4-c915ee29efff', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'searchAssets',
      params: { ownerAddress: wallet, grouping: ['collection', '46pcSL5gmjBrPqGKFaLbbCmR6iVuLJbnQy13hAe7s6CC'], page: 1, limit: 1 }
    })
  });
  data = await r.json();
  test('DAS searchAssets responds', data.result !== undefined);

  console.log('\n=== RESULTS ===');
  console.log(passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' total');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });
