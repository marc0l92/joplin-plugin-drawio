import joplin from 'api'
import { createDiagramResource, getDiagramResource, updateDiagramResource } from './resources'
import { Settings } from './settings'
import { v4 as uuidv4 } from 'uuid'

const Config = {
    DialogId: 'drawio-dialog',
}

export enum EmptyDiagram {
    PNG = 'data:image/png;base64,',
    SVG = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIxcHgiIGhlaWdodD0iMXB4IiB2aWV3Qm94PSIwIDAgMSAxIiBjb250ZW50PSImbHQ7bXhmaWxlIGhvc3Q9JnF1b3Q7ZW1iZWQuZGlhZ3JhbXMubmV0JnF1b3Q7IG1vZGlmaWVkPSZxdW90OzIwMjItMDEtMjRUMDc6Mzk6MTAuMTE3WiZxdW90OyB0eXBlPSZxdW90O2VtYmVkJnF1b3Q7Jmd0OyZsdDtkaWFncmFtIGlkPSZxdW90O0k1RXAxcldJZlc0d0RfNXFQY280JnF1b3Q7IG5hbWU9JnF1b3Q7UGFnZS0xJnF1b3Q7Jmd0O2RaRk5ENE1nRElaL0RYZVV1SSt6Yy9PeWs0ZWRpWFJDZ3BZZ2kyNi9maHB3U3JaZFNIbjZscGUyaE9YdGVMSGN5Q3NLMENTbFlpVHNSTkwwc0Q5TzV3eWVIdXl5eklQR0t1RlJzb0pLdlNCQUd1aERDZWdqb1VQVVRwa1kxdGgxVUx1SWNXdHhpR1YzMUxHcjRVMXdwQ3VvYXE3aFMzWlR3c25RVnJaUmw2QWF1VGduTkdSYXZvZ0Q2Q1VYT0d3UUt3akxMYUx6VVR2bW9PZlpMWFB4ZGVjLzJjL0hMSFR1UjhFVXJHOVBsMmhCckhnRCZsdDsvZGlhZ3JhbSZndDsmbHQ7L214ZmlsZSZndDsiPjxkZWZzLz48Zy8+PC9zdmc+',
}

function diagramMarkdown(diagramId: string) {
    return `![drawio](:/${diagramId})`
}

export class EditorDialog {
    private _handler: string = null
    private _settings: Settings = null

    constructor(settings: Settings) {
        this._settings = settings
    }

    private getThemeUi(sketch: boolean): string {
        let themeUi = ''
        if (sketch) {
            themeUi = 'sketch'
        } else {
            themeUi = this._settings.get('themeUi')
            if (this._settings.get('themeDark') === true && themeUi === 'kennedy') {
                themeUi = 'dark'
            }
        }
        return themeUi
    }

    private buildDialogHTML(diagramBody: string, themeUi: string): string {
        return `
            <form name="main">
                <a href="#" onclick="startDrawio()">Click here to load draw.io if it does not start automatically...</a>
                <input type="hidden" id="settings" value='${JSON.stringify(this._settings.toObject())}' />
                <input type="hidden" id="setting-theme-ui" value='${themeUi}' />
                <input type="hidden" id="diagram" name="diagram" value="${diagramBody}">
            </form>
            `
    }

    async init(): Promise<void> {
        if (this._handler) {
            return
        }
        this._handler = await joplin.views.dialogs.create(`${Config.DialogId}-${uuidv4()}`)
        await joplin.views.dialogs.setFitToContent(this._handler, false)
        await joplin.views.dialogs.addScript(this._handler, './dialog/DiagramEditor.js')
        await joplin.views.dialogs.addScript(this._handler, './dialog/bootstrap.js')
        await joplin.views.dialogs.setButtons(this._handler, [
            { id: 'ok', title: 'Save' },
            { id: 'cancel', title: 'Close' },
        ])
    }

    async reset(): Promise<void> {
        this._handler = null
    }

    async new(emptyDiagram: EmptyDiagram, sketch: boolean = false): Promise<void> {
        if (!this._handler) await this.init()

        const themeUi = this.getThemeUi(sketch)
        await joplin.views.dialogs.setHtml(this._handler, this.buildDialogHTML(emptyDiagram, themeUi))
        const dialogResult = await joplin.views.dialogs.open(this._handler)
        console.log('dialogResult', dialogResult)

        if (dialogResult.id === 'ok') {
            const diagramId = await createDiagramResource(dialogResult.formData.main.diagram, { sketch: sketch })
            await joplin.commands.execute('insertText', diagramMarkdown(diagramId))
        }
    }

    async edit(diagramId: string): Promise<void> {
        if (!this._handler) await this.init()

        const diagramResource = await getDiagramResource(diagramId)
        const themeUi = this.getThemeUi(diagramResource.options.sketch)
        await joplin.views.dialogs.setHtml(this._handler, this.buildDialogHTML(diagramResource.body, themeUi))
        const dialogResult = await joplin.views.dialogs.open(this._handler)
        console.log('dialogResult', dialogResult)

        if (dialogResult.id === 'ok') {
            const newDiagramId = await updateDiagramResource(diagramId, dialogResult.formData.main.diagram, diagramResource.options)
            const note = await joplin.workspace.selectedNote();
            if (note) {
                const newBody = (note.body as string).replace(new RegExp(`!\\[drawio\\]\\(:\\/${diagramId}\\)`, 'gi'), diagramMarkdown(newDiagramId))
                await joplin.data.put(['notes', note.id], null, { body: newBody })
                await joplin.commands.execute("editor.setText", newBody);
            }
        }
    }
}
