#!/bin/sh
# Copies the world data and the reference spoiler from an alundra-item-randomizer checkout.
# Usage: scripts/sync_data.sh [path to alundra-item-randomizer]   (default: ../alundra-item-randomizer)
set -e
cd "$(dirname "$0")/.."
R="${1:-../alundra-item-randomizer}"
for f in item item_source world_node world_path world_region; do
    cp "$R/src/main/resources/data/$f.json" data/
done
cp "$R/src/test/resources/golden/cpp_reference_spoiler.json" test/reference_spoiler.json
echo "Synced data from $R"
