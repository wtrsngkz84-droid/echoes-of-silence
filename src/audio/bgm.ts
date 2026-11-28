import type { BgmKey } from './track';

interface Channel {
  key: BgmKey;
  audio: HTMLAudioElement;
}

const TRACK_PATH: Record<BgmKey, string> = {
  menu: 'assets/audio/bgm/menu',
  ch1: 'assets/audio/bgm/ch1',
  ch2: 'assets/audio/bgm/ch2',
  ch3: 'assets/audio/bgm/ch3',
};

const MUTE_KEY = 'eos.bgm.muted';
const TARGET_VOLUME = 10 ** (-18 / 20);
const CROSSFADE_MS = 600;
const MUTE_FADE_MS = 220;
const STEP_MS = 25;

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

let audioHost: HTMLDivElement | null = null;

function getAudioHost(): HTMLDivElement {
  if (!audioHost) {
    audioHost = document.createElement('div');
    audioHost.hidden = true;
    document.body.appendChild(audioHost);
  }
  return audioHost;
}

function oggSupported(): boolean {
  if (typeof document === 'undefined') return false;
  return document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"') !== '';
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // 存储不可用时仅保留内存态
  }
}

/** 两轨交叉淡入淡出；首次用户手势后播放，静音状态持久化。 */
export class BgmController {
  private current: Channel | null = null;
  private next: Channel | null = null;
  private timer: number | null = null;
  private muted = readMuted();
  private unlocked = false;
  private pendingKey: BgmKey | null = null;
  private disposed = false;

  get isMuted(): boolean {
    return this.muted;
  }

  unlock(): void {
    if (this.disposed) return;
    this.unlocked = true;
    if (!this.muted) this.resume();
  }

  setTrack(key: BgmKey): void {
    this.pendingKey = key;
    if (this.disposed || !this.unlocked || this.muted) return;
    if (this.current?.key === key) {
      if (this.current.audio.paused) this.fadeInCurrent();
      return;
    }
    if (this.next?.key === key) return;
    this.start(key);
  }

  setMuted(muted: boolean): void {
    if (this.muted === muted) return;
    this.muted = muted;
    writeMuted(muted);

    if (muted) {
      this.clearFade();
      this.fadeOutCurrent();
      return;
    }

    this.unlocked = true;
    this.resume();
  }

  dispose(): void {
    this.disposed = true;
    this.clearFade();
    this.stopChannel(this.current);
    this.stopChannel(this.next);
    this.current = null;
    this.next = null;
  }

  private resume(): void {
    const key = this.pendingKey;
    if (key && (!this.current || this.current.key !== key)) {
      this.start(key);
      return;
    }
    if (this.current?.audio.paused) this.fadeInCurrent();
  }

  private start(key: BgmKey): void {
    this.clearFade();
    const next: Channel = this.createChannel(key);
    this.next = next;

    void next.audio
      .play()
      .then(() => {
        if (this.disposed || this.muted || this.next !== next) return;
        const old = this.current;
        const oldStart = old?.audio.volume ?? 0;
        const startAt = performance.now();

        this.timer = window.setInterval(() => {
          if (this.disposed || this.muted || this.next !== next) {
            this.clearFade();
            return;
          }
          const progress = Math.min(1, (performance.now() - startAt) / CROSSFADE_MS);
          next.audio.volume = TARGET_VOLUME * progress;
          if (old) old.audio.volume = oldStart * (1 - progress);
          if (progress >= 1) {
            if (this.timer !== null) window.clearInterval(this.timer);
            this.timer = null;
            if (old) this.stopChannel(old);
            this.current = next;
            this.next = null;
          }
        }, STEP_MS);
      })
      .catch(() => {
        if (this.next === next) {
          this.stopChannel(next);
          this.next = null;
        }
        this.unlocked = false;
      });
  }

  private fadeInCurrent(): void {
    const channel = this.current;
    if (!channel || this.muted) return;
    this.clearFade();
    channel.audio.volume = 0;
    void channel.audio
      .play()
      .then(() => {
        const startAt = performance.now();
        this.timer = window.setInterval(() => {
          if (this.disposed || this.muted || this.current !== channel) {
            this.clearFade();
            return;
          }
          const progress = Math.min(1, (performance.now() - startAt) / CROSSFADE_MS);
          channel.audio.volume = TARGET_VOLUME * progress;
          if (progress >= 1 && this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
          }
        }, STEP_MS);
      })
      .catch(() => {
        this.unlocked = false;
      });
  }

  private fadeOutCurrent(): void {
    const channel = this.current;
    if (!channel) return;
    const startVolume = channel.audio.volume;
    const startAt = performance.now();
    this.timer = window.setInterval(() => {
      if (this.disposed) {
        this.clearFade();
        return;
      }
      const progress = Math.min(1, (performance.now() - startAt) / MUTE_FADE_MS);
      channel.audio.volume = startVolume * (1 - progress);
      if (progress >= 1) {
        if (this.timer !== null) window.clearInterval(this.timer);
        this.timer = null;
        channel.audio.pause();
      }
    }, STEP_MS);
  }

  private createChannel(key: BgmKey): Channel {
    const audio = new Audio();
    audio.dataset.bgm = key;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    getAudioHost().appendChild(audio);
    const channel: Channel = { key, audio };
    const useOgg = oggSupported();
    audio.src = assetUrl(`${TRACK_PATH[key]}.${useOgg ? 'ogg' : 'mp3'}`);

    if (useOgg) {
      audio.addEventListener(
        'error',
        () => {
          if (this.disposed) return;
          audio.src = assetUrl(`${TRACK_PATH[key]}.mp3`);
          audio.load();
          if (this.current === channel || this.next === channel) {
            void audio.play().catch(() => undefined);
          }
        },
        { once: true },
      );
    }

    return channel;
  }

  private clearFade(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.next) {
      this.stopChannel(this.next);
      this.next = null;
    }
  }

  private stopChannel(channel: Channel | null): void {
    if (!channel) return;
    channel.audio.pause();
    channel.audio.volume = 0;
    try {
      channel.audio.currentTime = 0;
    } catch {
      // 某些浏览器在未加载时访问 currentTime 会抛错
    }
  }
}