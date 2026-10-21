import type { Message, PersonId } from './model';
import { callLabel } from './media-message';

function VoiceWave({ own }: { own: boolean }) {
  return (
    <svg className="voice-wave" viewBox="0 0 28 36" aria-hidden="true">
      <g transform={own ? 'translate(28 0) scale(-1 1)' : undefined}>
        <path d="M3 18 9 12.5a9 9 0 0 1 0 11Z" fill="currentColor" />
        <path
          d="M12.5 10a12.5 12.5 0 0 1 0 16M18 4a21 21 0 0 1 0 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
function CallReceiver() {
  return (
    <svg
      className="call-receiver"
      viewBox="0 0 40 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.2 17c-1.2.3-1.9-.5-1.7-1.8l.7-4C3.5 5.5 10.6 2.6 20 2.6s16.5 2.9 17.8 8.6l.7 4c.2 1.3-.5 2.1-1.7 1.8l-6.5-2.5c-1.1-.4-1.7-1-1.8-2.1l-.3-3.1a27 27 0 0 0-16.4 0l-.3 3.1c-.1 1.1-.7 1.7-1.8 2.1Z" />
    </svg>
  );
}
export default function MediaBubble({ message, viewer }: { message: Message; viewer: PersonId }) {
  const own = message.sender === viewer;
  if (message.type === 'call')
    return (
      <span className="text-bubble call-bubble">
        <CallReceiver />
        <span>{callLabel(message, viewer)}</span>
      </span>
    );
  return (
    <span className="voice-message">
      <span
        className="text-bubble voice-bubble"
        style={{
          width: `calc(${Math.min(700, 300 + (message.durationSeconds ?? 4) * 7)} * var(--wechat-unit))`,
        }}
      >
        <VoiceWave own={own} />
        <span>{message.durationSeconds ?? 4}″</span>
        {!own && message.voiceUnread && <i className="voice-unread" aria-hidden="true" />}
      </span>
      {message.text && <span className="text-bubble voice-transcript">{message.text}</span>}
    </span>
  );
}
