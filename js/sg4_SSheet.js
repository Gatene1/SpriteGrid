function allocSheet(cols, rows) {
    sheetCols = cols | 0;
    sheetRows = rows | 0;
    sheetOcc = new Int32Array(sheetCols * sheetRows);
    sheetOcc.fill(-1);
    sprites = [];
    selectedSprites.clear();
}

function cellIndex(cx, cy) {
    return (cy * sheetCols) + cx;
}

function stampSpriteOcc(spriteId, value /* spriteId or -1 */) {
    const s = sprites[spriteId];
    if (!s) return;

    const ax = s.xCell | 0;
    const ay = s.yCell | 0;

    for (let y = 0; y < s.hCells; y++) {
        for (let x = 0; x < s.wCells; x++) {
            const cx = ax + x;
            const cy = ay + y;
            if (cx < 0 || cy < 0 || cx >= sheetCols || cy >= sheetRows) continue;
            sheetOcc[cellIndex(cx, cy)] = value;
        }
    }
}

function canPlaceSpriteAt(spriteId, xCell, yCell, allowSet = null) {
    const s = sprites[spriteId];
    if (!s) return false;

    // bounds
    if (xCell < 0 || yCell < 0) return false;
    if ((xCell + s.wCells) > sheetCols) return false;
    if ((yCell + s.hCells) > sheetRows) return false;

    // collisions
    for (let y = 0; y < s.hCells; y++) {
        for (let x = 0; x < s.wCells; x++) {
            const occ = sheetOcc[cellIndex(xCell + x, yCell + y)];
            if (occ === -1) continue;
            if (allowSet && allowSet.has(occ)) continue; // allow overlap with moving selection
            if (occ !== spriteId) return false;
        }
    }
    return true;
}

function moveSelectionBy(dx, dy) {
    if (!selectedSprites.size) return false;

    // 1) clear occupancy for selected
    for (const id of selectedSprites) stampSpriteOcc(id, -1);

    // 2) validate all new placements
    for (const id of selectedSprites) {
        const s = sprites[id];
        const nx = (s.xCell + dx) | 0;
        const ny = (s.yCell + dy) | 0;
        if (!canPlaceSpriteAt(id, nx, ny, selectedSprites)) {
            // rollback (restamp originals) if invalid
            for (const rid of selectedSprites) stampSpriteOcc(rid, rid);
            return false;
        }
    }

    // 3) commit move
    for (const id of selectedSprites) {
        sprites[id].xCell = (sprites[id].xCell + dx) | 0;
        sprites[id].yCell = (sprites[id].yCell + dy) | 0;
    }

    // 4) restamp occupancy
    for (const id of selectedSprites) stampSpriteOcc(id, id);

    return true;
}