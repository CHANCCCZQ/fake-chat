import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dateTimeValue,
  editedTime,
  formatChatTime,
  migrateMessageTimes,
  parseDateTime,
  shouldShowTime,
  suggestedInsertTime,
} from './chat-time';
import { setMoneyStatus, updateMessage } from './model';
import type { Message } from './model';

const at = (value: string) => parseDateTime(value)!;
const now = at('2026-10-21T14:50');
const message = (id: string, time: number, type: Message['type'] = 'text'): Message => ({
  id,
  sender: 'self',
  type,
  text: '',
  sentAt: time,
});

test('short labels use Shanghai calendar days, weekdays, and same-year versus cross-year dates', () => {
  assert.equal(formatChatTime(now, now), '14:50');
  assert.equal(formatChatTime(at('2026-10-20T09:05'), now), '昨天 09:05');
  assert.equal(formatChatTime(at('2026-10-19T09:05'), now), '星期一 09:05');
  assert.equal(formatChatTime(at('2026-10-15T09:05'), now), '星期四 09:05');
  assert.equal(formatChatTime(at('2026-10-14T09:05'), now), '10月14日 09:05');
  assert.equal(formatChatTime(at('2025-10-21T09:05'), now), '2025年10月21日 09:05');
  assert.equal(formatChatTime(at('2026-10-20T23:59'), at('2026-10-21T00:01')), '昨天 23:59');
});
test('expanded labels include calendar date, weekday and hours/minutes, adding year across years', () => {
  assert.equal(formatChatTime(now, now, true), '10月21日 星期三 14:50');
  assert.equal(formatChatTime(at('2025-10-21T09:05'), now, true), '2025年10月21日 星期二 09:05');
});
test('timestamps appear at the first message, five-minute boundary, midnight and backward changes', () => {
  const timeline = [message('a', now), message('b', now + 299999), message('c', now + 599999)];
  assert.equal(shouldShowTime(timeline, 0), true);
  assert.equal(shouldShowTime(timeline, 1), false);
  assert.equal(
    shouldShowTime(timeline, 2),
    true,
    'exactly five minutes after the preceding message',
  );
  assert.equal(shouldShowTime([message('a', now), message('b', now - 1000)], 1), true);
  assert.equal(
    shouldShowTime([message('a', at('2026-10-20T23:59')), message('b', at('2026-10-21T00:00'))], 1),
    true,
  );
});
test('a continuous conversation does not accumulate duplicate labels; manual time nodes suppress the next auto label', () => {
  const timeline = Array.from({ length: 10 }, (_, index) =>
    message(String(index), now + index * 120000),
  );
  assert.equal(timeline.filter((_, i) => shouldShowTime(timeline, i)).length, 1);
  const manual = [message('manual', now, 'time'), message('text', now)];
  assert.equal(shouldShowTime(manual, 0), false);
  assert.equal(shouldShowTime(manual, 1), false);
});
test('inserting into a historical conversation suggests a time between surrounding messages', () => {
  const timeline = [message('a', now - 600000), message('b', now)];
  assert.equal(suggestedInsertTime(timeline, 'b', now + 10000000), now - 300000);
  assert.equal(suggestedInsertTime(timeline, 'a', now + 10000000), now - 600000);
  assert.equal(suggestedInsertTime(timeline, null, now - 10000), now);
});
test('date controls are timezone-independent, reject impossible dates, and preserve unedited seconds', () => {
  assert.equal(dateTimeValue(Date.UTC(2026, 9, 21, 6, 50)), '2026-10-21T14:50');
  assert.equal(parseDateTime('2026-02-30T12:00'), null);
  assert.equal(parseDateTime('2026-10-21T25:00'), null);
  assert.equal(editedTime('2026-10-21T14:50', now + 32123), now + 32123);
});
test('legacy chat migration preserves IDs and content, reads old time anchors and never changes known timestamps', () => {
  const legacy: Message[] = [
    { id: 'time', sender: 'other', type: 'time', text: '下午 2:10' },
    { id: 'text', sender: 'self', type: 'text', text: '旧消息' },
    message('known', now),
  ];
  const migrated = migrateMessageTimes(legacy, now, '14:18');
  assert.equal(migrated[0].sentAt, at('2026-10-21T14:10'));
  assert.equal(migrated[1].sentAt, at('2026-10-21T14:10') + 1000);
  assert.equal(migrated[1].text, '旧消息');
  assert.equal(migrated[2].sentAt, now);
  assert.equal(legacy[0].sentAt, undefined);
  const unknown = migrateMessageTimes([{ ...legacy[0], text: '三年前的某一天' }], now, '14:18');
  assert.equal(unknown[0].text, '三年前的某一天');
  assert.equal(unknown[0].sentAt, undefined);
});
test('money receipts receive a timestamp and preserve it on subsequent status changes', () => {
  const transfer: Message = {
    ...message('money', now),
    type: 'transfer',
    amount: '8.88',
    status: 'pending',
  };
  const received = setMoneyStatus([transfer], 'money', 'received', now + 360000);
  assert.equal(received[1].sentAt, now + 360000);
  assert.equal(shouldShowTime(received, 1), true);
  const returned = setMoneyStatus(received, 'money', 'returned', now + 720000);
  assert.equal(returned[1].sentAt, received[1].sentAt);
  const edited = updateMessage(returned, { ...returned[0], sentAt: now + 900000 });
  assert.equal(edited[1].sentAt, now + 900000, 'receipt cannot precede its source');
});
