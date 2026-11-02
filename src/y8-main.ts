import '@fontsource-variable/sora/wght.css';
import '@fontsource-variable/source-sans-3/wght.css';
import './styles.css';
import './campaign-atlas.css';
import './y8.css';
import './battle-controls.css';
import { HexfrontApp } from './app/HexfrontApp';
import { Y8PortalAdapter } from './platform/Y8PortalAdapter';
import { Y8_RELEASE_ID } from './platform/y8Release';

// Keep the portal presentation isolated from the standard and Kongregate builds.
document.documentElement.dataset.portal = 'y8';
document.getElementById('campaignAtlasSvg')?.setAttribute('data-presentation', 'cards');
const buildLabel = document.createElement('p');
buildLabel.className = 'y8BuildLabel';
buildLabel.textContent = Y8_RELEASE_ID;
document.getElementById('menuSettingsPanel')?.append(buildLabel);
const details = document.createElement('button');
details.type = 'button';
details.className = 'y8DetailsToggle';
details.setAttribute('aria-controls', 'y8MissionDetails');
document.querySelector('.missionContent')?.setAttribute('id', 'y8MissionDetails');
const updateDetailsLabel = () => {
  const open = document.getElementById('mapCenter')?.classList.contains('y8DetailsOpen') ?? false;
  details.textContent = open ? (document.documentElement.lang === 'de' ? 'Zurück' : 'Back') : 'Details';
  details.setAttribute('aria-expanded', String(open));
};
details.addEventListener('click', () => {
  document.getElementById('mapCenter')?.classList.toggle('y8DetailsOpen');
  updateDetailsLabel();
});
document.querySelector('.dossierHeader')?.append(details);
new MutationObserver(updateDetailsLabel).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });
updateDetailsLabel();
const app = new HexfrontApp(new Y8PortalAdapter());
app.renderer.minimumLabelPixels = 14;
