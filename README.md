# Alundra Item Tracker

Map and tracker pages for the [Alundra randomizer](https://github.com/gomezAlvaro/alundra-item-randomizer).

**Use it online:** https://gomezalvaro.github.io/alundra-item-tracker/

They are static HTML pages in `docs/`, built by Node scripts from the randomizer's world data.

| Page | What it is | Built by |
| --- | --- | --- |
| `docs/v4/index.html` | World tracker: the seed tracker on the real overworld map. Caves and dungeons are pins on their entrance with the chests left inside; click one to open its map. Shares progress with v3. | `scripts/v4/build.js` |
| `docs/v3/index.html` | Seed tracker: load a `spoiler.json`, chest contents stay hidden, and it shows which chests you can reach with the items you own. | `scripts/v3/build.js` |
| `docs/v2/index.html` | Chest atlas on the vgmaps Alundra maps. Also writes `docs/data/atlas.json`, the pin positions the tracker uses. | `scripts/v2/build.js` |
| `docs/world_map.html` | First version: interactive graph of item locations. | `scripts/gen_world_map.js` |

## Soft locks

The tracker only says what the logic requires. It does not stop you walking into a place you cannot leave, so keep
this list in mind (add to it as more turn up):

- **Magyscar: do not enter without Bombs.** The Iron Flail alone gets you in, but you can get stuck inside. The logic
  therefore requires both the Iron Flail and a Bomb (`overworld_c1` to `magyscar` in `data/world_path.json`), and the
  pin stays locked until you have both. Enter before that only if you accept the risk.
- **Mimics cave (A3): do not enter without Spring Beans.** Without them you get locked in. This one is only a warning on
  the pin's tooltip, the logic does not change.

## Build

Needs Node.js. The trackers use the atlas pins, so build v2 before v3 and v4:

```
node scripts/v2/build.js
node scripts/v3/build.js
node scripts/v4/build.js
node scripts/gen_world_map.js
```

Check the tracker logic against the randomizer's reference spoiler (or pass another `spoiler.json`):

```
node scripts/v3/test_logic.js [spoiler.json]
```

The v4 pin positions (cave and dungeon entrances on `World.png`) are the `PINS` table in `scripts/v4/build.js`.

To view the pages, serve `docs/` with any static server (the `.claude/launch.json` one listens on port 8765).

## Data

`data/` is a copy of `src/main/resources/data` from the randomizer, and `test/reference_spoiler.json` is its golden
spoiler. When the randomizer's logic data changes, refresh them and rebuild:

```
scripts/sync_data.sh ../alundra-item-randomizer
```

`scripts/v3/logic.js` (also used by v4) mirrors how the randomizer adjusts path requirements for a seed, so it needs updating too if
that behaviour changes.

## Map images

`docs/v2/maps` holds the Alundra maps from [vgmaps.com](https://www.vgmaps.com/). `scripts/v2/ChestMatcher.java`
finds chests on them and writes `docs/v2/candidates.json`:

```
java scripts/v2/ChestMatcher.java docs/v2/maps 0.65 docs/v2/candidates.json
```
