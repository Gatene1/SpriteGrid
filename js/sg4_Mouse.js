// functions for First Window (Grid)
// =================================
        function littleWindowClick() {
         windowZRearrange(0);
         windowZRefresh();
        }
        function divTitleClick(e) {
            e.stopPropagation();
            document.addEventListener('mousemove', updateMousePos, true);
            lmbDown = true;
            titleBar.style.cursor = "grabbing";
            mousePositionOffset = [
                littleWindow.offsetLeft - e.clientX,
                littleWindow.offsetTop - e.clientY
            ];
            littleWindowClick();
        }
        function divTitleUnClick() {
            lmbDown = false;
            titleBar.style.cursor = "grab";
            document.removeEventListener('mousemove', updateMousePos, true);
        }
        function updateMousePos(e) {
            e.preventDefault();
            if (lmbDown) {
                mousePosition = {
                    x : e.clientX,
                    y : e.clientY
                };
                littleWindow.style.left = (mousePosition.x + mousePositionOffset[0]) + 'px';
                littleWindow.style.top = (mousePosition.y + mousePositionOffset[1]) + 'px';
            }
        }
        function gearClick(windowNumber, whichWindow, whichSide) {
            switch (windowNumber) {

                case "BooskaPurple":
                    windowNumber = "Green";
                    whichWindow.style.backgroundColor = "darkgreen";
                    whichSide.style.backgroundColor = "darkgreen";
                    break;

                case "Green" :
                    windowNumber = "Red";
                    whichWindow.style.backgroundColor = "darkred";
                    whichSide.style.backgroundColor = "darkred";
                    break;

                case "Red" :
                    windowNumber = "Blue";
                    whichWindow.style.backgroundColor = "midnightblue";
                    whichSide.style.backgroundColor = "midnightblue";
                    break;

                case "Blue" :
                    windowNumber = "Black";
                    whichWindow.style.backgroundColor = "#000000";
                    whichSide.style.backgroundColor = "#000000";
                    break;

                case "Black" :
                    windowNumber = "White";
                    whichWindow.style.backgroundColor = "#ffffff";
                    whichWindow.style.color = "#000000";
                    whichSide.style.backgroundColor = "#ffffff";
                    whichSide.style.color = "#000000";
                    break;

                case "White" :
                    windowNumber = "Yellow";
                    whichWindow.style.backgroundColor = "khaki";
                    whichSide.style.backgroundColor = "khaki";
                    break;

                case "Yellow" :
                    windowNumber = "BooskaPurple";
                    whichWindow.style.backgroundColor = "#6930B4";
                    whichWindow.style.color = "#ffffff";
                    whichSide.style.backgroundColor = "#6930B4";
                    whichSide.style.color = "#ffffff";
                    break;
            }
            return windowNumber;
        }

// functions for Second Window (Preview)
// =====================================
        function prevLittleWindowClick() {
            windowZRearrange(1);
            windowZRefresh();
        }
        function prevDivTitleClick(e) {
            e.stopPropagation();
            document.addEventListener('mousemove', prevUpdateMousePos, true);
            prevLmbDown = true;
            prevTitleBar.style.cursor = "grabbing";
            prevMousePositionOffset = [
                prevLittleWindow.offsetLeft - e.clientX,
                prevLittleWindow.offsetTop - e.clientY
            ];
            prevLittleWindowClick();
        }
        function prevDivTitleUnClick() {
            prevLmbDown = false;
            prevTitleBar.style.cursor = "grab";
            document.removeEventListener('mousemove', prevUpdateMousePos, true);
        }
        function prevUpdateMousePos(e) {
            e.preventDefault();
            if (prevLmbDown) {
                prevMousePosition = {
                    x : e.clientX,
                    y : e.clientY
                };
                prevLittleWindow.style.left = (prevMousePosition.x + prevMousePositionOffset[0]) + 'px';
                prevLittleWindow.style.top = (prevMousePosition.y + prevMousePositionOffset[1]) + 'px';
            }
        }
// functions for Third Window (Color Iro.js)
// =====================================
function colorLittleWindowClick() {
    windowZRearrange(2);
    windowZRefresh();
}
function colorDivTitleClick(e) {
    e.stopPropagation();
    document.addEventListener('mousemove', colorUpdateMousePos, true);
    colorLmbDown = true;
    colorTitleBar.style.cursor = "grabbing";
    colorMousePositionOffset = [
        colorLittleWindow.offsetLeft - e.clientX,
        colorLittleWindow.offsetTop - e.clientY
    ];
    colorLittleWindowClick();
}
function colorDivTitleUnClick() {
    colorLmbDown = false;
    colorTitleBar.style.cursor = "grab";

    document.removeEventListener('mousemove', colorUpdateMousePos, true);
}
function colorUpdateMousePos(e) {
    e.preventDefault();
    if (colorLmbDown) {
        colorMousePosition = {
            x : e.clientX,
            y : e.clientY
        };
        colorLittleWindow.style.left = (colorMousePosition.x + colorMousePositionOffset[0]) + 'px';
        colorLittleWindow.style.top = (colorMousePosition.y + colorMousePositionOffset[1]) + 'px';
    }
}

// functions for Fourth Window (Grid Output)
// =====================================
function outLittleWindowClick() {
    windowZRearrange(3);
    windowZRefresh();
}
function outDivTitleClick(e) {
    e.stopPropagation();
    document.addEventListener('mousemove', outUpdateMousePos, true);
    outLmbDown = true;
    outTitleBar.style.cursor = "grabbing";
    outMousePositionOffset = [
        outLittleWindow.offsetLeft - e.clientX,
        outLittleWindow.offsetTop - e.clientY
    ];
    outLittleWindowClick();
}
function outDivTitleUnClick() {
    outLmbDown = false;
    outTitleBar.style.cursor = "grab";
    document.removeEventListener('mousemove', outUpdateMousePos, true);
}
function outUpdateMousePos(e) {
    e.preventDefault();
    if (outLmbDown) {
        outMousePosition = {
            x : e.clientX,
            y : e.clientY
        };
        outLittleWindow.style.left = (outMousePosition.x + outMousePositionOffset[0]) + 'px';
        outLittleWindow.style.top = (outMousePosition.y + outMousePositionOffset[1]) + 'px';
    }
}

// functions for Fifth Window (File Saving)
// =====================================
function fileLittleWindowClick() {
    windowZRearrange(4);
    windowZRefresh();
}
function fileDivTitleClick(e) {
    e.stopPropagation();
    document.addEventListener('mousemove', fileUpdateMousePos, true);
    fileLmbDown = true;
    fileTitleBar.style.cursor = "grabbing";
    fileMousePositionOffset = [
        fileLittleWindow.offsetLeft - e.clientX,
        fileLittleWindow.offsetTop - e.clientY
    ];
    fileLittleWindowClick();
}
function fileDivTitleUnClick() {
    fileLmbDown = false;
    fileTitleBar.style.cursor = "grab";
    document.removeEventListener('mousemove', fileUpdateMousePos, true);
}
function fileUpdateMousePos(e) {
    e.preventDefault();
    if (fileLmbDown) {
        fileMousePosition = {
            x : e.clientX,
            y : e.clientY
        };
        fileLittleWindow.style.left = (fileMousePosition.x + fileMousePositionOffset[0]) + 'px';
        fileLittleWindow.style.top = (fileMousePosition.y + fileMousePositionOffset[1]) + 'px';
    }
}


// functions for Sixth Window (Sprite Sheet)
// =====================================
function spriteLittleWindowClick() {
    windowZRearrange(5);
    windowZRefresh();
}
function spriteDivTitleClick(e) {
    e.stopPropagation();
    document.addEventListener('mousemove', spriteUpdateMousePos, true);
    spriteLmbDown = true;
    spriteTitleBar.style.cursor = "grabbing";
    spriteMousePositionOffset = [
        spriteLittleWindow.offsetLeft - e.clientX,
        spriteLittleWindow.offsetTop - e.clientY
    ];
    spriteLittleWindowClick();
}
function spriteDivTitleUnClick() {
    spriteLmbDown = false;
    spriteTitleBar.style.cursor = "grab";
    document.removeEventListener('mousemove', spriteUpdateMousePos, true);
}
function spriteUpdateMousePos(e) {
    e.preventDefault();
    if (spriteLmbDown) {
        spriteMousePosition = {
            x : e.clientX,
            y : e.clientY
        };
        spriteLittleWindow.style.left = (spriteMousePosition.x + spriteMousePositionOffset[0]) + 'px';
        spriteLittleWindow.style.top = (spriteMousePosition.y + spriteMousePositionOffset[1]) + 'px';
    }
}

// ===============================================
// = functions for Seventh Window (Level Editor) =
// ===============================================
function levelLittleWindowClick() {
    windowZRearrange(6);
    windowZRefresh();
}
function levelDivTitleClick(e) {
    e.stopPropagation();
    document.addEventListener('mousemove', levelUpdateMousePos, true);
    levelLmbDown = true;
    levelTitleBar.style.cursor = "grabbing";
    levelMousePositionOffset = [
        levelLittleWindow.offsetLeft - e.clientX,
        levelLittleWindow.offsetTop - e.clientY
    ];
    levelLittleWindowClick();
}
function levelDivTitleUnClick() {
    levelLmbDown = false;
    levelTitleBar.style.cursor = "grab";
    document.removeEventListener('mousemove', levelUpdateMousePos, true);
}
function levelUpdateMousePos(e) {
    e.preventDefault();
    if (levelLmbDown) {
        levelMousePosition = {
            x : e.clientX,
            y : e.clientY
        };
        levelLittleWindow.style.left = (levelMousePosition.x + levelMousePositionOffset[0]) + 'px';
        levelLittleWindow.style.top = (levelMousePosition.y + levelMousePositionOffset[1]) + 'px';
    }
}


function gridUpdateMousePos(e) {
// Position of mouse on page.
    let rect = canvasGrid.getBoundingClientRect();
    let root = document.documentElement;

    mouseXGrid = e.clientX - rect.left - root.scrollLeft;
    mouseYGrid = e.clientY - rect.top - root.scrollTop;

    const colV = Math.floor(mouseXGrid / cellSize);
    const rowV = Math.floor(mouseYGrid / cellSize);

    // If mouse is outside the visible viewport, ignore.
    if (colV < 0 || rowV < 0 || colV >= viewWCells || rowV >= viewHCells) {
        mouseToGrid = -1;
        return;
    }

    const col = colV + camXCells;
    const row = rowV + camYCells;

    mouseToGrid = (row * gridW) + col;



    // If the LMB is pressed down for drag painting.
     if (lmbDown) {
         changeCellColor();
         //queueRedraw();
     }

     if (rmbDown) {
         RMB();
         //queueRedraw();
     }
}

function gridUpdateMousePosColorChoose(e) {
// Position of mouse on page.
    let rect = colorChooseRow1.getBoundingClientRect();
    let root = document.documentElement;

    mouseXSpriteGrid = e.clientX - rect.left - root.scrollLeft;
    mouseYSpriteGrid = e.clientY - rect.top - root.scrollTop;

    mouseToGrid = (Math.floor(mouseYSpriteGrid / cellSize) * gridW) + Math.floor(mouseXSpriteGrid / cellSize);

    //drawText (Math.floor(mouseXSpriteGrid) + ", " + Math.floor(mouseYSpriteGrid), mouseXSpriteGrid, mouseYSpriteGrid, 8, "black", 2)

    //gridSizeRangeText.value = gridSizeRange.value + " X " + gridSizeRange.value;

    cSizeRangeText.value = cellSizeRange.value + " Pixels";

    // If the LMB is pressed down for drag painting.
    // if (LMBDown) {
    //     colorChange();
    // }
}

function gridUpdateMousePosSpriteSheet(e) {
    const rect = spriteCanvas.getBoundingClientRect();

    // CSS → canvas scale
    const scaleX = spriteCanvas.width / rect.width;
    const scaleY = spriteCanvas.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    mouseXSpriteCanvas = mx;
    mouseYSpriteCanvas = my;

    if (moveStarted && !moveMoved) {
        const dx = mouseXSpriteCanvas - downX;
        const dy = mouseYSpriteCanvas - downY;

        if ((dx * dx + dy * dy) > (MOVE_PIXEL_THRESHOLD * MOVE_PIXEL_THRESHOLD)) {
            moveMoved = true;
        }
    }

    const lmbPressed = (e.buttons & 1) === 1;

    // Compute cell index FIRST (prevents “stale idx” jumpiness)
    const col = Math.floor(mx / spriteCellSize);
    const row = Math.floor(my / spriteCellSize);

    if (col < 0 || col >= sheetCols || row < 0 || row >= sheetRows) {
        spriteCellOn = -1;
        hoveredSpriteId = -1;

        // If we’re mid-move and go out-of-bounds, just mark "no target".
        // (Commit logic already restores on invalid drop.)
        if (typeof isMovingSprite === "function" && isMovingSprite()) {
            moveHasTarget = false;
            movePreviewOk = false;
        }

        // If user isn’t holding LMB anymore, don’t let a pending grab linger.
        // if (!lmbPressed) pendingGrab = false;
        return;
    }

    const idx = row * sheetCols + col;

    spriteCellOn = idx;
    hoveredSpriteId = sheetOcc[idx];

    /*// If the user released LMB, kill pending grab so it can’t “arm” later.
    if (!lmbPressed) {
        pendingGrab = false;
        return;
    }*/

    /*// Promote pendingGrab → real drag only while LMB is down.
    if (typeof pendingGrab !== "undefined" && pendingGrab) {
        const dx = mouseXSpriteCanvas - downX;
        const dy = mouseYSpriteCanvas - downY;

        if ((dx * dx + dy * dy) >= (DRAG_THRESH_PX * DRAG_THRESH_PX)) {
            pendingGrab = false;
            beginSpriteMoveAtCellIndex(idx);
            updateSpriteMovePreviewAtCellIndex(idx);
        }
    }*/

    // If we're currently dragging a sprite, update its live placement preview.
    if (typeof isMovingSprite === "function" && isMovingSprite()) {
        updateSpriteMovePreviewAtCellIndex(idx);
    }
    requestRerender();
}







function mouseSpriteSheetLeave(e) {
    // If we left the canvas INTO the RMB menu, ignore.
    const toEl = e.relatedTarget;
    if (toEl && spriteRMB && spriteRMB.contains(toEl)) return;

    // If the cursor leaves the sheet while moving, cancel the move.
    if (typeof isMovingSprite === "function" && isMovingSprite()) {
        cancelSpriteMove?.(true);
        requestRerender();
    }

    spriteHeld = false;
    eraseTool = false;
    stopEraseTool();
    pasteSprite = false;
    mouseSprite = null;
    spriteCellOn = -1;
    hoveredSpriteId = -1;
    makeSpriteContextFalse();
    requestRerender();
}




function gridUpdateMousePosLevelEditor(e) {
    levelSyncToCanvas();

    const rect = levelCanvas.getBoundingClientRect();
    const scaleX = levelCanvas.width / rect.width;
    const scaleY = levelCanvas.height / rect.height;

    mouseXLevelCanvas = (e.clientX - rect.left) * scaleX;
    mouseYLevelCanvas = (e.clientY - rect.top)  * scaleY;

    const col = Math.floor(mouseXLevelCanvas / levelGridCellSize);
    const row = Math.floor(mouseYLevelCanvas / levelGridCellSize);

    if (col < 0 || row < 0 || col >= squaresForLevelGridWidth || row >= squaresForLevelGridHeight) {
        levelCellOn = -1;
        return;
    }

    levelCellOn = row * squaresForLevelGridWidth + col;

    if (levelLmbDown) {
        addToLevelGrid(1);
        requestRerender();
    } else {
        requestRerender(); // keeps hover highlight responsive
    }
}


function mouseLevelEditorLeave() {
    levelSpriteHeld = false;
    levelMouseSprite = null;
    levelCellOn = -1;
    pasteLevelSprite = false;
    requestRerender();
}

function mouseLevelEditorDown() {
    levelLmbDown = true;
}

function mouseLevelEditorUp() {
    levelLmbDown = false;
}

function updateSpriteMovePreviewAtCellIndex(idx) {
    if (!isMovingSprite()) return;

    // idx is already guaranteed "mouse is in bounds" because it came from gridUpdateMousePosSpriteSheet
    const col = idx % sheetCols;
    const row = Math.floor(idx / sheetCols);

    const s = sprites[movingSpriteId];
    if (!s) return;

    // Always track the cursor target while the cursor is inside the sheet
    // Keep the grabbed point under the cursor
    moveTargetX = col - grabOffX;
    moveTargetY = row - grabOffY;
    moveHasTarget = true;


    if (moveStarted) {
        moveMoved = (moveTargetX !== moveStartCellX) || (moveTargetY !== moveStartCellY);
    }

    // Now decide if it’s a legal placement.
    // 1) bounds of the sprite footprint
    const inBounds =
        moveTargetX >= 0 && moveTargetY >= 0 &&
        (moveTargetX + s.wCells) <= sheetCols &&
        (moveTargetY + s.hCells) <= sheetRows;

    if (!inBounds) {
        movePreviewOk = false;
        return;
    }

    // 2) collision rules (you already cleared the sprite's old occ in beginSpriteMoveAtCellIndex)
    movePreviewOk = canPlaceRect(moveTargetX, moveTargetY, s.wCells, s.hCells);
}

function previewPointerDown(e) {
    // Only left button
    if (e.button !== 0) return;

    previewDragging = true;

    // Keep getting moves even if cursor leaves canvas
    previewCanvas.setPointerCapture(e.pointerId);

    // Update immediately on click-down
    previewReticleDrag(e);

    e.preventDefault();
}

function previewPointerMove(e) {
    if (!previewDragging) return;
    previewReticleDrag(e);
    e.preventDefault();
}

function previewPointerUp(e) {
    if (!previewDragging) return;
    previewDragging = false;

    try { previewCanvas.releasePointerCapture(e.pointerId); } catch {}
    e.preventDefault();
}






