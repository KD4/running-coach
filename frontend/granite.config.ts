import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'running-coach',
  brand: {
    displayName: '러닝 코치',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/22843/75390407-f134-48da-89aa-57801a4d1962.png',
    bridgeColorMode: 'basic',
  },
  web: {
    host: '192.168.219.121',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
