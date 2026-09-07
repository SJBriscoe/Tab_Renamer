# Tab Renamer

A small Firefox extension for giving the current tab a private, custom label.

## Features

- Rename the active tab from the toolbar popup.
- Keep custom names when the tab navigates or reloads.
- Reset a tab to the page's original title.
- Open the popup with `Ctrl+Alt+Z` (`Cmd+Alt+Y` on macOS).

## Install locally

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Select **Load Temporary Add-on...**.
3. Choose this project's `manifest.json` file.
4. Pin **Tab Renamer** to the toolbar and select it on any regular web page.

Firefox blocks extensions from changing protected pages such as `about:` pages and the built-in PDF viewer. Temporary add-ons are removed when Firefox restarts.
