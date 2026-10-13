// Small native illustrations share the ceramic, amber and cyan game palette.
const paths={
 play:'<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
 menu:'<path d="M5 6h14M5 12h14M5 18h14"/>',
 settings:'<path d="m10 3-1 3-3 1-3 3 2 2-1 3 3 3 3-1 2 2 3-1 1-3 3-1 1-3-2-2 1-3-3-3-3 1Z"/><circle cx="12" cy="11" r="3"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 back:'<path d="M19 12H5m6-6-6 6 6 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 hex:'<path d="m12 2 9 5v10l-9 5-9-5V7Z"/>',
 flag:'<path d="M5 21V4m0 0c5-5 9 5 15 0v10c-6 5-10-5-15 0"/>',
 terrain:'<path d="m2 20 7-16 5 10 3-6 5 12Z" fill="#8c9a80" stroke="#637364"/><path d="m6 11 3-7 4 9-4-2-2 2Z" fill="#ece7d5" stroke="none"/><path d="m11 20 6-12 5 12Z" fill="#6d8c72"/>',
 credit:'<path d="m12 2 9 5v10l-9 5-9-5V7Z" fill="#f6be62" stroke="#cb9545"/><path d="m12 6 5 3v6l-5 3-5-3V9Z" stroke="#ffe0a2"/><path d="M14 9h-4v6h4" stroke="#b47d31"/>',
};
export function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.hex}</svg>`;}
export function robot(type='drone'){
 const body=type==='mech'?'<path d="m24 53-4 27h18l4-22m14-5 4 27h18l-5-29" fill="#b0b6af"/><path d="M17 77h23v9H14Zm42 0h21l5 9H59Z" fill="#e8e4d8"/><rect x="10" y="27" width="17" height="35" rx="7" fill="#f6b659"/><rect x="70" y="28" width="18" height="28" rx="7" fill="#f6b659"/><path d="M77 49h14v20H77Z" fill="#52666a"/><rect x="27" y="22" width="43" height="42" rx="14" fill="#f4f0e6"/><path d="M28 49h41v10H28Z" fill="#eaa54a"/><rect x="32" y="13" width="32" height="26" rx="10" fill="#e8e4d8"/><rect x="37" y="19" width="22" height="13" rx="5" fill="#263d43"/><path d="M41 24h14" stroke="#77d9f7" stroke-width="4"/>':'<ellipse cx="48" cy="82" rx="26" ry="5" fill="#52634b" opacity=".14" stroke="none"/><path d="m13 58 6 17 6-17m48 0 6 17 6-17" fill="#83d9ec" stroke="none"/><rect x="7" y="36" width="22" height="28" rx="10" fill="#f5b557"/><rect x="68" y="36" width="22" height="28" rx="10" fill="#f5b557"/><circle cx="48" cy="44" r="30" fill="#f3eee1"/><path d="M35 18h26l-3 7H38Z" fill="#f4b358"/><rect x="25" y="33" width="47" height="28" rx="14" fill="#263b43"/><ellipse cx="38" cy="46" rx="5" ry="7" fill="#7adbff" stroke="none"/><ellipse cx="59" cy="46" rx="5" ry="7" fill="#7adbff" stroke="none"/><path d="M39 68h18" stroke="#e8a94e" stroke-width="5"/>';
 return `<svg class="robot-art" viewBox="0 0 96 96" fill="none" stroke="#7c8278" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
export const headquarters='<svg viewBox="0 0 100 100" class="hq-art" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="var(--badge,#f3be6d)" stroke="#f9deaa" stroke-width="3"/><path d="m19 54 5-21 26-13 26 13 6 21-8 24H28Z" fill="#f2ecdc" stroke="#7b8179" stroke-width="2"/><ellipse cx="50" cy="43" rx="26" ry="19" fill="#e1a64e" stroke="#ab8041" stroke-width="3"/><ellipse cx="50" cy="42" rx="17" ry="12" fill="#405455"/><path d="M46 43V14h8v29" fill="#e3dfd1" stroke="#7b8179" stroke-width="2"/><path d="M50 14V7" stroke="#677373" stroke-width="3"/><path d="M22 55h15v15H25m53-15H63v15h12" fill="#ecb65e"/><path d="M40 66h20v14H40Z" fill="#425d63"/><path d="M42 68h16" stroke="#84d8ef" stroke-width="3"/></svg>';
