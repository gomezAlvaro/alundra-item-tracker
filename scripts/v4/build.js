// Builds docs/v4/index.html: the seed tracker on the real overworld map. Every cave, dungeon and shop is a pin on its
// entrance, with the number of chests left inside; click one (or a sector) to open its own map.
// Shares the reachability logic of v3 (scripts/v3/logic.js) and the atlas pins written by scripts/v2/build.js.
// Usage: node scripts/v2/build.js && node scripts/v4/build.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../..');
const read = f => fs.readFileSync(f, 'utf8');
const data = f => JSON.parse(read(path.join(root, 'data', f)));

const atlas = JSON.parse(read(path.join(root, 'docs/data/atlas.json')));
const regions = data('world_region.json');
const worldPaths = data('world_path.json');
const world = {
    paths: worldPaths,
    items: data('item.json').map(i => ({ name: i.name, slot: i.slot, tier: i.tier })),
};

// World.png is cut into a 5x4 grid of sectors, A1 to E4
const CELL_W = 1249.4, CELL_H = 961;
const OVERWORLD = /^Overworld ([A-E])([1-4]) \((.+)\)$/;
const SPECIAL_SECTORS = { Inoa: { col: 2, row: 2 } };
const KIND_OVERRIDES = { "Merrick's shop": 'shop', 'Riverside Casino': 'place', 'Fairy Pond': 'place' };
// Routing-only regions with no chests: they are not places you can open, so they get no pin
const HIDDEN = new Set(['River network']);
const NAME_FIXES = { 'Undeground Waterway': 'Underground Waterway' };
// Cave maps whose atlas title would clash with a dungeon's name, or reads badly as a pin
const CAVE_NAMES = {
    mimics: 'Mimics cave',
    watermill: 'Watermill', watermillcaves: 'Watermill caves', sanctuarycave: 'Sanctuary top-left cave', coalmines: 'Coal Mine upper mines', cavetolake: 'Cave to lake', cliffswell: 'Well', lurvy: "Lurvy's shop",
};

// Entrance of each location on World.png, in image pixels. `side` puts the label left of the pin when the right is busy.
const PINS = {
    'overworld-c2-sanctuary-sector--sanctuarycave': [2569, 1001],
    'overworld-c2-sanctuary-sector--olen': [2631, 1335],
    'overworld-c2-sanctuary-sector--cephas': [3614, 1651],
    'lars-crypt': [3555, 1160],
    'overworld-b2-coal-mine-sector--cavetolake': [1561, 1035],
    'overworld-b2-coal-mine-sector--coalmines': [2089, 1045],
    'overworld-b2-coal-mine-sector--coalhouse': [2389, 1291],
    'coal-mine': [2090, 1240],
    'overworld-d2-watermill-sector--watermill': [4630, 1700, 'l'],
    'overworld-d2-watermill-sector--watermillcaves': [4226, 996],
    'undeground-waterway': [5045, 1640],
    'tarn-manor': [4340, 2060],
    "merrick-s-shop": [3380, 3370],
    'coastal-cave': [3340, 3610],
    'reptile-lair': [4610, 3200],
    'riverside-casino': [1910, 2600],
    'fairy-pond': [905, 2865],
    'nava-s-keep': [1870, 3720],
    'overworld-e4-cliffs-of-madness--cliffswell': [6173, 3651],
    'overworld-e4-cliffs-of-madness--lurvy': [6137, 3620, 'l'],
    'overworld-e2-upper-desert--desertn': [5130, 1080],
    'ancient-shrine': [6080, 2770, 'l'],
    'magyscar': [3125, 70],
    'torla-mountain': [4775, 40],
    'ice-manor': [3940, 650],
    "nirude-s-lair": [5610, 240],
    'overworld-a3-ruins-above-fire-manor--mimics': [205, 2430],
    'overworld-a4-fire-manor-sector--firemanor': [560, 3590],
    'fire-manor': [515, 3300],
    'overworld-a2-murgg-woods--murgg': [936, 1144],
    'tower-of-the-great-tree': [620, 650],
    'lake-shrine': [1900, 140],
};

// Entrance pins moved with the page's edit mode (node scripts/edit-server.js) win over the defaults above
Object.assign(PINS, data('pin_overrides.json').locations);

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const regionOf = {};
regions.forEach(r => r.nodeIds.forEach(id => { regionOf[id] = r.name; }));
const mapTitle = Object.fromEntries(atlas.maps.map(m => [m.id, m.title]));

// Sources of each region, grouped by the atlas map they are pinned on
const byRegion = {};
atlas.sources.forEach((s, i) => {
    const r = regionOf[s.node], p = atlas.placements[i];
    if (!r || !p) return;
    ((byRegion[r] = byRegion[r] || {})[p.map] = byRegion[r][p.map] || []).push(i);
});
const mapsByCount = groups => Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

const locations = [];
const primaryOf = {};     // region name -> its location (sector or dungeon)
const add = loc => { locations.push(loc); return loc; };

for (const r of regions) {
    if (HIDDEN.has(r.name)) continue;
    const groups = byRegion[r.name] || {};
    const ow = r.name.match(OVERWORLD), special = SPECIAL_SECTORS[r.name];
    if (ow || special) {
        const col = ow ? 'ABCDE'.indexOf(ow[1]) : special.col, row = ow ? +ow[2] - 1 : special.row;
        // Inoa's chests are all on its own map; overworld sectors keep only their world-map chests
        const sector = add({
            id: slug(r.name), kind: 'sector', region: r.name, code: 'ABCDE'[col] + (row + 1), name: special ? r.name : ow[3], col, row,
            nodes: r.nodeIds, sources: special ? Object.values(groups).flat() : groups.world || [], maps: special ? mapsByCount(groups) : ['world'],
        });
        primaryOf[r.name] = sector;
        if (!special) {
            for (const map of mapsByCount(groups).filter(m => m !== 'world')) {
                add({
                    id: `${sector.id}--${map}`, kind: 'cave', region: r.name, name: CAVE_NAMES[map] || mapTitle[map],
                    nodes: [...new Set(groups[map].map(i => atlas.sources[i].node))], sources: groups[map], maps: [map],
                });
            }
        }
    } else {
        primaryOf[r.name] = add({
            id: slug(r.name), kind: KIND_OVERRIDES[r.name] || 'dungeon', region: r.name, name: NAME_FIXES[r.name] || r.name,
            nodes: r.nodeIds, sources: Object.values(groups).flat(), maps: mapsByCount(groups),
        });
    }
}

// Soft locks: places you can enter without the logic's required items but may not be able to leave (see README)
const WARNINGS = {
    'magyscar': 'Soft lock: do not enter without Bombs, you can get stuck inside',
    'overworld-a3-ruins-above-fire-manor--mimics': 'Soft lock: do not enter without Spring Beans, you can get stuck inside',
};

// Pins, and the sector each pin sits in
const sectorAt = {};
locations.filter(l => l.kind === 'sector').forEach(l => { sectorAt[l.code] = l; });
for (const l of locations) {
    if (l.kind === 'sector') continue;
    const pin = PINS[l.id];
    if (!pin) throw new Error(`No pin position for ${l.id} (${l.name}): add it to PINS`);
    [l.x, l.y] = pin;
    if (WARNINGS[l.id]) l.warning = WARNINGS[l.id];
    if (pin[2]) l.side = pin[2];
    const code = 'ABCDE'[Math.floor(l.x / CELL_W)] + (Math.floor(l.y / CELL_H) + 1);
    l.parent = sectorAt[code].id;
}

// ---- transitions between regions (a cave is always linked to its own sector)
const edgeKey = new Set(), edges = [];
const addEdge = (a, b) => {
    const k = [a, b].sort().join('|');
    if (a === b || edgeKey.has(k)) return;
    edgeKey.add(k);
    edges.push([a, b]);
};
for (const p of worldPaths) {
    const a = regionOf[p.fromId], b = regionOf[p.toId];
    if (a && b && a !== b && primaryOf[a] && primaryOf[b]) addEdge(primaryOf[a].id, primaryOf[b].id);
}
locations.filter(l => l.kind === 'cave').forEach(l => addEdge(l.parent, l.id));

const placedCount = locations.reduce((n, l) => n + l.sources.length, 0);
if (placedCount !== atlas.sources.length) console.warn(`Warning: ${atlas.sources.length - placedCount} item sources are on no location`);

const graph = { cell: { w: CELL_W, h: CELL_H }, locations, edges };
const html = read(path.join(__dirname, 'template.html'))
    .replace('/*ATLAS*/null', () => JSON.stringify(atlas))
    .replace('/*WORLD*/null', () => JSON.stringify(world))
    .replace('/*GRAPH*/null', () => JSON.stringify(graph))
    .replace('/*LOGIC*/', () => read(path.join(root, 'scripts/v3/logic.js')));

fs.mkdirSync(path.join(root, 'docs/v4'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/v4/index.html'), html);
console.log(`Wrote docs/v4/index.html (${locations.length} locations, ${edges.length} transitions)`);
