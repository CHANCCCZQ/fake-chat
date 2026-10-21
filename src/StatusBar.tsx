import { assetPath } from './lib/assets';
import { useId } from 'react';
import type { Device } from './model';

function Signal({ level }: { level: number }) {
  return (
    <span className="android-signal" role="img" aria-label={`信号 ${level} 格`}>
      {[9, 15, 22, 29].map((height, index) => (
        <i
          key={height}
          style={{
            left: `${((index * 8) / 30) * 100}%`,
            height: `${(height / 30) * 100}%`,
            opacity: index < level ? 1 : 0.2,
          }}
        />
      ))}
    </span>
  );
}
function AndroidWifi() {
  return (
    <span className="android-wifi" aria-label="Wi-Fi 6＋">
      <svg viewBox="0 0 38 32" color="#3d3f3f" aria-hidden="true">
        <path
          d="M1 9.4c8-7.2 20-7.2 28 0l-3.5 3.4c-6-5.1-15-5.1-21 0zM5.9 15.5c5.2-4.6 13-4.6 18.2 0l-3.5 3.4c-3.2-2.5-8-2.5-11.2 0zM10.8 21.6a6.5 6.5 0 0 1 8.4 0L15 26z"
          fill="currentColor"
        />
        <path
          d="M32 2v9M27.5 6.5h9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="square"
        />
      </svg>
      <small>6</small>
    </span>
  );
}
function AndroidMute() {
  return (
    <svg className="android-mute" viewBox="0 0 34 32" color="#3d3f3f" aria-label="静音">
      <path
        d="M6 8l-3 3 3 3-3 3 3 3M30 9l3 3-3 3 3 3-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="miter"
      />
      <path d="M12 10c0-5 3-8 7-8s7 3 7 8v9l3 4H9l3-4z" fill="currentColor" />
      <path d="M15 27h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 2l23 27" stroke="#ededed" strokeWidth="6" />
      <path d="M7 2l23 27" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square" />
    </svg>
  );
}
function IosSignal({ device }: { device: Device }) {
  const source = device.dual
    ? assetPath('wechat/ios-dual-signal.png')
    : assetPath('wechat/ios-signal.png');
  return (
    <span
      className={`ios-native-signal ${device.dual ? 'dual' : 'single'}`}
      aria-label={
        device.dual
          ? `双卡信号 ${device.signal} 格、${device.secondarySignal} 格`
          : `信号 ${device.signal} 格`
      }
    >
      <img className="signal-base" src={source} alt="" />
      <span className="signal-primary" style={{ width: `${device.signal * 25}%` }}>
        <img src={source} alt="" />
      </span>
      {device.dual && (
        <span className="signal-secondary" style={{ width: `${device.secondarySignal * 25}%` }}>
          <img src={source} alt="" />
        </span>
      )}
    </span>
  );
}
function Battery({ device }: { device: Device }) {
  const { battery, charging, os } = device;
  const low = battery <= 20;
  const clipId = useId().replace(/:/g, '');
  if (os === 'ios')
    return (
      <span
        className={`ios-native-battery ${charging ? 'charging' : ''} ${low ? 'low' : ''}`}
        aria-label={`电量 ${battery}%${charging ? '，充电中' : ''}`}
      >
        <span>
          <i style={{ width: `${battery}%` }} />
        </span>
        {charging && (
          <svg viewBox="0 0 10 14">
            <path d="M6 0L1 8h4l-1 6 6-8H6z" fill="currentColor" />
          </svg>
        )}
      </span>
    );
  return (
    <span
      className={`android-battery ${charging ? 'charging' : ''} ${low ? 'low' : ''}`}
      aria-label={`电量 ${battery}%${charging ? '，充电中' : ''}`}
    >
      <svg viewBox="0 0 48 32" color="#3d3f3f" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="3" width="42" height="26" rx="7" />
          </clipPath>
        </defs>
        <rect x="0" y="3" width="42" height="26" rx="7" fill="#b4b6b5" />
        <rect
          x="0"
          y="3"
          width={(42 * battery) / 100}
          height="26"
          clipPath={`url(#${clipId})`}
          fill={charging ? '#39a75e' : low ? '#d74338' : 'currentColor'}
        />
        <path d="M43 11h1.5a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H43z" fill="#999c9b" />
      </svg>
      <b>
        {charging ? (
          <svg viewBox="0 0 10 14" aria-hidden="true">
            <path d="M6 0L1 8h4l-1 6 6-8H6z" fill="currentColor" />
          </svg>
        ) : (
          battery
        )}
      </b>
    </span>
  );
}
export default function StatusBar({ device }: { device: Device }) {
  const ios = device.os === 'ios';
  return (
    <div className={`status-bar ${device.os} ${ios && device.island ? 'with-island' : ''}`}>
      <div className="status-clock">
        <span>{device.time}</span>
        {!ios && (
          <svg className="notification-symbol" viewBox="0 0 22 24" aria-hidden="true">
            <path d="M11 1l10 7-10 7L1 8zM1 11l10 7 10-7v4l-10 8L1 15z" fill="currentColor" />
          </svg>
        )}
      </div>
      {ios && device.island && <div className="dynamic-island" />}
      <div className="status-icons">
        {!ios && device.mute && <AndroidMute />}
        {ios ? (
          <>
            <IosSignal device={device} />
            {device.wifi ? (
              <span className="ios-native-wifi" aria-label="Wi-Fi">
                <img src={assetPath('wechat/ios-wifi.png')} alt="" />
              </span>
            ) : (
              <span className="ios-network">{device.network}</span>
            )}
          </>
        ) : (
          <>
            <span className="android-network">
              <small>{device.network}</small>
              <Signal level={device.signal} />
            </span>
            {device.dual && (
              <span className="android-network">
                <small>{device.network}</small>
                <Signal level={device.secondarySignal} />
              </span>
            )}
            {device.wifi && <AndroidWifi />}
          </>
        )}
        <Battery device={device} />
      </div>
    </div>
  );
}
