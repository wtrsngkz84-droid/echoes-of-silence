import { useEffect, useState } from 'react';
import type { CallContent } from '../../engine/types';

interface PhoneCallProps {
  call: CallContent;
}

/** 电话演出（C2-003）：来电人 + 通话计时 + 语音字幕。 */
export function PhoneCall({ call }: PhoneCallProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="phone-call" aria-label={`与${call.caller}通话中`}>
      <div className="phone-call__head">
        <div>
          <div className="phone-call__caller">{call.caller}</div>
          <div className="phone-call__status">通话中 · {mm}:{ss}</div>
        </div>
        <span className="phone-call__dot" aria-hidden />
      </div>
      <div className="phone-call__body">
        {call.lines.map((line, index) => (
          <div key={`${line.time ?? 'line'}-${index}`} className="phone-call__line">
            {line.time && <span className="phone-call__time">{line.time}</span>}
            <p>{line.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}