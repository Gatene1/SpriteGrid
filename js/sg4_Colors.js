function activateColor() {
    findWhereClicked();
    savedColorSquareArray[colorStoresSelected].borderColor = "#000000";
    colorStoresSelected = colorStoresClicked;
    savedColorSquareArray[colorStoresClicked].borderColor = GRID_BORDER_COLOR;
    currColor = savedColorSquareArray[colorStoresClicked].colorHeld;

    drawPreviewSquare(100);

    const bytes = unpackNative(currColor);
    colorPicker.color.set(bytesToIro(bytes));

    colorTextElement.value = nativeToHex8(currColor).toUpperCase();
    colorTextElementUint32.value = String(nativeToFormatUint32(currColor, sg4.ColorParadigm));
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

function hex8ToUint32(hex) {
    if (hex.startsWith("#")) hex = hex.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = parseInt(hex.slice(6, 8), 16);
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

function createAlphaPattern() {
    const tileSize = 8;
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = patternCanvas.height = tileSize * 2;

    const pctx = patternCanvas.getContext("2d");

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
    if (typeof s !== "string") return null;
    let t = s.trim();

    // Allow hex with 0x (optional convenience)
    if (t.startsWith("0x") || t.startsWith("0X")) {
        t = t.slice(2);
        if (!/^[0-9a-fA-F]{1,8}$/.test(t)) return null;
        return (parseInt(t, 16) >>> 0);
    }

    // Primary: DECIMAL (this matches what your picker copies)
    if (!/^[0-9]{1,10}$/.test(t)) return null;

    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    if (n < 0 || n > 4294967295) return null;

    return (n >>> 0);
}

function applyCurrColor(nativeU32) {
    currColor = (nativeU32 >>> 0);

    const bytes = unpackNative(currColor);
    colorPicker.color.set(bytesToIro(bytes));

    colorTextElement.value = bytesToHex8(bytes);
    colorTextElementUint32.value = String(nativeToFormatUint32(currColor, sg4.ColorParadigm));

    drawPreviewSquare(100);
}
