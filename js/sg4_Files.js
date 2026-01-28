// This block of code will allow the sg4 object to exist regardless of the order of the <scripts> in the HTML file.
/*window.sg4 ??= {};
const sg4 = window.sg4;
sg4.gatMeta ??= { createdUtc: null };
sg4.utcNowIso ??= () => new Date().toISOString();*/
// End Nullish Coalescing stuff

const fileOptions = {
    id: "spritegrid-open",
    types: [
        { description: "Accepted SpriteGrid Files",
            accept: {
                "text/plain": [".gat"],
                "image/png": [".png"],
            },
        },

        { description: "GAT Working Grid Files",
          accept: {
                  "text/plain": [".gat"],
          },
        },

        { description: "Portable Network Graphics",
          accept: {
              "image/png": [".png"],
          },
        },
    ],
    excludeAcceptAllOption: false,
    suggestedName: "WorkingGrid",
    multiple: false,
};

const palletteOptions = {
    id: "spritegrid-save",
    types: [{
        description: "GPT Palette Files",
        accept: {
            "text/parameters": [".gpt"],
        },
    }, ],
    excludeAcceptAllOption: false,
    suggestedName: "ColorPalette",
    multiple: false,
};

const spriteSheetOptions = {
    types: [{
        description: "GSS Sprite Sheet Files",
        accept: {
            "text/parameters": [".gss"],
        },
    }, ],
    excludeAcceptAllOption: true,
    suggestedName: "SpriteSheet",
    multiple: false,
};

const levelOptions = {
    id: "spritegrid-save",
    types: [
        { description: "Accepted SpriteGrid Files",
            accept: {
                "text/plain": [".gle"],
                "image/png": [".png"],
            },
        },

        { description: "GLE Level Editor Files",
            accept: {
                "text/plain": [".gle"],
            },
        },

        { description: "Portable Network Graphics",
            accept: {
                "image/png": [".png"],
            },
        },
    ],
    excludeAcceptAllOption: false,
    suggestedName: "LevelEditor",
    multiple: false,
};

const metaBaseTemplate = {
    type: null,
    name: null,
    notes: null,
};

function metaStamp(type, name = null, notes = null) {
    const now = Date.now();
    return { ...metaBaseTemplate, type, name, notes, createdUtc: now, modifiedUtc: now };
}

const levelMetaTemplate = {
...metaBaseTemplate,
    /*spriteSheetForegroundObjectsRef: null,   // or an id later
    spriteSheetForegroundParallaxRef: null,
    spriteSheetForegroundRelicsRef: null,
    spriteSheetForegroundOccludersRef: null,
    spriteSheetForegroundMarkersRef: null,
    spritesheetMiddleGroundCharactersRef: null,
    spriteSheetBackgroundRef: null,
    spriteSheetBackgroundParallaxRef: null,
    spriteSheetBackgroundSkyboxRef: null,
    spriteSheetBackgroundMidgroundElementsRef: null,*/
}

const spriteSheetMetaTemplate = {
...metaBaseTemplate,
}

const spriteIndividualTemplate = {
    id: -1,
    name: "",
    notes: "",
    createdUtc: 0,
    modifiedUtc: 0,
    wPx: 0,
    hPx: 0,
    pixels: null, // Uint32Array after load
    xCell: 0,
    yCell: 0
};


// ─────────────────────────────────────────────
// .gss (SG4GSS) Sprite Sheet v4 helpers
// Spec: gss-spec.txt
// Format: SG4GSS|{json header}|SPRITES:<n>|P:...|...|PLACEMENTS:<n>|L:...|...|META:<n>|M:...|
// ─────────────────────────────────────────────

// SpriteGrid v4 **internal/native** (current engine) Uint32 channel order.
// Canonical internal storage is 0xAABBGGRR (ABGR lens).
// IMPORTANT: This MUST match how SpriteGrid already interprets Uint32 colors in memory.
// If a file declares a different paradigm, we convert on load.
const SG4_NATIVE_COLOR_PARADIGM = "ABGR";

function sg4ParadigmStringToColorFormat(s) {
    const t = String(s ?? "").toUpperCase();
    // Accept both plain and *32 encodings.
    if (t === "RGBA" || t === "RGBA32") return ColorFormat.RGBA;
    if (t === "BGRA" || t === "BGRA32") return ColorFormat.BGRA;
    if (t === "ARGB" || t === "ARGB32") return ColorFormat.ARGB;
    if (t === "ABGR" || t === "ABGR32") return ColorFormat.ABGR;
    // Default to internal/native.
    return ColorFormat.ABGR;
}

function sg4SwapRB(u32) {
    // Swap red and blue channels for 0xRRGGBBAA <-> 0xBBGGRRAA (alpha stays lowest byte).
    const v = (u32 >>> 0);
    const rr = (v & 0xFF000000) >>> 24;
    const gg = (v & 0x00FF0000) >>> 16;
    const bb = (v & 0x0000FF00) >>> 8;
    const aa = (v & 0x000000FF);
    return ((bb << 24) | (gg << 16) | (rr << 8) | aa) >>> 0;
}

function gssEscape(str) {
    // Payload is '|' delimited at file level and ':' delimited within records.
    // We avoid cleverness: only escape what would break parsing.
    return String(str ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/\|/g, "\\|")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "");
}

function gssUnescape(str) {
    // Reverse of gssEscape.
    return String(str ?? "")
        .replace(/\\n/g, "\n")
        .replace(/\\\|/g, "|")
        .replace(/\\\\/g, "\\");
}

function buildGssV4String() {
    const now = (typeof sg4 !== "undefined" && sg4.utcNowIso) ? sg4.utcNowIso() : new Date().toISOString();

    // Build compaction map (sprites[] may contain null holes after deletes)
    const oldToNew = new Map();
    const compactSprites = [];
    for (let oldId = 0; oldId < sprites.length; oldId++) {
        const s = sprites[oldId];
        if (!s) continue;
        const newId = compactSprites.length;
        oldToNew.set(oldId, newId);
        compactSprites.push(s);
    }

    // Header (JSON segment)
    const header = {
        format: "GSS",
        version: 4,
        sheet: {
            cols: sheetCols | 0,
            rows: sheetRows | 0,
            cellPx: BASE_CELL_PX | 0,
            // NOTE: SpriteGrid's current native interpretation matches BGRA.
            // (We spent real pain discovering this — do not casually change it.)
            encoding: "BGRA32",
            packing: "0xAABBGGRR",
            colorParadigm: SG4_NATIVE_COLOR_PARADIGM // future: user-selectable (Color Picker)
        },
        meta: {
            createdUtc: (sg4?.gssMeta?.createdUtc ?? now),
            updatedUtc: now
        }
    };
    sg4.gssMeta ??= { createdUtc: header.meta.createdUtc };

    const parts = [];
    parts.push("SG4GSS");
    parts.push(JSON.stringify(header));

    // SPRITES
    parts.push(`SPRITES:${compactSprites.length}`);
    for (let newId = 0; newId < compactSprites.length; newId++) {
        const s = compactSprites[newId];
        const wPx = s.wPx | 0;
        const hPx = s.hPx | 0;
        const values = Array.from(s.pixels ?? []);
        const expected = wPx * hPx;
        if (values.length !== expected) {
            console.warn(`GSS save: sprite ${newId} pixel length mismatch (expected ${expected}, got ${values.length}).`);
        }
        // P:id:wPx:hPx:val0,val1,val2...
        parts.push(`P:${newId}:${wPx}:${hPx}:${values.join(",")}`);
    }

    // PLACEMENTS (current editor model = one placement per sprite)
    parts.push(`PLACEMENTS:${compactSprites.length}`);
    for (let oldId = 0; oldId < sprites.length; oldId++) {
        const s = sprites[oldId];
        if (!s) continue;
        const newId = oldToNew.get(oldId);
        if (newId == null) continue;
        // L:id:xCell:yCell:rot
        parts.push(`L:${newId}:${s.xCell | 0}:${s.yCell | 0}:0`);
    }

    // META (optional)
    const metaEntries = [];
    for (let oldId = 0; oldId < sprites.length; oldId++) {
        const s = sprites[oldId];
        if (!s) continue;
        const newId = oldToNew.get(oldId);
        if (newId == null) continue;
        const name = (s.name ?? "").toString();
        const notes = (s.notes ?? "").toString();
        if (!name && !notes) continue;
        metaEntries.push(`M:${newId}:${gssEscape(name)}:${gssEscape(notes)}`);
    }
    if (metaEntries.length) {
        parts.push(`META:${metaEntries.length}`);
        parts.push(...metaEntries);
    }

    // Trailing pipe is fine (easier for writers)
    return parts.join("|") + "|";
}

function parseGssV4String(text) {
    const raw = String(text ?? "");
    if (!raw.startsWith("SG4GSS|")) {
        throw new Error("Not an SG4GSS file");
    }

    const segs = raw.split("|");
    // segs[0] = SG4GSS, segs[1] = json
    const headerJson = segs[1];
    let header;
    try { header = JSON.parse(headerJson); }
    catch { throw new Error("Invalid SG4GSS header JSON"); }

    if (header?.format !== "GSS") throw new Error("SG4GSS header missing format=GSS");
    if ((header?.version | 0) !== 4) console.warn("GSS: non-v4 file; attempting best-effort parse.");

    const cols = header?.sheet?.cols | 0;
    const rows = header?.sheet?.rows | 0;
    if (cols < 1 || rows < 1) throw new Error("Invalid sheet dimensions in header");

    // Color paradigm (channel order).
    // Default to engine internal/native if missing.
    const fileParadigmStr = (header?.sheet?.colorParadigm ?? header?.sheet?.encoding ?? SG4_NATIVE_COLOR_PARADIGM).toString();
    const fileFmt = sg4ParadigmStringToColorFormat(fileParadigmStr);
    const needsRepack = (fileFmt !== ColorFormat.ABGR); // internal/native = ABGR (0xAABBGGRR)

    // Reset + allocate
    allocSheet(cols, rows);
    sg4.gssMeta ??= { createdUtc: null };
    sg4.gssMeta.createdUtc = header?.meta?.createdUtc ?? sg4.gssMeta.createdUtc ?? null;

    // Walk payload segments
    let i = 2;
    const spritesById = new Map();
    const placementsRaw = [];
    const metaById = new Map();

    while (i < segs.length) {
        const seg = segs[i];
        if (!seg) { i++; continue; }

        if (seg.startsWith("SPRITES:")) {
            i++;
            while (i < segs.length && segs[i] && !segs[i].startsWith("PLACEMENTS:") && !segs[i].startsWith("META:")) {
                const rec = segs[i];
                if (rec.startsWith("P:")) {
                    const parts = rec.split(":");
                    const id = parts[1] | 0;
                    const wPx = parts[2] | 0;
                    const hPx = parts[3] | 0;
                    const valuesStr = parts.slice(4).join(":"); // just in case
                    let values = valuesStr ? valuesStr.split(",").map(v => (parseInt(v, 10) >>> 0)) : [];

                    // Convert file -> engine internal/native (ABGR / 0xAABBGGRR) if needed.
                    if (needsRepack && values.length) {
                        values = values.map(v => formatUint32ToNative(v, fileFmt));
                    }
                    spritesById.set(id, { id, wPx, hPx, pixels: values });
                }
                i++;
            }
            continue;
        }

        if (seg.startsWith("PLACEMENTS:")) {
            i++;
            while (i < segs.length && segs[i] && !segs[i].startsWith("META:")) {
                const rec = segs[i];
                if (rec.startsWith("L:")) {
                    const parts = rec.split(":");
                    const id = parts[1] | 0;
                    const xCell = parts[2] | 0;
                    const yCell = parts[3] | 0;
                    const rot = parts[4] | 0;
                    placementsRaw.push({ id, xCell, yCell, rot });
                }
                i++;
            }
            continue;
        }

        if (seg.startsWith("META:")) {
            i++;
            while (i < segs.length) {
                const rec = segs[i];
                if (!rec) { i++; continue; }
                if (rec.startsWith("M:")) {
                    const parts = rec.split(":");
                    const id = parts[1] | 0;
                    const name = gssUnescape(parts[2] ?? "");
                    const notes = gssUnescape(parts.slice(3).join(":") ?? "");
                    metaById.set(id, { name, notes });
                    i++;
                    continue;
                }
                // Unknown record → ignore
                i++;
            }
            continue;
        }

        // Unknown segment → ignore
        i++;
    }

    // Build runtime sprites array.
    // NOTE: Current editor model only supports 1 placement per sprite-id.
    // If a file has multiple placements for the same sprite-id, we clone it into new sprite IDs.
    sprites = [];
    selectedSprites.clear();
    selectedSpriteId = -1;
    hoveredSpriteId = -1;

    // Sort placements by original sprite id, then y/x for stable ordering
    placementsRaw.sort((a, b) => (a.id - b.id) || (a.yCell - b.yCell) || (a.xCell - b.xCell));

    for (const plc of placementsRaw) {
        const src = spritesById.get(plc.id);
        if (!src) continue;

        const id = sprites.length;
        const meta = metaById.get(plc.id) ?? { name: "", notes: "" };

        // Compute cell footprint from px dims (ceil to cell)
        const wCells = Math.max(1, Math.ceil((src.wPx | 0) / BASE_CELL_PX));
        const hCells = Math.max(1, Math.ceil((src.hPx | 0) / BASE_CELL_PX));

        // Best-effort: if invalid placement, skip
        if (!canPlaceRect(plc.xCell, plc.yCell, wCells, hCells)) {
            console.warn(`GSS load: cannot place sprite ${plc.id} at ${plc.xCell},${plc.yCell} (occupied/out of bounds). Skipping.`);
            continue;
        }

        const s = {
            id,
            wPx: src.wPx | 0,
            hPx: src.hPx | 0,
            pixels: src.pixels.map(v => v >>> 0),
            wCells,
            hCells,
            xCell: plc.xCell | 0,
            yCell: plc.yCell | 0,
            name: meta.name ?? "",
            notes: meta.notes ?? ""
        };

        sprites.push(s);
        stampRect(s.xCell, s.yCell, s.wCells, s.hCells, id);
    }

    markSheetStaticDirty();
    requestRerender();
}

function buildGssV4SpecString() {
    const now = Date.now();

    // Preserve sheet createdUtc across saves (ms epoch)
    sg4.gssMeta ??= {};
    if (!sg4.gssMeta.createdUtc) sg4.gssMeta.createdUtc = now;

    // Count real sprites (sprites[] can have null holes)
    const spriteList = [];
    for (let i = 0; i < (sprites?.length ?? 0); i++) {
        const s = sprites[i];
        if (!s) continue;
        spriteList.push(s);
    }

    // Metadata (JSON section) per spec
    const meta = {
        type: "spritesheet",
        name: (docState?.sprites?.fileName ?? "Untitled Sheet"),
        createdUtc: sg4.gssMeta.createdUtc,
        modifiedUtc: now,
        notes: null,
        gridCellSize: (typeof BASE_CELL_PX !== "undefined" ? (BASE_CELL_PX | 0) : 16),
        colorParadigm: (typeof SG4_NATIVE_COLOR_PARADIGM !== "undefined" ? SG4_NATIVE_COLOR_PARADIGM : "ABGR"),
        spriteCount: spriteList.length
    };

    const lines = [];
    lines.push("SG4GSS");
    lines.push(JSON.stringify(meta, null, 2));
    lines.push("---");
    lines.push("SPRITES");

    // P:<id>:<wPx>:<hPx>:<createdUtc>:<modifiedUtc>:<pixelData>
    for (let i = 0; i < (sprites?.length ?? 0); i++) {
        const s = sprites[i];
        if (!s) continue;

        const id = (s.id != null ? (s.id | 0) : (i | 0));
        const wPx = (s.wPx | 0);
        const hPx = (s.hPx | 0);

        // Stamp per-sprite timestamps if missing
        if (!s.createdUtc) s.createdUtc = now;
        s.modifiedUtc = now;

        // Normalize pixel buffer
        const expected = wPx * hPx;
        let values = Array.from(s.pixels ?? []);

        // Best-effort fix if mismatch
        if (values.length !== expected) {
            console.warn(`GSS(v4 spec) save: sprite ${id} pixel length mismatch (expected ${expected}, got ${values.length}). Normalizing.`);
            const fixed = new Array(expected).fill(0);
            for (let k = 0; k < Math.min(expected, values.length); k++) fixed[k] = (values[k] >>> 0);
            values = fixed;
        } else {
            // Ensure unsigned
            for (let k = 0; k < values.length; k++) values[k] = (values[k] >>> 0);
        }

        lines.push(`P:${id}:${wPx}:${hPx}:${(s.createdUtc | 0)}:${(s.modifiedUtc | 0)}:${values.join(",")}`);
    }

    lines.push("PLACEMENTS");

    // L:<spriteId>:<xCell>:<yCell>
    for (let i = 0; i < (sprites?.length ?? 0); i++) {
        const s = sprites[i];
        if (!s) continue;

        const id = (s.id != null ? (s.id | 0) : (i | 0));
        lines.push(`L:${id}:${(s.xCell | 0)}:${(s.yCell | 0)}`);
    }

    // META (optional)
    lines.push("META");
    // M:<id>:<name>:<notes>
    for (let i = 0; i < (sprites?.length ?? 0); i++) {
        const s = sprites[i];
        if (!s) continue;

        const id = (s.id != null ? (s.id | 0) : (i | 0));
        const name = (s.name ?? "").toString();
        const notes = (s.notes ?? "").toString();
        if (!name && !notes) continue;

        lines.push(`M:${id}:${gssEscape(name)}:${gssEscape(notes)}`);
    }


    // Final newline (nice for text editors)
    return lines.join("\n") + "\n";
}

function parseGssV4SpecString(text) {
    const raw = String(text ?? "");
    const lines = raw.replace(/\r/g, "").split("\n");

    if ((lines[0] ?? "").trim() !== "SG4GSS") {
        throw new Error("Not an SG4GSS file (missing magic header)");
    }

    // Find '---' divider
    let divider = -1;
    for (let i = 1; i < lines.length; i++) {
        if ((lines[i] ?? "").trim() === "---") { divider = i; break; }
    }
    if (divider < 0) throw new Error("SG4GSS spec missing '---' divider");

    // Parse JSON metadata block: lines[1..divider-1]
    const jsonBlock = lines.slice(1, divider).join("\n").trim();
    let meta;
    try { meta = JSON.parse(jsonBlock); }
    catch { throw new Error("Invalid SG4GSS metadata JSON"); }

    const gridCellSize = (meta?.gridCellSize | 0) || (typeof BASE_CELL_PX !== "undefined" ? (BASE_CELL_PX | 0) : 16);

    // Parse payload sections
    let i = divider + 1;
    while (i < lines.length && !(lines[i] ?? "").trim()) i++;

    if ((lines[i] ?? "").trim() !== "SPRITES") {
        throw new Error("SG4GSS spec missing SPRITES section");
    }
    i++;

    const spritesById = new Map();

    // Read P lines until PLACEMENTS
    for (; i < lines.length; i++) {
        const line = (lines[i] ?? "").trim();
        if (!line) continue;
        if (line === "PLACEMENTS") break;
        if (!line.startsWith("P:")) continue;

        const parts = line.split(":");
        if (parts.length < 7) throw new Error(`Bad P record: ${line}`);

        const id = parts[1] | 0;
        const wPx = parts[2] | 0;
        const hPx = parts[3] | 0;
        const createdUtc = Number(parts[4]);
        const modifiedUtc = Number(parts[5]);

        const pixelStr = parts.slice(6).join(":");
        const px = pixelStr ? pixelStr.split(",").map(v => (parseInt(v, 10) >>> 0)) : [];

        spritesById.set(id, { id, wPx, hPx, createdUtc, modifiedUtc, pixels: px });
    }

    if (i >= lines.length || (lines[i] ?? "").trim() !== "PLACEMENTS") {
        throw new Error("SG4GSS spec missing PLACEMENTS section");
    }
    i++;

    const placements = [];
    for (; i < lines.length; i++) {
        const line = (lines[i] ?? "").trim();
        if (!line) continue;

        // ✅ Stop when META begins
        if (line === "META") break;

        if (!line.startsWith("L:")) continue;

        const parts = line.split(":");
        if (parts.length < 4) throw new Error(`Bad L record: ${line}`);

        const spriteId = parts[1] | 0;
        const xCell = parts[2] | 0;
        const yCell = parts[3] | 0;

        placements.push({ spriteId, xCell, yCell });
    }

    // ✅ META parsing (i is currently at "META" or end)
    const metaById = new Map();
    for (; i < lines.length; i++) {
        const line = (lines[i] ?? "").trim();
        if (!line || line === "META") continue;
        if (!line.startsWith("M:")) continue;

        const parts = line.split(":");
        const id = parts[1] | 0;
        const name = gssUnescape(parts[2] ?? "");
        const notes = gssUnescape(parts.slice(3).join(":") ?? "");
        metaById.set(id, { name, notes });
    }

    // Allocate sheet (dimensions driven by app globals for now)
    allocSheet(sheetCols, sheetRows);

    sprites = [];
    selectedSprites.clear();
    selectedSpriteId = -1;
    hoveredSpriteId = -1;

    placements.sort((a, b) => (a.spriteId - b.spriteId) || (a.yCell - b.yCell) || (a.xCell - b.xCell));

    let maxId = -1;
    for (const p of placements) if (p.spriteId > maxId) maxId = p.spriteId;
    if (maxId >= 0) sprites.length = maxId + 1;

    for (const p of placements) {
        const src = spritesById.get(p.spriteId);
        if (!src) continue;

        const wCells = Math.max(1, Math.ceil((src.wPx | 0) / gridCellSize));
        const hCells = Math.max(1, Math.ceil((src.hPx | 0) / gridCellSize));

        if (!canPlaceRect(p.xCell, p.yCell, wCells, hCells)) {
            console.warn(`GSS spec load: cannot place sprite ${p.spriteId} at ${p.xCell},${p.yCell}. Skipping.`);
            continue;
        }

        const metaRec = metaById.get(p.spriteId) ?? { name: "", notes: "" };

        const s = {
            id: p.spriteId,
            name: metaRec.name ?? "",
            notes: metaRec.notes ?? "",
            createdUtc: (src.createdUtc | 0) || 0,
            modifiedUtc: (src.modifiedUtc | 0) || 0,
            wPx: src.wPx | 0,
            hPx: src.hPx | 0,
            pixels: (src.pixels ?? []).map(v => (v >>> 0)),
            xCell: p.xCell | 0,
            yCell: p.yCell | 0,
            wCells,
            hCells
        };

        sprites[p.spriteId] = s;
        stampRect(s.xCell, s.yCell, s.wCells, s.hCells, s.id);
    }

    // Preserve sheet createdUtc if present
    sg4.gssMeta ??= {};
    if (meta?.createdUtc) sg4.gssMeta.createdUtc = meta.createdUtc;

    markSheetStaticDirty();
    requestRerender();

}



function resetWorkingGridCellSizeDefault() {
    cellSize = 24;
    cellSizeRange.value = cellSize;
    cSizeRangeText.value = cellSize + " Pixels";
}



function parseOpenFile() {
    let openFilePointer;
    let charAtGrid = 0;

    // Reset (legacy code expects this, but DO NOT force grid to be a plain [])
    // We'll let allocGrid / typed-array conversions handle it.
    // grid = [];

    const trimmed = openFileContents.trimStart();

    // ----------------------------
    // GAT v3 JSON (rectangles supported)
    // ----------------------------
    let obj = null;

    try {
        obj = tryParseGatV3Json(openFileContents);
    } catch (e) {
        alert(`Invalid GAT v3 JSON:\n\n${e.message}`);
        resetWorkingGridCellSizeDefault();
        redrawGridOverlay();
        requestGridFullRedraw();
        scheduleGridOutputRefresh();
// Reset working-grid cell size to normal 24
        cellSize = 24;
        cellSizeRange.value = cellSize;
        cSizeRangeText.value = cellSize + " Pixels";
        return;
    }

    if (obj) {
        displayLegacyAlert = false;

        if (typeof gridWInput !== "undefined" && gridWInput) gridWInput.value = gridW;
        if (typeof gridHInput !== "undefined" && gridHInput) gridHInput.value = gridH;
        if (typeof gridSizeRangeText !== "undefined" && gridSizeRangeText) gridSizeRangeText.value = `${gridW} x ${gridH}`;

        resetWorkingGridCellSizeDefault();
        redrawGridOverlay();
        scheduleGridOutputRefresh();
        requestGridFullRedraw();
        requestRerender();
// Reset working-grid cell size to normal 24
        cellSize = 24;
        cellSizeRange.value = cellSize;
        cSizeRangeText.value = cellSize + " Pixels";
        return;
    }


    // ----------------------------
    // Legacy formats (open only)
    // ----------------------------

    // Legacy hex format (no "GRID" header)
    if (openFileContents.substring(0, 4) !== "GRID") {
        // Legacy grid file system
        const temp = [];
        for (openFilePointer = 0; openFilePointer < openFileContents.length; openFilePointer++) {
            if (openFileContents.charAt(openFilePointer) == '#') {
                temp[charAtGrid] = hex8ToUint32(openFileContents.substring(openFilePointer, openFilePointer + 7) + "FF");
                openFilePointer += 6;
            } else {
                temp[charAtGrid] = 0;
            }
            charAtGrid++;
        }

        // Auto-resize square based on content length
        const side = Math.sqrt(temp.length);
        if (!Number.isInteger(side) || side <= 0) {
            alert("Legacy GAT appears corrupted (length is not a perfect square).");
            resetWorkingGridCellSizeDefault();
            redrawGridOverlay();
            requestGridFullRedraw();
            scheduleGridOutputRefresh();
// Reset working-grid cell size to normal 24
            cellSize = 24;
            cellSizeRange.value = cellSize;
            cSizeRangeText.value = cellSize + " Pixels";
            return;
        }

        gridW = side;
        gridH = side;

        // If you still track gridSize for UI elsewhere, keep it consistent
        if (typeof gridSize !== "undefined") gridSize = side;

        // Allocate typed grid + copy values
        allocGrid(gridW, gridH, false);
        grid.set(temp.map(v => v >>> 0));

        // Sync UI
        //if (typeof gridSizeRange !== "undefined") gridSizeRange.value = gridW;
        //if (typeof gridSizeRangeText !== "undefined" && gridSizeRangeText) gridSizeRangeText.value = `${gridW} x ${gridH}`;
        if (typeof gridWInput !== "undefined" && gridWInput) gridWInput.value = gridW;
        if (typeof gridHInput !== "undefined" && gridHInput) gridHInput.value = gridH;


        // Legacy files have no createdUtc, so stamp "now" on first v3 save
        sg4.gatMeta.createdUtc = sg4.gatMeta.createdUtc ?? sg4.utcNowIso();

        displayLegacyAlert = true;
        resetWorkingGridCellSizeDefault();
        redrawGridOverlay();
        scheduleGridOutputRefresh();
        requestGridFullRedraw();
        requestRerender();
// Reset working-grid cell size to normal 24
        cellSize = 24;
        cellSizeRange.value = cellSize;
        cSizeRangeText.value = cellSize + " Pixels";
        return;
    }

    // Legacy "GRID" typed array system (square only)
    const newGridSize = parseInt(openFileContents.substring(5, 7));
    const arr = openFileContents.substring(7).split(",").map(str => parseInt(str, 10) >>> 0);

    gridW = newGridSize;
    gridH = newGridSize;
    if (typeof gridSize !== "undefined") gridSize = newGridSize;

    allocGrid(gridW, gridH, false);
    grid.set(arr);

    // if (typeof gridSizeRange !== "undefined") gridSizeRange.value = gridW;
    // if (typeof gridSizeRangeText !== "undefined") gridSizeRangeText.value = `${gridW} x ${gridH}`;
    if (typeof gridWInput !== "undefined") gridWInput.value = gridW;
    if (typeof gridHInput !== "undefined") gridHInput.value = gridH;

    sg4.gatMeta.createdUtc = sg4.gatMeta.createdUtc ?? sg4.utcNowIso();

    displayLegacyAlert = true;
    requestGridFullRedraw();
    requestRerender();
// Reset working-grid cell size to normal 24
    cellSize = 24;
    cellSizeRange.value = cellSize;
    cSizeRangeText.value = cellSize + " Pixels";
}


function parsePaletteFile() {
    let openFilePointer;
    let colorStoresLoc = 0;
    let filePointerProgressor = 7;
    const firstChar = openPaletteContents[3];
    const palString = openPaletteContents.substring(0, 3);
    const firstCharHex = openPaletteContents[0];
    // this is supposed to read the contents of the palette file, test if it's hexString array or typed array
    // if it is hex string, then it needs to add a "ff" to the end of the read color, convert to uint32
    // store the uint32 version

    if (palString == "PAL") {
        if (firstChar === "|") {
            // New Uint32 System
            const data = openPaletteContents.substring(4); // skip "PAL|"
            const entries = data.split("|").filter(e => e !== "");

            for (let i = 0; i < entries.length && i < savedColorSquareArray.length; i++) {
                const uint = parseInt(entries[i], 10);
                savedColorSquareArray[i].colorHeld = uint;
                colorStores[i] = uint;
            }
            displayLegacyAlert = false;
        } else {
            alert(`Unrecognized file format: ${firstChar}.\n\nPalette files must begin with a \'#\' (legacy) or a \'|\' (Uint32)`);
        }
    } else if (firstCharHex === "#") {
        // Old Hex System
        for (openFilePointer = 0; openFilePointer < openPaletteContents.length; openFilePointer += filePointerProgressor) {
            const thisSubString = openPaletteContents.substring(openFilePointer, openFilePointer + filePointerProgressor);
            const hex8 = thisSubString + "FF";              // "#RRGGBBFF"
            const native = hex8ToUint32(hex8) >>> 0; // returns 0xAABBGGRR native in your codebase
            savedColorSquareArray[colorStoresLoc].colorHeld = native;
            colorStores[colorStoresLoc] = native;
            colorStoresLoc++;
           //alert(thisSubString);
        }
        displayLegacyAlert = true;
    } else {
        alert('Unrecogined file format or not a valid .gpt Palette File.\n\nRefer to Spruce\'s \'gpt-spec.txt\' file for more information');
    }
}

function parseSpriteGrid() {
    let i;
    for (i = 0; i < spriteGridSize; i++) {
        if (spriteGrid[i] == null) {
            spriteGridBlob[i] = null;
        } else {
            spriteGridBlob[i] = spriteGrid[i].sizeOfGrid + "," + spriteGrid[i].gridColors;
            //spriteGridBlob[i] = String(spriteGrid[i].size).padStart(2, "0") + spriteGrid[i].grid.map(c => "," + c).join("");
        }
    }
}

async function parseSSheetFile() {
    // v4+ (current) — SPEC FORMAT (line-based)
    const t = String(openSSheetContents ?? "").trimStart();

// New spec format starts with "SG4GSS\n" and contains a JSON block then "---"
    if (t.startsWith("SG4GSS\n") || t === "SG4GSS") {
        try {
            parseGssV4SpecString(t);
            displayLegacyAlert = false;
            return;
        } catch (e) {
            // If it wasn't spec, we keep going (could be the legacy pipe format)
            console.warn("GSS spec parse failed, falling back:", e);
        }
    }

// Legacy v4 pipe format
    if (t.startsWith("SG4GSS|")) {
        try {
            parseGssV4String(t);
            displayLegacyAlert = false; // treat as legacy now
            return;
        } catch (e) {
            alert(`Invalid .gss file:\n\n${e.message}`);
            return;
        }
    }

    // Legacy fallback: SSHEET0 / older (grid-of-icons). We convert to the v2 runtime model.
    // NOTE: this path exists so old files don't become landfill.
    spriteGrid = [];
    if (t.startsWith("SSHEET0")) {
        parseSSheetFile_Modern();
    } else {
        await parseSSheetFile_Legacy();
    }

    // Convert legacy spriteGrid[] -> sprites[] placements (best-effort)
    allocSheet(sheetCols, sheetRows);
    sprites = [];
    selectedSprites.clear();
    selectedSpriteId = -1;
    hoveredSpriteId = -1;

    let nextX = 0, nextY = 0;
    for (let idx = 0; idx < spriteGrid.length; idx++) {
        const icon = spriteGrid[idx];
        if (!icon) continue;

        const wPx = icon.sizeOfGrid | 0;
        const hPx = icon.sizeOfGrid | 0;
        const pixels = (icon.gridColors ?? []).map(v => (v >>> 0));

        // Find next free 1x1 spot
        while (nextY < sheetRows && !canPlaceRect(nextX, nextY, 1, 1)) {
            nextX++;
            if (nextX >= sheetCols) { nextX = 0; nextY++; }
        }
        if (nextY >= sheetRows) break;

        const id = sprites.length;
        const s = {
            id,
            wPx,
            hPx,
            pixels,
            wCells: 1,
            hCells: 1,
            xCell: nextX,
            yCell: nextY,
            name: "",
            notes: ""
        };
        sprites.push(s);
        stampRect(nextX, nextY, 1, 1, id);

        nextX++;
        if (nextX >= sheetCols) { nextX = 0; nextY++; }
    }

    displayLegacyAlert = true;
    if (displayLegacyAlert) {
        alert("This sprite sheet was saved in an older version of SpriteGrid.\nIt is recommended to save it in the new .gss format.");
        displayLegacyAlert = false;
    }
    markSheetStaticDirty();
    requestRerender();
}

function parseSSheetFile_Modern() {
    spriteGrid = [];

    const spriteEntries = openSSheetContents.split("|");
    const header = spriteEntries.shift(); // "SSHEET0"

    if (!header.startsWith("SSHEET")) {
        alert("Invalid sprite sheet file.");
        return;
    }

    for (const entry of spriteEntries) {
        if (entry === "null") {
            spriteGrid.push(null);
            continue;
        }

        const parts = entry.split(",");
        const gridSize = parseInt(parts.shift());
        const gridData = parts.map(val => parseInt(val));

        spriteGrid.push(new spriteSquareIcon(gridSize, gridData));
    }
}

function parseSSheetFile_Legacy() {
    displayLegacyAlert = true;
    let i, j;
    spriteGrid = [];
    // 1 = Size of the grid saved, 2 = The grid itself
    let expectClassPart = 1;
    let fileGridSize = 0;
    let fileGridGrid = [];
    let tempGridGridPointer = 0;
    let gridGridPointerCharCount = 0;
    for (i = 0; i < openSSheetContents.length; i++) {
        if (openSSheetContents.substring(i, i + 4) == "null") {
            spriteGrid.push(null);
            i += 3;
        } else {
            switch (expectClassPart) {
                case 1:
                    switch (openSSheetContents.substring(i, i + 2)) {
                        case "4,":
                            fileGridSize = 4;
                            i += 1;
                            break;
                        case "8,":
                            fileGridSize = 8;
                            i += 1;
                            break;
                        case "12":
                            fileGridSize = 12;
                            i += 2;
                            break;
                        case "16":
                            fileGridSize = 16;
                            i += 2;
                            break;
                        case "20":
                            fileGridSize = 20;
                            i += 2;
                            break;
                        case "24":
                            fileGridSize = 24;
                            i += 2;
                            break;
                        case "28":
                            fileGridSize = 28;
                            i += 2;
                            break;
                        case "32":
                            fileGridSize = 32;
                            i += 2;
                            break;
                    }
                    expectClassPart = 2;
                    break;
                case 2:
                    tempGridGridPointer = i;

                    if (openSSheetContents.substring(tempGridGridPointer, tempGridGridPointer + 1) == "0") {
                        fileGridGrid.push(0);
                        if (fileGridGrid.length < fileGridSize * fileGridSize) i += 1;
                    } else {
                        const hex8 = openSSheetContents.substring(tempGridGridPointer, tempGridGridPointer + 7) + "FF";
                        const [r,g,b,aByte] = hex8ToRgbaBytes(hex8);
                        fileGridGrid.push(packNative(r,g,b,aByte) >>> 0);

                        if (fileGridGrid.length < fileGridSize * fileGridSize) i += 7;
                        else i += 6;
                    }

                    if (fileGridGrid.length == fileGridSize * fileGridSize) {
                        spriteGrid.push(new spriteSquareIcon(fileGridSize, fileGridGrid));
                        fileGridGrid = [];
                        //alert (spriteGrid[spriteGrid.length - 1].grid);
                        expectClassPart = 1;
                    }
                    break;
            }
        }
    }
    return new Promise((resolve, reject) => {
        // async stuff here
        setTimeout(() => {
            // done!
            resolve("Refreshed!");
        }, 100);
    });
}

async function openSingleDrawing() {
    const [fileHandle] = await window.showOpenFilePicker(fileOptions);
    const file = await fileHandle.getFile();

    // ✅ PNG path
    if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
        await openPngToWorkingGrid(file);

        //titleBar.innerHTML = "Working Grid - " + file.name + " &#x1F4C2;";
        docState.grid.fileName = file.name;
        clearDirty("grid");

        windowZRearrange(0);
        windowZRefresh();
        // Reset working-grid cell size to normal 24
        cellSize = 24;
        cellSizeRange.value = cellSize;
        cSizeRangeText.value = cellSize + " Pixels";
        markSheetStaticDirty();
        requestRerender();
        return;
    }

    // existing .gat/text path
    openFileContents = await file.text();
    parseOpenFile();
    await refreshGridOutput();
    openFileContents = "";

    //titleBar.innerHTML = "Working Grid - " + file.name + " &#x1F4C2;";
    docState.grid.fileName = file.name;
    clearDirty("grid");

    windowZRearrange(0);
    windowZRefresh();

    // ...keep the rest of your legacy alert + lock logic...
    if (displayLegacyAlert) {
        alert("This file was saved in an older version of SpriteGrid.\nIt is recommended to save with the new format. before continuing further.");
        displayLegacyAlert = false;
    }

    if (gridLockBtn.ariaPressed === "true" && (gridWInput.value !== gridHInput.value)) {
        gridDimsLocked = false;
        gridLockBtn.classList.toggle("linkOff", !gridDimsLocked);
        gridLockBtn.setAttribute("aria-pressed", "false");
    }
// Reset working-grid cell size to normal 24
    cellSize = 24;
    cellSizeRange.value = cellSize;
    cSizeRangeText.value = cellSize + " Pixels";
    //requestGridFullRedraw();
    //markSheetStaticDirty();
    requestRerender();
}


async function loadPalletteFile() {
    const [fileHandle] = await window.showOpenFilePicker(palletteOptions);
    const file = await fileHandle.getFile();
    openPaletteContents = await file.text();
    parsePaletteFile();
    palletteOptions.suggestedName = file.name;
    docState.palette.fileName = file.name;
    clearDirty("palette");
    openPaletteContents = "";
    if (displayLegacyAlert) {
        alert("This file was saved in an older version of SpriteGrid.\nIt is recommended to save with the new format. before continuing further.");
        displayLegacyAlert = false;
    }
    drawColorSquares();
}

// NOTE: sg4.js expects this name for the unsaved-changes guard.
function actuallyNewSpriteSheet() {
    // createNewSpriteSheet() lives in sg4_Inputs.js and is the canonical reset.
    createNewSpriteSheet();
    docState.sprites.fileName = "Unknown.gss";
    spriteSheetOptions.suggestedName = "SpriteSheet";
    clearDirty("sprites");
    spriteTitleBar.innerHTML = "Sprite Sheet - " + docState.sprites.fileName + " &#x1F4C2;";
}

// NOTE: sg4.js expects these names for the unsaved-changes guard.
async function actuallyOpenSpriteSheet() {
    const [openSSheetFileHandle] = await window.showOpenFilePicker(spriteSheetOptions);
    const openSSheetFile = await openSSheetFileHandle.getFile();
    openSSheetContents = await openSSheetFile.text();

    await parseSSheetFile();
    openSSheetContents = "";

    spriteSheetOptions.suggestedName = openSSheetFile.name;
    docState.sprites.fileName = openSSheetFile.name;
    clearDirty("sprites");

    spriteTitleBar.innerHTML = "Sprite Sheet - " + openSSheetFile.name + " &#x1F4C2;";
    openWindow(5);
    windowZRearrange(5);
    windowZRefresh();

    markSheetStaticDirty();
    requestRerender();
}

// Back-compat name (in case anything still calls it)
async function openSpriteSheet() {
    return actuallyOpenSpriteSheet();
}

async function savePalletteFile() {
    const saveFileHandle = await window.showSaveFilePicker(palletteOptions);
    const saveFileWritableStream = await saveFileHandle.createWritable();

    let fileData = "PAL";
    for (let i = 0; i < savedColorSquareArray.length; i++) {
        const uintColor = savedColorSquareArray[i].colorHeld;
        fileData += "|" + uintColor.toString();
    }

    const saveFileBlob = new Blob([fileData], { type: "text/plain" });
    await saveFileWritableStream.write(saveFileBlob);
    palletteOptions.suggestedName = saveFileHandle.name;
    docState.palette.fileName = saveFileHandle.name;
    clearDirty("palette");
    colorTitleBar.innerHTML = "Color Picker - " + saveFileHandle.name + " &#x1F4C2;";
    await saveFileWritableStream.close();
}

async function saveSingleDrawingAsPNG(handle) {
    const canvas = document.createElement("canvas");
    canvas.width = gridW;
    canvas.height = gridH;

    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(gridW, gridH);
    const d = img.data;

    for (let i = 0; i < grid.length; i++) {
        const v = grid[i] >>> 0;
        const di = i * 4;

        d[di + 0] = (v >>> 24) & 0xff; // R
        d[di + 1] = (v >>> 16) & 0xff; // G
        d[di + 2] = (v >>> 8)  & 0xff; // B
        d[di + 3] = (v)        & 0xff; // A
    }

    ctx.putImageData(img, 0, 0);

    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}


async function saveSingleDrawing() {
    fileOptions.suggestedName = docState.grid.fileName;
    const saveFileHandle = await window.showSaveFilePicker(fileOptions);
    const fileName = saveFileHandle.name.toLowerCase();

    if (fileName.endsWith(".gat")) {
        const saveFileWritableStream = await saveFileHandle.createWritable();

        // Validate grid size before writing
        const expectedLen = gridW * gridH;
        if (!grid || grid.length !== expectedLen) {
            alert(`Grid data length mismatch. Expected ${expectedLen}, got ${grid ? grid.length : 0}.`);
            await saveFileWritableStream.close();
            return;
        }

        // Build JSON (preserves sg4.gatMeta.createdUtc automatically)
        const jsonString = buildGatV3JsonString(false);

        await saveFileWritableStream.write(jsonString);
        //titleBar.innerHTML = "Working Grid - " + saveFileHandle.name + " &#x1F4C2;";

        await saveFileWritableStream.close();
    } else if (fileName.endsWith(".png")) {
        await saveUint32GridAsPNG(saveFileHandle);
    }
    docState.grid.fileName = saveFileHandle.name;
    clearDirty("grid");
}



async function spriteSheetSave() {
    spriteSheetOptions.suggestedName = docState.sprites.fileName;
    const sSheetFileHandle = await window.showSaveFilePicker(spriteSheetOptions);
    const sSheetFileWritableStream = await sSheetFileHandle.createWritable();

    // NEW: write spec-compliant, line-based SG4GSS v4.0
    const fileData = buildGssV4SpecString();
    await sSheetFileWritableStream.write(fileData);
    await sSheetFileWritableStream.close();

    spriteSheetOptions.suggestedName = sSheetFileHandle.name;
    docState.sprites.fileName = sSheetFileHandle.name;
    clearDirty("sprites");
    spriteTitleBar.innerHTML = "Sprite Sheet - " + sSheetFileHandle.name + " &#x1F4C2;";

    requestRerender();
}


function buildGatV3JsonObject() {
    const now = sg4.utcNowIso();

    // Preserve createdUtc across saves
    if (!sg4.gatMeta.createdUtc) sg4.gatMeta.createdUtc = now;

    return {
        format: "GAT",
        version: 3,
        meta: {
            createdUtc: sg4.gatMeta.createdUtc,
            updatedUtc: now
        },
        image: {
            w: gridW,
            h: gridH,
            encoding: "RGBA32",
            packing: "0xRRGGBBAA",
            data: {
                type: "u32",
                values: Array.from(grid)
            }
        }
    };
}

function buildGatV3JsonString(pretty = false) {
    const obj = buildGatV3JsonObject();
    return JSON.stringify(obj, null, pretty ? 2 : 0);
}

function tryParseGatV3Json(text) {
    const trimmed = text.trimStart();
    if (!trimmed.startsWith("{")) return null;

    let obj;
    try { obj = JSON.parse(text); }
    catch { return null; }

    if (!obj || obj.format !== "GAT" || obj.version !== 3) return null;

    const img = obj.image;
    if (!img || typeof img.w !== "number" || typeof img.h !== "number") {
        throw new Error("GAT v3 JSON missing image.w/image.h");
    }

    const data = img.data;
    if (!data || data.type !== "u32" || !Array.isArray(data.values)) {
        throw new Error('GAT v3 JSON supports only image.data.type = "u32" right now');
    }

    const w = img.w | 0;
    const h = img.h | 0;
    if (w < 1 || h < 1) throw new Error("Invalid image dimensions");

    if (data.values.length !== (w * h)) {
        throw new Error(`GAT v3 JSON data length mismatch: expected ${w*h}, got ${data.values.length}`);
    }

    // Apply
    allocGrid(w, h, false);
    grid.set(data.values.map(v => v >>> 0));

    // Persist createdUtc for future saves
    sg4.gatMeta.createdUtc = obj.meta?.createdUtc || sg4.gatMeta.createdUtc || sg4.utcNowIso();

    return obj;
}

async function saveWorkingGridAsPNG(handle) {
    const w = gridW | 0;
    const h = gridH | 0;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, h);
    const d = img.data;

    for (let i = 0; i < window.grid.length; i++) {
        const v = window.grid[i] >>> 0;

        // empty pixel
        if (v === 0) {
            const di = i * 4;
            d[di + 0] = 0;
            d[di + 1] = 0;
            d[di + 2] = 0;
            d[di + 3] = 0;
            continue;
        }

        // Use your existing converter so PNG matches the app’s colors exactly.
        const hex = nativeToHex8(v);           // should be "#RRGGBBAA"
        const [r, g, b, a] = hex8ToRgbaBytes(hex);

        const di = i * 4;
        d[di + 0] = r;
        d[di + 1] = g;
        d[di + 2] = b;
        d[di + 3] = a;
    }

    ctx.putImageData(img, 0, 0);

    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

async function saveUint32GridAsPNG(handle, pixelsU32 = grid, w = gridW, h = gridH) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, h);
    const d = img.data;

    for (let i = 0; i < pixelsU32.length; i++) {
        const v = pixelsU32[i] >>> 0;

        const di = i * 4;
        if (v === 0) {
            d[di+0] = 0; d[di+1] = 0; d[di+2] = 0; d[di+3] = 0;
            continue;
        }

        const hex = nativeToHex8(v); // your “source of truth”
        let s = hex.startsWith("#") ? hex.slice(1) : hex;
        if (s.length === 6) s += "FF";

        d[di+0] = parseInt(s.slice(0,2), 16) & 255;
        d[di+1] = parseInt(s.slice(2,4), 16) & 255;
        d[di+2] = parseInt(s.slice(4,6), 16) & 255;
        d[di+3] = parseInt(s.slice(6,8), 16) & 255;
    }

    ctx.putImageData(img, 0, 0);

    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

async function openPngToWorkingGrid(file) {
    // Safety limits (per your spec)
    const bitmap = await createImageBitmap(file);
    const w = bitmap.width | 0;
    const h = bitmap.height | 0;

    if (w < 1 || h < 1 || w > 256 || h > 256) {
        alert(`PNG must be between 1x1 and 256x256. Got ${w}x${h}.`);
        return;
    }

    // Draw onto a temp canvas to read RGBA bytes
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0);

    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data; // RGBA bytes

    // Allocate grid and pack pixels to your Uint32 format: 0xAABBGGRR
    allocGrid(w, h, false);

    for (let i = 0; i < w * h; i++) {
        const di = i * 4;
        const r = d[di + 0] & 255;
        const g = d[di + 1] & 255;
        const b = d[di + 2] & 255;
        const a = d[di + 3] & 255;

        // Transparent pixel => 0 (your convention)
        if (a === 0) {
            grid[i] = 0;
        } else {
            grid[i] = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
        }
    }

    // UI sync + redraw
    if (gridWInput) gridWInput.value = w;
    if (gridHInput) gridHInput.value = h;


    scheduleGridOutputRefresh();
    syncCanvasToGrid();
    requestGridFullRedraw();
    redrawGridOverlay();

    // Stamp metadata for first save
    sg4.gatMeta.createdUtc = sg4.gatMeta.createdUtc ?? sg4.utcNowIso();

    if (gridLockBtn.ariaPressed === "true" && (gridWInput.value !== gridHInput.value)) {
        gridDimsLocked = false;
        gridLockBtn.classList.toggle("linkOff", !gridDimsLocked);
        gridLockBtn.setAttribute("aria-pressed", "false");
    }

    firstDraw = true;
}

function updateDocChrome(kind) {
    const s = docState[kind];
    const star = s.dirty ? "*" : "";
    const titleEl = document.getElementById(s.titleId);
    const sideEl  = document.getElementById(s.sideId);
    const labelPrefix = s.name;

    // Title text example: "Working Grid - Unknown.gat* 📂"
    titleEl.textContent =
        `${labelPrefix} - ${s.fileName}${star} \u{1F4C2}` +
        `${s.name === "Working Grid" ? ` (${gridW}x${gridH})` : ""}`;

    // Side tab indicator is CSS-driven via attribute:
    sideEl.dataset.dirty = s.dirty ? "1" : "0";
}

async function guardUnsaved(kind, labelPrefix, doNext) {
    if (!docState[kind].dirty) return doNext();

    const choice = await showUnsavedDialog(kind);
    // choice: "save" | "nosave" | "cancel"

    if (choice === "cancel") return;

    if (choice === "save") {
        const saved = await doSave(kind); // returns true/false (false if user cancels save)
        if (!saved) return;               // user canceled save dialog
    }

    // either saved, or chose "nosave"
    return doNext();
}

function saveLevelGridAsPNG() {
    try {
        const a = document.createElement("a");
        const base = (docState?.level?.fileName ?? "Level.gle").replace(/\.[^.]+$/, "");
        a.download = base + ".png";
        a.href = levelCanvas.toDataURL("image/png");
        a.click();
    } catch (err) {
        console.error(err);
        alert("Could not export PNG (see console).");
    }
}

