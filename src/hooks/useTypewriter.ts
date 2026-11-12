import { useEffect, useRef, useState } from 'react';

/** 打字机效果：逐字显示；skip 立即完成。text 变化时自动重置。 */
export function useTypewriter(text: string, speedMs = 28) {
  const [count, setCount] = useState(0);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    setCount(0);
    if (!text) return;
    let shown = 0;
    const timer = window.setInterval(() => {
      shown += 1;
      setCount(shown);
      if (shown >= text.length) window.clearInterval(timer);
    }, speedMs);
    return () => window.clearInterval(timer);
  }, [text, speedMs]);

  const done = count >= text.length;

  return {
    shownText: text.slice(0, count),
    done,
    skip: () => setCount(text.length),
  };
}
