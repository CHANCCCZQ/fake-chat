import { assetPath } from './lib/assets';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Clock3,
  Gift,
  ImagePlus,
  Mic,
  Phone as PhoneIcon,
  Pencil,
  Plus,
  ScanLine,
  Trash2,
  X,
} from 'lucide-react';
import type { Device, Message, PersonId, Project } from './model';
import { money, opposite } from './model';
import StatusBar from './StatusBar';
import MediaBubble from './MediaBubble';
import EmojiPicker from './EmojiPicker';
import type { MediaAction } from './MediaForm';
import { callLabel } from './media-message';
import {
  dateTimeValue,
  formatChatTime,
  parseDateTime,
  shouldShowTime,
  validTime,
} from './chat-time';

export type PhoneAction =
  | MediaAction
  | { kind: 'money'; sender: PersonId; type: 'transfer' | 'redpacket'; id?: string }
  | { kind: 'details'; id: string; viewer: PersonId }
  | { kind: 'text'; id: string }
  | { kind: 'message-time'; id: string }
  | { kind: 'time'; id?: string };
interface Props {
  id: PersonId;
  project: Project;
  draft: string;
  onDraft: (value: string) => void;
  screenRef: RefObject<HTMLDivElement | null>;
  now: number;
  onToggleTime: (id: PersonId) => void;
  insertAt: number;
  onInsertAt: (value: number) => void;
  insertion: string | null;
  insertMode: boolean;
  pickingInsertion: boolean;
  onInsert: (id: string | null) => void;
  cancelInsert: () => void;
  onSend: (sender: PersonId, type: 'text' | 'image', text: string) => void;
  onAction: (action: PhoneAction) => void;
  onDelete: (id: string) => void;
  onReadVoice: (id: string, viewer: PersonId) => void;
  onImage: (sender: PersonId, file: File, replaceId?: string) => Promise<void>;
  onOS: (id: PersonId, os: Device['os']) => void;
  onSettings: (id: PersonId) => void;
  onToggleInsert: () => void;
  onClear: () => void;
  canClear: boolean;
  onCapture: (id: PersonId) => void;
  capturing: boolean;
}
function MoneyBubble({ message, own }: { message: Message; own: boolean }) {
  const isRed = message.type === 'redpacket';
  const done = message.status !== 'pending';
  let label = message.text || (isRed ? '恭喜发财，大吉大利' : '转账');
  if (!isRed && done)
    label =
      message.status === 'returned' ? (own ? '已被退还' : '已退还') : own ? '已被接收' : '已收款';
  if (message.type === 'receipt')
    label =
      message.status === 'returned' ? (own ? '已退还' : '已被退还') : own ? '已收款' : '已被接收';
  return (
    <div
      className={`money-bubble ${!isRed && done ? 'is-settled' : ''} ${isRed ? 'is-redpacket' : ''}`}
    >
      <div className="money-main">
        <span className="money-symbol">
          {isRed ? (
            <img className="redpacket-asset" src={assetPath('wechat/redpacket.png')} alt="" />
          ) : done ? (
            <span className="money-check">
              {message.status === 'returned' ? <ArrowLeft size={26} /> : <Check size={27} />}
            </span>
          ) : (
            <img className="transfer-asset" src={assetPath('wechat/transfer.png')} alt="" />
          )}
        </span>
        <div className="money-copy">
          {isRed ? (
            <strong>{label}</strong>
          ) : (
            <>
              <strong className="money-amount">¥{money(message.amount)}</strong>
              <small>{label}</small>
            </>
          )}
        </div>
      </div>
      <div className="money-footer">{isRed ? '微信红包' : '微信转账'}</div>
    </div>
  );
}
export default function Phone(props: Props) {
  const {
    id,
    project,
    draft,
    onDraft,
    screenRef,
    now,
    onToggleTime,
    insertAt,
    onInsertAt,
    insertion,
    insertMode,
    pickingInsertion,
    onInsert,
    cancelInsert,
    onSend,
    onAction,
    onDelete,
    onReadVoice,
    onImage,
    onOS,
    onSettings,
    onCapture,
    capturing,
    onToggleInsert,
    onClear,
    canClear,
  } = props;
  const device = project.devices[id];
  const peer = opposite(id);
  const setDraft = (value: string | ((current: string) => string)) =>
    onDraft(typeof value === 'function' ? value(draft) : value);
  const [panel, setPanel] = useState<'emoji' | 'more' | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const replaceImage = useRef<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(project.messages.at(-1)?.id);
  useEffect(() => {
    if (!selected) return;
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const content = target.closest('.timeline-item.selected .message-content');
      if (!content || !bodyRef.current?.contains(content)) setSelected(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelected(null);
      const active = document.activeElement;
      if (active instanceof HTMLElement && bodyRef.current?.contains(active)) active.blur();
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [selected]);
  useEffect(() => {
    const last = project.messages.at(-1)?.id;
    if (last !== lastId.current && atBottom) {
      const body = bodyRef.current;
      if (body) body.scrollTop = body.scrollHeight;
    }
    lastId.current = last;
  }, [project.messages, atBottom]);
  useEffect(() => {
    if (insertMode) {
      const body = bodyRef.current;
      const gap = body?.querySelector(`[data-gap="${insertion ?? 'end'}"]`);
      gap?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [insertMode, insertion]);
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, []);
  useEffect(() => {
    if (pickingInsertion) setPanel(null);
  }, [pickingInsertion]);
  const send = () => {
    if (pickingInsertion || !draft.trim()) return;
    onSend(id, 'text', draft.trim());
    setDraft('');
    setPanel(null);
    inputRef.current?.focus();
  };
  const insertGap = (before: string | null) => (
    <div
      className={`insert-gap ${insertMode && insertion === before ? 'is-active' : ''}`}
      data-gap={before ?? 'end'}
    >
      <button
        data-editor-only="true"
        aria-label={`在${before ? '此消息前' : '末尾'}插入消息`}
        title="从这里插入消息"
        onClick={() => onInsert(before)}
      >
        <Plus size={11} />
        <span>{insertMode && insertion === before ? '将在这里插入' : '插入消息'}</span>
      </button>
    </div>
  );
  const renderTime = (message: Message, manual = false) => {
    const timestamped = validTime(message.sentAt);
    const expanded = project.timeSettings?.expanded[id] ?? false;
    const label = timestamped ? formatChatTime(message.sentAt!, now, expanded) : message.text;
    return (
      <div className={`system-message time-notice ${manual ? 'manual-time' : 'automatic-time'}`}>
        {timestamped ? (
          <button
            className="time-label"
            aria-label={`切换时间格式：${label}`}
            aria-pressed={expanded}
            onClick={() => onToggleTime(id)}
          >
            {label}
          </button>
        ) : (
          <span>{label}</span>
        )}
        <button
          className="system-edit icon-button"
          data-editor-only="true"
          aria-label="编辑消息时间"
          title="编辑日期与时间"
          onClick={() => onAction({ kind: manual ? 'time' : 'message-time', id: message.id })}
        >
          <Pencil size={12} />
        </button>
      </div>
    );
  };
  const processImage = async (file?: File) => {
    if (!file) return;
    const replacement = replaceImage.current;
    replaceImage.current = undefined;
    setUploading(true);
    await onImage(id, file, replacement);
    setUploading(false);
    setPanel(null);
  };
  return (
    <section className={`phone-column ${id}`} aria-label={id === 'other' ? '对方手机' : '自己手机'}>
      <div className="phone-caption">
        <button className="phone-role" onClick={() => onSettings(id)} title="调整这部手机的设置">
          <span className={`role-dot ${id}`} />
          <strong>{id === 'other' ? '对方' : '自己'}</strong>
          <span className="caption-name">{project.people[id].name}</span>
        </button>
        <div className="phone-caption-actions">
          <div className="mini-segment" aria-label={`${id === 'other' ? '对方' : '自己'}手机系统`}>
            <button
              className={device.os === 'android' ? 'active' : ''}
              onClick={() => onOS(id, 'android')}
            >
              Android
            </button>
            <button className={device.os === 'ios' ? 'active' : ''} onClick={() => onOS(id, 'ios')}>
              iOS
            </button>
          </div>
          <button
            className={`icon-button phone-tool insert-button ${pickingInsertion || insertMode ? 'is-active' : ''}`}
            title={pickingInsertion || insertMode ? '取消插入消息' : '选择位置插入消息'}
            aria-label={pickingInsertion || insertMode ? '取消插入消息' : '插入消息'}
            aria-pressed={pickingInsertion || insertMode}
            onClick={onToggleInsert}
          >
            {pickingInsertion || insertMode ? <X size={16} /> : <Plus size={16} />}
          </button>
          <button
            className="icon-button phone-tool"
            title="清空当前分组的聊天"
            aria-label="清空聊天记录"
            disabled={!canClear}
            onClick={onClear}
          >
            <Trash2 size={15} />
          </button>
          <button
            className="icon-button capture-button"
            title="截取这部手机"
            aria-label={`截取${id === 'other' ? '对方' : '自己'}手机画面`}
            disabled={capturing}
            onClick={() => onCapture(id)}
          >
            <ScanLine size={17} />
          </button>
        </div>
      </div>
      <div className={`phone-shell ${device.os}`}>
        <div
          className={`phone-screen ${device.os} ${pickingInsertion ? 'picking-insertion' : ''}`}
          ref={screenRef}
        >
          <StatusBar device={device} />
          <div className="wechat-navbar">
            <div className="wechat-back">
              <svg width="27" height="52" viewBox="0 0 27 52">
                <path
                  d="M25 2L3 26l22 24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {device.unread > 0 && <span>{device.unread > 99 ? '99+' : device.unread}</span>}
            </div>
            <strong>{project.people[peer].name}</strong>
            <span className="wechat-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div
            className="chat-scroll"
            ref={bodyRef}
            onScroll={() => {
              const body = bodyRef.current!;
              setAtBottom(body.scrollHeight - body.scrollTop - body.clientHeight < 50);
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelected(null);
                setPanel(null);
              }
            }}
          >
            <div className="chat-timeline">
              {project.messages.length === 0 && (
                <div className="chat-empty" data-editor-only="true">
                  <div className="empty-bubbles">
                    <span />
                    <span />
                  </div>
                  <strong>从一句「你好」开始</strong>
                  <p>在下方输入消息，两边会同步显示</p>
                </div>
              )}
              {project.messages.map((message, index) => {
                const own = message.sender === id;
                const moneyMessage = ['transfer', 'redpacket', 'receipt'].includes(message.type);
                const parent = message.parentId
                  ? project.messages.find((m) => m.id === message.parentId)
                  : undefined;
                let notice = '';
                if (message.type === 'notice' && parent)
                  notice = `${own ? '你' : project.people[message.sender].name}领取了${parent.sender === id ? '你' : project.people[parent.sender].name}的`;
                const editable = !message.parentId;
                return (
                  <div
                    key={message.id}
                    className={`timeline-item ${selected === message.id ? 'selected' : ''}`}
                  >
                    {insertGap(message.id)}
                    {shouldShowTime(project.messages, index) && renderTime(message)}
                    {message.type === 'time' ? (
                      renderTime(message, true)
                    ) : message.type === 'notice' ? (
                      <div className="system-message redpacket-notice">
                        <span>
                          <img
                            className="redpacket-notice-icon"
                            src={assetPath('wechat/redpacket.png')}
                            alt=""
                          />
                          <span className="redpacket-notice-text">
                            {notice}
                            <span className="redpacket-notice-link">红包</span>
                          </span>
                        </span>
                        <button
                          className="system-edit icon-button"
                          data-editor-only="true"
                          aria-label="撤销领取提示"
                          onClick={() => onDelete(message.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`message-row ${own ? 'own' : 'incoming'} ${message.type === 'image' ? 'image-row' : ''}`}
                      >
                        <img
                          className="message-avatar"
                          src={project.people[message.sender].avatar}
                          alt={`${project.people[message.sender].name}的头像`}
                        />
                        <div className="message-content">
                          <button
                            className={`message-hit ${moneyMessage ? 'money-hit' : ''} ${message.type === 'image' ? 'image-hit' : ''}`}
                            aria-label={`${own ? '发送' : '收到'}的${message.type === 'text' ? '消息：' + message.text : message.type === 'image' ? '图片' : message.type === 'redpacket' ? '红包' : message.type === 'voice' ? `语音，${message.durationSeconds}秒${!own && message.voiceUnread ? '，未读' : ''}` : message.type === 'call' ? `语音通话：${callLabel(message, id)}` : '转账'}`}
                            onClick={() => {
                              setSelected((current) =>
                                current === message.id ? null : message.id,
                              );
                              if (message.type === 'voice') onReadVoice(message.id, id);
                              if (moneyMessage)
                                onAction({
                                  kind: 'details',
                                  id: message.parentId ?? message.id,
                                  viewer: id,
                                });
                            }}
                            onDoubleClick={() => {
                              if (editable && message.type === 'text')
                                onAction({ kind: 'text', id: message.id });
                              if (message.type === 'voice' || message.type === 'call')
                                onAction({
                                  kind: 'media',
                                  type: message.type,
                                  sender: message.sender,
                                  id: message.id,
                                });
                            }}
                          >
                            {moneyMessage ? (
                              <MoneyBubble message={message} own={own} />
                            ) : message.type === 'voice' || message.type === 'call' ? (
                              <MediaBubble message={message} viewer={id} />
                            ) : message.type === 'image' ? (
                              <img
                                src={message.text}
                                alt="聊天图片"
                                className="chat-image"
                                onLoad={() => {
                                  if (atBottom) {
                                    const body = bodyRef.current;
                                    if (body) body.scrollTop = body.scrollHeight;
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-bubble">{message.text}</span>
                            )}
                          </button>
                          <div className="message-tools" data-editor-only="true">
                            <button
                              title="调整发送时间"
                              aria-label="调整发送时间"
                              onClick={() => onAction({ kind: 'message-time', id: message.id })}
                            >
                              <Clock3 size={12} />
                            </button>
                            <button
                              title="在这条之后插入"
                              aria-label="在这条消息后插入"
                              onClick={() => onInsert(project.messages[index + 1]?.id ?? null)}
                            >
                              <Plus size={13} />
                            </button>
                            {editable && (
                              <button
                                title="编辑消息"
                                aria-label="编辑消息"
                                onClick={() =>
                                  moneyMessage
                                    ? onAction({
                                        kind: 'money',
                                        sender: message.sender,
                                        type: message.type as 'transfer' | 'redpacket',
                                        id: message.id,
                                      })
                                    : message.type === 'voice' || message.type === 'call'
                                      ? onAction({
                                          kind: 'media',
                                          type: message.type,
                                          sender: message.sender,
                                          id: message.id,
                                        })
                                      : message.type === 'text'
                                        ? onAction({ kind: 'text', id: message.id })
                                        : (() => {
                                            replaceImage.current = message.id;
                                            imageRef.current?.click();
                                          })()
                                }
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                            <button
                              title="删除消息"
                              aria-label="删除消息"
                              onClick={() => onDelete(message.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {insertGap(null)}
              <div ref={endRef} />
            </div>
          </div>
          {!atBottom && (
            <button
              className="jump-bottom"
              data-editor-only="true"
              aria-label="回到最新消息"
              onClick={() => {
                const body = bodyRef.current;
                body?.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
              }}
            >
              <ArrowDown size={16} />
            </button>
          )}
          {(insertMode || pickingInsertion) && (
            <div className="insertion-banner" data-editor-only="true">
              <Plus size={14} />
              <span>
                {pickingInsertion
                  ? '先点击消息间的「插入消息」选择位置'
                  : insertion
                    ? '下一条将插入选中位置'
                    : '下一条将插入聊天末尾'}
              </span>
              <button aria-label="取消插入" onClick={cancelInsert}>
                <X size={14} />
              </button>
            </div>
          )}
          {insertMode && (
            <label className="insertion-time-row" data-editor-only="true">
              插入时间
              <input
                aria-label="本次插入时间"
                type="datetime-local"
                min="1970-01-01T00:00"
                max="9999-12-31T23:59"
                value={dateTimeValue(insertAt)}
                onChange={(e) => {
                  const at = parseDateTime(e.target.value);
                  if (at !== null) onInsertAt(at);
                }}
              />
            </label>
          )}
          <div className="wechat-composer" inert={pickingInsertion}>
            <button
              className="composer-icon"
              aria-label="发送语音消息"
              onClick={() => {
                setPanel(null);
                onAction({ kind: 'media', sender: id, type: 'voice' });
              }}
            >
              <img src={assetPath('wechat/voice.png')} alt="" />
            </button>
            <textarea
              ref={inputRef}
              aria-label={`${id === 'other' ? '对方' : '自己'}的消息输入框`}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              onPaste={(e) => {
                const file = Array.from(e.clipboardData.files).find((f) =>
                  f.type.startsWith('image/'),
                );
                if (file) {
                  e.preventDefault();
                  replaceImage.current = undefined;
                  void processImage(file);
                }
              }}
            />
            <button
              className={`composer-icon ${panel === 'emoji' ? 'chosen' : ''}`}
              aria-label="选择表情"
              aria-expanded={panel === 'emoji'}
              onClick={() => setPanel(panel === 'emoji' ? null : 'emoji')}
            >
              <img src={assetPath('wechat/emoji.png')} alt="" />
            </button>
            {draft.trim() ? (
              <button
                className="send-button"
                aria-label={`以${id === 'other' ? '对方' : '自己'}身份发送`}
                onClick={send}
              >
                发送
              </button>
            ) : (
              <button
                className={`composer-icon ${panel === 'more' ? 'chosen' : ''}`}
                aria-label="打开更多功能"
                aria-expanded={panel === 'more'}
                onClick={() => setPanel(panel === 'more' ? null : 'more')}
              >
                <img src={assetPath('wechat/more.png')} alt="" />
              </button>
            )}
          </div>
          <div className={`phone-home ${device.os}`}>
            <i />
          </div>
          {panel && (
            <div className={`composer-panel ${panel}`} data-editor-only="true">
              <div className="composer-panel-header">
                <span>{panel === 'emoji' ? '表情' : '发送更多内容'}</span>
                <button
                  aria-label="关闭功能面板"
                  className="icon-button"
                  onClick={() => setPanel(null)}
                >
                  <X size={15} />
                </button>
              </div>
              {panel === 'emoji' ? (
                <EmojiPicker
                  onSelect={(emoji) => {
                    setDraft((s) => s + emoji);
                    inputRef.current?.focus();
                  }}
                />
              ) : (
                <div className="more-grid">
                  <button
                    onClick={() => {
                      setPanel(null);
                      onAction({ kind: 'media', sender: id, type: 'voice' });
                    }}
                  >
                    <span>
                      <Mic size={26} strokeWidth={1.5} />
                    </span>
                    语音消息
                  </button>
                  <button
                    onClick={() => {
                      setPanel(null);
                      onAction({ kind: 'media', sender: id, type: 'call' });
                    }}
                  >
                    <span>
                      <PhoneIcon size={26} strokeWidth={1.5} />
                    </span>
                    语音通话
                  </button>
                  <button
                    onClick={() => {
                      replaceImage.current = undefined;
                      imageRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    <span>
                      <ImagePlus size={26} strokeWidth={1.5} />
                    </span>
                    {uploading ? '处理中…' : '图片'}
                  </button>
                  <button
                    onClick={() => {
                      setPanel(null);
                      onAction({ kind: 'money', sender: id, type: 'redpacket' });
                    }}
                  >
                    <span className="red-icon">
                      <Gift size={27} strokeWidth={1.5} />
                    </span>
                    红包
                  </button>
                  <button
                    onClick={() => {
                      setPanel(null);
                      onAction({ kind: 'money', sender: id, type: 'transfer' });
                    }}
                  >
                    <span className="orange-icon">
                      <ArrowLeftRight size={27} strokeWidth={1.5} />
                    </span>
                    转账
                  </button>
                  <button
                    onClick={() => {
                      setPanel(null);
                      onAction({ kind: 'time' });
                    }}
                  >
                    <span>
                      <Clock3 size={26} strokeWidth={1.5} />
                    </span>
                    时间
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        hidden
        onChange={(e) => {
          void processImage(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </section>
  );
}
