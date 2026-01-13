// This block of code will allow the SG4 object to exist regardless of the order of the <scripts> in the HTML file.
/*window.SG4 ??= {};
const SG4 = window.SG4;
SG4.gatMeta ??= { createdUtc: null };
SG4.utcNowIso ??= () => new Date().toISOString();*/
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
        description: "GAT Palette Files",
        accept: {
            "text/parameters": [".gpt"],
        },
    }, ],
    excludeAcceptAllOption: false,
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
    multiple: false,
};


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
        SG4.gatMeta.createdUtc = SG4.gatMeta.createdUtc ?? SG4.utcNowIso();

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

    SG4.gatMeta.createdUtc = SG4.gatMeta.createdUtc ?? SG4.utcNowIso();

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
    // if it is hext string, then it needs to add a "ff" to the end of the read color, convert to uint32
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
            const thisSubString = openPaletteContents.substring(openFilePointer, openFilePointer + filePointerProgressor)
            savedColorSquareArray[colorStoresLoc].colorHeld = rgbToUint(hexToRGB(thisSubString + "FF"));
            colorStores[colorStoresLoc] = rgbToUint(hexToRGB(thisSubString + "FF"));
            colorStoresLoc++;
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
    // Clean up existing grid
    spriteGrid = [];

    if (openSSheetContents.startsWith("SSHEET0")) {
        parseSSheetFile_Modern();
    } else {
        await parseSSheetFile_Legacy();
    }
    if (displayLegacyAlert) {
        alert("This file was saved in an older version of SpriteGrid.\nIt is recommended to save with the new format. before continuing further.");
        displayLegacyAlert = false;
    }
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
                        fileGridGrid.push(rgbToUint(hexToRGB(openSSheetContents.substring(tempGridGridPointer, tempGridGridPointer + 7))))
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
    openPaletteContents = "";
    colorTitleBar.innerHTML = "Color Selection - " + file.name + " &#x1F4C2;";
    if (displayLegacyAlert) {
        alert("This file was saved in an older version of SpriteGrid.\nIt is recommended to save with the new format. before continuing further.");
        displayLegacyAlert = false;
    }
    drawColorSquares();
}

async function openSpriteSheet() {
    const [openSSheetFileHandle] = await window.showOpenFilePicker(spriteSheetOptions);
    const openSSheetFile = await openSSheetFileHandle.getFile();
    openSSheetContents = await openSSheetFile.text();
    parseSSheetFile();
    openSSheetContents = "";
    spriteTitleBar.innerHTML = "Sprite Sheet - " + openSSheetFile.name + " &#x1F4C2;";
    openWindow(5);
    windowZRearrange(5);
    windowZRefresh();

    markSheetStaticDirty();
    requestRerender();
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
    colorTitleBar.innerHTML = "Color Selection - " + saveFileHandle.name + " &#x1F4C2;";
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

        // Build JSON (preserves SG4.gatMeta.createdUtc automatically)
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
    const sSheetFileHandle = await window.showSaveFilePicker(spriteSheetOptions);
    const sSheetFileWritableStream = await sSheetFileHandle.createWritable();

    parseSpriteGrid();

    let fileData = "SSHEET" + "0"; // header + inside joke padding

    for (let i = 0; i < spriteGridBlob.length; i++) {
        const sprite = spriteGridBlob[i];
        if (sprite === null) {
            fileData += "|null";
        } else {
            fileData += "|" + spriteGridBlob[i];
        }
    }

    await sSheetFileWritableStream.write(fileData);
    spriteTitleBar.innerHTML = "Sprite Sheet Editor - " + sSheetFileHandle.name + " &#x1F4C2;";
    await sSheetFileWritableStream.close();
    spriteGridBlob = [];
    fileData = null;

    requestRerender();
}

function buildGatV3JsonObject() {
    const now = SG4.utcNowIso();

    // Preserve createdUtc across saves
    if (!SG4.gatMeta.createdUtc) SG4.gatMeta.createdUtc = now;

    return {
        format: "GAT",
        version: 3,
        meta: {
            createdUtc: SG4.gatMeta.createdUtc,
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
    SG4.gatMeta.createdUtc = obj.meta?.createdUtc || SG4.gatMeta.createdUtc || SG4.utcNowIso();

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
        const hex = uint32ToHex8(v);           // should be "#RRGGBBAA"
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

        const hex = uint32ToHex8(v); // your “source of truth”
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

    if (w < 1 || h < 1 || w > 512 || h > 512) {
        alert(`PNG must be between 1x1 and 512x512. Got ${w}x${h}.`);
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
    SG4.gatMeta.createdUtc = SG4.gatMeta.createdUtc ?? SG4.utcNowIso();

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
    titleEl.textContent = `${labelPrefix} - ${s.fileName}${star} \u{1F4C2}`;

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
