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

function copyColorToClipboard(num) {
    const text = document.getElementById(num == 1 ? 'colorTextElement' : 'colorTextElementUint32').value;
    navigator.clipboard.writeText(text)
        .catch( err => {
            alert('Failure to Copy');
        });
}

function rgbToUint(rgb) {
    let a = rgb.a ?? 1;
    if (a > 1) a /= 255;

    return packRGBA(
        rgb.r & 255,
        rgb.g & 255,
        rgb.b & 255,
        Math.round(a * 255) & 255
    );
}


function abgrToUint(rgbObject) {
    return ((rgbObject.r) * 255 << 24) | (rgbObject.g << 16) | (rgbObject.b<< 8) | rgbObject.a;
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

function hex8ToRgbaBytes(hex) {
    // Expect "#RRGGBBAA"
    // If your uint32ToHex8 returns "#RRGGBB", we treat it as fully opaque.
    hex = (hex || "").trim();
    if (hex.startsWith("#")) hex = hex.slice(1);

    if (hex.length === 6) hex += "FF";
    if (hex.length !== 8) return [0, 0, 0, 0];

    const r = parseInt(hex.slice(0, 2), 16) & 255;
    const g = parseInt(hex.slice(2, 4), 16) & 255;
    const b = parseInt(hex.slice(4, 6), 16) & 255;
    const a = parseInt(hex.slice(6, 8), 16) & 255;
    return [r, g, b, a];
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
    const light = "#f2f2f2";
    const dark  = "#e0e0e0";


    // Draw 4 tiles
    pctx.fillStyle = light;
    pctx.fillRect(0, 0, tileSize * 2, tileSize * 2);
    pctx.fillStyle = dark;
    pctx.fillRect(0, 0, tileSize, tileSize);
    pctx.fillRect(tileSize, tileSize, tileSize, tileSize);

    // Store globally
    alphaPattern = canvasGridCTX.createPattern(patternCanvas, "repeat");
}

function hex8ToAABBGGRR(hex) {
    // "#RRGGBBAA" → Uint32 0xAABBGGRR for ImageData Uint32 view
    hex = hex.startsWith("#") ? hex.slice(1) : hex;
    if (hex.length === 6) hex += "FF";
    const rr = parseInt(hex.slice(0,2),16) & 255;
    const gg = parseInt(hex.slice(2,4),16) & 255;
    const bb = parseInt(hex.slice(4,6),16) & 255;
    const aa = parseInt(hex.slice(6,8),16) & 255;
    return (aa<<24) | (bb<<16) | (gg<<8) | rr;
}

function packRGBA(r, g, b, a, format = sg4.ColorParadigm) {
    switch (format) {
        case ColorFormat.RGBA:
            return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;

        case ColorFormat.BGRA:
            return ((b << 24) | (g << 16) | (r << 8) | a) >>> 0;

        case ColorFormat.ARGB:
            return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;

        case ColorFormat.ABGR:
            return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
    }
}

function rgbaToHex8(r, g, b, a) {
    let r2 = parseInt(rgba.r).toString(16).padStart(2, 0);
    let g2 = parseInt(rgba.g).toString(16).padStart(2, 0);
    let b2 = parseInt(rgba.b).toString(16).padStart(2, 0);
    let a2 = Math.round((rgba.a * 255)).toString(16).padStart(2, 0);

    return r2 + g2 + b2 + a2;
}
