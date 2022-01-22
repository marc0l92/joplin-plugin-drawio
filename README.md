# Joplin Plugin - bytefield-svg

This plugin allows you to create diagrams uing the syntax defined in [https://bytefield-svg.deepsymmetry.org](https://bytefield-svg.deepsymmetry.org).
This type of diagram is usually used to describe network protocols, memory layouts, and other data structures.

This plugin don't need an internet connection to work.

## Install the plugin

### Automatic installation

Use the Joplin plugin manager to install it (`Joplin > Options > Plugins`).
Search for `bytefield-svg`.

### Manual installation

- Download the last release from this repository.
- Open `Joplin > Options > Plugins > Install from File`
- Select the jpl file you downloaded.

# Markdown syntax

Use the markdown fence syntax to create a new bytefield-svg diagram.
Inside this block you can use the syntax documented at [https://bytefield-svg.deepsymmetry.org](https://bytefield-svg.deepsymmetry.org).

## Examples

Syntax example:

    ```bytefield
    (draw-column-headers)
    (draw-box "Address" {:span 4})
    (draw-box "Size" {:span 2})
    (draw-box 0 {:span 2})
    (draw-gap "Payload")
    (draw-bottom)
    ```

Rendering example:

![Rendering example](./doc/example1.png)

# Other funcitonalities

## Menu shortcuts
If you don't remember the syntax to create a bytefield-svg diagram you can use the templates in the tools menu.

# Development
If you want to contribute to this plugin you can find here some userful references:

- [Joplin - Getting started with plugin development](https://joplinapp.org/api/get_started/plugins/)
- [Joplin - Plugin API reference](https://joplinapp.org/api/references/plugin_api/classes/joplin.html)
- [Joplin - Data API reference](https://joplinapp.org/api/references/rest_api/)
- [Joplin - Plugin examples](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins)
- [Draw.io parameters](https://www.diagrams.net/doc/faq/supported-url-parameters)


https://www.diagrams.net/blog/embedding-walkthrough