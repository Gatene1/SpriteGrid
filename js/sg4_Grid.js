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

    return new Promise((resolve, reject) => {
        // async stuff here
        setTimeout(() => {
            // done
            resolve ("Refreshed!");
        }, 100);
    });
}

function zeroOutRefresh() {
    fillArrayWithZeroes();
    refreshGridOutput();
    drawGrid();
}

function changeCellColor(e) {
    lmbDown = true;

    const gx = Math.floor(mouseXGrid / cellSize);
    const gy = Math.floor(mouseYGrid / cellSize);
    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return;
    if (rmbDown) return;

    const idx = gridIndex(gx, gy);
    grid[idx] = currColor == "#f5f5f580" ? 0 : rgbToUint(colorPicker.color.rgba);

    drawGridFromRequest?.(idx);
    refreshGridOutput?.();
}

function RMB() {
    rmbDown = true;

    const gx = Math.floor(mouseXGrid / cellSize);
    const gy = Math.floor(mouseYGrid / cellSize);
    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return;

    const idx = gridIndex(gx, gy);
    grid[idx] = 0;

    refreshGridOutput?.();
    drawGridFromRequest?.(idx);
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
}

function syncCanvasToGrid() {
    const wPx = gridW * cellSize;
    const hPx = gridH * cellSize;

    canvasGrid.width  = wPx;
    canvasGrid.height = hPx;

    canvasGrid.style.width  = wPx + "px";
    canvasGrid.style.height = hPx + "px";
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