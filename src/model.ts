import { migrateMessageTimes, validTime } from './chat-time';
import type { TimeSettings } from './chat-time';
export type PersonId = 'other' | 'self';
export type MoneyStatus = 'pending' | 'received' | 'returned';
export type MessageType =
  'text' | 'image' | 'redpacket' | 'transfer' | 'time' | 'receipt' | 'notice';
export interface Person {
  name: string;
  avatar: string;
}
export interface Device {
  os: 'android' | 'ios';
  time: string;
  battery: number;
  charging: boolean;
  signal: number;
  secondarySignal: number;
  dual: boolean;
  network: '5G' | '4G';
  wifi: boolean;
  mute: boolean;
  island: boolean;
  unread: number;
}
export interface Message {
  id: string;
  sender: PersonId;
  type: MessageType;
  text: string;
  amount?: string;
  status?: MoneyStatus;
  parentId?: string;
  sentAt?: number;
}
export interface Project {
  version: 1;
  people: Record<PersonId, Person>;
  devices: Record<PersonId, Device>;
  messages: Message[];
  timeSettings?: TimeSettings;
}
export const opposite = (id: PersonId): PersonId => (id === 'self' ? 'other' : 'self');
export const uid = () => crypto.randomUUID();

function avatar(kind: 'mountain' | 'flower') {
  const art =
    kind === 'mountain'
      ? '<rect width="80" height="80" fill="#c9d6cf"/><circle cx="58" cy="23" r="12" fill="#f5e8be"/><path d="M0 60L25 24l23 30 12-17 20 26v17H0" fill="#668477"/><path d="M0 73l32-29 20 22 16-8 12 11v11H0" fill="#345e50"/>'
      : '<rect width="80" height="80" fill="#e7d8c3"/><path d="M42 78V34M41 59L22 48M42 67l17-14" stroke="#6f8452" stroke-width="3"/><g fill="#fbf4df"><ellipse cx="39" cy="23" rx="8" ry="15"/><ellipse cx="52" cy="33" rx="14" ry="8"/><ellipse cx="30" cy="34" rx="14" ry="8"/><ellipse cx="42" cy="43" rx="8" ry="13"/></g><circle cx="41" cy="33" r="8" fill="#cb914a"/>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">${art}</svg>`)}`;
}
const device: Device = {
  os: 'android',
  time: '14:18',
  battery: 80,
  charging: false,
  signal: 4,
  secondarySignal: 4,
  dual: true,
  network: '5G',
  wifi: true,
  mute: true,
  island: true,
  unread: 20,
};
export function createProject(): Project {
  const now = Date.now();
  return {
    version: 1,
    people: {
      other: { name: '林间', avatar: avatar('mountain') },
      self: { name: '陈记', avatar: avatar('flower') },
    },
    devices: {
      other: { ...device },
      self: {
        ...device,
        os: 'ios',
        time: '14:18',
        battery: 100,
        dual: false,
        mute: false,
        unread: 3,
      },
    },
    timeSettings: { mode: 'live', sendAt: now, expanded: { other: false, self: false } },
    messages: [
      { id: uid(), sender: 'other', type: 'text', text: '今天天气真好，晚上一起吃饭？' },
      { id: uid(), sender: 'self', type: 'text', text: '好呀！上次说的那家小馆子？' },
      { id: uid(), sender: 'other', type: 'text', text: '对，靠窗的位置已经订好啦 🌿' },
      { id: uid(), sender: 'self', type: 'text', text: '那就六点见，今天我请客～' },
      {
        id: uid(),
        sender: 'other',
        type: 'redpacket',
        text: '先请你喝杯下午茶',
        amount: '18.88',
        status: 'pending',
      },
      { id: uid(), sender: 'self', type: 'text', text: '哈哈，那我就不客气了 ☕️' },
    ].map((message, index) => ({
      ...message,
      sentAt: now - 8 * 60000 + index * 30000,
    })) as Message[],
  };
}

export function insertMessage(
  messages: Message[],
  message: Message,
  beforeId: string | null,
): Message[] {
  const index = beforeId ? messages.findIndex((m) => m.id === beforeId) : -1;
  if (index < 0) return [...messages, message];
  return [...messages.slice(0, index), message, ...messages.slice(index)];
}

// Money cards and their linked receipts always change in a single history entry.
export function setMoneyStatus(
  messages: Message[],
  id: string,
  status: MoneyStatus,
  at = Date.now(),
): Message[] {
  const source = messages.find((m) => m.id === id);
  if (!source || !['redpacket', 'transfer'].includes(source.type)) return messages;
  if (source.type === 'redpacket' && status === 'returned') return messages;
  const next = messages
    .filter((m) => m.parentId !== id)
    .map((m) => (m.id === id ? { ...m, status } : m));
  if (status === 'pending') return next;
  const linked: Message = {
    id: uid(),
    parentId: id,
    sender: opposite(source.sender),
    type: source.type === 'redpacket' ? 'notice' : 'receipt',
    text: '',
    amount: source.amount,
    status,
    sentAt:
      messages.find((m) => m.parentId === id)?.sentAt ??
      Math.max(at, source.sentAt ?? 0, messages.at(-1)?.sentAt ?? 0),
  };
  const oldIndex = messages.findIndex((m) => m.parentId === id);
  if (oldIndex >= 0) {
    // Keep the original receipt's timeline position when changing an existing state.
    const anchor = messages.slice(oldIndex + 1).find((m) => m.parentId !== id);
    return insertMessage(next, linked, anchor?.id ?? null);
  }
  return [...next, linked];
}

export function updateMessage(messages: Message[], edited: Message): Message[] {
  return messages.map((m) =>
    m.id === edited.id
      ? edited
      : m.parentId === edited.id
        ? {
            ...m,
            amount: edited.amount,
            sentAt: validTime(edited.sentAt)
              ? Math.max(m.sentAt ?? edited.sentAt, edited.sentAt)
              : m.sentAt,
          }
        : m,
  );
}
export function deleteMessage(messages: Message[], id: string): Message[] {
  const selected = messages.find((m) => m.id === id);
  if (selected?.parentId) return setMoneyStatus(messages, selected.parentId, 'pending');
  return messages.filter((m) => m.id !== id && m.parentId !== id);
}
export function validAmount(value: string) {
  return /^\d{1,8}(\.\d{1,2})?$/.test(value) && Number(value) > 0;
}
export function money(value?: string) {
  return Number(value || 0).toFixed(2);
}

const STORAGE_KEY = 'dialog-studio:project:v1';
export function normalizeProject(value: unknown): Project {
  try {
    const raw = value as Project | null;
    if (
      raw?.version !== 1 ||
      !Array.isArray(raw.messages) ||
      !raw.people?.self ||
      !raw.people?.other ||
      !raw.devices?.self ||
      !raw.devices?.other
    )
      return createProject();
    const base = createProject();
    const types = new Set(['text', 'image', 'redpacket', 'transfer', 'time', 'receipt', 'notice']);
    return {
      version: 1,
      people: Object.fromEntries(
        (['other', 'self'] as const).map((id) => [
          id,
          {
            name: String(raw.people[id].name || base.people[id].name).slice(0, 30),
            avatar:
              typeof raw.people[id].avatar === 'string' &&
              raw.people[id].avatar.startsWith('data:image/')
                ? raw.people[id].avatar
                : base.people[id].avatar,
          },
        ]),
      ) as Project['people'],
      devices: Object.fromEntries(
        (['other', 'self'] as const).map((id) => [
          id,
          {
            ...base.devices[id],
            ...raw.devices[id],
            os: raw.devices[id].os === 'ios' ? 'ios' : 'android',
            battery: Math.max(0, Math.min(100, Number(raw.devices[id].battery) || 0)),
            signal: Math.max(0, Math.min(4, Number(raw.devices[id].signal) || 0)),
            secondarySignal: Math.max(0, Math.min(4, Number(raw.devices[id].secondarySignal) || 0)),
            unread: Math.max(0, Math.min(999, Number(raw.devices[id].unread) || 0)),
            time: /^\d{2}:\d{2}$/.test(raw.devices[id].time) ? raw.devices[id].time : '14:18',
          },
        ]),
      ) as Project['devices'],
      messages: migrateMessageTimes(
        raw.messages.filter(
          (m: Message) =>
            m &&
            typeof m.id === 'string' &&
            types.has(m.type) &&
            ['other', 'self'].includes(m.sender) &&
            typeof m.text === 'string',
        ),
        Date.now(),
        raw.devices.self.time,
      ),
      timeSettings: {
        mode: raw.timeSettings?.mode === 'manual' ? 'manual' : 'live',
        sendAt: validTime(raw.timeSettings?.sendAt) ? raw.timeSettings.sendAt : Date.now(),
        expanded: {
          other: Boolean(raw.timeSettings?.expanded?.other),
          self: Boolean(raw.timeSettings?.expanded?.self),
        },
      },
    };
  } catch {
    return createProject();
  }
}
export function loadProject(): Project {
  try {
    return normalizeProject(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    return createProject();
  }
}
export function saveProject(project: Project) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

export async function readImage(file: File, avatar = false): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type))
    throw new Error('请选择 JPG、PNG、WebP、GIF 或 AVIF 图片');
  if (file.size > 15 * 1024 * 1024) throw new Error('图片需小于 15 MB，请压缩后重试');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const max = avatar ? 240 : 1400;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('图片处理失败，请重试');
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
