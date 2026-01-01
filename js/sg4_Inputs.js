function saveToStore() {
    savedColorSquareArray.at(colorStoresSelected).colorHeld = currColor;
    colorStores[colorStoresSelected] = currColor;
    //alert (currColor);

}

function previewScale() {
    prevCellSize = previewSelect.value;
    firstDraw = true;
}

function colorText() {
    currColor = colorTextElement.value;
    colorPicker.color.hex8String = currColor;
}

function workingGridToMouseSprite() {
    let spriteDimension = Math.floor(Math.sqrt(grid.length));
    let i;
    if (isNotEmpty(1)) {
        gridCopy = [];
        for (i = 0; i < gridW * gridH; i++) {
            gridCopy.push(grid[i]);
        }
        // This will create the mouseSprite Object
        mouseSprite = new spriteSquareIcon(spriteDimension, gridCopy);
        spriteHeld = true;
        pasteSprite = true;
        eraseTool = false;
    }
}

function spriteSheetToWorkingGrid() {
    let i;
    if (spriteChosen >= 0) {
        gridCopy = [];
        gridSizeRange.value = spriteGrid[spriteChosen].sizeOfGrid;
         changeGridSize();
        for (i = 0; i < spriteGrid[spriteChosen].gridColors.length; i++) {
            gridCopy.push(spriteGrid[spriteChosen].gridColors[i]);
        }
        grid = gridCopy;
        gridCopy = [];
        refreshGridOutput();
    }
    //firstDraw = true;
    drawGrid();
}

function eraseInSpriteSheet() {
    let spriteDimension = Math.floor(Math.sqrt(eraserGrid.length));
    let i;
    gridCopy = [];
    for (i = 0; i < eraserGrid.length; i++) {
        gridCopy.push(eraserGrid[i]);
    }
    mouseSprite = new spriteSquareIcon(spriteDimension, gridCopy);
    spriteHeld = true;
    pasteSprite = false;
    eraseTool = true;
}

function createNewSpriteSheet() {
    spriteGrid = [];
    fillSpriteGridArrayWithNulls();
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

    // Redraw
    void refreshGridOutput?.();
    redrawGridOverlay();
    drawGrid?.();
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
        }
    }
}

function bumpGrid(dx, dy) {
    // Guard rails
    if (!window.grid || !(window.grid instanceof Uint32Array)) return;

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

    refreshGridOutput?.();
    drawGrid?.();
}
