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

/** 场景背景（占位像素风） */
export function SceneBackground({ scene }: { scene?: SceneKey }) {
  const cls = SCENE_CLASS[scene ?? 'classroom'];
  return (
    <div className={`scene ${cls}`}>
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
    </div>
  );
}
