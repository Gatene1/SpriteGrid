\# SpriteGrid v3.4 Handoff TODO



\## GUI

* \[✴️] Resize Windows
* \[✴️] Add a help feature, and a first-run tutorial of sorts.
* \[] Whenever opening a new file, clearing the contents of a window, or closing a window, there should be a dialog box that asks about saving.
* \[] Remove the "Color Converter" window, or at least rename and repurpose it.



\## Working Grid Window Mechanics

* \[] Have bump arrows to "bump" the image on the Working Grid one pixel in the direction chosen. This should produce transparent pixels as new pixels.
* \[] When resizing the grid, the grid should not clear by itself.
* \[] Remove GridSize text box changing when scrolling through spritesheets.
* \[✅] Add flip buttons to flip the grid drawing horizontally or vertically.
* \[✅] Add a "Show Grid" checkbox to show a solid color background when the alpha channel's checkered bg isn't showing for chroma.



\## Preview Window Mechanics

* \[✴️] When changing the magnification on the preview window, clipping can currently occur, I need to fix that.



\## Output Window Mechanics

* \[✴️] Add dropdown menu for different output formats, add the various formats to the list.
* \[] Implement SpriteGrid RGBA32
* \[] Implement JSON
* \[] Implement Base64 RGBA8
* \[] Implement C / C++
* \[] Implement Unity C#
* \[] Implement Java ARGB





\## Spritesheet Window Mechanics

* \[✴️] Add a move button for the selected sprite to move to another cell, or should the user just be able to drag the sprite over to the new cell?





\## Level Editor Window Mechanics

* \[] When scrolling in the Level editor window, only what's visible onscreen \& changed should be drawn on the next frame.
* \[] Add ability to move sprites from one grid cell to the next (just like in the Spritesheet window mechanics above).
* \[] Add functionality to the Save and Erase buttons.



\## Uncategorized Mechanics

* \[] Be able to save window formation locations (layout saving).
* \[❓] Have an Undo function (Maybe have a history of 4 deep?)



\## Code cleanup



\## Notes

Keep entries short but descriptive enough to understand intent.

Use ✅ when a feature’s complete, ✴️ if it needs design discussion first, or ❓ if there's doubt in the implementation.

