import { useEffect, useState } from 'react';
import type { TypingEffect } from '../../engine/types';

type TypingPhase = 'typing' | 'holding' | 'deleting' | 'final';

interface TypingDeleteProps {
  effect: TypingEffect;
  onDone?: () => void;
}

/**
 * 「打字又删掉」演出（GAMEPLAY_DESIGN §2.3）：
 * 逐字浮现 → 停顿 → 逐字消隐 → 定格最终文案（或空白）。
 */
export function TypingDelete({ effect, onDone }: TypingDeleteProps) {
  const {
    label = '输入框',
    draft,
    final,
    typeMs = 45,
    deleteMs = 28,
    holdMs = 700,
  } = effect;
  const [phase, setPhase] = useState<TypingPhase>('typing');
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setPhase('typing');
    setCount(0);
    setDone(false);
  }, [draft, final]);

  useEffect(() => {
    if (phase === 'typing') {
      if (count < draft.length) {
        const timer = window.setTimeout(() => setCount((current) => current + 1), typeMs);
        return () => window.clearTimeout(timer);
      }
      const timer = window.setTimeout(() => setPhase('holding'), holdMs);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'holding') {
      setPhase('deleting');
      return;
    }

    if (phase === 'deleting') {
      if (count > 0) {
        const timer = window.setTimeout(() => setCount((current) => current - 1), deleteMs);
        return () => window.clearTimeout(timer);
      }
      setPhase('final');
      return;
    }

    if (!done) {
      setDone(true);
      onDone?.();
    }
  }, [phase, count, draft.length, typeMs, deleteMs, holdMs, done, onDone]);

  const shown = phase === 'final' ? final : draft.slice(0, count);

  return (
    <div className="typing-delete" data-phase={phase} aria-label="输入框演出">
      <div className="typing-delete__label">{label}</div>
      <div className="typing-delete__field" aria-live="polite">
        <span>{shown}</span>
        <span className="typing-delete__caret" aria-hidden />
      </div>
      <div className="typing-delete__hint">
        {phase === 'final' ? '▼ 点击继续' : '正在输入…'}
      </div>
    </div>
  );
}
