function allocSheet(cols, rows) {
    sheetCols = cols;
    sheetRows = rows;

    sheetOcc = new Int32Array(cols * rows);
    sheetOcc.fill(-1);

    sprites = [];
    selectedSprites.clear();
    selectedSpriteId = -1;
    hoveredSpriteId = -1;

    spriteCanvas.width = sheetCols * spriteCellSize;
    spriteCanvas.height = sheetRows * spriteCellSize;
}

function cellIndex(x, y) {
    return y * sheetCols + x;
}

function cellToXY(idx) {
    return {
        x: idx % sheetCols,
        y: Math.floor(idx / sheetCols)
    };
}

function canPlaceRect(x, y, w, h) {
    if (x < 0 || y < 0) return false;
    if (x + w > sheetCols) return false;
    if (y + h > sheetRows) return false;

    for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
            if (sheetOcc[cellIndex(x + xx, y + yy)] !== -1) {
                return false;
            }
        }
    }
    return true;
}

function stampRect(x, y, w, h, value) {
    for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
            sheetOcc[cellIndex(x + xx, y + yy)] = value;
        }
    }
}

function exitImportMode() {
    mouseSprite = null;
    spriteHeld = false;
    pasteSprite = false;
}

function addSpriteFromMouse(mouse, x, y) {
    const id = sprites.length;

    sprites.push({
        id,
        wPx: mouse.wPx,
        hPx: mouse.hPx,
        pixels: mouse.pixels,
        wCells: mouse.wCells,
        hCells: mouse.hCells,
        xCell: x,
        yCell: y
    });

    stampRect(x, y, mouse.wCells, mouse.hCells, id);
    markSheetStaticDirty();
    requestRerender();
    selectedSprites.clear();
    selectedSprites.add(id);
    selectedSpriteId = id;

    return id;
}

function tryPlaceMouseSpriteAtCellIndex(idx) {
    if (!mouseSprite || !pasteSprite) return false;

    const { x, y } = cellToXY(idx);

    if (!canPlaceRect(x, y, mouseSprite.wCells, mouseSprite.hCells)) {
        return false;
    }

    addSpriteFromMouse(mouseSprite, x, y);
    exitImportMode();
    requestRerender();
    return true;
}

function eraseSpriteById(id) {
    const s = sprites[id];
    if (!s) return;

    stampRect(s.xCell, s.yCell, s.wCells, s.hCells, -1);
    sprites[id] = null;

    selectedSprites.delete(id);
    markSheetStaticDirty();
    requestRerender();
    if (selectedSpriteId === id) selectedSpriteId = -1;
}

function spriteSheetClick() {
    // If we are dragging, ignore click events (mouseup will fire, then click fires — classic browser behavior)
    if (typeof isMovingSprite === "function" && isMovingSprite()) return;

    if (spriteCellOn < 0) return;

    if (spriteHeld && pasteSprite) {
        tryPlaceMouseSpriteAtCellIndex(spriteCellOn);
        //drawAll();
        requestRerender();
        return;
    }

    if (eraseTool) {
        const id = sheetOcc[spriteCellOn];
        if (id !== -1) eraseSpriteById(id);
        //drawAll();
        requestRerender();
        return;
    }

    const id = sheetOcc[spriteCellOn];
    selectedSprites.clear();
    if (id !== -1) {
        selectedSprites.add(id);
        selectedSpriteId = id;
    } else {
        selectedSpriteId = -1;
    }

    //drawAll();
    requestRerender();
}

function rebuildSheetOccFromSprites() {
    if (!sheetOcc) return;
    sheetOcc.fill(-1);

    for (let id = 0; id < sprites.length; id++) {
        const s = sprites[id];
        if (!s) continue;

        // id matches array index in your convention
        stampRect(s.xCell, s.yCell, s.wCells, s.hCells, id);
    }
}


function isMovingSprite() {
    return movingSpriteId !== -1;
}

function beginSpriteMoveAtCellIndex(idx) {
    const spriteId = sheetOcc[idx];
    if (spriteId === -1) return;

    // Only allow moving the currently selected sprite
    if (spriteId !== selectedSpriteId) return;

    const s = sprites[spriteId];
    if (!s) return;

    // Compute grab offset in cells (where inside the sprite the click happened)
    const clickCol = idx % sheetCols;
    const clickRow = Math.floor(idx / sheetCols);

    grabOffX = clickCol - s.xCell;
    grabOffY = clickRow - s.yCell;

// Clamp just in case (should already be inside sprite)
    if (grabOffX < 0) grabOffX = 0;
    if (grabOffY < 0) grabOffY = 0;
    if (grabOffX >= s.wCells) grabOffX = s.wCells - 1;
    if (grabOffY >= s.hCells) grabOffY = s.hCells - 1;


    movingSpriteId = spriteId;
    moveOrigX = s.xCell;
    moveOrigY = s.yCell;

    moveHasTarget = false;
    movePreviewOk = false;

    // Temporarily clear occupancy so we don't collide with ourselves
    stampRect(s.xCell, s.yCell, s.wCells, s.hCells, -1);
}

function commitSpriteMove() {
    if (!isMovingSprite()) return;

    const s = sprites[movingSpriteId];

    if (moveHasTarget && movePreviewOk) {
        s.xCell = moveTargetX;
        s.yCell = moveTargetY;
    } else {
        // Invalid drop → restore original position
        s.xCell = moveOrigX;
        s.yCell = moveOrigY;
        selectedSpriteId = -1; // unselect on cancel
        markSheetStaticDirty();
        requestRerender();
    }

    // Re-stamp occupancy
    stampRect(s.xCell, s.yCell, s.wCells, s.hCells, s.id);
    markSheetStaticDirty();

    movingSpriteId = -1;
    moveHasTarget = false;
    movePreviewOk = false;

    requestRerender();
}

function cancelSpriteMove(unselect = true) {
    if (!isMovingSprite()) return;

    const s = sprites[movingSpriteId];

    // Restore original position
    s.xCell = moveOrigX;
    s.yCell = moveOrigY;

    stampRect(s.xCell, s.yCell, s.wCells, s.hCells, s.id);

    movingSpriteId = -1;
    moveHasTarget = false;
    movePreviewOk = false;

    if (unselect) selectedSpriteId = -1;
    markSheetStaticDirty();
    requestRerender();
}

function initSheetStaticLayer() {
    sheetStaticCanvas = document.createElement("canvas");
    sheetStaticCanvas.width = spriteCanvas.width;
    sheetStaticCanvas.height = spriteCanvas.height;
    sheetStaticCTX = sheetStaticCanvas.getContext("2d");
    sheetStaticDirty = true;
}

function rebuildSheetStaticLayer() {
    if (!sheetStaticCTX || !sheetStaticCanvas) return;

    const ctx = sheetStaticCTX;
    ctx.clearRect(0, 0, sheetStaticCanvas.width, sheetStaticCanvas.height);

    // Base cells ONCE
    for (let y = 0; y < sheetRows; y++) {
        for (let x = 0; x < sheetCols; x++) {
            drawSquareOnCtx(
                ctx,
                x * spriteCellSize,
                y * spriteCellSize,
                spriteCellSize,
                spriteCellSize,
                true,
                uint32ToHex8(SPRITE_GRID_FILL_COLOR),
                GRID_BORDER_COLOR,
                true,
                false
            );
        }
    }

    // Sprites ONCE (use cached bitmaps)
    const scale = spriteCellSize / BASE_CELL_PX;

    for (const s of sprites) {
        if (!s) continue;

        ensureSpriteRenderCache(s, scale);

        const areaW = s.wCells * spriteCellSize;
        const areaH = s.hCells * spriteCellSize;

        const dx = (s.xCell * spriteCellSize) + ((areaW - s._cacheCanvas.width) >> 1);
        const dy = (s.yCell * spriteCellSize) + ((areaH - s._cacheCanvas.height) >> 1);

        ctx.drawImage(s._cacheCanvas, dx, dy);
    }

    sheetStaticDirty = false;
}


function ensureSpriteRenderCache(s, scale) {
    const key = scale; // scale is integer in your system (2, 1, etc)
    if (s._cacheKey === key && s._cacheCanvas) return;

    const c = document.createElement("canvas");
    c.width = (s.wPx * scale) | 0;
    c.height = (s.hPx * scale) | 0;
    const cctx = c.getContext("2d");

    for (let y = 0; y < s.hPx; y++) {
        for (let x = 0; x < s.wPx; x++) {
            const v = s.pixels[y * s.wPx + x] >>> 0;
            if (!v) continue;
            cctx.fillStyle = uint32ToHex8(v);
            cctx.fillRect(x * scale, y * scale, scale, scale);
        }
    }

    s._cacheKey = key;
    s._cacheCanvas = c;
}

function markSheetStaticDirty() {
    sheetStaticDirty = true;
    sheetMutatedThisInteraction = true;
}

function spriteSheetMouseDown(e) {
    if (e.button !== 0) return;
    if (spriteCellOn < 0) return;

    const spriteId = sheetOcc[spriteCellOn];
    if (spriteId === -1) return;

    // Select immediately
    selectedSpriteId = spriteId;

    // Begin move immediately (no threshold reliance)
    beginSpriteMoveAtCellIndex(spriteCellOn);

    // Track whether we actually moved to a new cell
    downX = mouseXSpriteCanvas;
    downY = mouseYSpriteCanvas;
    moveStarted = true;
    moveMoved = false;

    const s = sprites[movingSpriteId];
    if (s) {
        moveStartCellX = s.xCell;
        moveStartCellY = s.yCell;
    }

    e.preventDefault?.();
}




function spriteSheetMouseUp(e) {
    // If a move started but we never actually moved cells, treat as a click-select.
    if (typeof isMovingSprite === "function" && isMovingSprite()) {
        if (moveStarted && !moveMoved) {
            // Restore sprite to origin but KEEP it selected (no cancel-unselect vibe)
            cancelSpriteMove(false); // false => don't unselect
        } else {
            commitSpriteMove();
        }
        requestRerender();
    }

    moveStarted = false;
    moveMoved = false;

    if (sheetMutatedThisInteraction) {
        sheetStaticDirty = true;
        sheetMutatedThisInteraction = false;
    }
}
