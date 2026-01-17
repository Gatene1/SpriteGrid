\# SpriteGrid v3.4 Handoff TODO



\## GUI

* \[✴️] Resize Windows
* \[✴️] Add a help feature, and a first-run tutorial of sorts.
* \[] Whenever opening a new file, clearing the contents of a window, or closing a window, there should be a dialog box that asks about saving.



\## Working Grid Window Mechanics

* \[✅] Have bump arrows to "bump" the image on the Working Grid one pixel in the direction chosen. This should produce transparent pixels as new pixels.
* \[✅] When resizing the grid, the grid should not clear by itself.
* \[✅] Allow uneven dimensions of the grid.
* \[✅] Implement +/- text boxes for the width and height \& accompanying submit button (maybe make it realtime adding?).
* \[✅] Add a "Trim Whitespace" button and its functionality to make the grid form to the sprite.
* \[✅] When "Trim Whitespace" and "Open Drawing", if the gridW and gridH don't match, then make sure the dimension constraint button is unclicked.
* \[✅] Fix showBG error where it's no longer showing when toggled.
* \[✅] Removed fail safe I implemented where the grid would shut off when the user would make the Working Grid's dimensions higher than 64x64.
* \[✅] - Reintroduced the stroke parameter to the drawSquare() function for the other windows, and made the Working Grid's function calls false for the stroke argument.
* \[✅] Made the file open/save dialog boxes "remember" the last working directory.
* \[✅] Added "All Supported Types" to the file open/save list to the dialog box for different users' preferences.
* \[✅] Added support for ALT + Mouse Wheel combo while in the Working Grid, to increase/decrease the size of the individual grid cells.
* \[✅] Added padding to the Working Grid's Menu.
* \[✅] Add Undo/Redo support only for the Working Grid in coloring cells.
* \[✅] Make a "dirty" system for when changes are made to the Working Grid.



\## Preview Window Mechanics

* \[✴️] When changing the magnification on the preview window, clipping can currently occur, I need to fix that.
* \[] When the "Show BG" checkbox is checked, make the preview Window also show the background.



\## Color Picker Window Mechanics

* \[✅] Fix stroke around the color squares and preview square.
* \[✅] Change the name of the window to "Color Picker".
* \[✅] Make a "dirty" system for when changes are made to the Color Picker's color palette.



\## Output Window Mechanics

* \[✴️] Add dropdown menu for different output formats, add the various formats to the list.
* \[] Implement SpriteGrid RGBA32
* \[] Implement JSON
* \[] Implement Base64 RGBA8
* \[] Implement C / C++
* \[] Implement Unity C#
* \[] Implement Java ARGB
* \[✴️] Add a checkbox to see if the output box should be updated when the rest of the grid is.



\## Spritesheet Window Mechanics

* \[✅] Move sprites across the spritesheet with the mouse.
* \[✅] Make a "dirty" system for when changes are made to the Sprite Sheet.
* \[✅] When importing sprites, sprites can take up multiple cells, and are centered across the cells they do.
* \[✅] When importing, a shadow (green or red) will appear over the cells that it will occupy.
* \[✅] When importing, a shadow (green or red) will appear over the cells that it will occupy.
* \[✅] Implement "Open Sprite Sheet" button's logic.
* \[✅] Implement "Save Sprite Sheet" button's logic.
* \[✅] Implement "New Sprite Sheet" button's logic.
* \[✅] Implement "Erase A Cell" button's logic.



\## Options Menu Window Mechanics

* \[✅] Renaming window to "Options" or something akin
* \[] Add the tutorial button iconset
* \[] Add the functionality to the tutorial button iconset.


\## Level Editor Window Mechanics

* \[] When scrolling in the Level editor window, only what's visible onscreen \& changed should be drawn on the next frame.
* \[] Add ability to move sprites from one grid cell to the next (just like in the Spritesheet window mechanics above).
* \[] Add functionality to the Save and Erase buttons.
* \[] Add ability to change the height and width of a single screen of the level.
* \[] Add magnifying buttons to be able to zoom out and zoom in to see more/less of the level.
* \[] Add button to add a screen to the north, east, south, west
* \[] Add functionality to scroll throughout the level, instead of just one screen.
* \[] Make a "dirty" system for when changes are made to the Level Editor's workspace.



\## Uncategorized Mechanics

* \[] Be able to save window formation locations (layout saving).
* \[✅] Have an Undo function (Maybe have a history of 4 deep?)
* \[✅] make the gat-spec.txt file for information about the .gat file type.
* \[✅] make the gss-spec.txt file for information about the .gss file type.
* \[] make the gle-spec.txt file for information about the .gle file type.



\## Code cleanup



\## Notes

Keep entries short but descriptive enough to understand intent.

Use ✅ when a feature’s complete, ✴️ if it needs design discussion first, or ❓ if there's doubt in the implementation.

