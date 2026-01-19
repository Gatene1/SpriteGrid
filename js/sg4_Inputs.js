function saveToStore() {
    savedColorSquareArray.at(colorStoresSelected).colorHeld = currColor;
    colorStores[colorStoresSelected] = currColor;
    markDirty("palette");
    drawColorSquares();
    //alert (currColor);

}

function previewScale() {
    prevCellSize = previewSelect.value;
    firstDraw = true;
    requestRerender();
}

function colorText(e) {
    if (e.target.name !== "uint32") return;
    if (sg4.StateMachine !== State.NORMAL) return;

    sg4.StateMachine = State.EDIT_UINT32_BOX;

    const u32 = parseU32Text(e.target.value);
    if (u32 === null) {
        sg4.StateMachine = State.NORMAL;
        return;
    }


    // Convert FROM selected format → native
    currColor = formatUint32ToNative(u32, sg4.ColorParadigm);

    const bytes = unpackNative(currColor);

    colorPicker.color.set(bytesToIro(bytes));
    colorTextElement.value = bytesToHex8(bytes);

    drawPreviewSquare(100);
    sg4.StateMachine = State.NORMAL;
}


function workingGridToMouseSprite() {
    // must contain something
    let any = false;
    for (let i = 0; i < grid.length; i++) {
        if ((grid[i] >>> 0) !== 0) { any = true; break; }
    }
    if (!any) return;

    const wPx = gridW | 0;
    const hPx = gridH | 0;

    // Copy pixels into a plain Uint32Array
    const pixels = new Uint32Array(wPx * hPx);
    for (let i = 0; i < pixels.length; i++) pixels[i] = grid[i] >>> 0;

    // Convert px -> sheet cells (16px base)
    const wCells = Math.max(1, Math.ceil(wPx / BASE_CELL_PX));
    const hCells = Math.max(1, Math.ceil(hPx / BASE_CELL_PX));

    mouseSprite = { wPx, hPx, pixels, wCells, hCells };

    spriteHeld = true;
    pasteSprite = true;
    eraseTool = false;
    requestRerender();
}



function spriteSheetToWorkingGrid() {
    if (selectedSpriteId < 0) return;

    const s = sprites[selectedSpriteId];
    if (!s) return;

    gridW = s.wPx | 0;
    gridH = s.hPx | 0;

    gridWInput.value = gridW;
    gridHInput.value = gridH;

    if (gridW !== gridH) {
        gridDimsLocked = false;
        gridLockBtn.classList.toggle("linkOff", !gridDimsLocked);
        gridLockBtn.setAttribute("aria-pressed", "false");
    }

    allocGrid(gridW, gridH, false);

    // Copy pixels
    for (let i = 0; i < grid.length; i++) {
        grid[i] = s.pixels[i] >>> 0;
    }

    // Reset working-grid cell size to normal 24
    cellSize = 24;
    cellSizeRange.value = cellSize;
    cSizeRangeText.value = cellSize + " Pixels";

    // Force visible refresh immediately (no “click inside window” required)
    //drawGrid();
    forceDrawWorkingGridOnce = true;
    requestGridFullRedraw();
    requestGridOutputRefresh();
    requestRerender();
}



function eraseInSpriteSheet() {
    const dim = Math.floor(Math.sqrt(eraserGrid.length)); // 24 for your eraser
    const wPx = dim | 0;
    const hPx = dim | 0;

    // Copy into Uint32Array (new SpriteSheet-friendly format)
    const pixels = new Uint32Array(wPx * hPx);
    for (let i = 0; i < pixels.length; i++) {
        pixels[i] = eraserGrid[i] >>> 0;
    }

    const wCells = Math.max(1, Math.ceil(wPx / BASE_CELL_PX));
    const hCells = Math.max(1, Math.ceil(hPx / BASE_CELL_PX));

    mouseSprite = { wPx, hPx, pixels, wCells, hCells };

    spriteHeld = true;
    pasteSprite = false;
    eraseTool = true;
    requestRerender();
}


function createNewSpriteSheet() {
    allocSheet(sheetCols, sheetRows); // clears sheetOcc + sprites + selection
    rebuildSheetOccFromSprites();
    selectedSpriteId = -1;
    hoveredSpriteId = -1;
    spriteCellOn = -1;
    requestRerender();
    markSheetStaticDirty();
    requestRerender();
}


function trimTheWhitespace() {
    // Guard: grid must exist
    if (!window.grid || !(window.grid instanceof Uint32Array)) {
        alert("No grid data found to trim.");
        return;
    }

    const w = gridW | 0;
    const h = gridH | 0;

    if (w <= 0 || h <= 0 || window.grid.length !== w * h) {
        alert("Grid is in an invalid state. Cannot trim.");
        return;
    }

    // Find bounds of non-empty pixels (non-zero).
    let minX = w, minY = h, maxX = -1, maxY = -1;

    for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
            const v = window.grid[row + x] >>> 0;
            if (v !== 0) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    // If nothing is drawn, don't shrink to nothing.
    if (maxX < 0 || maxY < 0) {
        alert("Nothing to trim — the grid is empty.");
        return;
    }

    const newW = (maxX - minX + 1) | 0;
    const newH = (maxY - minY + 1) | 0;

    // If bounds equal current size, nothing to do.
    if (newW === w && newH === h) {
        alert("No whitespace found — already tightly fit.");
        return;
    }

    // Create new grid and copy pixels.
    const newGrid = new Uint32Array(newW * newH);

    for (let y = 0; y < newH; y++) {
        const srcRow = (minY + y) * w;
        const dstRow = y * newW;
        for (let x = 0; x < newW; x++) {
            newGrid[dstRow + x] = window.grid[srcRow + (minX + x)] >>> 0;
        }
    }

    // Apply new grid + dimensions
    gridW = newW;
    gridH = newH;
    window.grid = newGrid;
    window.gridTemp = new Uint32Array(newW * newH);

    // Sync UI inputs (if they exist)
    if (typeof gridWInput !== "undefined" && gridWInput) gridWInput.value = String(gridW);
    if (typeof gridHInput !== "undefined" && gridHInput) gridHInput.value = String(gridH);
    if (typeof gridSizeRangeText !== "undefined" && gridSizeRangeText) {
        gridSizeRangeText.value = `${gridW} x ${gridH}`;
    }

    markDirty("grid");
    requestGridFullRedraw();
    scheduleGridOutputRefresh();
    //drawGrid?.();
    //markSheetStaticDirty();
    requestRerender();

    if (gridLockBtn.ariaPressed === "true" && (gridWInput.value !== gridHInput.value)) {
        gridDimsLocked = false;
        gridLockBtn.classList.toggle("linkOff", !gridDimsLocked);
        gridLockBtn.setAttribute("aria-pressed", "false");
    }
}


function saveLevelGridAsPNG() {
    const exportSizeWidth = levelCanvasWidth;
    const exportSizeHeight = levelCanvasHeight;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = exportSizeWidth;
    tempCanvas.height = exportSizeHeight;

    tempCtx.drawImage(
        levelCanvas,   // source canvas
        0, 0, exportSizeWidth, exportSizeHeight,   // source area
        0, 0, exportSizeWidth, exportSizeHeight    // destination
    );

    const dataURL = tempCanvas.toDataURL("image/png");
    link.href = dataURL;
    link.download = "canvas_image.png"
    link.click();
}

function levelUseSpriteChosen() {
    let tempGrid = [];
    let i;
    let spriteDimension;
    if (spriteChosen >= 0) {
        if (spriteGrid[spriteChosen] != null) {
            // spriteDimension = Math.floor(Math.sqrt(spriteGrid[spriteChosen].grid.length));
            levelSpriteHeld = true;
            /*for (i = 0; i < spriteGrid[spriteChosen].grid.length; i++) {
                tempGrid.push(spriteGrid[spriteChosen].grid[i]);
            }
            levelMouseSprite = new spriteSquareIcon(spriteDimension, tempGrid);*/
            levelMouseSprite = spriteChosen;
            //alert(spriteGrid[spriteChosen].gridColors);
            pasteLevelSprite = true;
            requestRerender();
        }
    }
}

function bumpGrid(dx, dy) {
    // Guard rails
    if (!window.grid || !(window.grid instanceof Uint32Array)) return;
    if (!isNotEmpty(1)) return;

    const w = gridW | 0;
    const h = gridH | 0;
    if (w <= 0 || h <= 0) return;
    if (window.grid.length !== w * h) return;

    // If a shift would do nothing, bail early
    if (dx === 0 && dy === 0) return;
    if (Math.abs(dx) >= w || Math.abs(dy) >= h) {
        // shifting by >= dimension would erase everything — not allowed
        alert("Bump is too large for the current grid.");
        return;
    }

    const src = window.grid;
    const dst = new Uint32Array(w * h); // auto-filled with 0 (transparent)

    // Copy pixels with bounds check
    for (let y = 0; y < h; y++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;

        for (let x = 0; x < w; x++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;

            dst[ny * w + nx] = src[y * w + x];
        }
    }

    window.grid = dst;
    window.gridTemp = new Uint32Array(w * h);

    markDirty("grid");
    //refreshGridOutput?.();
    requestGridFullRedraw();
    requestGridOutputRefresh();
    // redrawGridOverlay();
    //markSheetStaticDirty();
    requestRerender();

}
