import { router } from '#/router';

interface Feature {
  action: () => void;
  cover: string;
  icon: string;
  key: string;
}

export const features: Feature[] = [
  {
    key: 'videoCutter',
    icon: 'https://cdn-icons-png.flaticon.com/128/10728/10728392.png',
    cover:
      'https://images.unsplash.com/photo-1574717519105-620355a34723?q=80&w=800&h=450&auto=format&fit=crop',
    action: () => {
      router.push('/video-cutter');
    },
  },
  {
    key: 'videoDownloader',
    icon: 'https://cdn-icons-png.flaticon.com/128/1384/1384060.png',
    cover:
      'https://images.unsplash.com/photo-1611162617213-6d22e5257410?q=80&w=800&h=450&auto=format&fit=crop',
    action: () => {
      router.push('/Video-downloader');
    },
  },
  {
    key: 'aiScriptWriter',
    icon: 'https://cdn-icons-png.flaticon.com/128/11510/11510353.png',
    cover:
      'https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=800&h=450&auto=format&fit=crop',
    action: () => {
      router.push('/ai-script-writer');
    },
  },
];
