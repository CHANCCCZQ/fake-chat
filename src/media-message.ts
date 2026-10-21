import type { Message, PersonId } from './model';

export type CallStatus = 'completed' | 'cancelled' | 'unanswered' | 'rejected';
export const callStatuses: readonly CallStatus[] = [
  'completed',
  'cancelled',
  'unanswered',
  'rejected',
];

export function callLabel(message: Message, viewer: PersonId) {
  const own = message.sender === viewer;
  switch (message.callStatus) {
    case 'cancelled':
      return own ? '已取消' : '对方已取消';
    case 'unanswered':
      return own ? '对方未接听' : '未接听';
    case 'rejected':
      return own ? '对方已拒绝' : '已拒绝';
    default:
      return `通话时长 ${formatCallDuration(message.durationSeconds ?? 59)}`;
  }
}
export function formatCallDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function parseCallDuration(value: string) {
  if (!/^\d{1,3}:[0-5]\d$/.test(value)) return null;
  const [minutes, seconds] = value.split(':').map(Number);
  return minutes * 60 + seconds;
}
export function normalizeMedia(message: Message): Message {
  const finite = Number.isFinite(message.durationSeconds);
  if (message.type === 'voice')
    return {
      ...message,
      durationSeconds: finite ? Math.max(1, Math.min(60, Math.trunc(message.durationSeconds!))) : 4,
      voiceUnread: Boolean(message.voiceUnread),
    };
  if (message.type === 'call')
    return {
      ...message,
      durationSeconds: finite
        ? Math.max(0, Math.min(59999, Math.trunc(message.durationSeconds!)))
        : 59,
      callStatus: callStatuses.includes(message.callStatus!) ? message.callStatus : 'completed',
    };
  return message;
}
export function markVoiceRead(messages: Message[], id: string, viewer: PersonId) {
  const message = messages.find((m) => m.id === id);
  if (message?.type !== 'voice' || message.sender === viewer || !message.voiceUnread)
    return messages;
  return messages.map((m) => (m.id === id ? { ...m, voiceUnread: false } : m));
}
