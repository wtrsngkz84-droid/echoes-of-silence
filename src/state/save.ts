import type { ProgressMeta, RunState } from '../engine/types';

/**
 * LocalStorage 存档（B-002）。
 * 双槽位：main = 首通记录，echo = 回声模式重玩（PRD 提案 D：回声不覆盖首通）。
 * meta 为跨局共享的进度图鉴：章节解锁、结局图鉴、线索图鉴。
 * 版本号变更时在 loadXxx 内增加迁移逻辑；解析失败按无存档处理，不抛错。
 */

const SAVE_KEY_MAIN = 'eos.save.main.v1';
const SAVE_KEY_ECHO = 'eos.save.echo.v1';
const META_KEY = 'eos.meta.v1';

const SAVE_VERSION = 1;

export type SaveSlot = 'main' | 'echo';

interface Envelope<T> {
  version: number;
  updatedAt: number;
  data: T;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

let defaultStorage: StorageLike =
  typeof localStorage !== 'undefined' ? localStorage : new MemoryStorage();

/** 测试专用：替换存储后端。生产代码不得调用。 */
export function setStorageBackendForTests(storage: StorageLike): void {
  defaultStorage = storage;
}

function slotKey(slot: SaveSlot): string {
  return slot === 'main' ? SAVE_KEY_MAIN : SAVE_KEY_ECHO;
}

function readEnvelope<T>(key: string): Envelope<T> | null {
  try {
    const raw = defaultStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (parsed.version !== SAVE_VERSION) return null; // 版本不匹配：待未来迁移逻辑
    return parsed;
  } catch {
    return null;
  }
}

function writeEnvelope<T>(key: string, data: T): void {
  try {
    const envelope: Envelope<T> = { version: SAVE_VERSION, updatedAt: Date.now(), data };
    defaultStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // 存储被禁用/超限时静默失败：游戏内存态不受影响
  }
}

export function loadRun(slot: SaveSlot): RunState | null {
  return readEnvelope<RunState>(slotKey(slot))?.data ?? null;
}

export function saveRun(slot: SaveSlot, run: RunState): void {
  writeEnvelope(slotKey(slot), run);
}

export function clearRun(slot: SaveSlot): void {
  defaultStorage.removeItem(slotKey(slot));
}

export function hasRun(slot: SaveSlot): boolean {
  return loadRun(slot) !== null;
}

export function loadMeta(): ProgressMeta {
  return (
    readEnvelope<ProgressMeta>(META_KEY)?.data ?? {
      firstRunCompleted: false,
      unlockedChapters: ['ch1'],
      endingsSeen: [],
      clueLog: [],
    }
  );
}

export function saveMeta(meta: ProgressMeta): void {
  writeEnvelope(META_KEY, meta);
}
