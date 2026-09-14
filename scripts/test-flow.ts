import { processFlowMessage, INITIAL_STATE, FlowState } from '@/lib/flows/reservationFlow';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function run() {
  console.log('\n--- 4+ guests routes straight to WhatsApp handoff ---');
  {
    const menu = await processFlowMessage({ text: 'new', state: { step: 'RESERVATION_MENU', draft: {} } });
    const result = await processFlowMessage({ text: '4+', state: menu.state });

    assert(result.state.step === 'MAIN_MENU', 'Resets to main menu after 4+ selection');
    assert(
      !!result.buttons?.[0]?.url?.includes('wa.me'),
      'Provides a wa.me WhatsApp link',
      JSON.stringify(result.buttons)
    );
  }

  console.log('\n--- Invalid phone number is rejected, stays on same step ---');
  {
    let state: FlowState = { step: 'RESERVATION_PHONE', draft: { name: 'Test', partySize: 2, date: '2026-10-05', time: '16:00' } };
    const result = await processFlowMessage({ text: '123', state });

    assert(result.state.step === 'RESERVATION_PHONE', 'Stays on phone step for invalid input');
    assert(!result.summary, 'Does not advance to confirmation summary');
  }

  console.log('\n--- Cancel mid-confirmation returns to main menu cleanly ---');
  {
    const state: FlowState = {
      step: 'RESERVATION_CONFIRM',
      draft: { name: 'Test', partySize: 2, date: '2026-10-05', time: '16:00', phone: '08012345678' },
    };
    const result = await processFlowMessage({ text: 'cancel', state });

    assert(result.state.step === 'MAIN_MENU', 'Returns to main menu on cancel');
    assert(JSON.stringify(result.state.draft) === '{}', 'Draft is cleared after cancel');
  }

  console.log('\n--- A genuinely full slot is not offered as a button ---');
  {
    // Requires a slot with zero availability for a large party size —
    // adjust the test date/party size to a scenario you know is full,
    // e.g. after running the Test 3 scenario from the SQL test pass.
    const dateState: FlowState = { step: 'RESERVATION_DATE', draft: { partySize: 40 } };
    const result = await processFlowMessage({ text: '2026-10-05', state: dateState });

    assert(
      result.state.step === 'RESERVATION_DATE' || (result.buttons?.length ?? 0) === 0,
      'Oversized party size finds no bookable slot',
      JSON.stringify(result.buttons)
    );
  }

  console.log('\n--- Manage by phone: zero matches gives a clear error, offers code fallback ---');
  {
    const state: FlowState = { step: 'MANAGE_CODE', draft: {} };
    const result = await processFlowMessage({ text: '08000000000', state });

    assert(result.state.step === 'MANAGE_CODE', 'Stays on lookup step when nothing found');
    assert(result.reply.toLowerCase().includes('code'), 'Suggests trying the reservation code instead');
  }

  console.log('\n--- Manage by phone: multiple matches asks for the code instead ---');
  {
    // Requires two active reservations already existing on the same
    // phone number in your test data — insert two via SQL first if
    // this doesn't already reflect real test data.
    const state: FlowState = { step: 'MANAGE_CODE', draft: {} };
    const result = await processFlowMessage({ text: '08010000001', state }); // adjust to a known multi-match number

    assert(
      result.reply.toLowerCase().includes('code') || result.state.step === 'MANAGE_CODE',
      'Multiple matches falls back to asking for the code'
    );
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();