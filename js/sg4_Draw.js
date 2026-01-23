function drawAll() {
    // Each if-statement will check to see if this is the initial drawing of WebApp or if the Window is active and
    // the Window is visible, then draw its contents.
    if (isWindowActive(0, true) || forceDrawWorkingGridOnce) {
        if (firstDraw || gridFullDirty) {
            syncCanvasToGrid();
            redrawGridOverlay();

            blitFullGridToOffscreen();
            presentOffscreenToVisible();
            gridFullDirty = false;
            dirtyCells.clear();
            gridDirty = false;
        } else if (dirtyCells.size) {
            blitDirtyCellsToOffscreen(dirtyCells);
            presentOffscreenToVisible();
            dirtyCells.clear();
        } else if (viewDirty) {
            presentOffscreenToVisible();
            viewDirty = false;
        }


        drawPreviewUpdate();
        forceDrawWorkingGridOnce = false;
        //drawGridFast();

    }

    // NEW: Preview window draws independently
    if (isWindowActive(1, true)) {
        drawPreviewUpdate();
    }

    if (isWindowActive(2, true)){
        drawColorSquares();
        drawPreviewSquare(100);
    }
    if (isWindowActive(5, false)) { drawSpriteSheetCanvasUpdateV2(); }
    if (isWindowActive(6, false)) {
        drawLevelCanvasUpdate();
        drawLevelExtendIcon();
    }

    if (firstDraw) firstDraw = false;
}

function whichCanvas(canvasToFigureOut) {
    let canvasChoice;
    switch (canvasToFigureOut) {
        case 0:
            canvasChoice = canvasGridCTX;
            break;
        case 1:
            canvasChoice = colorCanvasCTX;
            break;
        case 2:
            canvasChoice = colorChooseRow1CTX;
            break;
        case 3:
            canvasChoice = previewWindowCTX;
            break;
        case 4:
            canvasChoice = spriteCanvasCTX;
            break;
        case 5:
            canvasChoice = levelCanvasCTX;
            break;
    }

    return canvasChoice;

}

function drawSquare (x, y, width, height, stroke, fillColor, whichCanvas = 0,
                     strokeColor = GRID_BORDER_COLOR, fill = true, checkerBg = false) {
    let canvasChoice = canvasGridCTX;

    switch (whichCanvas) {
        case 0: canvasChoice = canvasGridCTX; break;
        case 1: canvasChoice = colorCanvasCTX; break;
        case 2: canvasChoice = colorChooseRow1CTX; break;
        case 3: canvasChoice = previewWindowCTX; break;
        case 4: canvasChoice = spriteCanvasCTX; break;
        case 5: canvasChoice = levelCanvasCTX; break;
    }

    if (checkerBg) {
        canvasChoice.fillStyle = alphaPattern;
        canvasChoice.fillRect(x, y, width, height);
    }

    if (fill) {
        canvasChoice.fillStyle = fillColor;
        canvasChoice.fillRect(x, y, width, height);
    }

    // Bringing stroke back for other windows.
    if (stroke) {
        canvasChoice.strokeStyle = strokeColor;
        canvasChoice.lineWidth = 1;
        // crisp-ish 1px strokes on whole pixels
        canvasChoice.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(width), Math.floor(height));
    }
}

function drawSquareOnCtx(ctx, x, y, width, height, stroke, fillColor,
                         strokeColor = GRID_BORDER_COLOR, fill = true, checkerBg = false) {
    if (checkerBg) {
        ctx.fillStyle = alphaPattern;
        ctx.fillRect(x, y, width, height);
    }

    if (fill) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width, height);
    }

    if (stroke) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(width), Math.floor(height));
    }
}



// Helper function for the drawGrid methods below, by Sprucey-Poo :-*
function getCellXY(index, border = true) {
    const row = Math.floor(index / gridW);
    const col = index % gridW;

    const inset = border ? 2 : 0;
    return {
        x: col * cellSize + inset,
        y: row * cellSize + inset
    };
}

function drawPreviewSquare(dimensions) {
    drawSquare(2, 2, dimensions, dimensions, true, colorPicker.color.rgbaString, 1, GRID_BORDER_COLOR, true, true);
}

function drawText (whatToSay, x, y, fontSize, fontColor, canvasChoice = canvasGridCTX) {
    let drawCanvas;
    if (canvasChoice != canvasGridCTX) drawCanvas = whichCanvas(canvasChoice);
    drawCanvas.font = fontSize + "px Trebuchet MS";
    drawCanvas.fillStyle = fontColor;
    drawCanvas.fillText(whatToSay, x, y);
}

function drawColorSquares() {
    // draw every time using the current data, regardless of "alreadyDeclared"
    for (let i = 0; i <= savedColorSquare.count; i++) {
        const sq = savedColorSquareArray[i];
        if (!sq) continue;

        // keep geometry stable after first time
        if (!alreadyDeclaredSavedColorClasses) {
            sq.x1 = colorStoresBorderSize;
            sq.x2 = colorStoresBorderSize * 2 + colorStoresSquareSize;
            sq.y1 = colorStoresSquareSize * i + colorStoresBorderSize + (i * colorStoresSquareGap);
            sq.y2 = sq.y1 + colorStoresSquareSize + colorStoresBorderSize;
        }

        // ALWAYS sync the held color from the store (and force uint32)
        sq.colorHeld = (colorStores[i] >>> 0);

        // ALWAYS recompute border color (selection can change)
        sq.borderColor = (sq.num === colorStoresSelected) ? GRID_BORDER_COLOR : "#000000";

        // ALWAYS draw with a real CSS color string
        drawSquare(
            sq.x1,
            sq.y1,
            colorStoresSquareSize,
            colorStoresSquareSize,
            true,
            nativeToHex8(sq.colorHeld),   // <-- key fix
            2,
            sq.borderColor,
            true,
            true
        );
    }

    alreadyDeclaredSavedColorClasses = true;
}


function drawPreviewUpdate() {
    let i, j;
    let localCurrCell, currCellColor;
    const layout = getPreviewLayout();
    const { scale, drawW, drawH, offX, offY } = layout;
    const dw = Math.round(gridW * scale);
    const dh = Math.round(gridH * scale);
    const maxScale = Math.min(256 / gridW, 256 / gridH);



    if (dw > MAX_PREV_IMAGE_WIDTH || dh > MAX_PREV_IMAGE_HEIGHT) {
        drawPreviewOverlayMessage([
            "Preview too large",
            `Preview is ${dw}×${dh} (max 256×256)`,
            "Lower magnification",
            `Try scale ≤ ${Math.floor(maxScale)}`
        ]);
        return; // stop drawing reticle, optional
    }

    previewWindowCTX.clearRect(0, 0, 300, 300);
    //alert ("GridSize = " + gridSize);

    for (i = 0; i < gridH; i++) {
        for (j = 0; j < gridW; j++) {
            localCurrCell = (i * gridW) + j; // FIX

            if (grid[localCurrCell] == 0) {
                currCellColor = 4294967295;
            } else {
                currCellColor = grid[localCurrCell];
            }

            const x = offX + j * scale;
            const y = offY + i * scale;

            drawSquare(x, y, prevCellSize, prevCellSize, false,
                nativeToHex8(currCellColor), 3);
        }
    }
    drawPreviewNavigator(layout);
}

function getPreviewReticleNudge(scale) {
    // Half a cell in preview pixel space, so the reticle appropriately shows up.
    return { x: scale / 2, y: scale / 2 };
}


function getPreviewLayout() {
    const scale = Number(previewSelect.value); // pixels per cell in preview
    const drawW = gridW * scale;
    const drawH = gridH * scale;

    const offX = Math.floor((PREV_CANVAS_WIDTH  - drawW) / 2);
    const offY = Math.floor((PREV_CANVAS_HEIGHT - drawH) / 2);

    return { scale, drawW, drawH, offX, offY };
}

function previewReticleDrag(e) {
    updateViewCells();

    // mouse position in preview canvas pixels (robust to CSS scaling)
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    const { scale, offX, offY } = getPreviewLayout();

    // mouse -> cell space (float)
    const sx = (mx - offX) / scale;
    const sy = (my - offY) / scale;

    // ignore if dragging outside the previewed grid bounds
    if (sx < 0 || sy < 0 || sx >= gridW || sy >= gridH) return;

    // treat mouse as reticle CENTER
    let nextCamX = Math.floor(sx - viewWCells / 2);
    let nextCamY = Math.floor(sy - viewHCells / 2);

    // clamp camera so viewport stays inside the *actual* grid dims
    const maxCamX = Math.max(0, gridW - viewWCells);
    const maxCamY = Math.max(0, gridH - viewHCells);

    nextCamX = Math.min(maxCamX, Math.max(0, nextCamX));
    nextCamY = Math.min(maxCamY, Math.max(0, nextCamY));

    const div = gridScrollDiv || document.querySelector(".divInnerBottomCanvasGrid");
    if (div) {
        div.scrollLeft = nextCamX * cellSize;
        div.scrollTop  = nextCamY * cellSize;
    }
    syncReticleToWorkingGrid();
}



function drawPreviewNavigator(layout) {
    if (!showReticle) return;
    updateViewCells();
    const { scale, offX, offY } = layout;


    //const { scale, offX, offY } = getPreviewLayout();
    const { x: nudgeX, y: nudgeY } = getPreviewReticleNudge(scale);
    //const { nudgeX, nudgeY } = getPreviewReticleNudge(); // computed from DOM/CSS padding or draw origin

    const retX = offX + camXCells * scale - nudgeX;
    const retY = offY + camYCells * scale - nudgeY;

    const retW = viewWCells * scale;
    const retH = viewHCells * scale;

    if (!Number.isFinite(scale) || !Number.isFinite(offX) || !Number.isFinite(offY) ||
        !Number.isFinite(camXCells) || !Number.isFinite(camYCells) ||
        !Number.isFinite(cellSize)) {
        console.warn("RETICLE BAD VALUES", { scale, offX, offY, camXCells, camYCells, cellSize });
        return;
    }


    // Don’t draw if preview is not usable yet
    if (!isFinite(retX + retY + retW + retH)) return;

    const ctx = previewCanvasCTX;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffffff";
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(retX + 0.5, retY + 0.5, retW, retH);

    // little corner handles so it reads as “navigator”
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffffff";
    const hs = 5;
    ctx.fillRect(retX, retY, hs, hs);
    ctx.fillRect(retX + retW - hs, retY, hs, hs);
    ctx.fillRect(retX, retY + retH - hs, hs, hs);
    ctx.fillRect(retX + retW - hs, retY + retH - hs, hs, hs);

    ctx.restore();
}


// This function exists so the LMB can be held to draw the sprites in multiple cells under 1 LMB press, instead
// of one at a time like in the Sprite Sheet.
function drawLevelSprite(cellOn, x, y) {
    let k = cellOn;
    let a = 0;
    let b = 0;
    let j;
    let spriteColumn = 0;

    // If there is a sprite in the LevelGrid array for the cell being drawn, then draw the sprite.
    if (levelGrid[k] != null) {
        // Center the icon in the cell.
        //a = Math.floor((levelGridCellSize - (levelGrid[k].size * levelSpriteInCellSize)) / 2);
        //b = Math.floor((levelGridCellSize - (levelGrid[k].size * levelSpriteInCellSize)) / 2);
        for (j = 0; j < spriteGrid[levelGrid[k]].sizeOfGrid * spriteGrid[levelGrid[k]].sizeOfGrid; j++) {
            if (spriteGrid[levelGrid[k]].gridColors[j] != "0")
            //if (spriteGrid[levelGrid[k].grid[j]] != "0")
                //drawSquare(x, y, levelSpriteInCellSize, levelSpriteInCellSize, false, levelGrid[k].grid[j], 5);
                //drawSquare(x + a, y + b, levelSpriteInCellSize, levelSpriteInCellSize, false, levelGrid[k].grid[j], 5);
                drawSquare(x + a, y + b, levelSpriteInCellSize, levelSpriteInCellSize, false, nativeToHex8(spriteGrid[levelGrid[k]].gridColors[j]), 5);
            spriteColumn++;
            if (spriteColumn >= spriteGrid[levelGrid[k]].sizeOfGrid) {
                spriteColumn = 0;
                a = Math.floor((levelGridCellSize - (spriteGrid[levelGrid[k]].sizeOfGrid * levelSpriteInCellSize)) / 2);
                b += levelSpriteInCellSize;
            } else {
                a += levelSpriteInCellSize;
            }

        }
    }
}

function drawLevelCanvasUpdate() {
    let a, b, i, j, k;
    let x = 0;
    let y = 0;
    let gridColumn = 0;
    let spriteColumn = 0;
    let cellCount = 0;
    let spriteGridFillColor;
    let spriteGridFillBool;

    //levelDebugging.value = levelSpriteHeld;

    // Clear the canvas, and then redraw the chosen background color.
    levelCanvasCTX.clearRect(0, 0, levelCanvasWidth, levelCanvasHeight);
    drawSquare(0, 0, levelCanvasWidth, levelCanvasHeight, false, nativeToHex8(bgColorChoose), 5);

    // Take the length of the canvas (levelCanvasWidth) and divide it / 17 (17 * 32 = 544 pixels wide for one screen)
    // Take the height of the canvas (levelCanvasHeight) and divide it / 15 (15 * 32 = 480 pixels tall for one screen)
    // Those equations above will tell how many squares to create (length/17 + height/15).
    // 17 x 13 pixels for one screen, each of these

    squaresForLevelGridWidth = Math.floor(levelCanvasWidth / levelGridCellSize); // Should be 17 initially
    squaresForLevelGridHeight = Math.floor(levelCanvasHeight / levelGridCellSize); // should be 15 initially
    levelGridSize = squaresForLevelGridWidth * squaresForLevelGridHeight;

    for (k = 0; k < levelGridSize; k++) {
        if (levelCellOn == k) {
            spriteGridFillColor = SPRITE_GRID_HOVER_FILL_COLOR;
            spriteGridFillBool = true;
        } else if (levelSpriteChosen == k) {
            spriteGridFillColor = SPRITE_GRID_HOVER_FILL_COLOR;
            spriteGridFillBool = true;
        } else {
            spriteGridFillColor = SPRITE_GRID_FILL_COLOR;
            spriteGridFillBool = false;
            drawSquare(x, y, levelGridCellSize, levelGridCellSize, showTheLevelGrid, nativeToHex8(bgColorChoose), 5, "black", true);
        }
        drawSquare(x, y, levelGridCellSize, levelGridCellSize, showTheLevelGrid, nativeToHex8(spriteGridFillColor), 5, "black", spriteGridFillBool);

        // This function exists so the LMB can be held to draw the sprites in multiple cells under 1 LMB press, instead
        // of one at a time like in the Sprite Sheet.
        drawLevelSprite(k ,x, y);

        cellCount++;
        if (cellCount >= squaresForLevelGridWidth) {
            cellCount = 0;
            y += levelGridCellSize;
            x = 0;
        } else {
            x += levelGridCellSize;
        }
    }

    // Need to reset the x and y coords to draw the mouse cursor of the sprite from either Sprite Sheet or Working Grid.
    x = 0;
    y = 0;

    // if a sprite should be on the mouse cursor, then draw it.
    if (levelSpriteHeld) {
        levelDebugging.value = spriteGrid[levelMouseSprite].sizeOfGrid;
        for (i = 0; i < spriteGrid[levelMouseSprite].sizeOfGrid * spriteGrid[levelMouseSprite].sizeOfGrid; i++) {
            if (spriteGrid[levelMouseSprite].gridColors[i] != "0")
                drawSquare(mouseXLevelCanvas + x, mouseYLevelCanvas + y, mouseSpriteCellSize, mouseSpriteCellSize, false, nativeToHex8(spriteGrid[levelMouseSprite].gridColors[i]), 5, GRID_BORDER_COLOR, true);
                //drawText("Hello World!", mouseXLevelCanvas, mouseYLevelCanvas, 32, "white", 5);
            gridColumn++;
            if (gridColumn >= spriteGrid[levelMouseSprite].sizeOfGrid) {
                gridColumn = 0;
                x = 0;
                y += mouseSpriteCellSize;
            } else {
                x += mouseSpriteCellSize;
            }
        }
    }
}

function changeLevelBG() {
    bgColorChoose = currColor;
}

function turnGridOnOff() {
    showTheGrid = showGridCheckbox.checked;
    redrawGridOverlay();
}


function redrawGridOverlay() {
    if (!canvasGridLinesCTX) return;

    canvasGridLinesCTX.clearRect(0, 0, canvasGridLines.width, canvasGridLines.height);

    if (!showTheGrid) return;

    canvasGridLinesCTX.strokeStyle = GRID_BORDER_COLOR;
    canvasGridLinesCTX.lineWidth = 1;

    updateViewCells();

    const wPx = gridW * cellSize;
    const hPx = gridH * cellSize;

// vertical lines
    for (let x = 0; x <= gridW; x++) {
        const px = x * cellSize;
        canvasGridLinesCTX.beginPath();
        canvasGridLinesCTX.moveTo(px + 0.5, 0);
        canvasGridLinesCTX.lineTo(px + 0.5, hPx);
        canvasGridLinesCTX.stroke();
    }

// horizontal lines
    for (let y = 0; y <= gridH; y++) {
        const py = y * cellSize;
        canvasGridLinesCTX.beginPath();
        canvasGridLinesCTX.moveTo(0, py + 0.5);
        canvasGridLinesCTX.lineTo(wPx, py + 0.5);
        canvasGridLinesCTX.stroke();
    }
}
function turnLevelGridOnOff() {
    showTheLevelGrid = showLevelGridCheckbox.checked;
}

function drawLevelExtendIcon() {
    //let logo { x, y };
}

function drawLevelGrid() {

}

function debugAction() {
    //gridSizeRangeText.value = divForSpriteGrid.scrollTop;
    //let startingNum = (Math.floor(divForSpriteGrid.scrollTop / spriteCellSize) * numberOfSpritesPerRow );
    //gridSizeRangeText.value = startingNum + " - " + (spriteGridViewableHeight * numberOfSpritesPerRow + startingNum - 1);

    // spriteCellSize = 64;
    // numberOfSpritesPerRow = 10
    // scrollTop will show me, basically, the Y value of what is visible...
    // So, at 133.03572082519, 20-79 is visible  (Floor(scrollTop / spriteCellSize)) * numberOfSpritesRow = starting #
    // then starting# + (numberOfSpritesRow - 1) will be the last # of the first row.
    // spriteGridViewableHeight * numberOfSpritesPerRow + starting# - 1 = ending #
}

function flipHorizontally() {
    if (!isNotEmpty(1)) return;

    const flipped = new Uint32Array(grid.length);
    const gridWidth = gridW;
    const gridHeight = gridH;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            // Get index of current pixel
            const originalIndex = y * gridWidth + x;

            // Calculate the mirrored X position
            const flippedIndex = y * gridWidth + (gridWidth - 1 - x);

            // Copy pixel into its mirrored position
            flipped[flippedIndex] = grid[originalIndex];
        }
    }
    grid = flipped;
    markDirty("grid");
    requestGridFullRedraw();
    requestGridOutputRefresh();
    //markSheetStaticDirty();
    requestRerender();
}

function flipVertically() {
    if (!isNotEmpty(1)) return;
    const flipped = new Uint32Array(grid.length);
    const gridWidth = gridW;
    const gridHeight = gridH;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const originalIndex = y * gridWidth + x;

            // Flip the Y coordinate instead
            const flippedIndex = (gridHeight - 1 - y) * gridWidth + x;

            flipped[flippedIndex] = grid[originalIndex];
        }
    }
    grid = flipped;
    markDirty("grid");
    requestGridFullRedraw();
    requestGridOutputRefresh();
    //markSheetStaticDirty();
    requestRerender();
}

function drawBg() {
    if (showBgBool) {
        drawSquare(0, 0, gridW * cellSize + 4, gridH * cellSize + 4, false, bgColorChoose, 0, GRID_BORDER_COLOR, true, false);
    } else {
        canvasGridCTX.clearRect(0, 0, canvasGrid.width * cellSize + 4, canvasGrid.height * cellSize + 4);

    }

}

function ensureImageBackbuffer(w, h){
    if (imgData && imgData.width === w && imgData.height === h) return;
    imgData = ctx.createImageData(w, h);
    imgU32 = new Uint32Array(imgData.data.buffer);
}

function redrawWholeGridFast(){
    ensureImageBackbuffer(gridW, gridH);

    // IMPORTANT: this assumes your Uint32 packing matches the browser's endianness needs.
    // Since your PNG export proved your pack is consistent, you may need to swizzle here.
    // If colors are wrong, we’ll add a tiny swizzle step.
    for (let i=0;i<window.grid.length;i++){
        imgU32[i] = packToCanvasRGBA(window.grid[i]); // see below
    }

    ctx.putImageData(imgData, 0, 0);
}

function packToCanvasRGBA(v){
    // v is your 0xRRGGBBAA
    // ImageData Uint32 wants 0xAABBGGRR on little-endian systems (which is basically all PCs).
    v >>>= 0;
    const r = (v >>> 24) & 255;
    const g = (v >>> 16) & 255;
    const b = (v >>>  8) & 255;
    const a = (v       ) & 255;
    return (a<<24) | (b<<16) | (g<<8) | r;
}

function requestCellRedraw(idx) {
    // only queue if not doing full redraw anyway
    if (!gridFullDirty) dirtyCells.add(idx);
}

function drawSpriteSheetCanvasUpdateV2() {
    const ctx = spriteCanvasCTX;

    if (!sheetStaticCanvas) initSheetStaticLayer();
    if (sheetStaticDirty) rebuildSheetStaticLayer();

    // 1) Base
    ctx.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
    ctx.drawImage(sheetStaticCanvas, 0, 0);

    const IMPORT_OK  = 4288413588; // #94ff9bff
    const IMPORT_BAD = 4283719935; // #ff6054ff

    let previewOk = false;
    let px = 0, py = 0, pw = 0, ph = 0;

    // 2) Compute hoverRect + selRect the way you already do
    let hoverRect = null;
    let selRect = null;

    const moving = (typeof isMovingSprite === "function") && isMovingSprite();

    if (!sheetStaticCanvas) initSheetStaticLayer();

    if (sheetStaticDirty) rebuildSheetStaticLayer();

    // Draw cached base
    spriteCanvasCTX.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
    spriteCanvasCTX.drawImage(sheetStaticCanvas, 0, 0);


    // Import preview
    if (spriteHeld && pasteSprite && mouseSprite && spriteCellOn >= 0) {
        const { x, y } = cellToXY(spriteCellOn);
        px = x;
        py = y;
        pw = mouseSprite.wCells;
        ph = mouseSprite.hCells;
        previewOk = canPlaceRect(px, py, pw, ph);
    }

    // Moving sprite: we DON'T draw the cell underlay while moving.
    // The sprite tint overlay handles feedback (green/red) on top of the sprite.
    if (moving) {
        pw = ph = 0;
    }


    // Hover footprint
    if (hoveredSpriteId !== -1 && sprites[hoveredSpriteId]) {
        const s = sprites[hoveredSpriteId];
        hoverRect = { x:s.xCell, y:s.yCell, w:s.wCells, h:s.hCells };
    }

    // Selection footprint
    if (selectedSpriteId !== -1 && sprites[selectedSpriteId]) {
        const s = sprites[selectedSpriteId];
        if (moving && movingSpriteId === selectedSpriteId && moveHasTarget) {
            selRect = { x:moveTargetX, y:moveTargetY, w:s.wCells, h:s.hCells };
        } else {
            selRect = { x:s.xCell, y:s.yCell, w:s.wCells, h:s.hCells };
        }
    }

    // Draw cells
    for (let y = 0; y < sheetRows; y++) {
        for (let x = 0; x < sheetCols; x++) {
            const idx = cellIndex(x, y);
            let color = SPRITE_GRID_FILL_COLOR;

            // selection footprint highlight (strongest)
            if (inRect(x, y, selRect)) color = SPRITE_GRID_CHOSEN_CELL_FILL_COLOR;
            // hover footprint highlight (next)
            else if (inRect(x, y, hoverRect)) color = SPRITE_GRID_HOVER_FILL_COLOR;
            // fallback: single cell hover
            else if (idx === spriteCellOn) color = SPRITE_GRID_HOVER_FILL_COLOR;

            // Import/move previews override cell colors.
            if (pw > 0 && ph > 0 && x >= px && x < px + pw && y >= py && y < py + ph) {
                color = previewOk ? IMPORT_OK : IMPORT_BAD;
            }

            drawSquare(
                x * spriteCellSize,
                y * spriteCellSize,
                spriteCellSize,
                spriteCellSize,
                true,
                nativeToHex8(color),
                4
            );
        }
    }

    // Draw sprites
    const scale = spriteCellSize / BASE_CELL_PX;

    for (const s of sprites) {
        if (!s) continue;

        // While moving, render the dragged sprite at the preview target.
        let drawXCell = s.xCell;
        let drawYCell = s.yCell;

        if (
            moving &&
            typeof movingSpriteId !== "undefined" &&
            s.id === movingSpriteId &&
            typeof moveHasTarget !== "undefined" && moveHasTarget
        ) {
            drawXCell = moveTargetX;
            drawYCell = moveTargetY;
        }

        const ox = drawXCell * spriteCellSize;
        const oy = drawYCell * spriteCellSize;

        const px0 = ox + ((s.wCells * spriteCellSize - s.wPx * scale) >> 1);
        const py0 = oy + ((s.hCells * spriteCellSize - s.hPx * scale) >> 1);

        for (let y = 0; y < s.hPx; y++) {
            for (let x = 0; x < s.wPx; x++) {
                const v = s.pixels[y * s.wPx + x] >>> 0;
                if (!v) continue;

                drawSquare(
                    px0 + x * scale,
                    py0 + y * scale,
                    scale,
                    scale,
                    false,
                    nativeToHex8(v),
                    4
                );
            }
        }
    }

    // ─────────────────────────────────────────────
    // Moving sprite tint overlay (green = valid, red = blocked)
    // ─────────────────────────────────────────────
    if ((typeof isMovingSprite === "function") && isMovingSprite() && movingSpriteId >= 0) {
        const s = sprites[movingSpriteId];
        if (s) {
            const tx = (moveHasTarget ? moveTargetX : s.xCell) * spriteCellSize;
            const ty = (moveHasTarget ? moveTargetY : s.yCell) * spriteCellSize;

            const ok = (moveHasTarget && movePreviewOk);

            spriteCanvasCTX.save();
            spriteCanvasCTX.globalAlpha = 0.25;
            spriteCanvasCTX.fillStyle = ok ? "rgb(0,255,0)" : "rgb(255,0,0)";
            spriteCanvasCTX.fillRect(
                tx,
                ty,
                s.wCells * spriteCellSize,
                s.hCells * spriteCellSize
            );
            spriteCanvasCTX.restore();
        }
    }


    // 3) Overlay tints (cheap)
    function fillRectCells(r, colorUint) {
        if (!r) return;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = nativeToHex8(colorUint);
        ctx.fillRect(r.x * spriteCellSize, r.y * spriteCellSize, r.w * spriteCellSize, r.h * spriteCellSize);
        ctx.restore();
    }

    fillRectCells(hoverRect, SPRITE_GRID_HOVER_FILL_COLOR);
    fillRectCells(selRect, SPRITE_GRID_CHOSEN_CELL_FILL_COLOR);

    // 4) Import / move preview (cheap)
    // Keep your existing previewOk/px/py/pw/ph logic then do:
    // ctx.globalAlpha + fillRect(...) for preview region

    // 5) Marching ants outline (your existing drawSelectionOutline)
    drawSelectionOutline();

    // 6) Eraser cursor icon (your existing code can stay)

    function inRect(col, row, r) {
        return r && col >= r.x && col < r.x + r.w && row >= r.y && row < r.y + r.h;
    }



    // ─────────────────────────────────────────────
    // Eraser cursor icon (trails the mouse)
    // ─────────────────────────────────────────────
    if (spriteHeld && eraseTool && mouseSprite && mouseSprite.pixels) {
        const pxSize = mouseSpriteCellSize; // you already have this global (looks like 2)
        const w = mouseSprite.wPx | 0;
        const h = mouseSprite.hPx | 0;

        // Center the icon on the cursor
        const startX = (mouseXSpriteCanvas - (w * pxSize) / 2) | 0;
        const startY = (mouseYSpriteCanvas - (h * pxSize) / 2) | 0;

        for (let py = 0; py < h; py++) {
            const row = py * w;
            for (let px = 0; px < w; px++) {
                const v = mouseSprite.pixels[row + px] >>> 0;
                if (!v) continue;

                drawSquare(
                    startX + px * pxSize,
                    startY + py * pxSize,
                    pxSize,
                    pxSize,
                    false,
                    nativeToHex8(v),
                    4
                );
            }
        }
    }

}




function drawSpriteIntoSheetCell_V2(spriteObj, cellX, cellY, cellPx) {
    // spriteObj is currently expected to look like your old spriteSquareIcon:
    // { sizeOfGrid, gridColors, ...plus placement fields later }

    const g = spriteObj.sizeOfGrid | 0;
    const colors = spriteObj.gridColors;

    // This is your “sprite pixel scale inside the sheet cell”
    // You already have spriteInCellSize as 1 or 2.
    const pxScale = spriteInCellSize | 0;

    // pixel art width in on-screen pixels
    const artPx = g * pxScale;

    // Center inside the sheet cell
    let ox = cellX + Math.floor((cellPx - artPx) / 2);
    let oy = cellY + Math.floor((cellPx - artPx) / 2);

    let col = 0;
    for (let i = 0; i < g * g; i++) {
        const v = colors[i] >>> 0;
        if (v !== 0) {
            drawSquare(ox, oy, pxScale, pxScale, false, nativeToHex8(v), 4);
        }

        col++;
        if (col >= g) {
            col = 0;
            ox = cellX + Math.floor((cellPx - artPx) / 2);
            oy += pxScale;
        } else {
            ox += pxScale;
        }
    }
}

function drawSpriteAssetIntoSheet_V2(spriteAsset, xPx, yPx, cellPx) {
    const wPx = spriteAsset.wPx | 0;
    const hPx = spriteAsset.hPx | 0;
    const pixels = spriteAsset.pixels;
    if (!pixels || !(pixels instanceof Uint32Array)) return;

    // Total drawable area in screen pixels (multi-cell footprint)
    const areaW = (spriteAsset.wCells * cellPx) | 0;
    const areaH = (spriteAsset.hCells * cellPx) | 0;

    // Scale each “working grid pixel” by spriteInCellSize (your existing knob)
    const pxScale = spriteInCellSize | 0;

    const artW = wPx * pxScale;
    const artH = hPx * pxScale;

    // Center inside the multi-cell area
    let ox0 = xPx + Math.floor((areaW - artW) / 2);
    let oy = yPx + Math.floor((areaH - artH) / 2);

    for (let py = 0; py < hPx; py++) {
        let ox = ox0;
        const row = py * wPx;
        for (let px = 0; px < wPx; px++) {
            const v = pixels[row + px] >>> 0;
            if (v !== 0) {
                drawSquare(ox, oy, pxScale, pxScale, false, nativeToHex8(v), 4);
            }
            ox += pxScale;
        }
        oy += pxScale;
    }
}

function startSelectionAnim() {
    if (selAnimOn) return;
    selAnimOn = true;
    requestRerender(); // kick the main loop

    /*function tick() {
        if (!selAnimOn) return;
        selDashOffset = (selDashOffset + 0.13) % 12; // speed
        requestRerender(); // or drawSpriteSheetCanvasUpdateV2()
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);*/
}

function stopSelectionAnim() {
    if (!selAnimOn) return;
    selAnimOn = false;
    requestRerender(); // so the last frame draws without ants
}

function drawSelectionOutline() {
    if (selectedSpriteId < 0) { stopSelectionAnim(); return; }
    startSelectionAnim();
    const s = sprites[selectedSpriteId];
    if (!s) return;

    const x = s.xCell * spriteCellSize;
    const y = s.yCell * spriteCellSize;
    const w = s.wCells * spriteCellSize;
    const h = s.hCells * spriteCellSize;

    const ctx = spriteCanvasCTX;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";       // black under-stroke for contrast
    ctx.setLineDash([]);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";       // white marching ants
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -selDashOffset;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    // corner handles (optional but awesome)
    ctx.setLineDash([]);
    const hs = 6;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 2, y + 2, hs, hs);
    ctx.fillRect(x + w - hs - 2, y + 2, hs, hs);
    ctx.fillRect(x + 2, y + h - hs - 2, hs, hs);
    ctx.fillRect(x + w - hs - 2, y + h - hs - 2, hs, hs);

    ctx.restore();
}

function stopEraseTool() {
    eraseTool = false;
    spriteHeld = false;
    mouseSprite = null;
}

function getScrollPaddingPx(div) {
    const cs = getComputedStyle(div);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padT = parseFloat(cs.paddingTop)  || 0;
    return { padL, padT };
}

function updateViewCells() {
    // Visible viewport is defined by the scroll container, not constants.
    const div = gridScrollDiv || document.querySelector(".divInnerBottomCanvasGrid");

    const wPx = div ? div.clientWidth  : WORK_CANVAS_WIDTH;
    const hPx = div ? div.clientHeight : WORK_CANVAS_HEIGHT;

    const { padL, padT } = getScrollPaddingPx(div);

    viewWCells = Math.max(1, Math.floor(wPx / cellSize));
    viewHCells = Math.max(1, Math.floor(hPx / cellSize));

    // Camera = top-left visible cell in the Working Grid
    if (div) {
        // include fractional cell offset so the reticle can align perfectly
        camXCells = div.scrollLeft / cellSize;
        camYCells = div.scrollTop  / cellSize;
    }

    // Clamp so reticle stays inside grid bounds
    const maxCamX = Math.max(0, gridW - viewWCells);
    const maxCamY = Math.max(0, gridH - viewHCells);
    camXCells = Math.max(0, (div.scrollLeft - padL) / cellSize);
    camYCells = Math.max(0, (div.scrollTop  - padT) / cellSize);

}

function syncReticleToWorkingGrid() {
    // Single source of truth: the Working Grid scroll container.
    updateViewCells();      // reads scrollLeft/Top into camXCells/camYCells + viewW/H
    viewDirty = true;       // preview needs redraw
    requestRerender();      // triggers preview draw loop
}

function drawPreviewOverlayMessage(lines) {
    const ctx = previewCanvasCTX;
    const w = previewCanvas.width;
    const h = previewCanvas.height;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "bold 16px system-ui";

    const lineHeight = 18;
    const totalH = (lines.length - 1) * lineHeight;
    const startY = h / 2 - totalH / 2;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], w / 2, startY + i * lineHeight);
        if (i === 0) ctx.font = "13px system-ui";
    }

    ctx.restore();
}

function drawReticleOrNot() {
    showReticle = showReticleCheckbox.checked;
    drawPreviewUpdate();
}