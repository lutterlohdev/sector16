export const getRarityColor = (value: number): string => {
  if (value >= 1024) return 'text-orange-500';
  if (value >= 512) return 'text-purple-500';
  if (value >= 256) return 'text-blue-500';
  if (value >= 128) return 'text-green-500';
  return 'text-gray-400';
};

export const getRarityName = (value: number): string => {
  if (value >= 1024) return 'LEGENDARY';
  if (value >= 512) return 'EPIC';
  if (value >= 256) return 'RARE';
  if (value >= 128) return 'UNCOMMON';
  return 'COMMON';
};
