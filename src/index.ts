import joplin from 'api'
import { ContentScriptType, MenuItem, MenuItemLocation } from 'api/types'
import { Settings } from './settings'
import { DiagramFormat, EditorDialog } from './editorDialog'
// import { sep } from 'path'

interface IResourceFile {
    attachmentFilename: string
    body: Uint8Array
    contentType: string
    type: string
}

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
        // TODO: Implement edit diagram
        await joplin.contentScripts.onMessage(Config.ContentScriptId, async (request: { resourceId: string }) => {
            // console.log('Draw.io definition:', message)

            let outputHtml = ''
            try {
                const resourceFile: IResourceFile = await joplin.data.get(['resources', request.resourceId, 'file'], null)
                console.log(resourceFile)
                const bodyBase64 = Buffer.from(resourceFile.body).toString('base64')
                outputHtml = `
                <div class="flex-center">
                    <img alt="Draw.io diagram: ${resourceFile.attachmentFilename}" src="data:${resourceFile.contentType};base64,${bodyBase64}" />
                </div>
                `
                // TODO: Cache image in the temp folder
                // const { fileId, filePath } = createTempFile(dialogResult.formData.main.diagram)
                // TODO: Test what happen if i try to rendere a resource that is not an image like a PDF

            } catch (err) {
                return `<div class="flex-center"><span class="error-icon">X</span><span>Draw.io Error:</span><span>${err.message}</span></div>`
            }
            return outputHtml
        })
    },
});
