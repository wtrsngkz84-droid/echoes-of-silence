import type { ProgressMeta, RunState } from '../engine/types';

/**
 * LocalStorage 存档（B-002 / P-014）。
 * 单存档槽 + 跨局 meta 图鉴：章节解锁、结局图鉴、线索图鉴。
 * v2：随 P-014 结局矩阵与 v_* 变量对齐，废弃 M0 的双槽位（main/echo）；
 * 旧 v1 档没有真实用户，不做迁移，版本不匹配按无存档处理。
 * 解析失败按无存档处理，不抛错。
 */

const SAVE_KEY = 'eos.save.v2';
const META_KEY = 'eos.meta.v2';
const THREE_MIN_KEY = 'eos_3min_v1';

const SAVE_VERSION = 2;
const THREE_MIN_VERSION = 1;

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

function readEnvelope<T>(key: string, version = SAVE_VERSION): Envelope<T> | null {
  try {
    const raw = defaultStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (parsed.version !== version) return null; // 版本不匹配：按无存档处理
    return parsed;
  } catch {
    return null;
  }
}

function writeEnvelope<T>(key: string, data: T, version = SAVE_VERSION): void {
  try {
    const envelope: Envelope<T> = { version, updatedAt: Date.now(), data };
    defaultStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // 存储被禁用/超限时静默失败：游戏内存态不受影响
  }
}

export function loadRun(): RunState | null {
  return readEnvelope<RunState>(SAVE_KEY)?.data ?? null;
}

export function saveRun(run: RunState): void {
  writeEnvelope(SAVE_KEY, run);
}

export function clearRun(): void {
  defaultStorage.removeItem(SAVE_KEY);
}

export function hasRun(): boolean {
  return loadRun() !== null;
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

/** FR-13 三分钟路径独立存档（3min_ 命名空间，不污染完整版）。 */
export function loadThreeMinRun(): RunState | null {
  return readEnvelope<RunState>(THREE_MIN_KEY, THREE_MIN_VERSION)?.data ?? null;
}

export function saveThreeMinRun(run: RunState): void {
  writeEnvelope(THREE_MIN_KEY, run, THREE_MIN_VERSION);
}

export function clearThreeMinRun(): void {
  defaultStorage.removeItem(THREE_MIN_KEY);
}

export function hasThreeMinRun(): boolean {
  return loadThreeMinRun() !== null;
}
