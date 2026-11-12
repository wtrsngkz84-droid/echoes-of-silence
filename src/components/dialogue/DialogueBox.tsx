import type { ReactNode } from 'react';
import { CHARACTERS, characterName } from '../../story/characters';
import '../../styles/game.css';

interface DialogueBoxProps {
  speaker?: string;
  /** 打字机已显示的文本 */
  text: ReactNode;
  /** 是否为内心独白 */
  isInner?: boolean;
  /** 是否显示继续提示 */
  showHint?: boolean;
}

/** 对话框：名牌 + 打字机文本 + 继续提示。点击行为由外层舞台统一处理 */
export function DialogueBox({ speaker, text, isInner, showHint }: DialogueBoxProps) {
  const character = speaker ? CHARACTERS[speaker] : undefined;
  const label = isInner
    ? `${characterName(speaker)} · 内心`
    : characterName(speaker) || '旁白';

  return (
    <div
      className={`dialogue-box ${isInner ? 'dialogue-box--inner' : ''}`}
      role="dialog"
      aria-label={label}
    >
      <span
        className="dialogue-box__nameplate"
        style={{ background: character?.themeColor ?? '#5a5478' }}
      >
        {label}
      </span>
      <p className="dialogue-box__text">{text}</p>
      {showHint && <span className="dialogue-box__hint blink">▼ 点击继续</span>}
    </div>
  );
}
