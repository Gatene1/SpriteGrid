function windowZRearrange(elementToLookAt) {
    const currentZ = windowZ[elementToLookAt];

    // Skip rearrangement if the target is hidden
    if (currentZ === -1) return;

    for (let i = 0; i < windowZ.length; i++) {
        if (i === elementToLookAt) continue; // Skip the window we're promoting

        // If window is visible and has a higher Z than the one we're promoting
        if (windowZ[i] !== -1 && windowZ[i] > currentZ) {
            windowZ[i] = Math.max(0, windowZ[i] - 1); // Decrease Z, not below 0
        }
    }

    // Now promote the selected window to Z = 6
    windowZ[elementToLookAt] = 6;

    // Update visual indicators
    windowZRefresh();
}

function windowZRefresh() {
    const windowElements = [
        littleWindow,
        prevLittleWindow,
        colorLittleWindow,
        outLittleWindow,
        fileLittleWindow,
        spriteLittleWindow,
        levelLittleWindow
    ];

    const titleBars = [
        titleBar,
        prevTitleBar,
        colorTitleBar,
        outTitleBar,
        fileTitleBar,
        spriteTitleBar,
        levelTitleBar
    ];

    for (let i = 0; i < windowZ.length; i++) {
        if (windowZ[i] === -1) continue; // Skip collapsed windows

        windowElements[i].style.zIndex = windowZ[i].toString();

        if (windowZ[i] === 6) {
            titleBars[i].style.fontWeight = "bold";
            titleBars[i].style.fontStyle = "normal";
        } else {
            titleBars[i].style.fontWeight = "normal";
            titleBars[i].style.fontStyle = "italic";
        }
    }
}


function closeWindow(windowIndex) {
    const closingZ = windowZ[windowIndex];
    const wasFocused = closingZ === Math.max(...windowZ);

    // Step 1: Temporarily remove the closing window from Z-order
    windowZ[windowIndex] = -1;

    // Step 2: Collapse all Zs above the closed window’s Z, but don’t go below 0
    for (let i = 0; i < windowZ.length; i++) {
        if (windowZ[i] > closingZ) {
            windowZ[i] = Math.max(0, windowZ[i] - 1);
        }
    }

    // Step 3: Promote the window with the new highest Z to 6
    let maxZ = Math.max(...windowZ);
    let maxIndex = windowZ.indexOf(maxZ);

    if (maxIndex !== -1 && windowZ[maxIndex] !== -1) {
        windowZ[maxIndex] = 6;
    }

    // Step 4: Collapse the window’s display, show its side tab
    switch (windowIndex) {
        case 0: littleWindow.style.visibility = "collapse"; divSide1.style.visibility = "visible"; break;
        case 1: prevLittleWindow.style.visibility = "collapse"; divSide2.style.visibility = "visible"; break;
        case 2: colorLittleWindow.style.visibility = "collapse"; divSide3.style.visibility = "visible"; break;
        case 3: outLittleWindow.style.visibility = "collapse"; divSide4.style.visibility = "visible"; break;
        case 4: fileLittleWindow.style.visibility = "collapse"; divSide5.style.visibility = "visible"; break;
        case 5: spriteLittleWindow.style.visibility = "collapse"; divSide6.style.visibility = "visible"; break;
        case 6: levelLittleWindow.style.visibility = "collapse"; divSide7.style.visibility = "visible"; break;
    }

    // Step 5: Update title bar fonts and zIndex styling
    windowZRefresh();
}
function openWindow(whichWindow) {
    // Make the window visible
    switch (whichWindow) {
        case 0: littleWindow.style.visibility = "visible"; divSide1.style.visibility = "collapse"; break;
        case 1: prevLittleWindow.style.visibility = "visible"; divSide2.style.visibility = "collapse"; break;
        case 2: colorLittleWindow.style.visibility = "visible"; divSide3.style.visibility = "collapse"; break;
        case 3: outLittleWindow.style.visibility = "visible"; divSide4.style.visibility = "collapse"; break;
        case 4: fileLittleWindow.style.visibility = "visible"; divSide5.style.visibility = "collapse"; break;
        case 5: spriteLittleWindow.style.visibility = "visible"; divSide6.style.visibility = "collapse"; break;
        case 6: levelLittleWindow.style.visibility = "visible"; divSide7.style.visibility = "collapse"; break;
    }

    // Assign temporary Z if window was closed (-1)
    if (windowZ[whichWindow] === -1) {
        windowZ[whichWindow] = 0;
    }

    // Promote this window to the front
    windowZRearrange(whichWindow);
}

function isWindowActive(index, checkForFirstDraw) {
    return windowZ[index] === 6 || (checkForFirstDraw && firstDraw);
}