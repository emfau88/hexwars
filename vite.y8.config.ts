import { defineConfig } from 'vite';

const MAIN_ENTRY = '/src/main.ts';
const Y8_ENTRY = '/src/y8-main.ts';
const Y8_SDK_URL = 'https://cdn.y8.com/minimal-sdk/2-0/y8.min.js';

export default defineConfig({
  base:'./',
  publicDir:'public',
  plugins:[{
    name:'hexfront-y8-entry',
    transformIndexHtml:{
      order:'pre',
      handler(html) {
        if (!html.includes(MAIN_ENTRY)) throw new Error('Y8 build could not locate the standard HEXFRONT entry point.');
        return {
          html:html.replace(MAIN_ENTRY, Y8_ENTRY),
          tags:[{
            tag:'script',
            attrs:{ src:Y8_SDK_URL, async:true },
            injectTo:'head',
          }],
        };
      },
    },
  }],
  build:{
    outDir:'dist-y8/package',
    emptyOutDir:true,
  },
});
