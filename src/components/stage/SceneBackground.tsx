import { useState } from 'react';
import type { SceneKey } from '../../engine/types';
import '../../styles/scene.css';

const SCENE_CLASS: Record<SceneKey, string> = {
  'home-night': 'scene--home-night',
  classroom: 'scene--classroom',
  'classroom-afternoon': 'scene--classroom',
  'classroom-cold': 'scene--classroom',
  hallway: 'scene--hallway',
  canteen: 'scene--hallway',
};

const SCENE_FILE: Partial<Record<SceneKey, string>> = {
  classroom: 'classroom-warm.png',
  'classroom-cold': 'classroom-cold.png',
  'classroom-afternoon': 'classroom-afternoon.png',
  hallway: 'hallway.png',
  'home-night': 'home-night.png',
};

/** 场景背景：优先正式像素图；缺图或加载失败时回退 CSS 装饰。 */
export function SceneBackground({ scene }: { scene?: SceneKey }) {
  const key = scene ?? 'classroom';
  const cls = SCENE_CLASS[key];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const file = SCENE_FILE[key];
  const src = file ? `${import.meta.env.BASE_URL}assets/scenes/${file}` : null;
  const showFallback = !src || failedSrc === src;

  return (
    <div className={`scene ${cls}`}>
      {src && !showFallback && (
        <img
          className="scene__img"
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={() => setFailedSrc(src)}
        />
      )}
      {showFallback && (
        <>
          {cls === 'scene--classroom' && (
            <>
              <div className="deco--window deco--window--a" />
              <div className="deco--window deco--window--b" />
              <div className="deco--board" />
              <div className="deco--desk deco--desk--1" />
              <div className="deco--desk deco--desk--2" />
              <div className="deco--desk deco--desk--3" />
              <div className="deco--desk deco--desk--4" />
            </>
          )}
          {cls === 'scene--hallway' && (
            <>
              <div className="deco--door deco--door--a" />
              <div className="deco--door deco--door--b" />
              <div className="deco--door deco--door--c" />
              <div className="deco--banner" />
            </>
          )}
          {cls === 'scene--home-night' && (
            <>
              <div className="deco--window" />
              <div className="deco--lamp" />
              <div className="deco--desk" />
            </>
          )}
          <div className="scene__floor" />
        </>
      )}
    </div>
  );
}