import type { ButtonHTMLAttributes } from 'react';
import '../../styles/pixel.css';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'accent' | 'ghost';
}

export function PixelButton({ variant = 'default', className = '', ...rest }: PixelButtonProps) {
  const variantClass = variant === 'default' ? '' : `pixel-btn--${variant}`;
  return <button className={`pixel-btn ${variantClass} ${className}`.trim()} {...rest} />;
}
