import { useEffect, useRef, useState } from 'react';
import { autoFloodActive, visibleChatMessages } from '../../engine/engine';
import {
  DEFAULT_FLOOD_INTERVAL_MS,
  createFloodState,
  floodIntervalMs,
  setFloodSpeed,
  startFlood,
  syncFloodState,
  tickFlood,
  toggleFloodPause,
} from '../../engine/flood';
import { characterName } from '../../story/characters';
import type { RunState, ScreenshotContent, StoryNode } from '../../engine/types';
import { CHARACTERS } from '../../story/characters';
import '../../styles/game.css';

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

interface PhoneChatProps {
  run: RunState;
  node: StoryNode;
  onChatNext: () => void;
  onOpenScreenshot: (content: ScreenshotContent) => void;
}

/** 手机聊天演出：逐条点击播放；autoFlood 段自动上涌（可暂停/2×/回滚）。 */
export function PhoneChat({ run, node, onChatNext, onOpenScreenshot }: PhoneChatProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const messages = visibleChatMessages(run, node);
  const played = messages.slice(0, run.chatPlayed);
  const finished = run.chatPlayed >= messages.length;
  const autoSegment = autoFloodActive(run, node);

  const [flood, setFlood] = useState(() => createFloodState(messages.length, run.chatPlayed));

  useEffect(() => {
    setFlood(createFloodState(messages.length, run.chatPlayed));
    stickToBottomRef.current = true;
  }, [node.id]);

  useEffect(() => {
    setFlood((current) => syncFloodState(current, run.chatPlayed, messages.length));
  }, [run.chatPlayed, messages.length]);

  useEffect(() => {
    if (!autoSegment) return;
    setFlood((current) => (current.status === 'idle' ? startFlood(current) : current));
  }, [autoSegment]);

  useEffect(() => {
    if (!autoSegment || flood.status !== 'playing') return;
    const timer = window.setTimeout(() => {
      setFlood((current) => tickFlood(current));
      onChatNext();
    }, floodIntervalMs(flood, node.floodIntervalMs ?? DEFAULT_FLOOD_INTERVAL_MS));
    return () => window.clearTimeout(timer);
  }, [autoSegment, flood, node.floodIntervalMs, onChatNext]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [run.chatPlayed]);

  const handleScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 12;
  };

  const openScreenshot = (content: ScreenshotContent) => {
    onOpenScreenshot(content);
  };

  const scrollToBottomIfSticky = () => {
    const el = bodyRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  };

  return (
    <div className="phone-chat" aria-label={`聊天窗口：${node.chatTitle ?? ''}`}>
      <div className="phone-chat__head">
        <span className="dot" />
        {node.chatTitle ?? '群聊'}
      </div>
      <div className="phone-chat__body" ref={bodyRef} onScroll={handleScroll}>
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
              {msg.sender && (
                <span
                  className="chat-msg__sender"
                  style={character ? { color: character.themeColor } : undefined}
                >
                  {characterName(msg.sender)}
                </span>
              )}
              {msg.kind === 'screenshot' && msg.screenshot ? (
                <div
                  className="chat-msg__screenshot"
                  role="button"
                  tabIndex={0}
                  aria-label={`${msg.screenshot.caption ?? '聊天截图'}，点击放大查看`}
                  onClick={(event) => {
                    event.stopPropagation();
                    openScreenshot(msg.screenshot!);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    openScreenshot(msg.screenshot!);
                  }}
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
                msg.src ? (
                  <div className="chat-msg__image chat-msg__image--photo">
                    <img
                      className="chat-msg__image-img"
                      src={assetUrl(msg.src)}
                      alt={msg.text}
                      draggable={false}
                      onLoad={scrollToBottomIfSticky}
                    />
                    <span className="chat-msg__image-caption">{msg.text}</span>
                  </div>
                ) : (
                  <div className="chat-msg__image">
                    {msg.imageCaption ?? '【图片】'}
                    <br />
                    {msg.text}
                  </div>
                )
              ) : (
                <div className="chat-msg__bubble">{msg.text}</div>
              )}
              {msg.time && <span className="chat-msg__time">{msg.time}</span>}
            </div>
          );
        })}
      </div>
      <div className="phone-chat__foot">
        {autoSegment ? (
          <div className="flood-controls">
            <span className="flood-progress">
              {flood.status === 'paused' ? '已暂停 · 可回滚' : '自动上涌中'} {run.chatPlayed}/
              {messages.length}
            </span>
            <button
              type="button"
              className="flood-btn"
              onClick={(event) => {
                event.stopPropagation();
                setFlood((current) => toggleFloodPause(current));
              }}
            >
              {flood.status === 'paused' ? '继续' : '暂停'}
            </button>
            <button
              type="button"
              className="flood-btn"
              onClick={(event) => {
                event.stopPropagation();
                setFlood((current) => setFloodSpeed(current, current.speed === 1 ? 2 : 1));
              }}
            >
              {flood.speed}×
            </button>
          </div>
        ) : finished ? (
          '▼ 点击继续'
        ) : (
          <span className="blink">
            ● 新消息 ×{messages.length - run.chatPlayed} · 点击播放
          </span>
        )}
      </div>
    </div>
  );
}
