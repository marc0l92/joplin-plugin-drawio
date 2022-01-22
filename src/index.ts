import joplin from 'api'
import { DialogResult, MenuItem, MenuItemLocation } from 'api/types'
import { Settings } from './settings'
import { tmpdir } from 'os'
import { sep } from 'path'
import { v4 as uuidv4 } from 'uuid'
const fs = joplin.require('fs-extra')

const Config = {
    DialogId: 'drawio-dialog',
    DataDir: 'D:/Documents/Repository/joplin-plugin-drawio/data',
    TempFolder: `${tmpdir}${sep}joplin-drawio-plugin${sep}`,
}

const CommandsId = {
    NewDiagramPng: 'drawio-new-diagram-png',
    NewDiagramSvg: 'drawio-new-diagram-svg',
}

enum DiagramFormat {
    PNG = 'data:image/png;',
    SVG = 'data:image/svg+xml;',
    TEST = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIxMjFweCIgaGVpZ2h0PSI2MXB4IiB2aWV3Qm94PSItMC41IC0wLjUgMTIxIDYxIiBjb250ZW50PSImbHQ7bXhmaWxlIGV0YWc9JnF1b3Q7VGdBR2JKbGNJaGw3a1JuRGFxSDQmcXVvdDsgYWdlbnQ9JnF1b3Q7TW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTRfNikgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzgwLjAuMzk4Ny4xMDYgU2FmYXJpLzUzNy4zNiZxdW90OyBtb2RpZmllZD0mcXVvdDsyMDIwLTAyLTE5VDEyOjQ0OjI3LjY1OVomcXVvdDsgaG9zdD0mcXVvdDt0ZXN0LmRyYXcuaW8mcXVvdDsgdmVyc2lvbj0mcXVvdDtARFJBV0lPLVZFUlNJT05AJnF1b3Q7Jmd0OyZsdDtkaWFncmFtIGlkPSZxdW90O3JVdXh2bWFtZE5aMXpyTFhPbF82JnF1b3Q7IG5hbWU9JnF1b3Q7UGFnZS0xJnF1b3Q7Jmd0O2xaUExic0l3RUVXL0prc2t4Nll0V3dvcGZhaWxLcXFRMkpsNGNGdzVHZVFZU1ByMVRZaWRCeXphcmpJK21VZm1YaWRnczdSWUdMNVBYbEdBRGlnUlJjRG1BYVVocGF4NjFLUnN5VjFEcEZIQ3NRNnMxRGM0U0J3OUtBSDVJTkVpYXF2MlF4aGpsa0ZzQjR3Ymc2ZGgyZzcxY09xZVM3Z0NxNWpyYTdwV3dpWU5uZHlRamorQ2tvbWZIQkwzSnVVKzJZRTg0UUpQUGNTaWdNME1vbTJpdEppQnJ0WHp1cnlGNy9NeFpSK2piRU5pU2FmUlJxcFIwK3poUHlYdENnWXkrOWZXbnptWTVmYXJscFFTemJlVnIrZktsZVhHTmczOTBPeXdIZHVuWTFnc1g5YlBiSWU0THFlamJzUDJJM05iZWxVTkhqSUJkVDBKMkwzVVBNOWQzS3BVSDVvNVJ6QVdpZ3M3ZnRrbDdJMWZBS1pnVFZuVnVTN01lK0p1NWNRZFQ1M0RvVTlKZXU3ZU9zYmRwWkp0NTA2NEtuQWIrMk5QU284NjE4L3B2WitIUlQ4PSZsdDsvZGlhZ3JhbSZndDsmbHQ7L214ZmlsZSZndDsiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiByZ2IoMjU1LCAyNTUsIDI1NSk7Ij48ZGVmcy8+PGc+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjMDAwMDAwIiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PGcgZmlsbD0iIzAwMDAwMCIgZm9udC1mYW1pbHk9IkhlbHZldGljYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMnB4Ij48dGV4dCB4PSI1OS41IiB5PSIzNC41Ij5TdGFydDwvdGV4dD48L2c+PC9nPjwvc3ZnPg==',
}

async function createDialog(): Promise<string> {
    const dialog = await joplin.views.dialogs.create(Config.DialogId)
    await joplin.views.dialogs.setFitToContent(dialog, false)
    await joplin.views.dialogs.addScript(dialog, './dialog/DiagramEditor.js')
    await joplin.views.dialogs.addScript(dialog, './dialog/dialog.js')
    await joplin.views.dialogs.addScript(dialog, './dialog/drawioEmbed.js')
    await joplin.views.dialogs.setButtons(dialog, [
        { id: 'ok', title: 'Save' },
        { id: 'cancel', title: 'Close' },
    ])

    return dialog
}

async function openDialog(dialog: string, settings: Settings, format: DiagramFormat): Promise<void> {
    const htmlContent = `
    <form name="main">
        <a href="#" onclick="startDrawio()">Click here to load draw.io...</a>
        <input type="hidden" id="settings" value='${JSON.stringify(settings.toObject())}' />
        <input type="hidden" id="diagram" name="diagram" value="${format}">
    </form>
    `
    await joplin.views.dialogs.setHtml(dialog, htmlContent)

    const dialogResult = await joplin.views.dialogs.open(dialog)
    console.log(dialogResult)

    if (dialogResult.id === 'ok') {
        const { fileId, filePath } = createTempFile(dialogResult.formData.main.diagram)
        const createdResource = await joplin.data.post(['resources'], null, { title: fileId }, [{ path: filePath }])
        console.log(createdResource)
        await joplin.commands.execute('insertText', `![${createdResource.title}](:/${createdResource.id})`)
    }
}

function createTempFile(data: string): { fileId: string, filePath: string } {
    const fileId: string = uuidv4()
    const format = data.split(';')[0] + ';'

    let filePath = `${Config.TempFolder}${fileId}`
    switch (format) {
        case DiagramFormat.SVG:
            filePath += '.svg'
            break
        case DiagramFormat.PNG:
            filePath += '.png'
            break
    }
    fs.writeFile(filePath, data.split(';')[1].split(',')[1], 'base64')
    return { fileId, filePath }
}

function clearDiskCache(): void {
    fs.rmdirSync(Config.TempFolder, { recursive: true })
    fs.mkdirSync(Config.TempFolder, { recursive: true })
}

joplin.plugins.register({
    onStart: async function () {
        const settings = new Settings()
        const dialog = await createDialog()

        // Clean and create cache folder
        clearDiskCache()

        // Register settings
        settings.register()

        // Register command
        await joplin.commands.register({
            name: CommandsId.NewDiagramPng,
            label: 'Create new diagram PNG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await openDialog(dialog, settings, DiagramFormat.PNG)
            },
        })
        await joplin.commands.register({
            name: CommandsId.NewDiagramSvg,
            label: 'Create new diagram SVG',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await openDialog(dialog, settings, DiagramFormat.SVG)
            },
        })

        // Register menu
        const commandsSubMenu: MenuItem[] = Object.values(CommandsId).map(command => ({ commandName: command }))
        await joplin.views.menus.create('menu-drawio', 'Draw.io', commandsSubMenu, MenuItemLocation.Tools)
    },
});
