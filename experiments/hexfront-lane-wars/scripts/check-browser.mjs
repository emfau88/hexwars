// Use the full browser's GPU backend rather than the software-only headless shell.
// Individual tests keep their normal direct entry points; this runner is for integrated QA.
import {chromium} from '@playwright/test';
const launch=chromium.launch.bind(chromium);chromium.launch=options=>launch({...options,channel:process.env.PLAYWRIGHT_CHANNEL||'chromium'});
for(const name of process.argv.slice(2)){console.log('Running '+name);await import(new URL('../tests/'+name+'.mjs',import.meta.url));}
