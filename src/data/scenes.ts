export type SceneId =
  | 'yty'
  | 'market'
  | 'hue-ring'
  | 'sea'
  | 'ubnd'
  | 'old-gate'
  | 'wedding';

export type MemoryItem =
  | 'leaf'
  | 'market-flower'
  | 'ring'
  | 'wave'
  | 'certificate'
  | 'red-flower'
  | 'wedding-bell';

export type Scene = {
  id: SceneId;
  title: string;
  text: string;
  item: MemoryItem;
  assetPath?: string;
  photoPath?: string;
  checkpointRatio: number;
  className: string;
};

export const scenes: Scene[] = [
  {
    id: 'yty',
    title: 'Y Tý',
    text: 'Tròn một năm từ lần đầu gặp nhau. Hồi ấy còn "chị chị em em", vậy mà giờ lại nắm tay nhau đi tiếp.',
    item: 'leaf',
    assetPath: '/ref/scene-yty-nes.png',
    photoPath: '/ref/photo_2026-06-13_20-56-53.jpg',
    checkpointRatio: 0.58,
    className: 'scene-yty',
  },
  {
    id: 'market',
    title: 'Chợ',
    text: 'Tình yêu không chỉ nằm ở những nơi thật đẹp. Nó còn ở những con phố quen, ở lúc hai đứa cùng đi qua một ngày rất bình thường.',
    item: 'market-flower',
    assetPath: '/ref/scene-market-nes.png',
    photoPath: '/ref/real-market.jpeg',
    checkpointRatio: 0.58,
    className: 'scene-market',
  },
  {
    id: 'hue-ring',
    title: 'Huế',
    text: '22.02.25 - She accepted the deal. Từ hôm đó, chiếc nhẫn nhỏ mở khóa một hành trình rất lớn.',
    item: 'ring',
    assetPath: '/ref/scene-hue-ring-nes.png',
    photoPath: '/ref/real-hue-ring.jpeg',
    checkpointRatio: 0.74,
    className: 'scene-hue',
  },
  {
    id: 'sea',
    title: 'Biển',
    text: 'Biển và em. Một bên là trời xanh rất rộng, một bên là người mình thương rất gần.',
    item: 'wave',
    assetPath: '/ref/scene-sea-nes.png',
    photoPath: '/ref/real-sea.jpeg',
    checkpointRatio: 0.58,
    className: 'scene-sea',
  },
  {
    id: 'ubnd',
    title: 'UBND',
    text: 'Bút sa gà chết.',
    item: 'certificate',
    assetPath: '/ref/scene-ubnd-nes.png',
    photoPath: '/ref/real-ubnd.jpeg',
    checkpointRatio: 0.56,
    className: 'scene-ubnd',
  },
  {
    id: 'old-gate',
    title: 'Cổng xưa',
    text: 'Từ những chuyến đi, tụi mình trở về trong sắc đỏ, để chuẩn bị bước vào ngày quan trọng nhất.',
    item: 'red-flower',
    assetPath: '/ref/scene-old-gate-nes.png',
    photoPath: '/ref/real-old-gate.jpeg',
    checkpointRatio: 0.6,
    className: 'scene-gate',
  },
  {
    id: 'wedding',
    title: 'Wedding',
    text: '08.08.2026 - KIGI Beach Resort. Cùng tụi mình bước sang chương mới nhé.',
    item: 'wedding-bell',
    assetPath: '/ref/wedding-beach-nes-platformer.png',
    photoPath: '/ref/real-wedding-beach.jpg',
    checkpointRatio: 0.62,
    className: 'scene-wedding',
  },
];

export const sceneProgressStep = 100 / scenes.length;
export const getSceneCheckpointProgress = (index: number) => (index + scenes[index].checkpointRatio) * sceneProgressStep;
