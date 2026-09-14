async function run() {
  const url = 'http://localhost:3000/api/ai/reservation';
  const results: number[] = [];

  console.log('Firing 50 rapid requests...\n');

  for (let i = 0; i < 50; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', session: { step: 'MAIN_MENU', draft: {} } }),
    });
    results.push(res.status);
  }

  const okCount = results.filter((s) => s === 200).length;
  const limitedCount = results.filter((s) => s === 429).length;

  console.log(`200 OK: ${okCount}`);
  console.log(`429 Rate Limited: ${limitedCount}`);

  if (limitedCount > 0) {
    console.log('\n✅ Rate limiting is active — some requests were throttled.');
  } else {
    console.log('\n❌ No requests were throttled — rate limiting may not be working.');
  }
}

run();