const fileOptions = {
    types: [{
        description: "GAT Working Grid Files",
        accept: {
            "text/parameters": [".gat"],
        },
    }, ],
    excludeAcceptAllOption: true,
    multiple: false,
};

const palletteOptions = {
    types: [{
        description: "GAT Palette Files",
        accept: {
            "text/parameters": [".gpt"],
        },
    }, ],
    excludeAcceptAllOption: true,
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

function parseOpenFile() {
    let openFilePointer;
    let charAtGrid = 0;

    // This is for the auto resize of the grid when opening legacy files. Before, it just loaded into the grid
    // without changing, which would often lead to distortion.
    grid = [];

    if (openFileContents.substring(0, 4) !== "GRID") {
        // The legacy grid file system
        for (openFilePointer = 0; openFilePointer < openFileContents.length; openFilePointer++) {
            if (openFileContents.charAt(openFilePointer) == '#') {
                grid[charAtGrid] = hex8ToUint32(openFileContents.substring(openFilePointer, openFilePointer + 7) + "FF");
                openFilePointer += 6;
            } else {
                grid[charAtGrid] = 0;
            }
            charAtGrid++;

        }
        if (grid.length !== gridSize * gridSize) {
            gridSize = Math.sqrt(grid.length);
            gridSizeRange.value = gridSize;
            gridSizeRangeText.value = `${gridSize} x ${gridSize}`;
        }
        displayLegacyAlert = true;
    } else {
        // The new Uint32 typed array file ssytem
        const newGridSize = parseInt(openFileContents.substring(5, 7));
        grid = openFileContents.substring(7).split(",").map(str => parseInt(str, 10));

        if (newGridSize != gridSize) {
            gridSize = newGridSize;
            gridSizeRange.value = gridSize;
            gridSizeRangeText.value = `${gridSize} x ${gridSize}`;
        }
        displayLegacyAlert = false;
    }
    drawGrid();
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
        alert("It is recommended that you save this file before the release of SpriteGrid 4.0, because it is in the " +
            "old (legacy) file format, and support will not be had in future releases from 4.0 on.");
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
    openFileContents = await file.text();
    parseOpenFile();
    await refreshGridOutput();
    openFileContents = "";
    titleBar.innerHTML = "Working Grid - " + file.name + " &#x1F4C2;";
    windowZRearrange(0);
    windowZRefresh();
    if (displayLegacyAlert) {
        alert("It is recommended that you save this file before the release of SpriteGrid 4.0, because it is in the " +
            "old (legacy) file format, and support will not be had in future releases from 4.0 on.");
        displayLegacyAlert = false;
    }
}

async function loadPalletteFile() {
    const [fileHandle] = await window.showOpenFilePicker(palletteOptions);
    const file = await fileHandle.getFile();
    openPaletteContents = await file.text();
    parsePaletteFile();
    openPaletteContents = "";
    colorTitleBar.innerHTML = "Color Selection - " + file.name + " &#x1F4C2;";
    if (displayLegacyAlert) {
        alert("It is recommended that you save this file before the release of SpriteGrid 4.0, because it is in the " +
            "old (legacy) file format, and support will not be had in future releases from 4.0 on.");
        displayLegacyAlert = false;
    }
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

async function saveSingleDrawing() {
    const saveFileHandle = await window.showSaveFilePicker(fileOptions);
    const saveFileWritableStream = await saveFileHandle.createWritable();
    const gridString = grid.join(",");
    const stringBuilderForFile = "GRID" + "0" + String(gridSize).padStart(2, "0") + gridString;
    await saveFileWritableStream.write(stringBuilderForFile);
    titleBar.innerHTML = "Working Grid - " + saveFileHandle.name + " &#x1F4C2;";
    await saveFileWritableStream.close();
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
    spriteTitleBar.innerHTML = "Sprite Sheet - " + sSheetFileHandle.name + " &#x1F4C2;";
    await sSheetFileWritableStream.close();
    spriteGridBlob = [];
    fileData = null;
}