import { describe, expect, it } from 'vitest';
import { createReasoningState, pickReasoningCandidate } from './reasoningState';

describe('推理指认状态机', () => {
  it('错误候选保留线索并给出反馈，可重试', () => {
    let state = createReasoningState();
    state = pickReasoningCandidate(state, false, '你怀疑错了。线索还在。');
    expect(state.solved).toBe(false);
    expect(state.wrongPicks).toBe(1);
    expect(state.feedback).toBe('你怀疑错了。线索还在。');

    state = pickReasoningCandidate(state, false, '你怀疑错了。线索还在。');
    expect(state.wrongPicks).toBe(2);
  });

  it('正确候选标记 solved，之后不再改变', () => {
    const wrong = pickReasoningCandidate(createReasoningState(), false, '错');
    const solved = pickReasoningCandidate(wrong, true, '错');
    expect(solved.solved).toBe(true);
    expect(solved.feedback).toBeNull();
    expect(pickReasoningCandidate(solved, false, '错')).toBe(solved);
  });
});
