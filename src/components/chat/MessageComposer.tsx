import { useState } from 'react';
import '../../styles/game.css';

interface MessageComposerProps {
  sceneNote?: string;
  candidates: string[];
  onSend: (text: string) => void;
  onDelete: (text: string) => void;
}

/**
 * 输入框演出（GD §3.4）：预置候选句 + 发送/删除双按钮。
 * 删除的文本交由调用方写入 deleted_messages 存档。
 */
export function MessageComposer({ sceneNote, candidates, onSend, onDelete }: MessageComposerProps) {
  const [draft, setDraft] = useState('');

  return (
    <div className="message-composer">
      {sceneNote && <div className="message-composer__scene">{sceneNote}</div>}
      <div className="message-composer__candidates">
        {candidates.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className="message-composer__candidate"
            onClick={(event) => {
              event.stopPropagation();
              setDraft(candidate);
            }}
          >
            {candidate}
          </button>
        ))}
      </div>
      <textarea
        className="message-composer__input"
        value={draft}
        rows={3}
        placeholder="打一句话……"
        onChange={(event) => setDraft(event.target.value)}
        onClick={(event) => event.stopPropagation()}
      />
      <div className="message-composer__actions">
        <button
          type="button"
          className="message-composer__delete"
          disabled={!draft.trim()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(draft);
            setDraft('');
          }}
        >
          删除
        </button>
        <button
          type="button"
          className="message-composer__send"
          disabled={!draft.trim()}
          onClick={(event) => {
            event.stopPropagation();
            onSend(draft);
            setDraft('');
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}