import test from 'node:test';
import assert from 'node:assert/strict';
import {
  callLabel,
  markVoiceRead,
  normalizeMedia,
  parseCallDuration,
  formatCallDuration,
} from './media-message';
import {
  createProject,
  normalizeProject,
  insertMessage,
  updateMessage,
  deleteMessage,
} from './model';
import type { Message } from './model';

const voice: Message = {
  id: 'voice',
  sender: 'other',
  type: 'voice',
  text: '一段转文字内容',
  durationSeconds: 4,
  voiceUnread: true,
  sentAt: Date.now(),
};
const call: Message = {
  id: 'call',
  sender: 'self',
  type: 'call',
  text: '',
  durationSeconds: 59,
  callStatus: 'completed',
  sentAt: Date.now(),
};

test('voice read marker changes only when the recipient listens, without duplicate history edits', () => {
  const messages = [voice, call];
  assert.equal(markVoiceRead(messages, voice.id, 'other'), messages);
  assert.equal(markVoiceRead(messages, call.id, 'other'), messages);
  const read = markVoiceRead(messages, voice.id, 'self');
  assert.equal(read[0].voiceUnread, false);
  assert.equal(read[0].text, voice.text);
  assert.equal(voice.voiceUnread, true);
  assert.equal(markVoiceRead(read, voice.id, 'self'), read);
});

test('call state text changes perspective while connected duration stays identical', () => {
  assert.equal(callLabel(call, 'self'), '通话时长 00:59');
  assert.equal(callLabel(call, 'other'), '通话时长 00:59');
  for (const [state, own, peer] of [
    ['cancelled', '已取消', '对方已取消'],
    ['unanswered', '对方未接听', '未接听'],
    ['rejected', '对方已拒绝', '已拒绝'],
  ] as const) {
    assert.equal(callLabel({ ...call, callStatus: state }, 'self'), own);
    assert.equal(callLabel({ ...call, callStatus: state }, 'other'), peer);
  }
});

test('call duration parsing validates seconds and preserves minute boundaries', () => {
  for (const [input, seconds] of [
    ['00:00', 0],
    ['00:59', 59],
    ['01:00', 60],
    ['99:59', 5999],
    ['999:59', 59999],
  ] as const) {
    assert.equal(parseCallDuration(input), seconds);
    assert.equal(parseCallDuration(formatCallDuration(seconds)), seconds);
  }
  for (const input of ['-1:00', '00:60', '1:2', 'abc', '1:00:00', '1000:00'])
    assert.equal(parseCallDuration(input), null);
});

test('voice and call metadata survive project normalization and malformed durations are bounded', () => {
  const project = createProject();
  const restored = normalizeProject({ ...project, messages: [voice, call] });
  assert.deepEqual(restored.messages, [voice, call]);
  assert.equal(normalizeMedia({ ...voice, durationSeconds: Infinity }).durationSeconds, 4);
  assert.equal(normalizeMedia({ ...voice, durationSeconds: 0 }).durationSeconds, 1);
  assert.equal(normalizeMedia({ ...voice, durationSeconds: 80.5 }).durationSeconds, 60);
  assert.equal(normalizeMedia({ ...call, durationSeconds: -3 }).durationSeconds, 0);
});

test('media messages insert, edit and delete without creating money receipts or losing surrounding IDs', () => {
  const base = createProject().messages.slice(0, 2);
  const inserted = insertMessage(base, voice, base[1].id);
  assert.deepEqual(
    inserted.map((m) => m.id),
    [base[0].id, voice.id, base[1].id],
  );
  const edited = updateMessage(inserted, { ...voice, durationSeconds: 12, text: '改后的转文字' });
  assert.equal(edited[1].durationSeconds, 12);
  assert.equal(edited.length, 3);
  assert.deepEqual(deleteMessage(edited, voice.id), base);
});
