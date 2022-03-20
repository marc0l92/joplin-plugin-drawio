import joplin from 'api'
import { ContentScriptType, MenuItem, MenuItemLocation } from 'api/types'
import { Settings } from './settings'
import { EmptyDiagram, EditorDialog } from './editorDialog'
import { clearDiskCache, getDiagramResource, writeTempFile } from './resources'
import { ChangeEvent } from 'api/JoplinSettings'

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
        // const resourceDir = await joplin.settings.globalValue('resourceDir')

        // Clean and create cache folder
        clearDiskCache()

        // Register settings
        await settings.register()
        joplin.settings.onChange(async (event: ChangeEvent) => {
            await settings.read(event)
            dialog.reset()
        })

        // Register command
        await joplin.commands.register({
            name: CommandsId.NewDiagramPng,
            label: 'Create new diagram PNG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.new(EmptyDiagram.PNG)
            },
        })
        await joplin.commands.register({
            name: CommandsId.NewDiagramSvg,
            label: 'Create new diagram SVG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.new(EmptyDiagram.SVG)
            },
        })
        await joplin.commands.register({
            name: CommandsId.NewSketchPng,
            label: 'Create new sketch PNG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.new(EmptyDiagram.PNG, true)
            },
        })
        await joplin.commands.register({
            name: CommandsId.NewSketchSvg,
            label: 'Create new sketch SVG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await dialog.new(EmptyDiagram.SVG, true)
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
        await joplin.contentScripts.onMessage(Config.ContentScriptId, async (request: { diagramId: string, action: string }) => {
            console.log('contentScripts.onMessage Input:', request)

            switch (request.action) {
                case 'init':
                    let outputHtml = ''
                    try {
                        const diagramResource = await getDiagramResource(request.diagramId)
                        // TODO HIGH: Test PDF export
                        writeTempFile(request.diagramId, diagramResource.body)
                        outputHtml = `
                        <div class="flex-center">
                            <img alt="Draw.io diagram: ${request.diagramId}" src="${diagramResource.body}" />
                        </div>
                        `
                    } catch (err) {
                        console.error('contentScripts.onMessage Error:', err)
                        return `<div class="flex-center"><span class="error-icon">X</span><span>Draw.io Error:</span><span>${err.message}</span></div>`
                    }
                    await joplin.commands.execute('focusElement', 'noteBody')
                    return outputHtml
                case 'edit':
                    await dialog.edit(request.diagramId)
                    await joplin.commands.execute('focusElement', 'noteBody')
                    return
                case 'preview':
                    // TODO HIGH: Test preview mode
                    // TODO HIGH: Pan, export
                    await dialog.preview(request.diagramId)
                    await joplin.commands.execute('focusElement', 'noteBody')
                    return
                default:
                    return `Invalid action: ${request.action}`
            }
        })
    },
});
