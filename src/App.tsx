import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  BellOff,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  FolderOpen,
  Gift,
  LoaderCircle,
  Pencil,
  MessageCircle,
  Plus,
  Redo2,
  RotateCcw,
  ScanLine,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trash2,
  Undo2,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import {
  createProject,
  deleteMessage,
  insertMessage,
  money,
  opposite,
  readImage,
  setMoneyStatus,
  uid,
  updateMessage,
  validAmount,
} from './model';
import type { Device, Message, MoneyStatus, PersonId, Project } from './model';
import Phone from './Phone';
import type { PhoneAction } from './Phone';
import Dialog from './Dialog';
import MediaForm from './MediaForm';
import { markVoiceRead } from './media-message';
import DateTimePicker from './DateTimePicker';
import ChoiceSelect from './ChoiceSelect';
import { StatusTimePicker, BatteryInput } from './DeviceFields';
import { Switch } from './components/ui/switch';
import { Slider } from './components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { useProject } from './useProject';
import {
  dateTimeValue,
  editedTime,
  parseDateTime,
  suggestedInsertTime,
  validTime,
} from './chat-time';

type Modal =
  | PhoneAction
  | { kind: 'group-new' }
  | { kind: 'group-trash' }
  | { kind: 'group-rename'; groupId: string }
  | { kind: 'group-delete'; groupId: string }
  | { kind: 'help' | 'clear' | 'reset' }
  | { kind: 'capture'; url: string; viewer: PersonId };
function Toggle({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="toggle-row">
      <span>
        {icon}
        {label}
      </span>
      <Switch
        className="studio-switch"
        aria-label={label}
        checked={checked}
        onCheckedChange={onChange}
      />
    </label>
  );
}

function MoneyForm({
  action,
  project,
  sendAt,
  onSave,
  onClose,
}: {
  action: Extract<PhoneAction, { kind: 'money' }>;
  project: Project;
  sendAt: number;
  onSave: (message: Message, status: MoneyStatus) => void;
  onClose: () => void;
}) {
  const current = action.id ? project.messages.find((m) => m.id === action.id) : undefined;
  const red = action.type === 'redpacket';
  const [amount, setAmount] = useState(current?.amount ?? '');
  const [text, setText] = useState(current?.text ?? '');
  const [status, setStatus] = useState<MoneyStatus>(current?.status ?? 'pending');
  const [baseSentAt] = useState(current?.sentAt ?? sendAt);
  const [sentTime, setSentTime] = useState(dateTimeValue(baseSentAt));
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!validAmount(amount)) {
      setError('请输入大于 0 的金额，最多保留两位小数');
      return;
    }
    const sentAt = editedTime(sentTime, baseSentAt);
    if (sentAt === null) {
      setError('请选择有效的发送日期和时间');
      return;
    }
    onSave(
      {
        sentAt,
        id: current?.id ?? uid(),
        sender: action.sender,
        type: action.type,
        text: text.trim() || (red ? '恭喜发财，大吉大利' : '转账'),
        amount: money(amount),
        status: current?.status ?? 'pending',
      },
      status,
    );
  };
  return (
    <Dialog
      title={`${current ? '编辑' : '发送'}${red ? '红包' : '转账'}`}
      onClose={onClose}
      className="money-dialog"
    >
      <div className="send-to">
        <img src={project.people[opposite(action.sender)].avatar} alt="" />
        <span>
          <small>{project.people[action.sender].name} 发给</small>
          <strong>{project.people[opposite(action.sender)].name}</strong>
        </span>
        <span className={`send-type ${red ? 'red' : ''}`}>
          {red ? <Gift size={22} /> : <ArrowLeftRight size={22} />}
        </span>
      </div>
      <form onSubmit={submit} className="dialog-form">
        <label className="amount-field">
          <span>{red ? '红包金额' : '转账金额'}</span>
          <div>
            <b>¥</b>
            <Input
              aria-label="金额"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              autoFocus
              maxLength={11}
            />
          </div>
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <label className="form-field">
          {red ? '祝福语' : '转账说明'}
          <Input
            maxLength={80}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={red ? '恭喜发财，大吉大利' : '转账'}
          />
        </label>
        {current && (
          <label className="form-field">
            消息状态
            <ChoiceSelect<MoneyStatus>
              label="消息状态"
              value={status}
              onValueChange={setStatus}
              options={[
                { value: 'pending', label: red ? '未领取' : '待收款' },
                { value: 'received', label: red ? '已领取' : '已收款' },
                ...(!red ? [{ value: 'returned' as const, label: '已退还' }] : []),
              ]}
            />
          </label>
        )}
        <label className="form-field">
          发送日期与时间
          <DateTimePicker label="发送日期与时间" value={sentTime} onValueChange={setSentTime} />
        </label>
        <p className="form-note">
          <ShieldCheck size={14} />
          这是聊天模拟，不会发生真实资金交易
        </p>
        <div className="dialog-actions">
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            className="button secondary"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            variant="unstyled"
            size="unstyled"
            className={`button primary ${red ? 'red-primary' : ''}`}
            type="submit"
          >
            {current ? '保存修改' : red ? '塞钱进红包' : '发送转账'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function App() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4200);
  }, []);
  const {
    project,
    edit,
    undo,
    redo,
    canUndo,
    canRedo,
    saved,
    groups,
    activeGroup,
    activeId,
    trash,
    selectGroup,
    createGroup,
    renameGroup,
    deleteGroup,
    restoreGroup,
    setGroupDraft,
  } = useProject(notify);
  const [modal, setModal] = useState<Modal | null>(null);
  const [deviceId, setDeviceId] = useState<PersonId>('other');
  const [insertMode, setInsertMode] = useState(false);
  const [pickingInsertion, setPickingInsertion] = useState(false);
  const [insertion, setInsertion] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState(Date.now);
  const [mobileView, setMobileView] = useState<PersonId>('other');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [copying, setCopying] = useState(false);
  const otherRef = useRef<HTMLDivElement>(null);
  const selfRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const avatarPerson = useRef<PersonId>('other');
  const captureBlob = useRef<Blob | null>(null);
  const captureUrl = useRef<string | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setModal(null);
    setPickingInsertion(false);
    setInsertMode(false);
    setInsertion(null);
    if (captureUrl.current) {
      URL.revokeObjectURL(captureUrl.current);
      captureUrl.current = null;
    }
    captureBlob.current = null;
  }, [activeId]);
  const device = project.devices[deviceId];
  const timeSettings = project.timeSettings ?? {
    mode: 'live' as const,
    sendAt: now,
    expanded: { other: false, self: false },
  };
  const sendAt = insertMode ? insertAt : timeSettings.mode === 'manual' ? timeSettings.sendAt : now;
  const moneyCount = project.messages.filter(
    (m) => m.type === 'redpacket' || m.type === 'transfer',
  ).length;

  const closeModal = () => {
    setModal(null);
    if (captureUrl.current) {
      URL.revokeObjectURL(captureUrl.current);
      captureUrl.current = null;
    }
    captureBlob.current = null;
  };
  const patchDevice = (patch: Partial<Device>, id = deviceId) =>
    edit((p) => ({ ...p, devices: { ...p.devices, [id]: { ...p.devices[id], ...patch } } }));
  const addMessage = (message: Message, groupId = activeId) => {
    edit((p) => {
      const sentAt = validTime(message.sentAt)
        ? message.sentAt
        : insertMode
          ? insertAt
          : p.timeSettings?.mode === 'manual'
            ? p.timeSettings.sendAt
            : Date.now();
      return {
        ...p,
        messages: insertMessage(p.messages, { ...message, sentAt }, insertMode ? insertion : null),
      };
    }, groupId);
    if (insertMode) {
      setInsertMode(false);
      setInsertion(null);
      notify('消息已插入，两边同步更新');
    }
  };
  const cancelInsertion = () => {
    setPickingInsertion(false);
    setInsertMode(false);
    setInsertion(null);
  };
  const chooseInsert = (before: string | null) => {
    setInsertAt(suggestedInsertTime(project.messages, before, sendAt));
    setPickingInsertion(false);
    setInsertMode(true);
    setInsertion(before);
  };
  const settle = (id: string, status: MoneyStatus) => {
    edit((p) => ({
      ...p,
      messages: setMoneyStatus(
        p.messages,
        id,
        status,
        p.timeSettings?.mode === 'manual' ? p.timeSettings.sendAt : Date.now(),
      ),
    }));
    notify(
      status === 'received'
        ? '已接收，两边状态和对应消息已自动更新'
        : '已退还，两边状态和对应消息已自动更新',
    );
  };
  const handleImage = async (sender: PersonId, file: File, replaceId?: string) => {
    const groupAtStart = activeId;
    try {
      const text = await readImage(file);
      if (replaceId)
        edit(
          (p) => ({
            ...p,
            messages: p.messages.map((m) => (m.id === replaceId ? { ...m, text } : m)),
          }),
          groupAtStart,
        );
      else addMessage({ id: uid(), sender, type: 'image', text }, groupAtStart);
    } catch (error) {
      notify(error instanceof Error ? error.message : '图片处理失败，请重试');
    }
  };
  const changeAvatar = async (file?: File) => {
    if (!file) return;
    const id = avatarPerson.current;
    const groupAtStart = activeId;
    try {
      const avatar = await readImage(file, true);
      edit(
        (p) => ({ ...p, people: { ...p.people, [id]: { ...p.people[id], avatar } } }),
        groupAtStart,
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : '头像上传失败');
    }
  };
  const capture = async (viewer: PersonId) => {
    if (capturing) return;
    setCapturing(true);
    const screen = viewer === 'other' ? otherRef.current : selfRef.current;
    if (!screen) {
      setCapturing(false);
      return;
    }
    // On mobile, temporarily render the hidden peer's screen to get an actual capture.
    const column = screen.closest<HTMLElement>('.phone-column')!;
    const wasHidden = getComputedStyle(column).display === 'none';
    const previousColumnStyle = column.getAttribute('style');
    if (wasHidden) {
      const visibleColumn = Array.from(
        document.querySelectorAll<HTMLElement>('.phone-column'),
      ).find((el) => getComputedStyle(el).display !== 'none');
      const bounds = visibleColumn?.getBoundingClientRect();
      Object.assign(column.style, {
        display: 'flex',
        position: 'fixed',
        left: '-10000px',
        width: `${bounds?.width ?? 354}px`,
        height: `${bounds?.height ?? 650}px`,
      });
    }
    try {
      await document.fonts.ready;
      await Promise.all(
        Array.from(screen.querySelectorAll('img')).map((img) => img.decode().catch(() => {})),
      );
      const scrollTop = screen.querySelector<HTMLElement>('.chat-scroll')?.scrollTop ?? 0;
      // Capture a mounted offscreen clone so scrolling and editor cleanup never
      // disturb either live phone. Preserve the layout gaps between messages.
      const clone = screen.cloneNode(true) as HTMLDivElement;
      const bounds = screen.getBoundingClientRect();
      Object.assign(clone.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        borderRadius: '0',
        pointerEvents: 'none',
      });
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[data-editor-only]').forEach((node) => node.remove());
      clone.querySelectorAll('.selected').forEach((node) => node.classList.remove('selected'));
      clone
        .querySelectorAll('.insert-gap.is-active')
        .forEach((node) => node.classList.remove('is-active'));
      const clonedTimeline = clone.querySelector<HTMLElement>('.chat-timeline');
      if (clonedTimeline) clonedTimeline.style.transform = `translateY(-${scrollTop}px)`;
      document.body.appendChild(clone);
      let blob: Blob | null;
      try {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(clone, {
          scale: 3,
          backgroundColor: '#ededed',
          useCORS: true,
          logging: false,
          width: bounds.width,
          height: bounds.height,
        });
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      } finally {
        clone.remove();
      }
      if (!blob) throw new Error('截图生成失败，请重试');
      if (captureUrl.current) URL.revokeObjectURL(captureUrl.current);
      captureBlob.current = blob;
      captureUrl.current = URL.createObjectURL(blob);
      setModal({ kind: 'capture', url: captureUrl.current, viewer });
    } catch (error) {
      notify(error instanceof Error ? error.message : '截图失败，请重试');
    } finally {
      setCapturing(false);
      if (wasHidden) {
        if (previousColumnStyle === null) column.removeAttribute('style');
        else column.setAttribute('style', previousColumnStyle);
      }
    }
  };
  const copyCapture = async () => {
    if (!captureBlob.current) return;
    setCopying(true);
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
        throw new Error('当前浏览器不支持复制图片，请点击保存图片');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': captureBlob.current })]);
      notify('截图已复制，可直接粘贴');
    } catch (error) {
      notify(
        error instanceof Error && error.message.includes('不支持')
          ? error.message
          : '复制未完成，请允许剪贴板权限，或点击保存图片',
      );
    } finally {
      setCopying(false);
    }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable], dialog')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === 'Escape') {
        setPickingInsertion(false);
        setInsertMode(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);
  useEffect(() => {
    if (insertMode && insertion && !project.messages.some((m) => m.id === insertion)) {
      setInsertMode(false);
      setInsertion(null);
    }
  }, [project.messages, insertion, insertMode]);

  const detail =
    modal?.kind === 'details' ? project.messages.find((m) => m.id === modal.id) : undefined;
  const detailViewer = modal?.kind === 'details' ? modal.viewer : 'self';
  const detailRed = detail?.type === 'redpacket';
  const detailOwn = detail?.sender === detailViewer;
  const detailReceived = detail?.status === 'received';
  const saveMoney = (message: Message, status: MoneyStatus) => {
    edit((p) => {
      let messages = p.messages.some((m) => m.id === message.id)
        ? updateMessage(p.messages, message)
        : insertMessage(p.messages, message, insertMode ? insertion : null);
      if (status !== message.status)
        messages = setMoneyStatus(messages, message.id, status, sendAt);
      return { ...p, messages };
    });
    setModal(null);
    if (insertMode) {
      setInsertMode(false);
      setInsertion(null);
      notify('消息已插入');
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="对话工坊首页">
          <span className="brand-mark">
            <MessageCircle size={21} strokeWidth={1.8} />
            <span />
          </span>
          <strong>对话工坊</strong>
          <span className="brand-divider" />
          <span className="brand-subtitle current-group-breadcrumb" title={activeGroup.name}>
            {activeGroup.name}
          </span>
        </a>
        <div className="header-actions">
          <span className={`save-state ${saved === 'error' ? 'save-error' : ''}`}>
            {saved === 'saved' ? (
              <CheckCheck size={15} />
            ) : saved === 'error' ? (
              <CircleHelp size={15} />
            ) : (
              <LoaderCircle size={14} className="spin" />
            )}
            {saved === 'saved' ? '草稿已保存在本机' : saved === 'error' ? '草稿未保存' : '保存中…'}
          </span>
          <div className="history-actions">
            <button
              className="icon-button"
              title="撤销 ⌘Z / Ctrl+Z"
              aria-label="撤销"
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2 size={18} />
            </button>
            <button
              className="icon-button"
              title="重做 ⇧⌘Z / Ctrl+Shift+Z"
              aria-label="重做"
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2 size={18} />
            </button>
          </div>
          <button
            className="icon-button help-button"
            title="使用说明"
            aria-label="使用说明"
            onClick={() => setModal({ kind: 'help' })}
          >
            <CircleHelp size={19} />
          </button>
        </div>
      </header>
      <div className="app-body">
        {sidebarOpen && (
          <button
            className="sidebar-scrim"
            aria-label="关闭设置"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`sidebar ${sidebarOpen ? 'open' : ''}`}
          aria-label="分组与手机设置面板"
          tabIndex={0}
        >
          <div className="sidebar-mobile-title">
            <strong>分组与手机设置</strong>
            <button
              className="icon-button"
              aria-label="收起设置"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <section className="settings-section group-settings">
            <h2>
              <FolderOpen size={16} />
              聊天分组<span>{groups.length} 组</span>
              <button
                className="icon-button"
                title="新建分组"
                aria-label="新建分组"
                disabled={capturing}
                onClick={() => setModal({ kind: 'group-new' })}
              >
                <Plus size={15} />
              </button>
            </h2>
            <div className="group-list" aria-label="聊天分组列表">
              {groups.map((group) => (
                <div
                  className={`group-row ${group.id === activeId ? 'active' : ''}`}
                  key={group.id}
                >
                  <button
                    className="group-select"
                    aria-label={`切换到分组：${group.name}`}
                    aria-current={group.id === activeId ? 'true' : undefined}
                    disabled={capturing}
                    onClick={() => selectGroup(group.id)}
                  >
                    <img src={group.project.people.other.avatar} alt="" />
                    <span>
                      <strong>{group.name}</strong>
                      <small>
                        {group.project.people.other.name} ·{' '}
                        {
                          group.project.messages.filter((m) => !['time', 'notice'].includes(m.type))
                            .length
                        }{' '}
                        条消息
                      </small>
                    </span>
                  </button>
                  <div className="group-row-actions">
                    <button
                      className="icon-button"
                      aria-label={`重命名分组：${group.name}`}
                      title="重命名"
                      disabled={capturing}
                      onClick={() => setModal({ kind: 'group-rename', groupId: group.id })}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`删除分组：${group.name}`}
                      title={groups.length === 1 ? '至少保留一个分组' : '删除分组'}
                      disabled={capturing || groups.length === 1}
                      onClick={() => setModal({ kind: 'group-delete', groupId: group.id })}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {trash.length > 0 && (
              <button
                className="group-trash-link"
                onClick={() => setModal({ kind: 'group-trash' })}
              >
                <Trash2 size={12} />
                最近删除（{trash.length}）
              </button>
            )}
          </section>
          <section className="settings-section participant-settings">
            <h2>
              <Users size={16} />
              聊天双方<span>双人聊天</span>
            </h2>
            {(['other', 'self'] as const).map((id) => (
              <div className="person-setting" key={id}>
                <button
                  className="avatar-upload"
                  title="更换头像"
                  aria-label={`更换${id === 'other' ? '对方' : '自己'}头像`}
                  onClick={() => {
                    avatarPerson.current = id;
                    avatarRef.current?.click();
                  }}
                >
                  <img src={project.people[id].avatar} alt="" />
                  <span>
                    <Camera size={14} />
                  </span>
                </button>
                <label>
                  <span>{id === 'other' ? '对方' : '自己'}</span>
                  <Input
                    aria-label={`${id === 'other' ? '对方' : '自己'}昵称`}
                    value={project.people[id].name}
                    maxLength={20}
                    onChange={(e) => {
                      const name = e.target.value;
                      edit((p) => ({
                        ...p,
                        people: { ...p.people, [id]: { ...p.people[id], name } },
                      }));
                    }}
                    onBlur={() => {
                      if (!project.people[id].name.trim())
                        edit((p) => ({
                          ...p,
                          people: {
                            ...p.people,
                            [id]: { ...p.people[id], name: id === 'other' ? '对方' : '自己' },
                          },
                        }));
                    }}
                  />
                </label>
              </div>
            ))}
            <p className="settings-hint">点击头像更换，昵称会同步到聊天中</p>
          </section>
          <section className="settings-section device-settings" ref={settingsRef}>
            <h2>
              <Smartphone size={16} />
              手机设置
            </h2>
            <Tabs
              className="segment device-tabs"
              value={deviceId}
              onValueChange={(id) => setDeviceId(id as PersonId)}
            >
              <TabsList aria-label="选择要设置的手机">
                {(['other', 'self'] as const).map((id) => (
                  <TabsTrigger key={id} value={id}>
                    {id === 'other' ? '对方的手机' : '自己的手机'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <label className="setting-field">
              手机系统
              <ChoiceSelect
                label="当前手机系统"
                value={device.os}
                onValueChange={(os) => patchDevice({ os })}
                options={[
                  { value: 'android', label: 'Android · 参考样式' },
                  { value: 'ios', label: 'iOS · iPhone' },
                ]}
              />
            </label>
            <div className="setting-two">
              <div className="setting-field">
                <span>状态栏时间</span>
                <StatusTimePicker value={device.time} onChange={(time) => patchDevice({ time })} />
              </div>
              <div className="setting-field">
                <span>电量 %</span>
                <BatteryInput
                  value={device.battery}
                  onChange={(battery) => patchDevice({ battery })}
                />
              </div>
            </div>
            <label className="range-field">
              <span>
                主卡信号 <small>{device.signal} 格</small>
              </span>
              <Slider
                className="studio-slider"
                aria-label="主卡信号"
                min={0}
                max={4}
                step={1}
                value={[device.signal]}
                onValueChange={([signal]) => patchDevice({ signal })}
              />
            </label>
            <Toggle
              label="双卡信号"
              checked={device.dual}
              onChange={(dual) => patchDevice({ dual })}
            />
            {device.dual && (
              <label className="range-field secondary-signal">
                <span>
                  副卡信号 <small>{device.secondarySignal} 格</small>
                </span>
                <Slider
                  className="studio-slider"
                  aria-label="副卡信号"
                  min={0}
                  max={4}
                  step={1}
                  value={[device.secondarySignal]}
                  onValueChange={([secondarySignal]) => patchDevice({ secondarySignal })}
                />
              </label>
            )}
            <Toggle
              label="Wi-Fi"
              icon={<Wifi size={15} />}
              checked={device.wifi}
              onChange={(wifi) => patchDevice({ wifi })}
            />
            {device.os === 'android' && (
              <Toggle
                label="静音模式"
                icon={<BellOff size={15} />}
                checked={device.mute}
                onChange={(mute) => patchDevice({ mute })}
              />
            )}
            <Toggle
              label="正在充电"
              checked={device.charging}
              onChange={(charging) => patchDevice({ charging })}
            />
            {device.os === 'ios' && (
              <Toggle
                label="灵动岛布局"
                checked={device.island}
                onChange={(island) => patchDevice({ island })}
              />
            )}
            <details className="advanced-settings">
              <summary>
                更多状态栏设置
                <ChevronDown size={14} />
              </summary>
              <div>
                <label className="setting-field">
                  移动网络
                  <ChoiceSelect
                    label="移动网络"
                    value={device.network}
                    onValueChange={(network) => patchDevice({ network })}
                    options={[
                      { value: '5G', label: '5G' },
                      { value: '4G', label: '4G' },
                    ]}
                  />
                </label>
                <label className="setting-field">
                  返回按钮未读数
                  <Input
                    aria-label="未读消息数量"
                    type="number"
                    min="0"
                    max="999"
                    value={device.unread}
                    onChange={(e) =>
                      patchDevice({ unread: Math.max(0, Math.min(999, Number(e.target.value))) })
                    }
                  />
                </label>
              </div>
            </details>
          </section>
          <section className="settings-section timeline-settings">
            <h2>
              <Clock3 size={16} />
              消息时间<span>北京时间</span>
            </h2>
            <Toggle
              label="使用当前发送时间"
              checked={timeSettings.mode === 'live'}
              onChange={(live) =>
                edit((p) => ({
                  ...p,
                  timeSettings: {
                    ...timeSettings,
                    mode: live ? 'live' : 'manual',
                    sendAt: live ? Date.now() : timeSettings.sendAt,
                  },
                }))
              }
            />
            <label className="setting-field">
              {insertMode ? '本次插入时间' : '发送日期与时间'}
              <DateTimePicker
                label="模拟发送时间"
                value={dateTimeValue(sendAt)}
                onValueChange={(value) => {
                  const at = parseDateTime(value);
                  if (at !== null) {
                    if (insertMode) setInsertAt(at);
                    else
                      edit((p) => ({
                        ...p,
                        timeSettings: { ...timeSettings, mode: 'manual', sendAt: at },
                      }));
                  }
                }}
              />
            </label>
            <p className="settings-hint">
              间隔满 5 分钟或跨天时自动显示时间。点击聊天中的时间，可切换详细日期。
            </p>
          </section>
          <div className="sidebar-bottom">
            <div>
              <ShieldCheck size={16} />
              <span>内容只保存在当前浏览器</span>
            </div>
            <button onClick={() => setModal({ kind: 'reset' })}>
              <RotateCcw size={14} />
              恢复示例对话
            </button>
          </div>
        </aside>
        <main className={`workspace mobile-${mobileView}`} aria-label="聊天内容工作区" tabIndex={0}>
          <h1 className="sr-only">聊天编排 · {activeGroup.name}</h1>
          <div className="workspace-mobile-bar">
            <button
              className="mobile-settings button secondary"
              aria-label="分组与手机设置"
              onClick={() => setSidebarOpen(true)}
            >
              <Settings2 size={15} />
              <span>{activeGroup.name}</span>
            </button>
            <div className="mobile-view-tabs segment">
              <button
                className={mobileView === 'other' ? 'active' : ''}
                onClick={() => setMobileView('other')}
              >
                对方视角
              </button>
              <button
                className={mobileView === 'self' ? 'active' : ''}
                onClick={() => setMobileView('self')}
              >
                自己视角
              </button>
            </div>
          </div>
          <div className="phone-stage">
            {(['other', 'self'] as const).map((id) => (
              <Phone
                key={`${activeId}-${id}`}
                id={id}
                project={project}
                now={now}
                insertAt={insertAt}
                onInsertAt={setInsertAt}
                onToggleTime={(viewer) =>
                  edit((p) => ({
                    ...p,
                    timeSettings: {
                      ...timeSettings,
                      expanded: {
                        ...timeSettings.expanded,
                        [viewer]: !timeSettings.expanded[viewer],
                      },
                    },
                  }))
                }
                draft={activeGroup.drafts[id]}
                onDraft={(draft) => setGroupDraft(id, draft)}
                screenRef={id === 'other' ? otherRef : selfRef}
                insertion={insertion}
                insertMode={insertMode}
                pickingInsertion={pickingInsertion}
                onToggleInsert={() => {
                  if (pickingInsertion || insertMode) cancelInsertion();
                  else setPickingInsertion(true);
                }}
                onClear={() => setModal({ kind: 'clear' })}
                canClear={project.messages.length > 0}
                onInsert={chooseInsert}
                cancelInsert={cancelInsertion}
                onReadVoice={(messageId, viewer) =>
                  edit((p) => {
                    const messages = markVoiceRead(p.messages, messageId, viewer);
                    return messages === p.messages ? p : { ...p, messages };
                  })
                }
                onSend={(sender, type, text) => addMessage({ id: uid(), sender, type, text })}
                onAction={setModal}
                onDelete={(id) => edit((p) => ({ ...p, messages: deleteMessage(p.messages, id) }))}
                onImage={handleImage}
                onOS={(id, os) => patchDevice({ os }, id)}
                onSettings={(id) => {
                  setDeviceId(id);
                  if (window.matchMedia('(max-width: 940px)').matches) setSidebarOpen(true);
                  settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                onCapture={(viewer) => void capture(viewer)}
                capturing={capturing}
              />
            ))}
            <div className="sync-bridge" aria-hidden="true">
              <ArrowLeftRight size={18} />
            </div>
          </div>
          <footer className="workspace-footer">
            <span>
              <span className="shortcut-key">↵</span>发送消息
              <span className="footer-dot" />
              悬停消息可编辑，消息间可插入
            </span>
            <span>
              {project.messages.filter((m) => m.type !== 'time' && m.type !== 'notice').length}{' '}
              条消息{moneyCount > 0 && ` · ${moneyCount} 笔红包 / 转账`}
            </span>
          </footer>
        </main>
      </div>
      <input
        ref={avatarRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={(e) => {
          void changeAvatar(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button aria-label="关闭提示" onClick={() => setToast('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {(modal?.kind === 'group-new' || modal?.kind === 'group-rename') && (
        <Dialog
          title={modal.kind === 'group-new' ? '新建聊天分组' : '重命名分组'}
          onClose={closeModal}
        >
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const name = String(data.get('name') || '').trim();
              if (!name) return;
              if (modal.kind === 'group-new')
                createGroup(name, String(data.get('otherName') || ''));
              else renameGroup(modal.groupId, name);
              closeModal();
            }}
          >
            <label className="form-field">
              分组名称
              <Input
                name="name"
                aria-label="分组名称"
                maxLength={40}
                required
                autoFocus
                placeholder="例如：与张三的聊天"
                defaultValue={
                  modal.kind === 'group-rename'
                    ? groups.find((g) => g.id === modal.groupId)?.name
                    : ''
                }
              />
            </label>
            {modal.kind === 'group-new' && (
              <>
                <label className="form-field">
                  对方昵称
                  <Input
                    name="otherName"
                    aria-label="新分组对方昵称"
                    maxLength={20}
                    placeholder="可稍后在左侧修改"
                  />
                </label>
                <p className="form-note">新分组从空白聊天开始，沿用自己的头像昵称和手机设置。</p>
              </>
            )}
            <div className="dialog-actions">
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                className="button secondary"
                onClick={closeModal}
              >
                取消
              </Button>
              <Button variant="unstyled" size="unstyled" type="submit" className="button primary">
                {modal.kind === 'group-new' ? '创建分组' : '保存名称'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      {modal?.kind === 'group-delete' && (
        <Dialog title="删除这个分组？" onClose={closeModal}>
          <div className="dialog-copy">
            <p>
              「{groups.find((g) => g.id === modal.groupId)?.name}
              」的聊天内容和设置会一起移到最近删除。
            </p>
            <p className="muted">需要时可以从左侧「最近删除」完整恢复。</p>
          </div>
          <div className="dialog-actions">
            <Button
              variant="unstyled"
              size="unstyled"
              className="button secondary"
              onClick={closeModal}
            >
              取消
            </Button>
            <Button
              variant="unstyled"
              size="unstyled"
              className="button danger"
              onClick={() => {
                deleteGroup(modal.groupId);
                closeModal();
                notify('分组已移到最近删除，可以随时恢复');
              }}
            >
              删除分组
            </Button>
          </div>
        </Dialog>
      )}
      {modal?.kind === 'group-trash' && (
        <Dialog title="最近删除的分组" onClose={closeModal}>
          <div className="deleted-groups">
            {trash.length === 0 ? (
              <p className="muted">没有已删除的分组</p>
            ) : (
              [...trash].reverse().map((item) => (
                <div key={item.group.id}>
                  <img src={item.group.project.people.other.avatar} alt="" />
                  <span>
                    <strong>{item.group.name}</strong>
                    <small>{item.group.project.messages.length} 条记录 · 含头像与手机设置</small>
                  </span>
                  <Button
                    variant="unstyled"
                    size="unstyled"
                    className="button secondary"
                    aria-label={`恢复分组：${item.group.name}`}
                    onClick={() => {
                      restoreGroup(item.group.id);
                      closeModal();
                      notify('分组已完整恢复');
                    }}
                  >
                    恢复
                  </Button>
                </div>
              ))
            )}
          </div>
        </Dialog>
      )}
      {modal?.kind === 'media' && (
        <MediaForm
          action={modal}
          current={project.messages.find((message) => message.id === modal.id)}
          sendAt={sendAt}
          onClose={closeModal}
          onSave={(message) => {
            if (modal.id) edit((p) => ({ ...p, messages: updateMessage(p.messages, message) }));
            else addMessage(message);
            closeModal();
          }}
        />
      )}
      {modal?.kind === 'money' && (
        <MoneyForm
          action={modal}
          project={project}
          sendAt={sendAt}
          onSave={saveMoney}
          onClose={closeModal}
        />
      )}
      {modal?.kind === 'text' && (
        <Dialog title="编辑消息" onClose={closeModal}>
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const text = String(data.get('text') ?? '').trim();
              const sentAt = editedTime(
                String(data.get('sentAt') ?? ''),
                project.messages.find((m) => m.id === modal.id)?.sentAt,
              );
              if (!text || sentAt === null) return;
              const existing = project.messages.find((m) => m.id === modal.id);
              if (existing)
                edit((p) => ({
                  ...p,
                  messages: updateMessage(p.messages, { ...existing, text, sentAt }),
                }));
              closeModal();
            }}
          >
            <label className="form-field">
              消息内容
              <textarea
                name="text"
                aria-label="编辑消息内容"
                defaultValue={project.messages.find((m) => m.id === modal.id)?.text ?? ''}
                rows={4}
                required
                autoFocus
              />
            </label>
            <label className="form-field">
              发送日期与时间
              <DateTimePicker
                name="sentAt"
                label="发送日期与时间"
                defaultValue={dateTimeValue(
                  project.messages.find((m) => m.id === modal.id)?.sentAt ?? sendAt,
                )}
              />
            </label>
            <div className="dialog-actions">
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                className="button secondary"
                onClick={closeModal}
              >
                取消
              </Button>
              <Button variant="unstyled" size="unstyled" className="button primary" type="submit">
                保存修改
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      {(modal?.kind === 'time' || modal?.kind === 'message-time') && (
        <Dialog
          title={
            modal.kind === 'message-time'
              ? '调整消息发送时间'
              : modal.id
                ? '编辑时间节点'
                : '插入时间节点'
          }
          onClose={closeModal}
        >
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              const sentAt = editedTime(
                String(new FormData(e.currentTarget).get('sentAt') ?? ''),
                modal.id ? project.messages.find((m) => m.id === modal.id)?.sentAt : undefined,
              );
              if (sentAt === null) return;
              const existing = modal.id
                ? project.messages.find((m) => m.id === modal.id)
                : undefined;
              if (existing)
                edit((p) => ({
                  ...p,
                  messages: updateMessage(p.messages, {
                    ...existing,
                    sentAt,
                    text: existing.type === 'time' ? '' : existing.text,
                  }),
                }));
              else addMessage({ id: uid(), sender: 'self', type: 'time', text: '', sentAt });
              closeModal();
            }}
          >
            <label className="form-field">
              日期与时间
              <DateTimePicker
                name="sentAt"
                label="消息日期与时间"
                defaultValue={dateTimeValue(
                  (modal.id
                    ? project.messages.find((m) => m.id === modal.id)?.sentAt
                    : undefined) ?? sendAt,
                )}
                autoFocus
              />
            </label>
            <p className="form-note">修改后自动重算相邻的时间提示，消息位置保持不变。</p>
            <div className="dialog-actions">
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                className="button secondary"
                onClick={closeModal}
              >
                取消
              </Button>
              <Button variant="unstyled" size="unstyled" className="button primary" type="submit">
                {modal.kind === 'time' && !modal.id ? '插入时间' : '保存时间'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      {modal?.kind === 'details' && detail && (
        <Dialog
          title={detailRed ? '微信红包' : '转账详情'}
          onClose={closeModal}
          className={`transaction-dialog ${detailRed ? 'redpacket-detail' : ''}`}
        >
          <div className="transaction-content">
            <img className="transaction-avatar" src={project.people[detail.sender].avatar} alt="" />
            <p className="transaction-from">
              {project.people[detail.sender].name}
              {detailRed ? '的红包' : '的转账'}
            </p>
            {detailRed && <p className="redpacket-wish">{detail.text}</p>}
            <div className="transaction-icon">
              {detailRed ? (
                <Gift size={40} strokeWidth={1.3} />
              ) : detail.status === 'received' ? (
                <Check size={40} />
              ) : detail.status === 'returned' ? (
                <RotateCcw size={35} />
              ) : (
                <ArrowLeftRight size={39} strokeWidth={1.4} />
              )}
            </div>
            {(!detailRed || detailOwn || detailReceived) && (
              <p className="transaction-amount">
                {money(detail.amount)}
                <small>元</small>
              </p>
            )}
            {!detailRed && <p className="transaction-remark">{detail.text}</p>}
            <p className="transaction-status">
              {detail.status === 'pending'
                ? detailOwn
                  ? detailRed
                    ? '等待对方领取'
                    : '等待对方收款'
                  : detailRed
                    ? '给你的一份心意'
                    : '待你确认收款'
                : detail.status === 'returned'
                  ? detailOwn
                    ? '对方已退还'
                    : '已退还给对方'
                  : detailRed
                    ? detailOwn
                      ? '对方已领取'
                      : '已领取，已存入零钱'
                    : detailOwn
                      ? '对方已收款'
                      : '已收款，已存入零钱'}
            </p>
            {detail.status === 'pending' && !detailOwn && (
              <div className="transaction-actions">
                <Button
                  variant="unstyled"
                  size="unstyled"
                  className={`button primary ${detailRed ? 'red-primary open-packet' : ''}`}
                  onClick={() => settle(detail.id, 'received')}
                >
                  {detailRed ? '开' : '确认收款'}
                </Button>
                {!detailRed && (
                  <button className="text-button" onClick={() => settle(detail.id, 'returned')}>
                    立即退还
                  </button>
                )}
              </div>
            )}
            {detailOwn && detail.status === 'pending' && (
              <p className="transaction-tip">
                在{opposite(detailViewer) === 'other' ? '左边对方' : '右边自己'}的手机中点开，即可
                {detailRed ? '领取红包' : '收款或退还'}
              </p>
            )}
            {detail.status !== 'pending' && (
              <p className="transaction-tip">
                <CheckCheck size={14} />
                双方消息已同步更新
              </p>
            )}
            <button
              className="text-button transaction-edit"
              onClick={() =>
                setModal({
                  kind: 'money',
                  sender: detail.sender,
                  type: detail.type as 'transfer' | 'redpacket',
                  id: detail.id,
                })
              }
            >
              编辑这条{detailRed ? '红包' : '转账'}消息
            </button>
          </div>
        </Dialog>
      )}
      {modal?.kind === 'capture' && (
        <Dialog
          title={`${modal.viewer === 'other' ? '对方' : '自己'}的手机截图`}
          onClose={closeModal}
          className="capture-dialog"
        >
          <div className="capture-preview">
            <img src={modal.url} alt="生成的手机聊天截图" />
          </div>
          <p className="capture-note">已隐藏编辑按钮，以 3 倍清晰度截取当前画面</p>
          <div className="dialog-actions">
            <Button
              variant="unstyled"
              size="unstyled"
              className="button secondary"
              onClick={() => void copyCapture()}
              disabled={copying}
            >
              {copying ? <LoaderCircle size={16} className="spin" /> : <Copy size={16} />}复制图片
            </Button>
            <a
              className="button primary"
              href={modal.url}
              download={`微信聊天-${project.people[modal.viewer].name}-${Date.now()}.png`}
            >
              <ArrowDownToLine size={16} />
              保存图片
            </a>
          </div>
        </Dialog>
      )}
      {(modal?.kind === 'clear' || modal?.kind === 'reset') && (
        <Dialog
          title={modal.kind === 'clear' ? '清空这段对话？' : '恢复示例对话？'}
          onClose={closeModal}
        >
          <div className="dialog-copy">
            <p>
              {modal.kind === 'clear'
                ? '将移除双方手机中的所有消息，保留昵称、头像和手机设置。'
                : '将替换当前消息，保留你设置的昵称、头像和手机样式。'}
            </p>
            <p className="muted">操作后可以点击顶部「撤销」恢复。</p>
          </div>
          <div className="dialog-actions">
            <Button
              variant="unstyled"
              size="unstyled"
              className="button secondary"
              onClick={closeModal}
            >
              取消
            </Button>
            <Button
              variant="unstyled"
              size="unstyled"
              className="button danger"
              onClick={() => {
                const messages = modal.kind === 'clear' ? [] : createProject().messages;
                edit((p) => ({ ...p, messages }));
                cancelInsertion();
                closeModal();
              }}
            >
              确认{modal.kind === 'clear' ? '清空' : '恢复'}
            </Button>
          </div>
        </Dialog>
      )}
      {modal?.kind === 'help' && (
        <Dialog title="把对话聊出来" onClose={closeModal} className="help-dialog">
          <div className="help-steps">
            <div>
              <MessageCircle />
              <span>
                <strong>一人分饰两角</strong>
                <p>
                  左边是对方，右边是自己。两部手机共享对话，在任一边输入并发送即可。Enter
                  发送，Shift + Enter 换行。
                </p>
              </span>
            </div>
            <div>
              <Plus />
              <span>
                <strong>随时补上一句话</strong>
                <p>
                  点击手机上方的「＋」，再点击两条消息之间的插入点。从任意一边发送，内容就会插到选中位置；一次发送后自动退出插入模式。也可以直接悬停消息间插入。
                </p>
              </span>
            </div>
            <div>
              <Gift />
              <span>
                <strong>领取和收款，自动补齐记录</strong>
                <p>
                  点输入栏「＋」发送图片、语音、通话记录、红包、转账或时间。在接收方点击红包或转账，领取、收款或退还后，两边状态和对应提示自动更新。
                </p>
              </span>
            </div>
            <div>
              <ScanLine />
              <span>
                <strong>截下此刻的手机画面</strong>
                <p>
                  先滚动到想要的位置，再点击对应手机上方的截图按钮。截图包含状态栏，不含外框和编辑工具。可复制或保存为图片。
                </p>
              </span>
            </div>
          </div>
          <div className="dialog-actions">
            <Button
              variant="unstyled"
              size="unstyled"
              className="button primary"
              onClick={closeModal}
            >
              开始编排
            </Button>
            <a className="button secondary" href={`${import.meta.env.BASE_URL}about.html`}>
              功能与使用指南
            </a>
          </div>
        </Dialog>
      )}
    </div>
  );
}
