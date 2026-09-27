import { defineConfig } from 'vite';

const MAIN_ENTRY = '/src/main.ts';
const PORTAL_ENTRY = '/src/gamemonetize-main.ts';

export default defineConfig({
  base:'./',
  publicDir:'public',
  plugins:[{
    name:'hexfront-gamemonetize-entry',
    transformIndexHtml:{
      order:'pre',
      handler(html) {
        if (!html.includes(MAIN_ENTRY)) throw new Error('GameMonetize build could not locate the standard HEXFRONT entry point.');
        return html.replace(MAIN_ENTRY, PORTAL_ENTRY);
      },
    },
  }],
  build:{
    outDir:'dist-gamemonetize/package',
    emptyOutDir:true,
  },
});
