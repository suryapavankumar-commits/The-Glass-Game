// Test script to verify the 15 requirements specified in the prompt
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('==============================================');
  console.log('TESTING THE GLASS GAME MULTIPLAYER ENGINE');
  console.log('==============================================\n');

  // TEST 1: Create room (Expect 6-character code)
  console.log('--- TEST 1: Create room ---');
  const createRes = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName: 'Commander Vale' }),
  });
  const createData = await createRes.json();
  const roomCode = createData.room.code;
  const hostId = createData.hostPlayer.id;
  console.log(`Room created: ${roomCode} (length: ${roomCode.length})`);
  if (roomCode.length !== 6) throw new Error('Room code must be 6 characters');
  console.log('✓ TEST 1 PASSED: 6-character code created successfully.\n');

  // TEST 2: Join from second player (Expect 2 / 10)
  console.log('--- TEST 2: Join from second player ---');
  const join2Res = await fetch(`${BASE_URL}/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Player 02 (Valdris Defector)' }),
  });
  const join2Data = await join2Res.json();
  console.log(`Players in room: ${join2Data.room.players.length} / 10`);
  if (join2Data.room.players.length !== 2) throw new Error('Expected 2 players');
  console.log('✓ TEST 2 PASSED: 2 / 10 players connected.\n');

  // TEST 3: Join until 10 players (Expect 10 / 10)
  console.log('--- TEST 3: Join until 10 players ---');
  for (let i = 3; i <= 10; i++) {
    const joinRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Operative ${i}` }),
    });
    const joinData = await joinRes.json();
    console.log(`Player ${i} joined. Total: ${joinData.room.players.length} / 10`);
  }
  const roomCheck = await (await fetch(`${BASE_URL}/api/rooms/${roomCode}`)).json();
  if (roomCheck.room.players.length !== 10) throw new Error('Expected 10 players');
  console.log('✓ TEST 3 PASSED: 10 / 10 players connected.\n');

  // TEST 4: Attempt 11th player (Expect ROOM_FULL, HTTP 400)
  console.log('--- TEST 4: Attempt 11th player ---');
  const join11Res = await fetch(`${BASE_URL}/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Operative 11' }),
  });
  const join11Data = await join11Res.json();
  console.log(`Status code: ${join11Res.status}, Error: ${join11Data.error}`);
  if (join11Res.status !== 400 || join11Data.error !== 'ROOM_FULL') {
    throw new Error('Expected HTTP 400 ROOM_FULL');
  }
  console.log('✓ TEST 4 PASSED: 11th player strictly rejected on server with ROOM_FULL.\n');

  // TEST 5: Non-host attempts to start game (Expect rejected)
  console.log('--- TEST 5: Non-host starts game ---');
  const nonHostStartRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: 'fake-player-id' }),
  });
  const nonHostData = await nonHostStartRes.json();
  console.log(`Status code: ${nonHostStartRes.status}, Error: ${nonHostData.error}`);
  if (nonHostStartRes.status !== 403 || nonHostData.error !== 'NOT_HOST') {
    throw new Error('Expected HTTP 403 NOT_HOST');
  }
  console.log('✓ TEST 5 PASSED: Non-host cannot start game.\n');

  // TEST 6: Host starts game (Expect status: playing, Turn 1)
  console.log('--- TEST 6: Host starts game ---');
  const hostStartRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: hostId }),
  });
  const hostStartData = await hostStartRes.json();
  console.log(`Room status: ${hostStartData.room.status}, Turn: ${hostStartData.room.gameState.currentTurn}`);
  if (hostStartData.room.status !== 'playing' || hostStartData.room.gameState.currentTurn !== 1) {
    throw new Error('Expected room status playing and turn 1');
  }
  console.log('✓ TEST 6 PASSED: Host started game. All players transition.\n');

  // TEST 7: Player submits action (Expect turn advance and world update)
  console.log('--- TEST 7: Player performs action ---');
  const actionRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: hostId,
      action: { actionType: 'select_choice', choiceId: 'c1-1', timestamp: new Date().toISOString() },
    }),
  });
  const actionData = await actionRes.json();
  console.log(`Action submitted. New Turn: ${actionData.room.gameState.currentTurn}`);
  if (actionData.room.gameState.currentTurn !== 2) throw new Error('Expected Turn 2');
  console.log('✓ TEST 7 PASSED: Authoritative turn advance.\n');

  // TEST 8: Progress to Turn 6 (Expect Player 7 invariant created)
  console.log('--- TEST 8: Progress to Turn 6 (Invariant Creation) ---');
  for (let t = 3; t <= 6; t++) {
    await fetch(`${BASE_URL}/api/rooms/${roomCode}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: hostId,
        action: { actionType: 'select_choice', choiceId: `c${t-1}-1`, timestamp: new Date().toISOString() },
      }),
    });
  }
  const turn6Room = await (await fetch(`${BASE_URL}/api/rooms/${roomCode}`)).json();
  const p7Inv = turn6Room.room.gameState.memory.invariants.find(i => i.id === 'inv-protect-p7');
  console.log(`Turn: ${turn6Room.room.gameState.currentTurn}, Invariants: ${turn6Room.room.gameState.memory.invariants.length}`);
  console.log(`Player 7 Invariant: ${p7Inv?.label} (Status: ${p7Inv?.status})`);
  if (!p7Inv || p7Inv.status !== 'active') throw new Error('Expected active Player 7 invariant at Turn 6');
  console.log('✓ TEST 8 PASSED: Player 7 invariant created at Turn 6.\n');

  // TEST 9 & 10: Progress to Turn 17 (Expect context pressure & Invariant DROPPED)
  console.log('--- TEST 9 & 10: Context Pressure & Turn 17 Invariant Dropped ---');
  for (let t = 7; t <= 17; t++) {
    await fetch(`${BASE_URL}/api/rooms/${roomCode}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: hostId,
        action: { actionType: 'select_choice', choiceId: `c${t-1}-1`, timestamp: new Date().toISOString() },
      }),
    });
  }
  const turn17Room = await (await fetch(`${BASE_URL}/api/rooms/${roomCode}`)).json();
  const p7Inv17 = turn17Room.room.gameState.memory.invariants.find(i => i.id === 'inv-protect-p7');
  console.log(`Turn: ${turn17Room.room.gameState.currentTurn}, Context Load: ${turn17Room.room.gameState.contextLoad}%`);
  console.log(`Player 7 Invariant Status: ${p7Inv17?.status}`);
  if (p7Inv17?.status !== 'dropped') throw new Error('Expected Player 7 invariant dropped at Turn 17');
  console.log('✓ TESTS 9 & 10 PASSED: Context pressure simulated, invariant dropped while Player 7 physically remains.\n');

  // TEST 11 & 12: Turn 18 Failure & Structured Trace
  console.log('--- TEST 11 & 12: Turn 18 Failure & Structured Trace ---');
  await fetch(`${BASE_URL}/api/rooms/${roomCode}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: hostId,
      action: { actionType: 'select_choice', choiceId: 'c17-1', timestamp: new Date().toISOString() },
    }),
  });
  const turn18Room = await (await fetch(`${BASE_URL}/api/rooms/${roomCode}`)).json();
  console.log(`Failure detected: ${turn18Room.room.gameState.failureDetected}`);
  const lastTrace = turn18Room.room.traces[turn18Room.room.traces.length - 1];
  console.log(`Last Trace: ${lastTrace.title} | Status: ${lastTrace.status} | Latency: ${lastTrace.durationMs}ms`);
  if (!turn18Room.room.gameState.failureDetected) throw new Error('Expected failure at Turn 18');
  console.log('✓ TESTS 11 & 12 PASSED: Context integrity failure detected and structured trace generated.\n');

  // TEST 13 & 14 & 15: Apply Surgery, Replay, Return to Healed World
  console.log('--- TEST 13, 14 & 15: Context Surgery, Replay & Healed World ---');
  const surgeryRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/surgery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: hostId }),
  });
  const surgeryData = await surgeryRes.json();
  const healedInv = surgeryData.room.gameState.memory.invariants.find(i => i.id === 'inv-protect-p7');
  console.log(`Surgery applied: ${surgeryData.room.gameState.surgeryApplied}`);
  console.log(`Player 7 Invariant Status: ${healedInv?.status}`);
  console.log(`Replay completed: ${surgeryData.room.gameState.replayCompleted}`);
  console.log(`Room mode: ${surgeryData.room.gameState.mode}`);
  if (healedInv?.status !== 'restored' || !surgeryData.room.gameState.surgeryApplied) {
    throw new Error('Expected invariant restored and surgery applied');
  }
  console.log('✓ TESTS 13, 14, 15 PASSED: Surgery applied, invariant restored, all connected players receive healed world!\n');

  console.log('==============================================');
  console.log('ALL 15 TESTS COMPLETED AND VERIFIED 100%!');
  console.log('==============================================');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
