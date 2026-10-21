import type { Message } from './model';

export const TIME_GAP = 5 * 60 * 1000;
const DAY = 86400000;
const OFFSET = 8 * 60 * 60 * 1000;
const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
export interface TimeSettings {
  mode: 'live' | 'manual';
  sendAt: number;
  expanded: { other: boolean; self: boolean };
}
export function validTime(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 253402271999999
  );
}
function parts(at: number) {
  const date = new Date(at + OFFSET);
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
    h: date.getUTCHours(),
    min: date.getUTCMinutes(),
    weekday: weekdays[date.getUTCDay()],
  };
}
const pad = (value: number) => String(value).padStart(2, '0');
export const dayNumber = (at: number) => Math.floor((at + OFFSET) / DAY);
export function dateTimeValue(at: number) {
  const p = parts(at);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}
export function parseDateTime(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const at = Date.parse(`${value}:00+08:00`);
  return validTime(at) && dateTimeValue(at) === value ? at : null;
}
export function editedTime(value: string, previous?: number): number | null {
  return validTime(previous) && value === dateTimeValue(previous) ? previous : parseDateTime(value);
}
export function formatChatTime(at: number, now: number, expanded = false): string {
  const p = parts(at);
  const today = parts(now);
  const time = `${pad(p.h)}:${pad(p.min)}`;
  const date = `${p.y === today.y ? '' : `${p.y}年`}${p.m}月${p.d}日`;
  if (expanded) return `${date} ${p.weekday} ${time}`;
  const days = dayNumber(now) - dayNumber(at);
  if (days === 0) return time;
  if (days === 1) return `昨天 ${time}`;
  if (days >= 2 && days < 7) return `${p.weekday} ${time}`;
  return `${date} ${time}`;
}
export function shouldShowTime(messages: Message[], index: number): boolean {
  const message = messages[index];
  if (!message || message.type === 'time' || !validTime(message.sentAt)) return false;
  const previous = messages[index - 1];
  if (!previous) return true;
  if (previous.type === 'time') return false;
  if (!validTime(previous.sentAt)) return true;
  const gap = message.sentAt - previous.sentAt;
  return gap >= TIME_GAP || gap < 0 || dayNumber(message.sentAt) !== dayNumber(previous.sentAt);
}
export function suggestedInsertTime(
  messages: Message[],
  beforeId: string | null,
  fallback: number,
): number {
  const index = beforeId ? messages.findIndex((m) => m.id === beforeId) : -1;
  if (index < 0) return Math.max(fallback, ...messages.slice(-1).map((m) => m.sentAt ?? 0));
  const next = messages[index].sentAt;
  const prev = messages[index - 1]?.sentAt;
  if (validTime(prev) && validTime(next) && prev <= next) return Math.floor((prev + next) / 2);
  return validTime(next) ? next : validTime(prev) ? prev : fallback;
}

// Old chats only stored display strings. Preserve those nodes and infer missing
// dates once from recognizable anchors; explicit timestamps are never changed.
export function migrateMessageTimes(
  messages: Message[],
  now: number,
  statusTime: string,
): Message[] {
  const today = dateTimeValue(now).slice(0, 10);
  let cursor = parseDateTime(`${today}T${statusTime}`) ?? now;
  return messages.map((message) => {
    if (validTime(message.sentAt)) {
      cursor = message.sentAt;
      return message;
    }
    if (message.type === 'time') {
      const match = /^(昨天\s*)?(凌晨|早上|上午|中午|下午|晚上)?\s*(\d{1,2}):(\d{2})$/.exec(
        message.text.trim(),
      );
      const full = /^(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?\s+(\d{1,2}):(\d{2})$/.exec(
        message.text.trim(),
      );
      let anchor: number | null = null;
      if (match) {
        let hour = Number(match[3]);
        const minute = Number(match[4]);
        if (['下午', '晚上'].includes(match[2]) && hour < 12) hour += 12;
        if (['上午', '凌晨'].includes(match[2]) && hour === 12) hour = 0;
        anchor = parseDateTime(`${today}T${pad(hour)}:${pad(minute)}`);
        if (anchor !== null && match[1]) anchor -= DAY;
      } else if (full)
        anchor = parseDateTime(
          `${full[1]}-${pad(Number(full[2]))}-${pad(Number(full[3]))}T${pad(Number(full[4]))}:${full[5]}`,
        );
      if (anchor === null) return { ...message, sentAt: undefined };
      cursor = anchor;
      return { ...message, sentAt: cursor };
    }
    cursor += 1000;
    return { ...message, sentAt: cursor };
  });
}
