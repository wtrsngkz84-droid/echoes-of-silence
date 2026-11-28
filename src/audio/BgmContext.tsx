import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useGame } from '../state/GameContext';
import { BgmController } from './bgm';
import { trackForScreen } from './track';

interface BgmState {
  muted: boolean;
  toggleMuted: () => void;
}

const BgmContext = createContext<BgmState | null>(null);

export function BgmProvider({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const [controller] = useState(() => new BgmController());
  const [muted, setMuted] = useState(() => controller.isMuted);
  const track = trackForScreen(state.screen, state.run);

  useEffect(() => {
    controller.setTrack(track);
  }, [controller, track]);

  useEffect(() => {
    const unlock = () => controller.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [controller]);

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    controller.setMuted(next);
  };

  return (
    <BgmContext.Provider value={{ muted, toggleMuted }}>{children}</BgmContext.Provider>
  );
}

export function useBgm(): BgmState {
  const context = useContext(BgmContext);
  if (!context) throw new Error('useBgm 必须在 BgmProvider 内使用');
  return context;
}