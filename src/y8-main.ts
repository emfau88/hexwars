import '@fontsource-variable/sora/wght.css';
import '@fontsource-variable/source-sans-3/wght.css';
import './styles.css';
import './campaign-atlas.css';
import { HexfrontApp } from './app/HexfrontApp';
import { Y8PortalAdapter } from './platform/Y8PortalAdapter';

new HexfrontApp(new Y8PortalAdapter());
