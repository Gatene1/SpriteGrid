function activateColor() {
    findWhereClicked();
    savedColorSquareArray[colorStoresSelected].borderColor = "#000000";
    colorStoresSelected = colorStoresClicked;
    savedColorSquareArray[colorStoresClicked].borderColor = GRID_BORDER_COLOR;
    currColor = savedColorSquareArray[colorStoresClicked].colorHeld;
    //alert (uIntToRgbaString(currColor));
    drawPreviewSquare(100);
    colorPicker.color.rgbaString = uIntToRgbaString(currColor);
}

function findWhereClicked() {
    savedColorSquareArray.forEach((square, index) => {
        if (mouseXSpriteGrid >= square.x1 && mouseXSpriteGrid <= square.x2 && mouseYSpriteGrid >= square.y1 && mouseYSpriteGrid <= square.y2) {
            colorStoresClicked = index;
        }
    })
}

function copyColorToClipboard() {
    const text = document.getElementById('colorTextElement').value;
    navigator.clipboard.writeText(text)
        .catch( err => {
            alert('Failure to Copy');
        });
}

function rgbToUint(rgbObject) {
    return ((rgbObject.a) * 255 << 24) | (rgbObject.b << 16) | (rgbObject.g << 8) | rgbObject.r;
}

function uIntToRgb(uInt) {
    return {
        a: (uInt >> 24) & 0xFF,
        b: (uInt >> 16) & 0xFF,
        g: (uInt >> 8) & 0xFF,
        r: uInt & 0xFF
    };
}

function uIntToRgba(uInt) {
    return {
        g: (uInt >> 8) & 0xFF,
        b: (uInt >> 16) & 0xFF,
        a: ((uInt >> 24) & 0xFF) / 255,
        r: uInt & 0xFF
    };
}

function uIntToRgbaDivide(uInt) {
    return {
        g: (uInt >> 8) & 0xFF,
        b: (uInt >> 16) & 0xFF,
        a: ((uInt >> 24) / 255 & 0xFF),
        r: uInt & 0xFF
    };
}

function hexToRGB(hexString) {
    return  {
        r: parseInt(hexString[1] + hexString[2], 16),
        g: parseInt(hexString[3] + hexString[4], 16),
        b: parseInt(hexString[5] + hexString[6], 16),
        a: 1
    }
}

function uIntToRgbString(uInt) {
    const stringVersion = uIntToRgb(uInt);
    return "rgb(" + stringVersion.r + ", " + stringVersion.g + ", " + stringVersion.b + ")";
}

function uIntToRgbaString(uInt) {
    const stringVersion = uIntToRgba(uInt);
    return "rgba(" + stringVersion.r + ", " + stringVersion.g + ", " + stringVersion.b + ", " + stringVersion.a + ")";
}

function uIntToRgbaStringDivide(uInt) {
    const stringVersion = uIntToRgbaDivide(uInt);
    return "rgba(" + stringVersion.r + ", " + stringVersion.g + ", " + stringVersion.b + ", " + stringVersion.a + ")";
}

function hex8ToUint32(hex) {
    if (hex.startsWith("#")) hex = hex.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = parseInt(hex.slice(6, 8), 16);
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

function uint32ToHex8(uint) {
    const r = uint & 0xFF;
    const g = (uint >> 8) & 0xFF;
    const b = (uint >> 16) & 0xFF;
    const a = (uint >> 24) & 0xFF;

    return (
        "#" +
        r.toString(16).padStart(2, "0") +
        g.toString(16).padStart(2, "0") +
        b.toString(16).padStart(2, "0") +
        a.toString(16).padStart(2, "0")
    );
}

function createAlphaPattern() {
    const tileSize = 8;
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = patternCanvas.height = tileSize * 2;

    const pctx = patternCanvas.getContext("2d");

    // Colors
    const light = "#eee";
    const dark = "#ccc";

    // Draw 4 tiles
    pctx.fillStyle = light;
    pctx.fillRect(0, 0, tileSize * 2, tileSize * 2);
    pctx.fillStyle = dark;
    pctx.fillRect(0, 0, tileSize, tileSize);
    pctx.fillRect(tileSize, tileSize, tileSize, tileSize);

    // Store globally
    alphaPattern = canvasGridCTX.createPattern(patternCanvas, "repeat");
}