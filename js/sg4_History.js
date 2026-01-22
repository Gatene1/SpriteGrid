"use strict";
function historyBeginAction(label = "edit") {
    activeAction = { label, changes: [] };
    activeIndexMap = new Map();
}

function historyRecordChange(i, from, to) {
    if (!activeIndexMap) return;

    const existing = activeIndexMap.get(i);
    if (!existing) activeIndexMap.set(i, { i, from, to });
    else existing.to = to;
}

function historyEndAction() {
    if (!activeAction) return;

    activeAction.changes = Array.from(activeIndexMap.values());

    if (activeAction.changes.length > 0) {
        undoStack.push(activeAction);
        if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
        redoStack.length = 0; // clear redo on new edit
    }

    activeAction = null;
    activeIndexMap = null;
}

function historyCanUndo() { return undoStack.length > 0; }
function historyCanRedo() { return redoStack.length > 0; }

// These assume `grid` exists globally (which it does in sg4)
function historyUndo() {
    const action = undoStack.pop();
    if (!action) return false;

    for (let k = action.changes.length - 1; k >= 0; k--) {
        const ch = action.changes[k];
        grid[ch.i] = ch.from;
    }

    redoStack.push(action);
    return true;
}

function historyRedo() {
    const action = redoStack.pop();
    if (!action) return false;

    for (let k = 0; k < action.changes.length; k++) {
        const ch = action.changes[k];
        grid[ch.i] = ch.to;
    }

    undoStack.push(action);
    return true;
}

// The “gate” for pixel writes.
// Use this instead of grid[i] = next;
function historySetCell(i, next) {
    const prev = grid[i];
    if (prev === next) return;

    if (activeAction) historyRecordChange(i, prev, next);
    grid[i] = next;
}