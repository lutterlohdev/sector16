import { useState } from 'react';
import { getItemIconPath } from '../utils/loot';

interface ItemIconProps {
  name: string;
  className?: string;
}

export default function ItemIcon({ name, className = "" }: ItemIconProps) {
  const [error, setError] = useState(false);

  if (error) {
    // Return a translucent fallback box or just hide it
    return null;
  }

  return (
    <img 
      src={getItemIconPath(name)} 
      alt={name} 
      className={`pixelated object-contain ${className}`}
      onError={() => setError(true)}
    />
  );
}
