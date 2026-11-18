/** 推理指认纯状态机（GAMEPLAY_DESIGN §4.3）：错误不惩罚、可重试。 */

export interface ReasoningState {
  wrongPicks: number;
  feedback: string | null;
  solved: boolean;
}

export function createReasoningState(): ReasoningState {
  return { wrongPicks: 0, feedback: null, solved: false };
}

export function pickReasoningCandidate(
  state: ReasoningState,
  correct: boolean,
  wrongFeedback: string,
): ReasoningState {
  if (state.solved) return state;
  if (correct) return { ...state, feedback: null, solved: true };
  return {
    ...state,
    wrongPicks: state.wrongPicks + 1,
    feedback: wrongFeedback,
  };
}
