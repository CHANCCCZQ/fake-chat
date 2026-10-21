import { useState } from 'react';
import type { FormEvent } from 'react';
import Dialog from './Dialog';
import DateTimePicker from './DateTimePicker';
import ChoiceSelect from './ChoiceSelect';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Switch } from './components/ui/switch';
import { dateTimeValue, editedTime } from './chat-time';
import { formatCallDuration, parseCallDuration } from './media-message';
import type { CallStatus } from './media-message';
import { uid } from './model';
import type { Message, PersonId } from './model';

export interface MediaAction {
  kind: 'media';
  sender: PersonId;
  type: 'voice' | 'call';
  id?: string;
}
export default function MediaForm({
  action,
  current,
  sendAt,
  onSave,
  onClose,
}: {
  action: MediaAction;
  current?: Message;
  sendAt: number;
  onSave: (message: Message) => void;
  onClose: () => void;
}) {
  const voice = action.type === 'voice';
  const [duration, setDuration] = useState(
    voice
      ? String(current?.durationSeconds ?? 4)
      : formatCallDuration(current?.durationSeconds ?? 59),
  );
  const [text, setText] = useState(current?.text ?? '');
  const [unread, setUnread] = useState(current?.voiceUnread ?? true);
  const [status, setStatus] = useState<CallStatus>(current?.callStatus ?? 'completed');
  const [baseTime] = useState(current?.sentAt ?? sendAt);
  const [time, setTime] = useState(dateTimeValue(baseTime));
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const seconds = voice
      ? /^\d{1,2}$/.test(duration)
        ? Number(duration)
        : null
      : status === 'completed'
        ? parseCallDuration(duration)
        : 0;
    if (seconds === null || (voice && (seconds < 1 || seconds > 60))) {
      setError(voice ? '语音时长请输入 1–60 秒的整数' : '通话时长请按 分:秒 填写，例如 00:59');
      return;
    }
    const sentAt = editedTime(time, baseTime);
    if (sentAt === null) {
      setError('请选择有效的发送日期与时间');
      return;
    }
    onSave({
      id: current?.id ?? uid(),
      sender: action.sender,
      type: action.type,
      text: voice ? text.trim() : '',
      sentAt,
      durationSeconds: seconds,
      ...(voice ? { voiceUnread: unread } : { callStatus: status }),
    });
  };
  return (
    <Dialog
      title={`${current ? '编辑' : '添加'}${voice ? '语音消息' : '语音通话'}`}
      onClose={onClose}
    >
      <form className="dialog-form" onSubmit={submit}>
        {!voice && (
          <label className="form-field">
            通话状态
            <ChoiceSelect<CallStatus>
              label="通话状态"
              value={status}
              onValueChange={setStatus}
              options={[
                { value: 'completed', label: '已接通（显示通话时长）' },
                { value: 'cancelled', label: '已取消' },
                { value: 'unanswered', label: '未接听' },
                { value: 'rejected', label: '已拒绝' },
              ]}
            />
          </label>
        )}
        {(voice || status === 'completed') && (
          <label className="form-field">
            {voice ? '语音时长（秒）' : '通话时长（分:秒）'}
            <Input
              aria-label={voice ? '语音时长' : '通话时长'}
              inputMode={voice ? 'numeric' : 'text'}
              value={duration}
              onChange={(event) => {
                setDuration(event.target.value);
                setError('');
              }}
              placeholder={voice ? '1–60' : '00:59'}
              autoFocus
              maxLength={voice ? 2 : 6}
            />
          </label>
        )}
        {voice && (
          <>
            <label className="form-field">
              转文字内容（可选）
              <textarea
                aria-label="语音转文字内容"
                rows={3}
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1000}
                placeholder="填写后会显示在语音气泡下方"
              />
            </label>
            <label className="toggle-row">
              <span>接收方显示未读红点</span>
              <Switch
                className="studio-switch"
                aria-label="接收方显示未读红点"
                checked={unread}
                onCheckedChange={setUnread}
              />
            </label>
          </>
        )}
        <label className="form-field">
          发送日期与时间
          <DateTimePicker label="语音发送日期与时间" value={time} onValueChange={setTime} />
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <p className="form-note">
          {voice
            ? '按填写的时长生成语音样式；接收方点击气泡可标记为已听。'
            : '生成聊天中的通话记录，双方会显示对应视角的状态。'}
        </p>
        <div className="dialog-actions">
          <Button
            type="button"
            variant="unstyled"
            size="unstyled"
            className="button secondary"
            onClick={onClose}
          >
            取消
          </Button>
          <Button type="submit" variant="unstyled" size="unstyled" className="button primary">
            {current ? '保存修改' : voice ? '添加语音消息' : '添加通话记录'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
