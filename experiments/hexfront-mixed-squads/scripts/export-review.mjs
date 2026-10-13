import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'test-results'),out=path.join(root,'docs/review-2026-10-13');
const shots=[
 ['cozy-menu-1440','Hauptmenü · Desktop'],['cozy-menu-390','Hauptmenü · Smartphone'],
 ['cozy-missions','Missionsauswahl'],
 ...['morgenwacht','windpass','auenstrom'].flatMap(map=>[[`landscape-${map}-1440`,`${map} · Taktik 70°`],[`landscape-${map}-diorama-1440`,`${map} · Diorama 55°`]]),
 ['landscape-auenstrom-390','Auenstrom · Smartphone'],['landscape-auenstrom-844','Auenstrom · Querformat'],
 ['landscape-morgenwacht-320','Morgenwacht · schmales Smartphone'],
 ['mobile-command','Befehlsauswahl · Touch'],['supply-desktop','Nachschub · Desktop'],
 ['cozy-production-1440','Produktion · Desktop'],['cozy-production-390','Produktion · Smartphone'],
 ['result-morgenwacht','Sieg · reguläre simulierte Partie'],['result-defeat','Niederlage · reguläre simulierte Partie'],
 ['cozy-victory-390','Sieg · Smartphone (Layout-Testzustand)'],['cozy-defeat-390','Niederlage · Smartphone (Layout-Testzustand)'],
 ['cozy-victory-844','Sieg · Querformat (Layout-Testzustand)'],['cozy-defeat-844','Niederlage · Querformat (Layout-Testzustand)'],
];
await fs.mkdir(out,{recursive:true});
const reports={};
for(const name of ['browser','cozy','landscape']){
 const report=JSON.parse(await fs.readFile(path.join(source,name+'-report.json'),'utf8'));
 if(report.failure||report.errors?.length)throw Error(`${name}: review export requires a passing final report`);
 reports[name]=report;await fs.writeFile(path.join(out,name+'-report.json'),JSON.stringify(report,null,2)+'\n');
}
for(const [file] of shots)await fs.copyFile(path.join(source,file+'.png'),path.join(out,file+'.png'));
const analysis={date:'2026-10-13',branch:'experiment/mixed-squads',approved_reference:'approved-ui-concept.png',scope:'Nur Mixed Squads; Originalvarianten und ihre Kampagnen bleiben unverändert.',
 changes:['Helle keramische UI mit abgerundeten Flächen, salbeifarbenen Anzeigen und warmen orangefarbenen Hauptaktionen.','Eigenes Hauptmenü, Missionsauswahl, Einstellungen/Hilfe, kompakter HUD und kontextbezogene Befehlsauswahl.','Produktion mit Einheitenvergleich und Einkommensaufschlüsselung; Sieg und Niederlage mit eigener Illustration.','Alle drei Maps: normale Hexfelder bleiben eben, Höhenübergänge bleiben auf Rampen beschränkt.','Morgenwacht: nur die beiden erhöhten Ruinenfragmente am Relais samt Flugabstand entfernt.','Besetzte Felder: Füllung 0,28 → 0,38; ausgewählt 0,34 → 0,46. Konturbreite 0,035 → 0,045; neutraler Rand 0,62 → 0,84 Deckkraft; dunkler Unterrand 0,25 → 0,42.'],
 camera:{recommendation:'Festen Taktikwinkel beibehalten und Karten darauf abstimmen. Kein zusätzlicher Dreh-Joystick.',tactical_degrees:70,diorama_degrees:55,controls:'Zoom, Verschieben, Zentrieren und Ansichtswechsel; eigenes HQ unten mittig.',review:'Paarweise Taktik-/Diorama-Bilder vergleichen: Höhenlesbarkeit, verdeckte Wege, Größe der Spielfelder und Freiraum für HUD.'},
 verification:{logic_tests:28,browser:reports.browser.checks,ui:reports.cozy.checks,landscape:reports.landscape.checks},
 limitations:['Browserbilder stammen aus Chromium mit emulierten Smartphone-Abmessungen, nicht von physischen Mobilgeräten.','Die cozy-victory/defeat-Bilder verwenden Testzustände zur Layoutprüfung; die regulären Ergebnisbilder stammen aus vollständig simulierten Partien.','Eine gezeigte Roboterfigur repräsentiert den Einheitentyp im Feld, nicht jeden einzelnen Roboter.','Illustrationen wurden mit dem eingebauten Imagegen-Tool erzeugt; Prompts und Assets liegen in public/ui.'],
 review_questions:['Ist die Gebietszughörigkeit auf Fels und Gras bei beiden Kamerawinkeln sofort erkennbar?','Sind neutrale Konturen klar, ohne die Fraktionsfarben zu überlagern?','Ist der Unterschied zwischen Auswahl, erreichbaren Feldern und laufendem Gefecht deutlich?','Bleiben die mobilen Bedienelemente gut erreichbar, ohne das eigentliche Spielfeld zu überdecken?'],screenshots:shots.map(([file,caption])=>({file:file+'.png',caption}))};
await fs.writeFile(path.join(out,'analysis.json'),JSON.stringify(analysis,null,2)+'\n');
await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HEXFRONT · UI-Review</title><style>body{margin:0;padding:32px;background:#f3eddf;color:#294037;font:16px/1.5 system-ui}main{max-width:1300px;margin:auto}h1{margin-bottom:6px}a{color:#876226}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}figure{margin:0;background:#fff9ef;border:1px solid #cebea2;border-radius:14px;overflow:hidden}img{width:100%;height:320px;object-fit:contain;background:#dce2d1;display:block}figcaption{padding:12px 16px}small{color:#6c7b65}</style><main><h1>HEXFRONT · Mixed Squads</h1><p>UI- und Kamera-Review · 13. Oktober 2026</p><p><a href="analysis.json">Änderungen, Prüfergebnisse und Fragen für die Analyse</a> · <a href="browser-report.json">Spielablauf</a> · <a href="cozy-report.json">UI</a> · <a href="landscape-report.json">Alle Karten</a></p><p><small>Taktik: 70°, Diorama: 55°. Mobile Ergebnisbilder sind Layout-Testzustände; reguläre Spielresultate sind entsprechend beschriftet.</small></p><section>${shots.map(([file,caption])=>`<figure><a href="${file}.png"><img src="${file}.png" alt="${caption}" loading="lazy"></a><figcaption>${caption}</figcaption></figure>`).join('')}</section></main></html>`);
console.log(`${shots.length} final screenshots and three passing reports exported to ${out}`);
