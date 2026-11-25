import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { CharacterDef } from '../../engine/types';

/**
 * 角色立绘：优先使用 public/assets/characters 的正式像素图；
 * 无对应文件或加载失败时回退 12×12 数据驱动网格。
 */

const AVATAR_ROWS = [
  '....HHHH....',
  '..HHHHHHHH..',
  '.HHHHHHHHHH.',
  '.HHSSSSSSHH.',
  '.HSSSSSSSSH.',
  '.HSESSSSESH.',
  '.HSSSSSSSSH.',
  '..SSSSSSSS..',
  '..SSSSSSSS..',
  '...SSSSSS...',
  '..CCCCCCCC..',
  '.CCACCCACCC.',
];

const EYE = '#241f33';

const PORTRAIT_FILE: Record<string, string> = {
  xiaoman: 'xiaoman.png',
  yuAn: 'yuan.png',
  chenyu: 'chenyu.png',
  zhengXiaoyun: 'zhengxiaoyun.png',
  liTeacher: 'liteacher.png',
  mom: 'mom.png',
};

export function PixelAvatar({ character, size = 120 }: { character: CharacterDef; size?: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const file = PORTRAIT_FILE[character.id];
  const src = file ? `${import.meta.env.BASE_URL}assets/characters/${file}` : null;

  if (src && failedSrc !== src) {
    return (
      <img
        className="pixel-art-img"
        src={src}
        alt={character.name}
        draggable={false}
        style={{ height: `${size}px` }}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  const colorOf = (code: string): string | null => {
    switch (code) {
      case 'H':
        return character.palette.hair;
      case 'S':
        return character.palette.skin;
      case 'E':
        return EYE;
      case 'C':
        return character.palette.cloth;
      case 'A':
        return character.palette.accent;
      default:
        return null;
    }
  };

  return (
    <div
      className="pixel-art"
      role="img"
      aria-label={character.name}
      style={
        {
          '--pixel-size': `${size}px`,
        } as CSSProperties
      }
    >
      {AVATAR_ROWS.flatMap((row, y) =>
        row.split('').map((code, x) => {
          const color = colorOf(code);
          return (
            <div
              key={`${x}-${y}`}
              className="pixel-art__cell"
              style={color ? { background: color } : undefined}
            />
          );
        }),
      )}
    </div>
  );
}