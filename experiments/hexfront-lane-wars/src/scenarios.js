export const SCENARIOS = Object.freeze([
  { id: 'swarm', name: 'Drohnen → Fernkampf', note: 'Je ein Produktionsverband: Überzahl gegen eine langsame Einzelschusswaffe.', orange: { drone: 1 }, blue: { rail: 1 } },
  { id: 'splash', name: 'Mech → Drohnen', note: 'Je ein Produktionsverband: begrenzter Flächenschaden gegen einen Schwarm.', orange: { mech: 1 }, blue: { drone: 1 } },
  { id: 'range', name: 'Fernkampf → Mech', note: 'Je ein Produktionsverband: Reichweite und Einzelschaden gegen eine schwere Front.', orange: { rail: 1 }, blue: { mech: 1 } },
  { id: 'mixed', name: 'Konter gegen Mech + Fernkampf', note: 'Vier Produktionsverbände je Seite: 12 Drohnen gegen 2 Mechs + 2 Fernkämpfer.', orange: { drone: 4 }, blue: { mech: 2, rail: 2 } },
  { id: 'swarm-answer', name: 'Antwort auf den großen Schwarm', note: 'Vier Produktionsverbände je Seite: Der Drohnenschwarm ist seinerseits konterbar.', orange: { mech: 4 }, blue: { drone: 4 } },
  { id: 'heavy-answer', name: 'Konter gegen die schwere Mischung', note: 'Vier Verbände je Seite: 1 Mech + 3 Fernkämpfer gegen 3 Mechs + 1 Fernkämpfer.', orange: { mech: 1, rail: 3 }, blue: { mech: 3, rail: 1 } },
  { id: 'mirror', name: 'Spiegelgefecht', note: 'Gleiche Armeen, gleiche Ausgangslage. Kein Vorteil für eine Fraktion.', orange: { drone: 2, mech: 1, rail: 1 }, blue: { drone: 2, mech: 1, rail: 1 } },
]);
export const scenarioById = id => SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
