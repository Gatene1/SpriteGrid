function requestGridOutputRefresh() {
    clearTimeout(gridOutputTimer);
    gridOutputTimer = setTimeout(() => {
        refreshGridOutput?.();
    }, 150);
}


function changeCellSize() {
    cSizeRangeText.value = cellSizeRange.value + " Pixels";
    cellSize = cellSizeRange.value;
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

function fillSpriteGridArrayWithNulls() {
    let i;
    spriteGrid = [];
    for (i = 0; i < spriteGridSize; i++) {
        spriteGrid.push(null);
    }
}

function refreshGridOutput() {
    let i;
    gridOutput.value = "grid = [  ";

    // This begins with 0, and ends in - 1, because I want the last element of the grid[] array to not have a ","
    // after it.
    for (i = 0; i < gridW * gridH - 1; i++) {
        //gridOutput.value = gridOutput.value + "\"" + grid[i] + "\", ";
        gridOutput.value = gridOutput.value + grid[i] + ", ";
    }
    // This will show the last value of the grid[] array, and end the output with a "];".
    //gridOutput.value = gridOutput.value + "\"" + grid[gridSize * gridSize - 1] + "\"  ];";
    gridOutput.value = gridOutput.value + grid[gridW * gridH - 1] + "  ];";
}

function zeroOutRefresh() {
    fillArrayWithZeroes();
    clearOffscreen();
    requestGridFullRedraw();
    redrawGridOverlay();
    void refreshGridOutput();
    //drawGrid();
}

function changeCellColor() {
    lmbDown = true;

    const gx = Math.floor(mouseXGrid / cellSize);
    const gy = Math.floor(mouseYGrid / cellSize);
    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return;
    if (rmbDown) return;

    const idx = gridIndex(gx, gy);
    const next = (currColor == "#f5f5f580") ? 0 : rgbToUint(colorPicker.color.rgba);

    if (grid[idx] === next) return;

    grid[idx] = next;
    requestCellRedraw(idx);
    pendingGridOutputRefresh = true;
}

function RMB() {
    rmbDown = true;

    const gx = Math.floor(mouseXGrid / cellSize);
    const gy = Math.floor(mouseYGrid / cellSize);
    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return;

    const idx = gridIndex(gx, gy);
    const next = 0;

    if (grid[idx] === next) return;

    grid[idx] = next;
    requestCellRedraw(idx);
    pendingGridOutputRefresh = true;
}



function LMBRelease() {
    lmbDown = false;
}

function RMBRelease() {
    rmbDown = false;
}

function siphonColor() {
    currColor = grid[mouseToGrid] == 0 ? 16777215 : grid[mouseToGrid];
    colorPicker.color.hexString = uint32ToHex8(currColor);
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
            if (pasteLevelSprite) {
                //levelGrid[levelCellOn] = levelMouseSprite;
                levelGrid[levelCellOn] = spriteChosen;
            }
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
    let i;
    let returnValue = false;
    switch (whichArray) {
        case 1:
            for (i = 0; i < grid.length; i++) {
                if (grid[i] != "0" && grid[i] != null) returnValue = true;
            }
            break;
        case 4:
            for (i = 0; i < spriteGrid[spriteCellOn].gridColors.length; i++) {
                if (spriteGrid[spriteCellOn].gridColors[i] != "0" && spriteGrid[spriteCellOn].gridColors[i] != null) returnValue = true;
            }
            break;
        case 5:
            for (i = 0; i < levelGrid[spriteCellOn].grid.length; i++) {
                if (levelGrid[spriteCellOn].grid[i] != "0" && spriteGrid[spriteCellOn].grid[i] != null) returnValue = true;
            }
            break;
    }
    return returnValue;
}

function levelClickFunction() {
    if (pasteLevelSprite)
        addToLevelGrid(1);
    else
        if (isNotEmpty(5)) levelSpriteChosen = levelCellOn;
}

function showBgFunc() {
    showBgBool = !showBgBool;
    bgColorChoose = showBgBool ? colorPicker.color.rgbaString : 4294967295;
    firstDraw = true;
}

function applyNewGridDimensions() {
    const w = parseInt(gridWInput.value, 10);
    const h = parseInt(gridHInput.value, 10);
    allocGrid(w, h, true);   // preserve pixels (crop/pad)
    refreshGridOutput?.();

    if (gridW * gridH > 4096) {
        showTheGrid = false;
        showGridCheckbox.checked = false;
    }

    syncCanvasToGrid();
    requestGridFullRedraw();
    redrawGridOverlay();
}

function syncCanvasToGrid() {
    const wPx = gridW * cellSize;
    const hPx = gridH * cellSize;

    canvasGrid.width  = wPx;
    canvasGrid.height = hPx;
    canvasGrid.style.width  = wPx + "px";
    canvasGrid.style.height = hPx + "px";

    // overlay canvas matches exactly
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

function redrawGridFast() {
    ensureGridBackbuffer(gridW, gridH);

    for (let i = 0; i < grid.length; i++) {
        const v = grid[i] >>> 0;
        if (v === 0) {
            gridImageU32[i] = 0; // transparent
        } else {
            const hex = uint32ToHex8(v);           // your “truth”
            gridImageU32[i] = hex8ToAABBGGRR(hex); // canvas order
        }
    }

    // Paint pixels 1:1 onto a tiny offscreen-sized surface
    // BUT we want them scaled up to cellSize, so…
    ctxGrid.putImageData(gridImageData, 0, 0);

    // Scale to your visible canvas using drawImage
    // You’ll need an offscreen canvas for the 1:1 image
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

    // 2) background color layer
    if (showBgBool) {
        canvasGridCTX.fillStyle = uIntToRgbaString(bgColorChoose);
        canvasGridCTX.fillRect(0, 0, canvasGrid.width, canvasGrid.height);
    }

    // 3) alpha checkerboard behind pixels
    if (showAlpha) {
        canvasGridCTX.fillStyle = alphaPattern;
        canvasGridCTX.fillRect(0, 0, canvasGrid.width, canvasGrid.height);
    }

    // 4) scaled pixels
    canvasGridCTX.imageSmoothingEnabled = false;
    canvasGridCTX.drawImage(
        gridOffCanvas,
        0, 0, gridW, gridH,
        2, 2, gridW * cellSize, gridH * cellSize
    );
}

function clearOffscreen() {
    if (gridOffU32) gridOffU32.fill(0);
    if (gridOffCtx && gridOffImg) gridOffCtx.putImageData(gridOffImg, 0, 0);
}