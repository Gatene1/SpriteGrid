// Each level 15 (only 13 are used) sprites tall and 17 wide, canvas is 578 pixels tall, so each pixel can be 38 pixels square
// So, pixelsPerUnit for the level will be 2.
// Vars for Web App
const FRAMES_PER_SECOND = 30;
const CANVAS_GRID_WIDTH = 775;
const CANVAS_GRID_HEIGHT = 775;
const GRID_BORDER_COLOR = "#a0a0a0ff";
const GRID_FILL_COLOR = 4294309365;
const SPRITE_GRID_FILL_COLOR = 4294309365;
const SPRITE_GRID_HOVER_FILL_COLOR = 4294960606;
const SPRITE_GRID_CHOSEN_CELL_FILL_COLOR = 4294947248;
const UINT_WHITE = 0xFFFFFFFF;
const image = new Image();
const link = document.createElement('a');

var firstDraw = true;
var closingWindow = false;
var prevWindowToHaveFocus = 0;
var canvasGrid, canvasGridCTX, colorCanvas, colorCanvasCTX, colorChooseRow1, colorChooseRow1CTX, previewWindow,
    previewWindowCTX, spriteCanvas, spriteCanvasCTX, levelCanvas, levelCanvasCTX;
var mouseXGrid, mouseYGrid, mouseXSpriteGrid, mouseYSpriteGrid;
var pixelsPerUnit = 2;
var gridSize = 16;
var cellSize = 24;
var spriteMouseGridSize = 16;
var gridSizeRange = document.getElementById("gridSizeRangeSlider");
var cellSizeRange = document.getElementById("cellSizeRangeSlider");
var gridSizeRangeText = document.getElementById("gridSizeRangeText");
var cSizeRangeText = document.getElementById("cellSizeRangeText");
var gridOutput = document.getElementById("gridOutput");
var trimWhitespace = document.getElementById("trimWhitespace");
window.redrawQueued = false;
window.BgColor = 4294967295;
window.showBgBool = false;

let gridW = 16;
let gridH = 16;
let imgData = null;
let imgU32 = null;

let gridImageData = null;
let gridImageU32 = null;

let gridDirty = true;
let gridFullDirty = true;
const dirtyCells = new Set();

//var grid = ["0"];
// window.grid = new Uint32Array(gridSize * gridSize);
window.grid = new Uint32Array(gridW * gridH);  // 0 = transparent or empty.
window.gridTemp = new Uint32Array(gridW * gridH);

var showTheGrid = true;
var showTheLevelGrid = true;
var gridCopy = ["0"];
var mouseToGrid;
var toolGrid = ["0"];
var toolSize = 16;
var eraseTool = false;

// Vars for classes
var savedColorSquareArray = [
    new savedColorSquare(0, 0, 0, 0, GRID_BORDER_COLOR, 4278255360),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", 4278190335),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR),
    new savedColorSquare(0, 0, 0, 0, "#000000ff", GRID_FILL_COLOR)
];

// Vars for the color picker.
var colorPicker = new iro.ColorPicker('#picker', {
    width: 175,
    color: "rgba(0, 255, 0, 1)",
    layout: [{
            component: iro.ui.Wheel,
            options: {}
        },
        {
            component: iro.ui.Slider,
            options: {
                sliderType: "value"
            }
        },
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'alpha'
            }
        }
    ]
});
var currColor = hex8ToUint32(colorPicker.color.hex8String);
var colorTextElement = document.getElementById("colorTextElement");
var colorStores = [4278255360, 4278190335, GRID_FILL_COLOR, GRID_FILL_COLOR, GRID_FILL_COLOR, GRID_FILL_COLOR, GRID_FILL_COLOR, GRID_FILL_COLOR, GRID_FILL_COLOR, GRID_FILL_COLOR];
var colorStoresSelected = 0;
var colorStoresSquareSize = 24;
var colorStoresBorderSize = 2;
var colorStoresSquareGap = 15.55;
var alreadyDeclaredSavedColorClasses = false;
var colorStoresClicked = 0;

// Vars for preview window
var prevCellSize = 2;
var previewSelect = document.getElementById("previewSelect");

// Vars for every window
var windowZ = [6, 0, 1, 2, 3, -1, -1];
let windowZHistory = [];
let currentTopWindow;
let windowFocusHistory = [];
// Old windowZ values, just in case my fix is not a fix, but a blunder lol.
//var windowZ = [0, 1, 2, 3, 4, 5, 6];

// Vars for History
const HISTORY_LIMIT = 200; // actions, not pixels
let undoStack = [];
let redoStack = [];

let activeAction = null;
// To avoid duplicate entries for the same index during a stroke:
let activeIndexMap = null; // Map<int, {i, from, to}>

// Vars for First Window (Grid)
var lmbDown = false;
var rmbDown = false;
var mousePosition;
var mousePositionOffset = [0, 0];
var titleBar = document.getElementById("titleBarHW");
var littleWindow = document.getElementById("littleWindowHW");
var gearHW = document.getElementById("gearHW");
var closeHW = document.getElementById("closeHW");
var window1Color = "Green";
var divSide1 = document.getElementById("divSide1");
var resetGridButton = document.getElementById("resetGridButton");
var showGridCheckbox = document.getElementById("showGridCheckbox");
var showTransparentCheckbox = document.getElementById("showTransparentCheckbox");
window.showAlpha = true;
window.flipHorizontal = document.getElementById("flipHorizontal");
window.flipVertical = document.getElementById("flipVertical");
window.showBg = document.getElementById("showBg");
const bumpUp    = document.getElementById("bumpUp");
const bumpDown  = document.getElementById("bumpDown");
const bumpLeft  = document.getElementById("bumpLeft");
const bumpRight = document.getElementById("bumpRight");

//let dimsLinked = true;
let gridDimsLocked = true;

window.SG4 ??= {};
const SG4 = window.SG4;
SG4.gatMeta ??= { createdUtc: null };

SG4.utcNowIso = function utcNowIso() {
    return new Date().toISOString();
};

let gridOutputTimer = null;
let gridOffCanvas = null;
let gridOffCtx = null;
let gridOffImg = null;
let gridOffU32 = null;
let pendingGridOutputRefresh = false;

const gridWInput = document.getElementById("gridWInput");
const gridHInput = document.getElementById("gridHInput");
const gridLockBtn = document.getElementById("gridLockBtn");
const gridApplyBtn = document.getElementById("gridApplyBtn");

var canvasGridLines = document.getElementById("canvasGridLines");
var canvasGridLinesCTX = canvasGridLines.getContext("2d");



// Vars for Second Window (Preview)
var prevLmbDown = false;
var prevMousePosition;
var prevMousePositionOffset = [0, 0];
var prevTitleBar = document.getElementById("prevTitleBarHW");
var prevLittleWindow = document.getElementById("prevLittleWindowHW");
var prevGearHW = document.getElementById("prevGearHW");
var prevCloseHW = document.getElementById("prevCloseHW");
var window2Color = "Green";
var divSide2 = document.getElementById("divSide2");

// Vars for Third Window (Color Iro.js)
var colorLmbDown = false;
var colorMousePosition;
var colorMousePositionOffset = [0, 0];
var colorTitleBar = document.getElementById("colorTitleBarHW");
var colorLittleWindow = document.getElementById("colorLittleWindowHW");
var colorGearHW = document.getElementById("colorGearHW");
var colorCloseHW = document.getElementById("colorCloseHW");
var window3Color = "Green";
var divSide3 = document.getElementById("divSide3");
var saveButton = document.getElementById("saveButton");
var loadPalletteButton = document.getElementById('loadPalletteButton');
var savePalletteButton = document.getElementById('savePalletteButton');
let copyColorCode = document.getElementById('copyColorCode');
window.alphaPattern = null;


// Vars for Fourth Window (Grid Output)
var outLmbDown = false;
var outMousePosition;
var outMousePositionOffset = [0, 0];
var outTitleBar = document.getElementById("outTitleBarHW");
var outLittleWindow = document.getElementById("outLittleWindowHW");
var outGearHW = document.getElementById("outGearHW");
var outCloseHW = document.getElementById("outCloseHW");
var window4Color = "Green";
var divSide4 = document.getElementById("divSide4");

// Vars for Fifth Window (File Saving)
var fileLmbDown = false;
var fileMousePosition;
var fileMousePositionOffset = [0, 0];
var fileTitleBar = document.getElementById("fileTitleBarHW");
var fileLittleWindow = document.getElementById("fileLittleWindowHW");
var fileGearHW = document.getElementById("fileGearHW");
var fileCloseHW = document.getElementById("fileCloseHW");
var window5Color = "Green";
var divSide5 = document.getElementById("divSide5");
var fileSavingOpenButton = document.getElementById("fileSavingOpenButton");
var fileSavingSaveButton = document.getElementById("fileSavingSaveButton");
var newSSheet = document.getElementById("newSSheet");
var hexToUintButton = document.getElementById("hexToUintButton");
var hexToUintText = document.getElementById('hexToUintText');
var uintToHexButton = document.getElementById("uintToHexButton");
var uintToHexText = document.getElementById('uintToHexText');
var openFileContents;
var openPaletteContents;
var openSSheetContents;
window.displayLegacyAlert = false;

// Vars for Sixth Window (Sprite Sheet)
var spriteLmbDown = false;
var spriteMousePosition;
var spriteMousePositionOffset = [0, 0];
var spriteTitleBar = document.getElementById("spriteTitleBarHW");
var spriteLittleWindow = document.getElementById("spriteLittleWindowHW");
var spriteGearHW = document.getElementById("spriteGearHW");
var spriteCloseHW = document.getElementById("spriteCloseHW");
var divForSpriteGrid = document.getElementById("divForSpriteGrid");
var window6Color = "Green";
var divSide6 = document.getElementById("divSide6");
var spriteWindowWidth, spriteWindowHeight;
var spriteCellOn = -1;
var mouseXSpriteCanvas, mouseYSpriteCanvas;

// Vars for SpriteSheet.
var howManySpritesInSpriteSheet = 0;
var numberOfSpritesPerRow;

// SpriteSheet v2 core model (multi-cell occupancy)
const BASE_CELL_PX = 16;
const SPRITE_ZOOM = 2;
var spriteCellSize = BASE_CELL_PX * SPRITE_ZOOM;
//var spriteGridSize = 500;
var spriteGridViewableHeight = Math.ceil(divForSpriteGrid.clientHeight / spriteCellSize);
var spriteGridCellsViewable;
//var spriteGrid = [];
var spriteGridBlob = [];
var spriteHeld = false;
var spriteChosen = -1;
var pasteSprite = false;
var mouseSprite = null;
var spriteImportWorkingGrid = document.getElementById("spriteImportWorkingGrid");
var spriteExportWorkingGrid = document.getElementById("spriteExportWorkingGrid");
var spriteSaveButton = document.getElementById("spriteSaveButton");
var openSSheet = document.getElementById("openSSheet");
var eraseSingleSprite = document.getElementById("eraseSingleSprite");
var mouseSpriteCellSize = 1;
var spriteInCellSize = 2;
let needsRedraw = true;
let antsAnimating = false;
let queuedMouseEvent = null;

let sheetCols = 20; // TODO: set from UI or config
let sheetRows = 50;
let maxCells = 500;

let sprites = [];            // array of SpriteAsset
let placements = [];
let sheetOcc = null;         // Int32Array of spriteId or -1
let selectedSprites = new Set(); // sprite ids
let selectedSpriteId = -1;
let hoveredSpriteId = -1;

let selDashOffset = 0;
let selAnimOn = false;

// Spritesheet overlay
let sheetStaticCanvas = null;
let sheetStaticCTX = null;
let sheetStaticDirty = true;
let sheetMutatedThisInteraction = false;

// ─────────────────────────────────────────────
// Sprite move transaction state
// ─────────────────────────────────────────────
let movingSpriteId = -1;   // sprite currently being dragged, -1 = none
let moveOrigX = 0;         // original xCell before move
let moveOrigY = 0;         // original yCell before move

let moveTargetX = 0;       // current preview xCell
let moveTargetY = 0;       // current preview yCell

let moveHasTarget = false; // true only when cursor is in-bounds
let movePreviewOk = false; // canPlaceRect result for preview

//let pendingGrab = false;
//let pendingGrabSpriteId = -1;
const MOVE_PIXEL_THRESHOLD = 1; // px
let downX = 0, downY = 0;
//const DRAG_THRESH_PX = 4;
let moveStarted = false;     // true while a move transaction is active
let moveMoved = false;       // true once target cell differs from origin
let moveStartCellX = 0;
let moveStartCellY = 0;
let grabOffX = 0;  // in CELLS
let grabOffY = 0;  // in CELLS



// Vars for Seventh Window (Level Editor)
var levelLmbDown = false;
var levelMousePosition;
var levelMousePositionOffset = [0, 0];
var levelTitleBar = document.getElementById("levelTitleBarHW");
var levelLittleWindow = document.getElementById("levelLittleWindowHW");
var levelGearHW = document.getElementById("levelGearHW");
var levelCloseHW = document.getElementById("levelCloseHW");
var window7Color = "Green";
var divSide7 = document.getElementById("divSide7");
var levelCanvasWidth = 544;
var levelCanvasHeight = 480;
var levelGrid = [];
var levelGridCellSize = 32;
var levelGridInCellSize = 32;
var levelSpriteInCellSize = 2;
var bgColorChoose = 4294477153;
var levelBgColor = document.getElementById("levelBgColor");
var levelImportSpriteChosen = document.getElementById("levelImportSpriteChosen")
var levelSpriteHeld = false;
var levelSpriteChosen = -1;
var pasteLevelSprite = false;
var levelMouseSprite = null;
var mouseXLevelCanvas, mouseYLevelCanvas;
var squaresForLevelGridWidth, squaresForLevelGridHeight;
var levelCellOn;
var levelGridSize;
window.showLevelGridCheckbox = document.getElementById("showLevelGridCheckbox");
window.saveLevelPNGButton = document.getElementById("saveLevelPNGButton");
window.levelDebugging = document.getElementById("levelDebugging");


window.onload = function() {
    //Web App Code
    // gridSizeRange.value = gridSize;
    cellSizeRange.value = cellSize;
    // gridSizeRangeText.value = gridSize + " X " + gridSize;
    cSizeRangeText.value = cellSize + " Pixels";

    fillArrayWithZeroes();
    // fillSpriteGridArrayWithNulls();
    refreshGridOutput();



    canvasGrid = document.getElementById("canvasGrid");
    canvasGridCTX = canvasGrid.getContext('2d');

    colorCanvas = document.getElementById("colorPrev");
    colorCanvasCTX = colorCanvas.getContext('2d');

    colorChooseRow1 = document.getElementById("colorChooseRow1");
    colorChooseRow1CTX = colorChooseRow1.getContext('2d');

    previewWindow = document.getElementById("previewWindow");
    previewWindowCTX = previewWindow.getContext('2d');

    spriteCanvas = document.getElementById("spriteCanvas");
    spriteCanvasCTX = spriteCanvas.getContext('2d');
    spriteWindowWidth = spriteCanvas.width;
    spriteWindowHeight = spriteCanvas.height;
    initSheetStaticLayer();
    numberOfSpritesPerRow = Math.floor(spriteWindowWidth / spriteCellSize);

    levelCanvas = document.getElementById("levelCanvas");
    levelCanvasCTX = levelCanvas.getContext('2d');
    levelCanvas.width = levelCanvasWidth;
    levelCanvas.height = levelCanvasHeight;

    // --- SpriteSheet geometry (make maxCells real) ---
    spriteCellSize = BASE_CELL_PX * 2; //4; // 16px base * 4 = 64px on-screen (10 cols on a 700px canvas)
    // sheetCols = Math.max(1, Math.floor(spriteCanvas.width / spriteCellSize)); // e.g. 10
    // sheetRows = Math.ceil(maxCells / sheetCols); // e.g. 500/10 = 50

    allocSheet(sheetCols, sheetRows);
    rebuildSheetOccFromSprites();

    // ─────────────────────────────────────────────
    // This replaces the setInterval() function call.
    // ─────────────────────────────────────────────
    window.requestRerender = function() {
        needsRedraw = true;
    }
    // Render loop
    function renderLoop() {
        if (needsRedraw || antsAnimating) {
            drawAll();
            needsRedraw = false;
        }
        requestAnimationFrame(renderLoop);
    }
    // Init
    requestAnimationFrame(renderLoop);



    createAlphaPattern();

    // Listeners for whole app.
    divSide1.addEventListener('mousedown', function() { openWindow(0);
        windowZRearrange(0);
        windowZRefresh(); }, true);
    divSide2.addEventListener('mousedown', function() { openWindow(1);
        windowZRearrange(1);
        windowZRefresh(); }, true);
    divSide3.addEventListener('mousedown', function() { openWindow(2);
        windowZRearrange(2);
        windowZRefresh(); }, true);
    divSide4.addEventListener('mousedown', function() { openWindow(3);
        windowZRearrange(3);
        windowZRefresh(); }, true);
    divSide5.addEventListener('mousedown', function() { openWindow(4);
        windowZRearrange(4);
        windowZRefresh(); }, true);
    divSide6.addEventListener('mousedown', function() { openWindow(5);
        windowZRearrange(5);
        windowZRefresh(); }, true);
    divSide7.addEventListener('mousedown', function() { openWindow(6);
        windowZRearrange(6);
        windowZRefresh(); }, true);
    cellSizeRange.addEventListener('change', () => { changeCellSize(); syncCanvasToGrid(); redrawGridOverlay(); drawGrid(); }, false);
    // gridSizeRange.addEventListener('change', () => { changeGridSize(); drawGrid(); }, false);

    window.addEventListener("mouseup", () => {
        lmbDown = false;
        rmbDown = false;
        if (pendingGridOutputRefresh) {
            pendingGridOutputRefresh = false;
            scheduleGridOutputRefresh();
        }
        historyEndAction();
    });

    // Listener for the History
    window.addEventListener("keydown", e => {
        const el = document.activeElement;
        const tag = el?.tagName;

        // Don't hijack undo while typing in inputs/textareas
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        const isMod = e.ctrlKey || e.metaKey;

        // Undo: Ctrl/Cmd + Z
        if (isMod && !e.shiftKey && e.key.toLowerCase() === "z") {
            e.preventDefault();
            if (historyUndo()) {
                requestGridFullRedraw();
                pendingGridOutputRefresh = true;
                scheduleGridOutputRefresh();
            }
            return;
        }

        // Redo: Ctrl/Cmd + Y OR Ctrl/Cmd + Shift + Z
        if (isMod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
            e.preventDefault();
            if (historyRedo()) {
                requestGridFullRedraw();
                pendingGridOutputRefresh = true;
                scheduleGridOutputRefresh();
            }
            return;
        }

        // Cancel sprite move with Esc
        if (e.key === "Escape") {
            if (typeof isMovingSprite === "function" && isMovingSprite()) {
                e.preventDefault();
                cancelSpriteMove(true);
                requestRerender();
                return;
            }
        }
    });



    // Listeners for the Color Iro.js
    colorPicker.on('color:change', function(color) {
        const rgba = color.rgba;
        currColor = rgbToUint(rgba);
        colorTextElement.value = uint32ToHex8(currColor);
        drawPreviewSquare(100);
    });



    // Listeners for the Grid Canvas
    canvasGrid.addEventListener('mousemove', gridUpdateMousePos, true);
    //canvasGrid.addEventListener('mousedown', changeCellColor, false);
    canvasGrid.addEventListener('mouseup', (e) => {
        switch (e.button) {
            case 0:
                LMBRelease();
                break;
            case 2:
                RMBRelease();
                break;
        }
        historyEndAction();
    }, false);

    canvasGrid.addEventListener('mousedown', (e) => {
        switch (e.button) {
            case 0:
                historyBeginAction("paint");
                //gridTemp = grid;
                changeCellColor();
                break;
            case 1:
                e.preventDefault();
                siphonColor();
                break;
            case 2:
                historyBeginAction("erase");
                RMB();
                break;
            default:
                break;
        }

    }, false);
    canvasGrid.addEventListener('contextmenu', (e) => { e.preventDefault(); }, { passive: false });


    // Listeners for First Window (Grid)
    littleWindow.addEventListener('mousedown', littleWindowClick, false);
    littleWindow.addEventListener('wheel', e => { changeCellSizeByWheel(e) }, { passive: false });
    titleBar.addEventListener('mousedown', divTitleClick, false);
    titleBar.addEventListener('mouseup', divTitleUnClick, true);
    gearHW.addEventListener('mousedown', gearClick, true);
    closeHW.addEventListener('mousedown', function() { closeWindow(0); }, false);
    resetGridButton.addEventListener('mousedown', zeroOutRefresh, true);
    showGridCheckbox.addEventListener('change', turnGridOnOff, true);
    showTransparentCheckbox.addEventListener('change', function() { showAlpha = !showAlpha; firstDraw = true; requestRerender(); }, true);
    trimWhitespace.addEventListener('click', trimTheWhitespace, true);
    fileSavingOpenButton.addEventListener('click', openSingleDrawing, true);
    fileSavingSaveButton.addEventListener('click', saveSingleDrawing, true);
    flipHorizontal.addEventListener('click', flipHorizontally);
    flipVertical.addEventListener('click', flipVertically);
    showBg.addEventListener('change', showBgFunc);

    gridLockBtn.addEventListener("click", () => {
        gridDimsLocked = !gridDimsLocked;
        gridLockBtn.classList.toggle("linkOn", gridDimsLocked);
        gridLockBtn.classList.toggle("linkOff", !gridDimsLocked);
        gridLockBtn.setAttribute("aria-pressed", gridDimsLocked ? "true" : "false");

        requestGridOutputRefresh();
        requestGridFullRedraw();
        markSheetStaticDirty();
        requestRerender();
    });

    gridWInput.addEventListener("input", () => {
        if (gridDimsLocked) gridHInput.value = gridWInput.value;
    });
    gridWInput.addEventListener("keydown", handleGridDimEnter, true);
    gridHInput.addEventListener("input", () => {
        if (gridDimsLocked) gridWInput.value = gridHInput.value;
    });
    gridHInput.addEventListener("keydown", handleGridDimEnter, true);
    gridApplyBtn.addEventListener("click", applyNewGridDimensions, true);


    bumpUp?.addEventListener("click",    () => bumpGrid(0, -1), true);
    bumpDown?.addEventListener("click",  () => bumpGrid(0,  1), true);
    bumpLeft?.addEventListener("click",  () => bumpGrid(-1, 0), true);
    bumpRight?.addEventListener("click", () => bumpGrid( 1, 0), true);

    const offscreenCanvas = document.createElement("canvas");
    const offscreenCtx = offscreenCanvas.getContext("2d");

    // Listeners for Second Window (Preview)
    prevLittleWindow.addEventListener('mousedown', prevLittleWindowClick, false);
    prevTitleBar.addEventListener('mousedown', prevDivTitleClick, false);
    prevTitleBar.addEventListener('mouseup', prevDivTitleUnClick, true);
    prevGearHW.addEventListener('mousedown', prevGearClick, true);
    prevCloseHW.addEventListener('mousedown', function() { closeWindow(1); }, true);
    previewSelect.addEventListener('change', previewScale, true);

    // Listeners for Third Window (Color Iro.js)
    colorLittleWindow.addEventListener('mousedown', colorLittleWindowClick, false);
    colorTitleBar.addEventListener('mousedown', colorDivTitleClick, false);
    colorTitleBar.addEventListener('mouseup', colorDivTitleUnClick, true);
    colorGearHW.addEventListener('mousedown', colorGearClick, true);
    colorCloseHW.addEventListener('mousedown', function() { closeWindow(2); }, true);
    colorChooseRow1.addEventListener('click', activateColor, true);
    colorChooseRow1.addEventListener('mousemove', gridUpdateMousePosColorChoose, true);
    saveButton.addEventListener('click', saveToStore, true);
    colorTextElement.addEventListener('change', colorText, true);
    loadPalletteButton.addEventListener('click', loadPalletteFile, true);
    savePalletteButton.addEventListener('click', savePalletteFile, true);
    copyColorCode.addEventListener('click', copyColorToClipboard, true);

    // Listeners for Fourth Window (Output)
    outLittleWindow.addEventListener('mousedown', outLittleWindowClick, false);
    outTitleBar.addEventListener('mousedown', outDivTitleClick, false);
    outTitleBar.addEventListener('mouseup', outDivTitleUnClick, true);
    outGearHW.addEventListener('mousedown', outGearClick, true);
    outCloseHW.addEventListener('mousedown', function() { closeWindow(3); }, true);

    // Listeners for Fifth Window (File Saving)
    fileLittleWindow.addEventListener('mousedown', fileLittleWindowClick, false);
    fileTitleBar.addEventListener('mousedown', fileDivTitleClick, false);
    fileTitleBar.addEventListener('mouseup', fileDivTitleUnClick, true);
    fileGearHW.addEventListener('mousedown', fileGearClick, true);
    fileCloseHW.addEventListener('mousedown', function() { closeWindow(4); }, true);
    hexToUintButton.addEventListener('click', function() { alert(hex8ToUint32(hexToUintText.value)); }, true);
    uintToHexButton.addEventListener('click', function() { alert(uint32ToHex8(uintToHexText.value)); }, true);

    // Listeners for Sixth Window (Sprite Sheet)
    spriteLittleWindow.addEventListener('mousedown', spriteLittleWindowClick, false);
    spriteTitleBar.addEventListener('mousedown', spriteDivTitleClick, false);
    spriteTitleBar.addEventListener('mouseup', spriteDivTitleUnClick, true);
    spriteGearHW.addEventListener('mousedown', spriteGearClick, true);
    spriteCloseHW.addEventListener('mousedown', function() { closeWindow(5); }, true);
    spriteCanvas.addEventListener('mousemove', gridUpdateMousePosSpriteSheet, true);
    spriteCanvas.addEventListener('mouseleave', mouseSpriteSheetLeave, true);
    spriteCanvas.addEventListener('click', spriteSheetClick, true);

    spriteCanvas.addEventListener('mousedown', spriteSheetMouseDown, true);
    spriteCanvas.addEventListener('mouseup', spriteSheetMouseUp, true);

    divForSpriteGrid.addEventListener('scroll', debugAction, true);
    spriteImportWorkingGrid.addEventListener('click', workingGridToMouseSprite, true);
    spriteExportWorkingGrid.addEventListener('click', spriteSheetToWorkingGrid, true);
    spriteSaveButton.addEventListener('click', spriteSheetSave, true);
    eraseSingleSprite.addEventListener('click', eraseInSpriteSheet, true)
    openSSheet.addEventListener('click', openSpriteSheet, true);
    newSSheet.addEventListener('click', createNewSpriteSheet, true);

    // Listeners for Seventh Window (Level Editor)
    levelLittleWindow.addEventListener('mousedown', levelLittleWindowClick, false);
    levelTitleBar.addEventListener('mousedown', levelDivTitleClick, false);
    levelTitleBar.addEventListener('mouseup', levelDivTitleUnClick, true);
    levelGearHW.addEventListener('mousedown', levelGearClick, true);
    levelCloseHW.addEventListener('mousedown', function() { closeWindow(6); }, true);
    levelBgColor.addEventListener('click', changeLevelBG, true);
    levelImportSpriteChosen.addEventListener('click', levelUseSpriteChosen, true);
    levelCanvas.addEventListener('mousemove', gridUpdateMousePosLevelEditor, true);
    levelCanvas.addEventListener('mouseleave', mouseLevelEditorLeave, true);
    levelCanvas.addEventListener('click', levelClickFunction, true);
    levelCanvas.addEventListener('mousedown', mouseLevelEditorDown, true);
    levelCanvas.addEventListener('mouseup', mouseLevelEditorUp, true);
    showLevelGridCheckbox.addEventListener('click', turnLevelGridOnOff);
    saveLevelPNGButton.addEventListener('click', saveLevelGridAsPNG);
}