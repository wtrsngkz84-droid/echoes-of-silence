import { useState } from 'react';
import type { ReasoningContent } from '../../engine/types';
import {
  createReasoningState,
  pickReasoningCandidate,
} from './reasoningState';

interface ReasoningPanelProps {
  content: ReasoningContent;
  onSolved: () => void;
}

/** 推理指认（GAMEPLAY_DESIGN §4.3）：线索陈列 + 四候选；错误不惩罚、可重试。 */
export function ReasoningPanel({ content, onSolved }: ReasoningPanelProps) {
  const [state, setState] = useState(createReasoningState);

  return (
    <div className="reasoning-panel">
      <div className="reasoning-panel__card">
        <div className="reasoning-panel__kicker">推理指认 · 轻推理，不计分</div>
        <h2 className="reasoning-panel__prompt">{content.prompt}</h2>
        <ul className="reasoning-panel__clues">
          {content.clues.map((clue) => (
            <li key={clue}>{clue}</li>
          ))}
        </ul>
        <div className="reasoning-panel__candidates">
          {content.candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="reasoning-panel__candidate"
              data-candidate-id={candidate.id}
              onClick={(event) => {
                event.stopPropagation();
                const next = pickReasoningCandidate(
                  state,
                  Boolean(candidate.correct),
                  content.wrongFeedback,
                );
                setState(next);
                if (next.solved) onSolved();
              }}
            >
              {candidate.text}
            </button>
          ))}
        </div>
        {state.feedback && <div className="reasoning-panel__feedback">{state.feedback}</div>}
      </div>
    </div>
  );
}