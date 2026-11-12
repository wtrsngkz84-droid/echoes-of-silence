import type { StoryOption } from '../../engine/types';
import '../../styles/game.css';

interface ChoiceListProps {
  options: StoryOption[];
  onSelect: (optionId: string) => void;
}

/** 选项列表（纯展示）：键盘数字 1-9 快捷选择由 GameScreen 处理 */
export function ChoiceList({ options, onSelect }: ChoiceListProps) {
  return (
    <div className="choice-list" role="group" aria-label="选择">
      {options.map((option, index) => (
        <button
          key={option.id}
          className="choice-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(option.id);
          }}
        >
          <span className="choice-btn__key">{index + 1}</span>
          {option.text}
          {option.hint && <span className="choice-btn__hint">{option.hint}</span>}
        </button>
      ))}
    </div>
  );
}
