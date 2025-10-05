import type { Options as PwaPluginOptions } from 'vite-plugin-pwa';

import type { ImportmapPluginOptions } from './typing';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Get PWA icons configuration with fallback
 */
function getPWAIcons(): any[] {
  // Core PWA required sizes
  const pwaRequiredSizes = new Set([
    '16x16',
    '20x20',
    '24x24',
    '32x32',
    '40x40',
    '48x48',
    '60x60',
    '64x64',
    '72x72',
    '80x80',
    '96x96',
    '128x128',
    '144x144',
    '152x152',
    '167x167',
    '180x180',
    '192x192',
    '256x256',
    '512x512',
    '1024x1024',
  ]);

  // Generate icons based on the JSON structure
  const baseUrl = 'https://unpkg.com/@tfsoft/static-source@1.0.2/static/pwa/';

  const icons = [
    // Android icons (primary PWA icons)
    {
      sizes: '48x48',
      src: `${baseUrl}android/android-launchericon-48-48.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '72x72',
      src: `${baseUrl}android/android-launchericon-72-72.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '96x96',
      src: `${baseUrl}android/android-launchericon-96-96.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '144x144',
      src: `${baseUrl}android/android-launchericon-144-144.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '192x192',
      src: `${baseUrl}android/android-launchericon-192-192.png`,
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      sizes: '512x512',
      src: `${baseUrl}android/android-launchericon-512-512.png`,
      type: 'image/png',
      purpose: 'any maskable',
    },
    // iOS icons (additional coverage)
    {
      sizes: '16x16',
      src: `${baseUrl}ios/16.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '20x20',
      src: `${baseUrl}ios/20.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '32x32',
      src: `${baseUrl}ios/32.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '60x60',
      src: `${baseUrl}ios/60.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '64x64',
      src: `${baseUrl}ios/64.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '80x80',
      src: `${baseUrl}ios/80.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '128x128',
      src: `${baseUrl}ios/128.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '152x152',
      src: `${baseUrl}ios/152.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '167x167',
      src: `${baseUrl}ios/167.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '180x180',
      src: `${baseUrl}ios/180.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '256x256',
      src: `${baseUrl}ios/256.png`,
      type: 'image/png',
      purpose: 'any',
    },
    {
      sizes: '1024x1024',
      src: `${baseUrl}ios/1024.png`,
      type: 'image/png',
      purpose: 'any',
    },
  ];

  return icons.filter((icon) => pwaRequiredSizes.has(icon.sizes));
}

const getDefaultPwaOptions = (name: string): Partial<PwaPluginOptions> => ({
  manifest: {
    background_color: '#ffffff',
    categories: ['productivity', 'utilities', 'entertainment'],
    description: 'Nexo Studio - Creative Content Platform for Video Makers',
    display: 'standalone',
    icons: getPWAIcons(),
    lang: 'vi-VN',
    name: `${name}${isDevelopment ? ' dev' : ''}`,
    orientation: 'portrait',
    scope: '/',
    short_name: `${name}${isDevelopment ? ' dev' : ''}`,
    start_url: '/',
    theme_color: '#ffffff',
  },
});

/**
 * importmap CDN 暂时不开启，因为有些包不支持，且网络不稳定
 */
const defaultImportmapOptions: ImportmapPluginOptions = {
  // 通过 Importmap CDN 方式引入,
  // 目前只有esm.sh源兼容性好一点，jspm.io对于 esm 入口要求高
  defaultProvider: 'esm.sh',
  importmap: [
    { name: 'vue' },
    { name: 'pinia' },
    { name: 'vue-router' },
    // { name: 'vue-i18n' },
    { name: 'dayjs' },
    { name: 'vue-demi' },
  ],
};

export { defaultImportmapOptions, getDefaultPwaOptions };
