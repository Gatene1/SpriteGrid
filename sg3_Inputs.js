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
        for (i = 0; i < gridSize * gridSize; i++) {
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

function saveGridAsPNG() {
    const exportSize = gridSize * cellSize;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = exportSize;
    tempCanvas.height = exportSize;

    tempCtx.drawImage(
        canvasGrid,   // source canvas
        2, 2, exportSize, exportSize,   // source area
        0, 0, exportSize, exportSize    // destination
    );

    const dataURL = tempCanvas.toDataURL("image/png");
    link.href = dataURL;
    link.download = "canvas_image.png"
    link.click();
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