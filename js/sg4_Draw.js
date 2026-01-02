function requestRedraw() {
    if (gridDirty) return;
    gridDirty = true;
}

function drawAll() {
    // Each if-statement will check to see if this is the initial drawing of WebApp or if the Window is active and
    // the Window is visible, then draw its contents.
    if (isWindowActive(0, true)) {
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
        }


        drawPreviewUpdate();

        //drawGridFast();

    }
    if (isWindowActive(2, true)){
        drawColorSquares();
        drawPreviewSquare(100);
    }
    if (isWindowActive(5, false)) drawSpriteCanvasUpdate();
    if (isWindowActive(6, false)) {
        drawLevelCanvasUpdate();
        drawLevelExtendIcon();
    }

    if (firstDraw) firstDraw = false;



    //alert (currColor);
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

function drawGrid() {
    let x, y;
    let idx, currCellColor;

    // Keep this if other UI code expects it, but it is NOT used for indexing
    gridSize = gridW * gridH;

    canvasGridCTX.clearRect(0, 0, canvasGrid.width, canvasGrid.height);

    drawBg();

    for (y = 0; y < gridH; y++) {
        for (x = 0; x < gridW; x++) {
            idx = (y * gridW) + x; // FIX: proper row-major index

            const posX = x * cellSize + 2;
            const posY = y * cellSize + 2;

            if (grid[idx] === 0) {
                if (!showTheGrid && !showAlpha) continue;

                if (showTheGrid) {
                    currCellColor = "rgba(245, 245, 245, .5)";
                    drawSquare(posX, posY, cellSize, cellSize, false, currCellColor, 0, GRID_BORDER_COLOR, true, showAlpha);
                } else {
                    currCellColor = "rgba(245, 245, 245, 0)";
                    drawSquare(posX, posY, cellSize, cellSize, false, currCellColor, 0, GRID_BORDER_COLOR, false, showAlpha);
                }
            } else {
                currCellColor = uIntToRgbaString(grid[idx]);
                drawSquare(posX, posY, cellSize, cellSize, false, currCellColor, 0, GRID_BORDER_COLOR, true, showAlpha);
            }
        }
    }
}


function drawGridFromRequest(gridElement) {
    /*let y = Math.floor(gridElement / gridSize) * cellSize;
    let col = gridElement - ((y / cellSize) * gridSize);
    let x = col * cellSize;*/
    if (gridElement < 0 || gridElement >= grid.length) return;

    let { x, y } = getCellXY(gridElement);

    let currCellColor;

    canvasGridCTX.clearRect(x, y, cellSize + 1, cellSize + 1);


    if (grid[gridElement] == 0) {
        if (!showTheGrid && !showAlpha) {
            currCellColor = "rgba(255, 255, 255, .5)";
            drawSquare(x, y, cellSize, cellSize, false, currCellColor, 0, GRID_BORDER_COLOR, true, showAlpha)
        }
        if (showTheGrid) {
            currCellColor = "rgba(245, 245, 245, .5)";
            drawSquare(x, y, cellSize, cellSize, false, currCellColor, 0, GRID_BORDER_COLOR, true, showAlpha)
            //drawSquare(j * cellSize + 2, i * cellSize + 2, cellSize, cellSize, showTheGrid, currCellColor, 0, GRID_BORDER_COLOR, true, showAlpha);
        } else {
            currCellColor = "rgba(245, 245, 245, 0)";
            drawSquare(x, y, cellSize, cellSize, false, currCellColor, 0, GRID_BORDER_COLOR, false, showAlpha);
        }
    } else {
        drawSquare(x, y, cellSize, cellSize, false, uIntToRgbaString(grid[gridElement]), 0, GRID_BORDER_COLOR, true, showAlpha)
    }
}

function drawPreviewSquare(dimensions) {
    drawSquare(2, 2, dimensions, dimensions, true, uint32ToHex8(currColor), 1, GRID_BORDER_COLOR, true, true);
}

function drawText (whatToSay, x, y, fontSize, fontColor, canvasChoice = canvasGridCTX) {
    let drawCanvas;
    if (canvasChoice != canvasGridCTX) drawCanvas = whichCanvas(canvasChoice);
    drawCanvas.font = fontSize + "px Trebuchet MS";
    drawCanvas.fillStyle = fontColor;
    drawCanvas.fillText(whatToSay, x, y);
}

function drawColorSquares() {
    let i, j;

    if (!alreadyDeclaredSavedColorClasses) {
        for (i = 0; i <= savedColorSquare.count; i++) {

            if (savedColorSquareArray[i].num === colorStoresSelected)
                savedColorSquareArray[i].borderColor = GRID_BORDER_COLOR;
            else
                savedColorSquareArray[i].borderColor = "#000000";

            savedColorSquareArray[i].x1 = colorStoresBorderSize;
            savedColorSquareArray[i].x2 = colorStoresBorderSize * 2 + colorStoresSquareSize;
            savedColorSquareArray[i].y1 = colorStoresSquareSize * i + colorStoresBorderSize + (i * colorStoresSquareGap);
            savedColorSquareArray[i].y2 = savedColorSquareArray[i].y1 + colorStoresSquareSize + colorStoresBorderSize;
            savedColorSquareArray[i].colorHeld = colorStores[i];
            //alert(uIntToRgbaString(savedColorSquareArray[i].colorHeld));
            drawSquare(
                savedColorSquareArray[i].x1,
                savedColorSquareArray[i].y1,
                colorStoresSquareSize, colorStoresSquareSize, true,
                uIntToRgbaString(savedColorSquareArray[i].colorHeld), 2,
                savedColorSquareArray[i].borderColor,true, true
            );
        }
    } else {
        for (j = 0; j <= savedColorSquare.count; j++) {
            drawSquare(
                savedColorSquareArray[j].x1,
                savedColorSquareArray[j].y1,
                colorStoresSquareSize, colorStoresSquareSize, true,
                uIntToRgbaString(savedColorSquareArray[j].colorHeld), 2,
                savedColorSquareArray[j].borderColor, true, true
            );

            //alert(savedColorSquareArray[j].colorHeld);
        }
    }
    alreadyDeclaredSavedColorClasses = true;
}

function drawPreviewUpdate() {
    let i, j;
    let localCurrCell, currCellColor;
    let prevGridSize = gridW * gridH;

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

            drawSquare(j * prevCellSize + 2, i * prevCellSize + 2, prevCellSize, prevCellSize, false,
                uint32ToHex8(currCellColor), 3);
        }
    }

}

function drawSpriteCanvasUpdate() {
    let a, b, i, j;
    let spriteColNum = 0;
    let spriteGridFillColor;
    let gridColumn = 0;
    let spriteColumn = 0;
    let startingNumViewable = (Math.floor(divForSpriteGrid.scrollTop / spriteCellSize) * numberOfSpritesPerRow );
    let endingNumViewable = spriteGridViewableHeight * numberOfSpritesPerRow + startingNumViewable - 1;
    let startingLineViewable = startingNumViewable / numberOfSpritesPerRow * spriteCellSize;
    let x = 0;
    let y = startingLineViewable;



    // spriteCellSize = 64;
    // numberOfSpritesPerRow = 10
    // scrollTop will show me, basically, the Y value of what is visible...
    // So, at 133.03572082519, 20-79 is visible  (Floor(scrollTop / spriteCellSize)) * numberOfSpritesRow = starting #
    // then starting# + (numberOfSpritesRow - 1) will be the last # of the first row.
    // spriteGridViewableHeight * numberOfSpritesPerRow + starting# - 1 = ending #

    //gridSizeRangeText.value = startingNumViewable + " - " + (spriteGridViewableHeight * numberOfSpritesPerRow + startingNum - 1);

    spriteCanvasCTX.clearRect(0, 0, spriteWindowWidth, spriteWindowHeight);

    if (endingNumViewable >= spriteGridSize) endingNumViewable = spriteGridSize - 1;

    if (startingNumViewable < endingNumViewable) {
        for (i = startingNumViewable; i <= endingNumViewable; i++) {
            // Determines the fill color of the individual cell. If the cell being drawn is the same the user is hovering over, it will be the highlighted, else, will be the normal color.
            if (i == spriteChosen)
                spriteGridFillColor = SPRITE_GRID_CHOSEN_CELL_FILL_COLOR;
            else if (i == spriteCellOn)
                spriteGridFillColor = SPRITE_GRID_HOVER_FILL_COLOR;
            else
                spriteGridFillColor = SPRITE_GRID_FILL_COLOR;
            // Draw the individual cell of the spriteGrid.
            drawSquare(x, y, spriteCellSize, spriteCellSize, true, uint32ToHex8(spriteGridFillColor), 4);
            // Draws the # of the individual cell in the lower right hand corner of the cell.
            drawText(i, x + spriteCellSize - 20, y + spriteCellSize - 5, 12, "black", 4)

            // If there is a sprite in the spriteGrid array for the cell being drawn, then draw the sprite.
            if (spriteGrid[i] != null) {
                // Center the icon in the cell.
                a = Math.floor((spriteCellSize - (spriteGrid[i].sizeOfGrid * spriteInCellSize)) / 2);
                b = Math.floor((spriteCellSize - (spriteGrid[i].sizeOfGrid * spriteInCellSize)) / 2);
                for (j = 0; j < spriteGrid[i].sizeOfGrid * spriteGrid[i].sizeOfGrid; j++) {
                    if (spriteGrid[i].gridColors[j] != 0)
                        drawSquare(x + a, y + b, spriteInCellSize, spriteInCellSize, false, uint32ToHex8(spriteGrid[i].gridColors[j]), 4);
                    spriteColumn++;
                    if (spriteColumn >= spriteGrid[i].sizeOfGrid) {
                        spriteColumn = 0;
                        a = Math.floor((spriteCellSize - (spriteGrid[i].sizeOfGrid * spriteInCellSize)) / 2);
                        b += spriteInCellSize;
                    } else {
                        a += spriteInCellSize;
                    }

                }
            }

            // if the max number of cells has been drawn for a single row, restart the spriteColNum count, and the X-axis count, but increase the Y, if not, continue drawing on the same row.
            if (spriteColNum == numberOfSpritesPerRow - 1) {
                spriteColNum = 0;
                x = 0;
                y += spriteCellSize;
            } else {
                spriteColNum++;
                x += spriteCellSize;
            }
        }
       // gridSizeRangeText.value = startingNumViewable + " - " + endingNumViewable;
    }
    x = 0;
    y = 0;

    // if a sprite should be on the mouse cursor, then draw it.
    if (spriteHeld) {
        for (i = 0; i < mouseSprite.sizeOfGrid * mouseSprite.sizeOfGrid; i++) {
            if (mouseSprite.gridColors[i] != "0")
                drawSquare(mouseXSpriteCanvas + x, mouseYSpriteCanvas + y, mouseSpriteCellSize, mouseSpriteCellSize, false, uint32ToHex8(mouseSprite.gridColors[i]), 4);
            gridColumn++;
            if (gridColumn >= mouseSprite.sizeOfGrid) {
                gridColumn = 0;
                x = 0;
                y += mouseSpriteCellSize;
            } else {
                x += mouseSpriteCellSize;
            }
        }
    }

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
                drawSquare(x + a, y + b, levelSpriteInCellSize, levelSpriteInCellSize, false, uIntToRgbaString(spriteGrid[levelGrid[k]].gridColors[j]), 5);
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
    drawSquare(0, 0, levelCanvasWidth, levelCanvasHeight, false, uIntToRgbaString(bgColorChoose), 5);

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
            drawSquare(x, y, levelGridCellSize, levelGridCellSize, showTheLevelGrid, uIntToRgbaString(bgColorChoose), 5, "black", true);
        }
        drawSquare(x, y, levelGridCellSize, levelGridCellSize, showTheLevelGrid, uIntToRgbaString(spriteGridFillColor), 5, "black", spriteGridFillBool);

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
                drawSquare(mouseXLevelCanvas + x, mouseYLevelCanvas + y, mouseSpriteCellSize, mouseSpriteCellSize, false, uIntToRgbaString(spriteGrid[levelMouseSprite].gridColors[i]), 5, GRID_BORDER_COLOR, true);
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

    // light overlay line style
    canvasGridLinesCTX.strokeStyle = GRID_BORDER_COLOR;
    canvasGridLinesCTX.lineWidth = 1;

    const wPx = gridW * cellSize;
    const hPx = gridH * cellSize;

    // vertical lines
    for (let x = 0; x <= gridW; x++) {
        const px = (x * cellSize) + 2;
        canvasGridLinesCTX.beginPath();
        canvasGridLinesCTX.moveTo(px, 2);
        canvasGridLinesCTX.lineTo(px, hPx + 2);
        canvasGridLinesCTX.stroke();
    }

    // horizontal lines
    for (let y = 0; y <= gridH; y++) {
        const py = (y * cellSize) + 2;
        canvasGridLinesCTX.beginPath();
        canvasGridLinesCTX.moveTo(2, py);
        canvasGridLinesCTX.lineTo(wPx + 2, py);
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
    firstDraw = true;
}

function flipVertically() {
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
    firstDraw = true;
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