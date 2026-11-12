import { useEffect, useRef } from 'react';
import { visibleChatMessages } from '../../engine/engine';
import { characterName } from '../../story/characters';
import type { RunState, StoryNode } from '../../engine/types';
import { CHARACTERS } from '../../story/characters';
import '../../styles/game.css';

interface PhoneChatProps {
  run: RunState;
  node: StoryNode;
}

/** 手机聊天演出：逐条点击播放；全部播完后由外层接管推进/选项 */
export function PhoneChat({ run, node }: PhoneChatProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const messages = visibleChatMessages(run, node);
  const played = messages.slice(0, run.chatPlayed);
  const finished = run.chatPlayed >= messages.length;

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [run.chatPlayed]);

  return (
    <div className="phone-chat" aria-label={`聊天窗口：${node.chatTitle ?? ''}`}>
      <div className="phone-chat__head">
        <span className="dot" />
        {node.chatTitle ?? '群聊'}
      </div>
      <div className="phone-chat__body" ref={bodyRef}>
        {played.map((msg) => {
          if (msg.side === 'system') {
            return (
              <div key={msg.id} className="chat-msg chat-msg--system">
                <div className="chat-msg__bubble">
                  {msg.time && <span>{msg.time} </span>}
                  {msg.text}
                </div>
              </div>
            );
          }
          const character = msg.sender ? CHARACTERS[msg.sender] : undefined;
          return (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.side}`}>
              <span
                className="chat-msg__sender"
                style={character ? { color: character.themeColor } : undefined}
              >
                {characterName(msg.sender)}
              </span>
              {msg.kind === 'screenshot' && msg.screenshot ? (
                <div
                  className="chat-msg__screenshot"
                  aria-label={msg.screenshot.caption ?? '聊天截图'}
                >
                  {msg.screenshot.caption && (
                    <div className="shot-caption">{msg.screenshot.caption}</div>
                  )}
                  <div className="shot-frame">
                    {msg.screenshot.statusTime && (
                      <div className="shot-status">
                        <span>{msg.screenshot.statusTime}</span>
                        <span aria-hidden>▮▮▮</span>
                      </div>
                    )}
                    <div className="shot-frame__header">{msg.screenshot.header}</div>
                    <div className="shot-frame__body">
                      {msg.screenshot.rows.map((row, idx) => (
                        <div key={`${msg.id}-row-${idx}`} className={`shot-row shot-row--${row.side}`}>
                          <div className="shot-row__bubble">{row.text}</div>
                          {row.time && <span className="shot-row__time">{row.time}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : msg.kind === 'image' ? (
                <div className="chat-msg__image">
                  {msg.imageCaption ?? '【图片】'}
                  <br />
                  {msg.text}
                </div>
              ) : (
                <div className="chat-msg__bubble">{msg.text}</div>
              )}
              {msg.time && <span className="chat-msg__time">{msg.time}</span>}
            </div>
          );
        })}
      </div>
      <div className="phone-chat__foot">
        {finished ? '▼ 点击继续' : <span className="blink">点击播放下一条…</span>}
      </div>
    </div>
  );
}
