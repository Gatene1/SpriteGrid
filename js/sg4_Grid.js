function requestGridOutputRefresh() {
    clearTimeout(gridOutputTimer);
    gridOutputTimer = setTimeout(() => {
        refreshGridOutput?.();
    }, 150);
}


function changeCellSize() {
    cSizeRangeText.value = cellSizeRange.value + " Pixels";
    cellSize = cellSizeRange.value;
    updateViewCells();
    syncCanvasToGrid();
    requestGridFullRedraw();
    redrawGridOverlay();
}

function changeGridSize() {
    gridSizeRangeText.value = gridSizeRange.value + " X " + gridSizeRange.value;

    //gridSize = gridSizeRange.value;
    gridSize = gridW * gridH;
    //grid = new Uint32Array(gridSize * gridSize);
    fillArrayWithZeroes();
    refreshGridOutput();
}

function gridIndex(x, y) {
    return (y * gridW) + x;
}

function allocGrid(newW, newH, preserve = true) {
    newW = Math.max(1, newW | 0);
    newH = Math.max(1, newH | 0);

    const next = new Uint32Array(newW * newH);

    if (preserve && grid && grid.length) {
        const copyW = Math.min(gridW, newW);
        const copyH = Math.min(gridH, newH);
        for (let y = 0; y < copyH; y++) {
            const srcRow = y * gridW;
            const dstRow = y * newW;
            for (let x = 0; x < copyW; x++) {
                next[dstRow + x] = grid[srcRow + x];
            }
        }
    }

    gridW = newW;
    gridH = newH;
    grid = next;

    window.grid = grid;
    window.gridTemp = new Uint32Array(gridW * gridH);

    // Update title / UI as needed
    if (typeof titleBar !== "undefined" && titleBar) {
        titleBar.innerHTML = `Working Grid - Unknown.gat &#x1F4C2; (${gridW}x${gridH})`;
    }
}


function fillArrayWithZeroes() {
    /*//let i;
    //grid = [];
    grid = new Uint32Array(gridSize * gridSize);
    // for (i = 0; i < gridSize * gridSize; i++) {
    //     grid.push("0");
    // }
    titleBar.innerHTML = "Working Grid - Unknown.gat &#x1F4C2;";*/
    allocGrid(gridW, gridH, false); // same dims, clears
}

/*function fillSpriteGridArrayWithNulls() {
    let i;
    spriteGrid = [];
    for (i = 0; i < spriteGridSize; i++) {
        spriteGrid.push(null);
    }
}*/

function refreshGridOutput() {
    const len = gridW * gridH;
    const parts = new Array(len);

    for (let i = 0; i < len; i++) {
        parts[i] = grid[i] === 0 ? String(0) : String(nativeToFormatUint32(grid[i], sg4.ColorParadigm));
    }
    colorTextElementUint32.value = String(nativeToFormatUint32(currColor, sg4.ColorParadigm));
    gridOutput.value = "grid = [  " + parts.join(", ") + "  ];";
}


function zeroOutRefresh() {
    fillArrayWithZeroes();
    clearOffscreen();
    docState.grid.fileName = "Unknown.gat";
    clearDirty("grid");
    requestGridFullRedraw();
    redrawGridOverlay();
    void refreshGridOutput();
    pendingGridOutputRefresh = false;
    requestRerender();
}

function changeCellColor() {
    lmbDown = true;

    const gx = Math.floor(mouseXGrid / cellSize);
    const gy = Math.floor(mouseYGrid / cellSize);


    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return;
    if (rmbDown) return;

    const idx = gridIndex(gx, gy);
    const next = currColor >>> 0; // canonical already

    if (grid[idx] === next) return;


    historySetCell(idx, next); // Adds the color to the history.
    //grid[idx] = next;

    markDirty("grid");
    requestCellRedraw(idx);
    pendingGridOutputRefresh = true;
    requestRerender();
}

function RMB() {
    rmbDown = true;

    const gx = camXCells + Math.floor(mouseXGrid / cellSize);
    const gy = camYCells + Math.floor(mouseYGrid / cellSize);

    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return;

    const idx = gridIndex(gx, gy);
    const next = 0;

    if (grid[idx] === next) return;


    historySetCell(idx, next);
    //grid[idx] = next;

    requestCellRedraw(idx);
    pendingGridOutputRefresh = true;
    requestRerender();
    markDirty("grid");
}



function LMBRelease() {
    lmbDown = false;
}

function RMBRelease() {
    rmbDown = false;
}

function siphonColor() {
    const v = grid[mouseToGrid] >>> 0;
    if (v === 0) return;

    currColor = v;

    const bytes = unpackNative(v);
    colorPicker.color.set(bytesToIro(bytes));

    colorTextElement.value = bytesToHex8(bytes);
    colorTextElementUint32.value = String(nativeToFormatUint32(v, sg4.ColorParadigm));

    drawPreviewSquare(100);
}



function addToSpriteGrid(whichTool) {
    switch (whichTool) {
        case 1:
            spriteGrid[spriteCellOn] = mouseSprite;
            mouseSpriteSheetLeave();
            break;
        case 2:
            spriteGrid[spriteCellOn] = null;
            spriteChosen = -1;
            break;
    }
}

function addToLevelGrid(whichTool) {
    switch (whichTool) {
        case 1:
            if (!pasteLevelSprite) return;
            if (levelCellOn == null || levelCellOn < 0) return;

            // prefer the sprite you’re actually holding for paintbrush behavior
            const id = (typeof levelMouseSprite !== "undefined" && levelMouseSprite != null)
                ? levelMouseSprite
                : spriteChosen;

            if (id == null || id < 0) return;

            levelSetCell(levelCellOn, id);
            break;
    }
}


function clickFunction() {
    if (eraseTool)
        addToSpriteGrid(2);
    else if (pasteSprite)
        addToSpriteGrid(1);
    else
        if (spriteChosen == spriteCellOn)
            spriteChosen = -1;
        else
            if (isNotEmpty(4)) spriteChosen = spriteCellOn;
}

function isNotEmpty(whichArray) {
    switch (whichArray) {
        case 1:
            for (let i = 0; i < grid.length; i++) {
                if (grid[i] !== 0 && grid[i] != null) return true;
            }
            return false;

        case 4:
            if (!spriteGrid || spriteCellOn == null || spriteCellOn < 0) return false;
            if (!spriteGrid[spriteCellOn]) return false;
            for (let i = 0; i < spriteGrid[spriteCellOn].gridColors.length; i++) {
                if (spriteGrid[spriteCellOn].gridColors[i] !== "0" && spriteGrid[spriteCellOn].gridColors[i] != null) return true;
            }
            return false;

        case 5:
            returnValue = (levelCellOn != null &&
                levelCellOn >= 0 &&
                levelHasSpriteAt(levelCellOn));
            break;
    }
    return false;
}


function levelClickFunction() {
    if (pasteLevelSprite) {
        addToLevelGrid(1);
    } else {
        if (levelHasSpriteAt(levelCellOn)) levelSpriteChosen = levelCellOn;
    }
}

function showBgFunc() {
    showBgBool = !showBgBool;

    if (showBgBool) {
        const bytes = iroToBytes(colorPicker.color.rgba);
        bgColorChoose = packNative(bytes.r, bytes.g, bytes.b, bytes.aByte);
    } else {
        bgColorChoose = UINT_WHITE;
    }

    requestGridFullRedraw();
    requestRerender();
}


function applyNewGridDimensions() {
    const w = parseInt(gridWInput.value, 10);
    const h = parseInt(gridHInput.value, 10);
    allocGrid(w, h, true);   // preserve pixels (crop/pad)
    scheduleGridOutputRefresh();

    markDirty("grid");
    requestGridFullRedraw();
    requestGridOutputRefresh();
    //markSheetStaticDirty();
    // redrawGridOverlay();
    syncReticleToWorkingGrid();
}

function syncCanvasToGrid() {
    const wPx = gridW * cellSize;
    const hPx = gridH * cellSize;

    canvasGrid.width  = wPx;
    canvasGrid.height = hPx;
    canvasGrid.style.width  = wPx + "px";
    canvasGrid.style.height = hPx + "px";

    canvasGridLines.width  = wPx;
    canvasGridLines.height = hPx;
    canvasGridLines.style.width  = wPx + "px";
    canvasGridLines.style.height = hPx + "px";
}




function ensureGridBackbuffer(w, h) {
    if (gridImageData && gridImageData.width === w && gridImageData.height === h) return;
    gridImageData = ctxGrid.createImageData(w, h);
    gridImageU32  = new Uint32Array(gridImageData.data.buffer);
}

function requestGridFullRedraw() {
    gridFullDirty = true;
}

function ensureGridOffscreen(w, h) {
    if (gridOffImg && gridOffImg.width === w && gridOffImg.height === h) return;

    gridOffCanvas = document.createElement("canvas");
    gridOffCanvas.width = w;
    gridOffCanvas.height = h;

    gridOffCtx = gridOffCanvas.getContext("2d", { willReadFrequently: false });
    gridOffImg = gridOffCtx.createImageData(w, h);
    gridOffU32 = new Uint32Array(gridOffImg.data.buffer);
}

function blitFullGridToOffscreen() {
    ensureGridOffscreen(gridW, gridH);

    // grid is Uint32Array already; 0 means transparent
    gridOffU32.set(grid);

    gridOffCtx.putImageData(gridOffImg, 0, 0);
}

function blitDirtyCellsToOffscreen(dirtySet) {
    ensureGridOffscreen(gridW, gridH);

    // find a bounding box so we do ONE putImageData, not 500 of them
    let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;

    for (const idx of dirtySet) {
        gridOffU32[idx] = grid[idx]; // direct write
        const x = idx % gridW;
        const y = (idx / gridW) | 0;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }

    if (maxX < 0) return;

    const w = (maxX - minX + 1);
    const h = (maxY - minY + 1);

    gridOffCtx.putImageData(gridOffImg, 0, 0, minX, minY, w, h);
}

function presentOffscreenToVisible() {
    // clear
    canvasGridCTX.clearRect(0, 0, canvasGrid.width, canvasGrid.height);

    // background color layer
    if (showBgBool) {
        canvasGridCTX.fillStyle = nativeToHex8(bgColorChoose);
        canvasGridCTX.fillRect(0, 0, canvasGrid.width, canvasGrid.height);
    }

    // alpha checkerboard behind pixels
    if (showAlpha) {
        canvasGridCTX.fillStyle = alphaPattern;
        canvasGridCTX.fillRect(0, 0, canvasGrid.width, canvasGrid.height);
    }

    // scaled pixels (full grid)
    canvasGridCTX.imageSmoothingEnabled = false;
    canvasGridCTX.drawImage(
        gridOffCanvas,
        0, 0, gridW, gridH,
        0, 0, gridW * cellSize, gridH * cellSize
    );
}



function clearOffscreen() {
    if (gridOffU32) gridOffU32.fill(0);
    if (gridOffCtx && gridOffImg) gridOffCtx.putImageData(gridOffImg, 0, 0);
}

function scheduleGridOutputRefresh() {
    clearTimeout(gridOutputTimer);
    gridOutputTimer = setTimeout(() => {
        void refreshGridOutput();
    }, 300); // try 150–300
}

function handleGridDimEnter(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    applyNewGridDimensions();
}

function changeCellSizeByWheel(e) {
    if (e.altKey) {
        e.preventDefault();
       if (e.deltaY < 0) { // If scrolled up with the mouse wheel.
           if (cellSize < 24) {
               cellSize += 2;
               cSizeRangeText.value = cellSize.toString() + " Pixels";
               cellSizeRange.value = cellSize;
               forceDrawWorkingGridOnce = true;
               syncReticleToWorkingGrid();
               syncCanvasToGrid();
               redrawGridOverlay();
               requestGridFullRedraw();
           }
       } else if (e.deltaY > 0) { // If scrolled down with the mouse wheel.
           if (cellSize > 2) {
               cellSize -= 2;
               cSizeRangeText.value = cellSize.toString() + " Pixels";
               cellSizeRange.value = cellSize;
               forceDrawWorkingGridOnce = true;
               syncReticleToWorkingGrid();
               syncCanvasToGrid();
               redrawGridOverlay();

               requestGridFullRedraw();
           }
       }
    }
}

function clampCameraToGrid() {
    sg4.camXCells = Math.max(0, Math.min(sg4.camXCells, sg4.gridW - sg4.viewWCells));
    sg4.camYCells = Math.max(0, Math.min(sg4.camYCells, sg4.gridH - sg4.viewHCells));
}
