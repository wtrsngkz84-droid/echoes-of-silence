import { useState } from 'react';
import type { ChecklistContent } from '../../engine/types';

interface DutyChecklistProps {
  content: ChecklistContent;
  onSubmit: (selectedIds: string[]) => void;
}

/** 担责清单（C2-008）：全选 duty=2，任一放弃 duty=1。 */
export function DutyChecklist({ content, onSubmit }: DutyChecklistProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="duty-checklist">
      <div className="duty-checklist__card">
        <div className="duty-checklist__kicker">担责清单 · 六项</div>
        {content.clock && <div className="duty-checklist__clock">{content.clock}</div>}
        <p className="duty-checklist__prompt">{content.prompt}</p>
        <div className="duty-checklist__items">
          {content.items.map((item) => {
            const checked = selected.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`duty-checklist__item ${checked ? 'duty-checklist__item--checked' : ''}`}
                data-checklist-id={item.id}
                aria-pressed={checked}
                onClick={(event) => {
                  event.stopPropagation();
                  toggle(item.id);
                }}
              >
                <span className="duty-checklist__box" aria-hidden>
                  {checked ? '✓' : ''}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="duty-checklist__actions">
          <button
            type="button"
            className="duty-checklist__submit"
            disabled={selected.size === 0}
            onClick={(event) => {
              event.stopPropagation();
              onSubmit([...selected]);
            }}
          >
            {selected.size === content.items.length ? '完成全部六项' : '完成当前清单'}
          </button>
        </div>
      </div>
    </div>
  );
}