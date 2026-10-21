import type { Message, PersonId } from './model';
import { callLabel } from './media-message';

function VoiceWave({ own }: { own: boolean }) {
  return (
    <svg className="voice-wave" viewBox="0 0 28 32" aria-hidden="true">
      <g transform={own ? 'rotate(180 14 16)' : undefined}>
        <path d="M4 14l5-5v14l-5-5z" fill="currentColor" />
        <path
          d="M13 9Q20 16 13 23M18 4Q29 16 18 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
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
      viewBox="0 0 36 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 14c.8-5.4 6.3-8.5 15-8.5S32.2 8.6 33 14v3c0 1.2-1 2-2.2 1.8l-6.3-1.4a2 2 0 0 1-1.5-2v-3a23 23 0 0 0-10 0v3a2 2 0 0 1-1.5 2l-6.3 1.4C4 19 3 18.2 3 17z" />
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
