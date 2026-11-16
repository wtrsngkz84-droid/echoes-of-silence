import { useEffect, useRef, useState } from 'react';
import type { ScreenshotContent } from '../../engine/types';
import { createViewerState, openViewer, toggleViewerMode } from './screenshotViewerState';

interface ScreenshotViewerProps {
  content: ScreenshotContent;
  onClose: () => void;
}

/** 截图查看器：放大滚动；裁剪图可切换完整记录，被裁条目带撕裂断口标记。 */
export function ScreenshotViewer({ content, onClose }: ScreenshotViewerProps) {
  const [view, setView] = useState(() =>
    openViewer(createViewerState(Boolean(content.fullContext?.length))),
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const hasFullContext = Boolean(content.fullContext?.length);
  const rows = view.mode === 'full' && content.fullContext ? content.fullContext : content.rows;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [view.mode]);

  return (
    <div
      className="shot-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="聊天截图查看器"
      onClick={onClose}
    >
      <div className="shot-viewer__panel" onClick={(event) => event.stopPropagation()}>
        <header className="shot-viewer__head">
          <div>
            <div className="shot-viewer__title">{content.caption ?? '聊天截图'}</div>
            <div className="shot-viewer__sub">
              {content.header}
              {content.statusTime ? ` · ${content.statusTime}` : ''}
              {' · '}
              {view.mode === 'full' ? '完整记录' : '裁剪图'}
            </div>
          </div>
          <button
            type="button"
            className="shot-viewer__close"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            aria-label="关闭截图查看器"
          >
            ×
          </button>
        </header>

        <div className="shot-viewer__body" ref={bodyRef}>
          {rows.map((row, index) => {
            const key = `${row.time ?? 'no-time'}-${index}-${row.text.slice(0, 8)}`;
            return (
              <div key={key}>
                {row.cropped && (
                  <div className="shot-tear" role="note">
                    <span className="shot-tear__edge" aria-hidden />
                    <span className="shot-tear__label">这张图被裁掉的部分</span>
                  </div>
                )}
                <div
                  className={[
                    'shot-viewer__row',
                    `shot-viewer__row--${row.side}`,
                    row.cropped ? 'shot-viewer__row--cropped' : '',
                  ].join(' ').trim()}
                >
                  <div className="shot-viewer__bubble">{row.text}</div>
                  {row.time && <span className="shot-viewer__time">{row.time}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="shot-viewer__foot">
          <span className="shot-viewer__hint">Esc / 点击遮罩关闭</span>
          {hasFullContext && (
            <button
              type="button"
              className="shot-viewer__toggle"
              onClick={(event) => {
                event.stopPropagation();
                setView((current) => toggleViewerMode(current));
              }}
            >
              {view.mode === 'cropped' ? '查看完整上下文' : '返回裁剪图'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
