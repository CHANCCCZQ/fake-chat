import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteMessage, insertMessage, setMoneyStatus, updateMessage, validAmount } from './model';
import type { Message } from './model';

const transfer: Message = {
  id: 'transfer-1',
  sender: 'other',
  type: 'transfer',
  text: '晚餐',
  amount: '88.00',
  status: 'pending',
};
const packet: Message = { ...transfer, id: 'packet-1', type: 'redpacket', text: '恭喜发财' };
const text: Message = { id: 'text-1', type: 'text', sender: 'self', text: '你好' };

test('receiving a transfer updates its source and adds a linked receipt from the recipient', () => {
  const before = [transfer, text];
  const after = setMoneyStatus(before, transfer.id, 'received');
  assert.equal(after[0].status, 'received');
  assert.equal(after[2].type, 'receipt');
  assert.equal(after[2].sender, 'self');
  assert.equal(after[2].parentId, transfer.id);
  assert.equal(after[2].amount, '88.00');
  assert.equal(before[0].status, 'pending', 'history snapshot is never mutated');
});
test('claiming a packet generates a viewpoint-aware notice, not a transfer receipt', () => {
  const after = setMoneyStatus([packet], packet.id, 'received');
  assert.equal(after[1].type, 'notice');
  assert.equal(after[1].sender, 'self');
  assert.equal(after[1].parentId, packet.id);
  assert.deepEqual(setMoneyStatus([packet], packet.id, 'returned'), [packet]);
});
test('changing and resetting a money state never leaves duplicate or orphan receipts', () => {
  const received = setMoneyStatus([transfer, text], transfer.id, 'received');
  const withLaterMessage = [...received, { ...text, id: 'later' }];
  const returned = setMoneyStatus(withLaterMessage, transfer.id, 'returned');
  assert.equal(returned.filter((m) => m.parentId === transfer.id).length, 1);
  assert.equal(returned[2].status, 'returned');
  assert.equal(returned[3].id, 'later', 'receipt keeps its place in the timeline');
  const reset = setMoneyStatus(returned, transfer.id, 'pending');
  assert.equal(reset.length, 3);
  assert.equal(reset[0].status, 'pending');
  assert.equal(reset.filter((m) => m.parentId === transfer.id).length, 0);
});
test('deleting the source removes its generated receipt; deleting a receipt resets the source', () => {
  const received = setMoneyStatus([transfer, text], transfer.id, 'received');
  assert.deepEqual(deleteMessage(received, transfer.id), [text]);
  const reset = deleteMessage(received, received[2].id);
  assert.equal(reset[0].status, 'pending');
  assert.equal(reset.length, 2);
});
test('editing a settled amount also updates the corresponding receipt', () => {
  const received = setMoneyStatus([transfer], transfer.id, 'received');
  const edited = updateMessage(received, { ...received[0], amount: '128.00' });
  assert.equal(edited[0].amount, '128.00');
  assert.equal(edited[1].amount, '128.00');
});
test('inserting anywhere preserves IDs, source order and linked receipt behavior', () => {
  const received = setMoneyStatus([transfer, text], transfer.id, 'received');
  const inserted = insertMessage(received, packet, text.id);
  assert.deepEqual(
    inserted.map((m) => m.id),
    [transfer.id, packet.id, text.id, received[2].id],
  );
  assert.equal(insertMessage([text], packet, 'deleted-anchor').at(-1)?.id, packet.id);
  assert.equal(insertMessage([text], packet, null).at(-1)?.id, packet.id);
});
test('money input rejects malformed, nonpositive, infinite and excessive precision amounts', () => {
  for (const amount of ['0', '-1', 'NaN', 'Infinity', '1e3', '1.234', '1,000', '', '123456789'])
    assert.equal(validAmount(amount), false, amount);
  for (const amount of ['0.01', '18.88', '100', '99999999.99'])
    assert.equal(validAmount(amount), true, amount);
});
