// sg4_Level.js
// Owns the Level Editor data model so other files stop poking levelGrid directly.

(function () {

    // Single source of truth.
    window.currentLevel = null;

    function computeLevelDims() {
        const cols = Math.floor(levelCanvasWidth / levelGridCellSize);
        const rows = Math.floor(levelCanvasHeight / levelGridCellSize);
        return { cols, rows, size: cols * rows };
    }

    window.levelEnsure = function levelEnsure() {
        if (window.currentLevel) return;

        const dims = computeLevelDims();
        window.currentLevel = new levelEditorMap(
            (typeof spriteSheetUsed !== "undefined" ? spriteSheetUsed : null),
            "Untitled Level",
            new Array(dims.size).fill(null)
        );

        // Back-compat: keep old global pointing at the same array.
        window.levelGrid = window.currentLevel.levelGrid;
    };

    window.levelSyncToCanvas = function levelSyncToCanvas() {
        levelEnsure();

        const dims = computeLevelDims();
        const g = window.currentLevel.levelGrid;

        if (!Array.isArray(g) || g.length !== dims.size) {
            window.currentLevel.levelGrid = new Array(dims.size).fill(null);

            // Back-compat sync
            window.levelGrid = window.currentLevel.levelGrid;
        }

        // Also keep these consistent everywhere:
        squaresForLevelGridWidth = dims.cols;
        squaresForLevelGridHeight = dims.rows;
        levelGridSize = dims.size;
    };

    window.levelGetGrid = function levelGetGrid() {
        levelEnsure();
        return window.currentLevel.levelGrid;
    };

    window.levelGetCell = function levelGetCell(i) {
        const g = levelGetGrid();
        if (i == null || i < 0 || i >= g.length) return null;
        return g[i];
    };

    window.levelSetCell = function levelSetCell(i, spriteIdOrNull) {
        const g = levelGetGrid();
        if (i == null || i < 0 || i >= g.length) return false;
        g[i] = spriteIdOrNull;
        return true;
    };

    window.levelHasSpriteAt = function levelHasSpriteAt(i) {
        return levelGetCell(i) != null;
    };

    // ---- Buttons ----

    window.levelUseSpriteChosen = function levelUseSpriteChosen() {
        let id = -1;

        if (typeof selectedSpriteId !== "undefined" && selectedSpriteId >= 0) id = selectedSpriteId;
        else if (typeof hoveredSpriteId !== "undefined" && hoveredSpriteId >= 0) id = hoveredSpriteId;
        else if (typeof spriteChosen !== "undefined" && spriteChosen >= 0) id = spriteChosen;

        if (id < 0) {
            alert("No sprite selected.");
            return;
        }

        pasteLevelSprite = true;
        levelSpriteHeld = true;
        levelMouseSprite = id;

        requestRerender();
    };

    window.saveLevelGridAsPNG = function saveLevelGridAsPNG() {
        try {
            const a = document.createElement("a");
            const base = (window.currentLevel?.levelName ?? "Level").replace(/\.[^.]+$/, "");
            a.download = base + ".png";
            a.href = levelCanvas.toDataURL("image/png");
            a.click();
        } catch (err) {
            console.error(err);
            alert("Could not export PNG (see console).");
        }
    };

})();
