import joplin from 'api'
import { ContentScriptType, MenuItem, MenuItemLocation } from 'api/types'
import { Settings } from './settings'
import { DiagramFormat, EditorDialog } from './editorDialog'

const Config = {
    ContentScriptId: 'drawio-content-script',
}

const CommandsId = {
    NewDiagramPng: 'drawio-new-diagram-png',
    NewDiagramSvg: 'drawio-new-diagram-svg',
    NewSketchPng: 'drawio-new-sketch-png',
    NewSketchSvg: 'drawio-new-sketch-svg',
}

joplin.plugins.register({
    onStart: async function () {
        const settings = new Settings()
        const dialog = new EditorDialog(settings)

        // Clean and create cache folder
        dialog.clearDiskCache()

        // Register settings
        settings.register()

        // Register command
        await joplin.commands.register({
            name: CommandsId.NewDiagramPng,
            label: 'Create new diagram PNG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.open(DiagramFormat.PNG)
            },
        })
        await joplin.commands.register({
            name: CommandsId.NewDiagramSvg,
            label: 'Create new diagram SVG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.open(DiagramFormat.SVG)
            },
        })
        await joplin.commands.register({
            name: CommandsId.NewSketchPng,
            label: 'Create new sketch PNG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.open(DiagramFormat.PNG, true)
            },
        })
        await joplin.commands.register({
            name: CommandsId.NewSketchSvg,
            label: 'Create new sketch SVG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.open(DiagramFormat.SVG, true)
            },
        })

        // Register menu
        const commandsSubMenu: MenuItem[] = Object.values(CommandsId).map(command => ({ commandName: command }))
        await joplin.views.menus.create('menu-drawio', 'Draw.io', commandsSubMenu, MenuItemLocation.Tools)

        // Content Scripts
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            Config.ContentScriptId,
            './contentScript/contentScript.js',
        )

        /**
         * Messages handling
         */
        await joplin.contentScripts.onMessage(Config.ContentScriptId, async (request: { id: string, content: string }) => {
            // console.log('PlantUML definition:', message)

            let outputHtml = ''
            // try {
            //     const diagramHeader = await readFileContent(settings.get('diagramHeaderFile'))
            //     request.content = addDiagramHeader(request.content, diagramHeader)
            //     let diagram: Diagram = cache.getCachedObject(request.content)
            //     if (!diagram) {
            //         diagram = await plantUMLRenderer.execute(request.content)
            //         cache.addCachedObject(request.content, diagram)
            //         writeTempImage(request.id, diagram.blob, settings.get('renderingFormats'))
            //     }
            //     outputHtml += view.render(diagram)
            // } catch (err) {
            //     outputHtml += view.renderError(request.content, err)
            // }
            return outputHtml
        })
    },
});
