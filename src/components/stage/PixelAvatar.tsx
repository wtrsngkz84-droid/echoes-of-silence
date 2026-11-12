import type { CSSProperties } from 'react';
import type { CharacterDef } from '../../engine/types';

/**
 * 占位像素立绘：12×12 数据驱动网格。
 * 正式像素资源（ASSET_LIST）到位后，本组件替换为 <img> 即可，调用方接口不变。
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

export function PixelAvatar({ character, size = 120 }: { character: CharacterDef; size?: number }) {
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
