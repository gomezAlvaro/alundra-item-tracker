# Alundra Item Tracker

Map and tracker pages for the [Alundra randomizer](https://github.com/gomezAlvaro/alundra-item-randomizer).
They are static HTML pages in `docs/`, built by Node scripts from the randomizer's world data.

| Page | What it is | Built by |
| --- | --- | --- |
| `docs/v3/index.html` | Seed tracker: load a `spoiler.json`, chest contents stay hidden, and it shows which chests you can reach with the items you own. | `scripts/v3/build.js` |
| `docs/v2/index.html` | Chest atlas on the vgmaps Alundra maps. Also writes `docs/data/atlas.json`, the pin positions the tracker uses. | `scripts/v2/build.js` |
| `docs/world_map.html` | First version: interactive graph of item locations. | `scripts/gen_world_map.js` |

## Build

Needs Node.js. The tracker uses the atlas pins, so build v2 before v3:

```
node scripts/v2/build.js
node scripts/v3/build.js
node scripts/gen_world_map.js
```

Check the tracker logic against the randomizer's reference spoiler (or pass another `spoiler.json`):

```
node scripts/v3/test_logic.js [spoiler.json]
```

To view the pages, serve `docs/` with any static server (the `.claude/launch.json` one listens on port 8765).

## Data

`data/` is a copy of `src/main/resources/data` from the randomizer, and `test/reference_spoiler.json` is its golden
spoiler. When the randomizer's logic data changes, refresh them and rebuild:

```
scripts/sync_data.sh ../alundra-item-randomizer
```

`scripts/v3/logic.js` mirrors how the randomizer adjusts path requirements for a seed, so it needs updating too if
that behaviour changes.

## Map images

`docs/v2/maps` holds the Alundra maps from [vgmaps.com](https://www.vgmaps.com/). `scripts/v2/ChestMatcher.java`
finds chests on them and writes `docs/v2/candidates.json`:

```
java scripts/v2/ChestMatcher.java docs/v2/maps 0.65 docs/v2/candidates.json
```
