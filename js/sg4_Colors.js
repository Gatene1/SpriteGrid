function activateColor() {
    findWhereClicked();
    savedColorSquareArray[colorStoresSelected].borderColor = "#000000";
    colorStoresSelected = colorStoresClicked;
    savedColorSquareArray[colorStoresClicked].borderColor = GRID_BORDER_COLOR;
    currColor = savedColorSquareArray[colorStoresClicked].colorHeld;
    //alert (uIntToRgbaString(currColor));
    drawPreviewSquare(100);

    const bytes = unpackNative(currColor);
    colorPicker.color.set(bytesToIro(bytes));

    colorTextElement.value = bytesToHex8(bytes);
    colorTextElementUint32.value =
        "0x" + nativeToFormatUint32(currColor, sg4.ColorParadigm)
            .toString(16)
            .padStart(8, "0")
            .toUpperCase();


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

function uIntToRgba(uint) {
    switch (sg4.ColorParadigm) {
        case 0:
            return {
                a: uint & 0xFF,
                b: (uint >> 8) & 0xFF,
                g: (uint >> 16) & 0xFF,
                r: (uint >> 24) & 0xFF
            }
            break;
        case 1:
            return {
                a: uint & 0xFF,
                r: (uint >> 8) & 0xFF,
                g: (uint >> 16) & 0xFF,
                b: (uint >> 24) & 0xFF
            };
            break;
        case 2:
            return {
                b: uint & 0xFF,
                g: (uint >> 8) & 0xFF,
                r: (uint >> 16) & 0xFF,
                a: (uint >> 24) & 0xFF
            };
            break;
        case 3:
            return {
                r: uint & 0xFF,
                g: (uint >> 8) & 0xFF,
                b: (uint >> 16) & 0xFF,
                a: (uint >> 24) & 0xFF
            };
            break;
    }

    /*return {
        g: (uInt >> 8) & 0xFF,
        b: (uInt >> 16) & 0xFF,
        a: ((uInt >> 24) & 0xFF) / 255,
        r: uInt & 0xFF
    };*/
}

function uIntToRgbaDivide(uInt) {
    return {
        g: (uInt >> 8) & 0xFF,
        b: (uInt >> 16) & 0xFF,
        a: ((uInt >> 24) / 255 & 0xFF),
        r: uInt & 0xFF
    };
}

function hexToBytes(hexString) {
    const [r, g, b, aByte] = hex8ToRgbaBytes(hexString);
    return { r, g, b, aByte };
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
    let r, g, b, a;
    switch (sg4.ColorParadigm) {
        case 0:
            a = uint & 0xFF;
            b = (uint >> 8) & 0xFF;
            g = (uint >> 16) & 0xFF;
            r = (uint >> 24) & 0xFF;
            // r = uint & 0xFF;
            // g = (uint >> 8) & 0xFF;
            // b = (uint >> 16) & 0xFF;
            // a = (uint >> 24) & 0xFF;
            return (
                "#" +
                r.toString(16).padStart(2, "0") +
                g.toString(16).padStart(2, "0") +
                b.toString(16).padStart(2, "0") +
                a.toString(16).padStart(2, "0")
            );
            break;
        case 1:
            a = uint & 0xFF;
            r = (uint >> 8) & 0xFF;
            g = (uint >> 16) & 0xFF;
            b = (uint >> 24) & 0xFF;
            return (
                "#" +
                b.toString(16).padStart(2, "0") +
                g.toString(16).padStart(2, "0") +
                r.toString(16).padStart(2, "0") +
                a.toString(16).padStart(2, "0")
            );
            break;
        case 2:
            b = uint & 0xFF;
            g = (uint >> 8) & 0xFF;
            r = (uint >> 16) & 0xFF;
            a = (uint >> 24) & 0xFF;
            return (
                "#" +
                a.toString(16).padStart(2, "0") +
                r.toString(16).padStart(2, "0") +
                g.toString(16).padStart(2, "0") +
                b.toString(16).padStart(2, "0")
            );
            break;
        case 3:
            r = uint & 0xFF;
            g = (uint >> 8) & 0xFF;
            b = (uint >> 16) & 0xFF;
            a = (uint >> 24) & 0xFF;
            return (
                "#" +
                a.toString(16).padStart(2, "0") +
                b.toString(16).padStart(2, "0") +
                g.toString(16).padStart(2, "0") +
                r.toString(16).padStart(2, "0")
            );
            break;
    }




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
    let r2 = parseInt(r).toString(16).padStart(2, 0);
    let g2 = parseInt(g).toString(16).padStart(2, 0);
    let b2 = parseInt(b).toString(16).padStart(2, 0);
    let a2 = Math.floor((parseInt(a) * 255)).toString(16).padStart(2, 0).toUpperCase();

    return r2 + g2 + b2 + a2;
}

function unpackRGBA(u32, format) {
    u32 >>>= 0;
    let b3 = (u32 >>> 24) & 255;
    let b2 = (u32 >>> 16) & 255;
    let b1 = (u32 >>> 8) & 255;
    let b0 = u32 & 255;

    switch (format) {
        case ColorFormat.RGBA: return { r: b3, g: b2, b: b1, aByte: b0 };
        case ColorFormat.BGRA: return { b: b3, g: b2, r: b1, aByte: b0 };
        case ColorFormat.ARGB: return { aByte: b3, r: b2, g: b1, b: b0 };
        case ColorFormat.ABGR: return { aByte: b3, b: b2, g: b1, r: b0 };
    }
}

// ─────────────────────────────────────────────
// CANONICAL INTERNAL FORMAT (for grid + canvas)
// INTERNAL UINT32 = 0xAABBGGRR  (little-endian -> RGBA bytes in memory)
// ─────────────────────────────────────────────

function clampByte(n) {
    n = n | 0;
    if (n < 0) return 0;
    if (n > 255) return 255;
    return n;
}

function float01ToByte(a) {
    // accept 0..1 or 0..255
    if (a == null) return 255;
    if (a <= 1) return clampByte(Math.round(a * 255));
    return clampByte(Math.round(a));
}

// Pack to INTERNAL (AABBGGRR)
function packNative(r, g, b, aByte) {
    r = clampByte(r);
    g = clampByte(g);
    b = clampByte(b);
    aByte = clampByte(aByte);

    // 0xAABBGGRR
    return (
        ((aByte & 255) << 24) |
        ((b     & 255) << 16) |
        ((g     & 255) <<  8) |
        ((r     & 255)      )
    ) >>> 0;
}

// Unpack from INTERNAL (AABBGGRR) -> bytes
function unpackNative(u32) {
    u32 = (u32 >>> 0);
    return {
        r:     (u32       ) & 255,
        g:     (u32 >>>  8) & 255,
        b:     (u32 >>> 16) & 255,
        aByte: (u32 >>> 24) & 255
    };
}

// Hex display is ALWAYS #RRGGBBAA (human readable)
function bytesToHex8({ r, g, b, aByte }) {
    return (
        "#" +
        r.toString(16).padStart(2,"0") +
        g.toString(16).padStart(2,"0") +
        b.toString(16).padStart(2,"0") +
        aByte.toString(16).padStart(2,"0")
    ).toUpperCase();
}

// iro rgba (0..255 + 0..1) -> bytes
function iroToBytes(rgba) {
    return {
        r: clampByte(rgba.r),
        g: clampByte(rgba.g),
        b: clampByte(rgba.b),
        aByte: float01ToByte(rgba.a)
    };
}

// bytes -> iro-friendly object (0..255 + 0..1 alpha)
function bytesToIro({ r, g, b, aByte }) {
    return { r, g, b, a: aByte / 255 };
}

function nativeToFormatUint32(nativeU32, fmt) {
    const bytes = unpackNative(nativeU32);
    return bytesToFormatUint32(bytes, fmt);
}

function formatUint32ToNative(u32, fmt) {
    const bytes = formatUint32ToBytes(u32, fmt);
    return packNative(bytes.r, bytes.g, bytes.b, bytes.aByte);
}

function bytesToFormatUint32(bytes, fmt) {
    const r = bytes.r, g = bytes.g, b = bytes.b, a = bytes.aByte;

    let v = 0;
    switch (fmt) {
        case ColorFormat.RGBA: v = (r<<24) | (g<<16) | (b<<8) | (a); break; // RRGGBBAA
        case ColorFormat.BGRA: v = (b<<24) | (g<<16) | (r<<8) | (a); break; // BBGGRRAA
        case ColorFormat.ARGB: v = (a<<24) | (r<<16) | (g<<8) | (b); break; // AARRGGBB
        case ColorFormat.ABGR: v = (a<<24) | (b<<16) | (g<<8) | (r); break; // AABBGGRR
        default:               v = (b<<24) | (g<<16) | (r<<8) | (a); break; // default BGRA-ish display
    }
    return v >>> 0;
}

function formatUint32ToBytes(u32, fmt) {
    u32 = (u32 >>> 0);
    let r=0,g=0,b=0,a=255;

    switch (fmt) {
        case ColorFormat.RGBA: r=(u32>>>24)&255; g=(u32>>>16)&255; b=(u32>>>8)&255; a=u32&255; break;
        case ColorFormat.BGRA: b=(u32>>>24)&255; g=(u32>>>16)&255; r=(u32>>>8)&255; a=u32&255; break;
        case ColorFormat.ARGB: a=(u32>>>24)&255; r=(u32>>>16)&255; g=(u32>>>8)&255; b=u32&255; break;
        case ColorFormat.ABGR: a=(u32>>>24)&255; b=(u32>>>16)&255; g=(u32>>>8)&255; r=u32&255; break;
        default:               b=(u32>>>24)&255; g=(u32>>>16)&255; r=(u32>>>8)&255; a=u32&255; break;
    }

    return { r, g, b, aByte: a };
}

function nativeToHex8(u32) {
    const { r, g, b, aByte } = unpackNative(u32 >>> 0);

    const h = n => n.toString(16).padStart(2, "0").toUpperCase();
    return `#${h(r)}${h(g)}${h(b)}${h(aByte)}`;
}

function parseU32Text(s) {
    if (typeof s != "string") return null;
    let t = s.trim();
    if (t.startsWith("0x") || t.startsWith("0X")) t = t.slice(2);
    if (!/^[0-9a-fA-F]{1,8}$/.test(t)) return null;
    return (parseInt(t, 16) >>> 0);
}
