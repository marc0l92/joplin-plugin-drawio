# Joplin Plugin - draw.io

This plugin allows you to create diagrams using the editor [diagrams.net](https://www.diagrams.net) (aka. draw.io).

This plugin needs an internet connection to work.

![Example1](./doc/example1.png)
![Example2](./doc/example2.png)

## Install the plugin

### Automatic installation

Use the Joplin plugin manager to install it (`Joplin > Options > Plugins`).
Search for `draw.io`.

### Manual installation

- Download the last release from this repository.
- Open `Joplin > Options > Plugins > Install from File`
- Select the jpl file you downloaded.

# Create new diagram

Use the tools menu to create a new diagram and paste it in the note.

> The diagram will be inserted where the cursor is.

![Tools menu](./doc/tools_menu.png)

You can create your diagram using 2 different type of file format:
* PNG: raster format
* SVG: vectorial format

The sketch mode configures the diagram editor to simplify the hand drawing.

# Context menu

Right click on the diagram to open the context menu that allows you to:
- Edit the image in the draw.io editor
- Open the image in a larger dialog
- Copy the image to the clipboard

![Context menu](./doc/context_menu.png)

# Settings

![Settings](./doc/settings.png)


# Development
If you want to contribute to this plugin you can find here some useful references:

- [Joplin - Getting started with plugin development](https://joplinapp.org/api/get_started/plugins/)
- [Joplin - Plugin API reference](https://joplinapp.org/api/references/plugin_api/classes/joplin.html)
- [Joplin - Data API reference](https://joplinapp.org/api/references/rest_api/)
- [Joplin - Plugin examples](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins)
- [Draw.io parameters](https://www.diagrams.net/doc/faq/supported-url-parameters)


https://www.diagrams.net/blog/embedding-walkthrough