import joplin from 'api'
import { Settings } from './settings'
import { v4 as uuidv4 } from 'uuid'
import { tmpdir } from 'os'
import { sep } from 'path'
const fs = joplin.require('fs-extra')

const Config = {
    DialogId: 'drawio-dialog',
    TempFolder: `${tmpdir}${sep}joplin-drawio-plugin${sep}`,
    DataImageRegex: /^data:image\/(png|svg)(?:\+xml)?;base64,(.*)/,
}

export enum DiagramFormat {
    PNG = 'data:image/png;base64,',
    SVG = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIxcHgiIGhlaWdodD0iMXB4IiB2aWV3Qm94PSIwIDAgMSAxIiBjb250ZW50PSImbHQ7bXhmaWxlIGhvc3Q9JnF1b3Q7ZW1iZWQuZGlhZ3JhbXMubmV0JnF1b3Q7IG1vZGlmaWVkPSZxdW90OzIwMjItMDEtMjRUMDc6Mzk6MTAuMTE3WiZxdW90OyB0eXBlPSZxdW90O2VtYmVkJnF1b3Q7Jmd0OyZsdDtkaWFncmFtIGlkPSZxdW90O0k1RXAxcldJZlc0d0RfNXFQY280JnF1b3Q7IG5hbWU9JnF1b3Q7UGFnZS0xJnF1b3Q7Jmd0O2RaRk5ENE1nRElaL0RYZVV1SSt6Yy9PeWs0ZWRpWFJDZ3BZZ2kyNi9maHB3U3JaZFNIbjZscGUyaE9YdGVMSGN5Q3NLMENTbFlpVHNSTkwwc0Q5TzV3eWVIdXl5eklQR0t1RlJzb0pLdlNCQUd1aERDZWdqb1VQVVRwa1kxdGgxVUx1SWNXdHhpR1YzMUxHcjRVMXdwQ3VvYXE3aFMzWlR3c25RVnJaUmw2QWF1VGduTkdSYXZvZ0Q2Q1VYT0d3UUt3akxMYUx6VVR2bW9PZlpMWFB4ZGVjLzJjL0hMSFR1UjhFVXJHOVBsMmhCckhnRCZsdDsvZGlhZ3JhbSZndDsmbHQ7L214ZmlsZSZndDsiPjxkZWZzLz48Zy8+PC9zdmc+',
}

function createTempFile(data: string): { fileId: string, filePath: string } {
    const fileId: string = uuidv4()
    const matches = data.match(Config.DataImageRegex)
    if (!matches) {
        throw new Error('Invalid image data')
    }

    let filePath = `${Config.TempFolder}${fileId}.${matches[1]}`
    fs.writeFile(filePath, matches[2], 'base64')
    return { fileId, filePath }
}

function getThemeUi(sketch: boolean, settings: Settings): string {
    let themeUi = ''
    if (sketch) {
        themeUi = 'sketch'
    } else {
        themeUi = settings.get('themeUi')
        if (settings.get('themeDark') === true && themeUi === 'kennedy') {
            themeUi = 'dark'
        }
    }
    return themeUi
}


export class EditorDialog {
    private _handler: string = null
    private _settings: Settings = null

    constructor(settings: Settings) {
        this._settings = settings
    }

    async init(): Promise<void> {
        if (!this._handler) {
            this._handler = await joplin.views.dialogs.create(Config.DialogId)
            await joplin.views.dialogs.setFitToContent(this._handler, false)
            await joplin.views.dialogs.addScript(this._handler, './dialog/DiagramEditor.js')
            await joplin.views.dialogs.addScript(this._handler, './dialog/bootstrap.js')
            await joplin.views.dialogs.addScript(this._handler, './dialog/drawioEmbed.js')
            await joplin.views.dialogs.setButtons(this._handler, [
                { id: 'ok', title: 'Save' },
                { id: 'cancel', title: 'Close' },
            ])
        }
    }

    async open(format: DiagramFormat, sketch: boolean = false): Promise<void> {
        if (!this._handler) await this.init()
        await this._settings.read()

        const themeUi = getThemeUi(sketch, this._settings)

        const htmlContent = `
        <form name="main">
            <a href="#" onclick="startDrawio()">Click here to load draw.io...</a>
            <input type="hidden" id="settings" value='${JSON.stringify(this._settings.toObject())}' />
            <input type="hidden" id="setting-theme-ui" value='${themeUi}' />
            <input type="hidden" id="diagram" name="diagram" value="${format}">
        </form>
        `
        await joplin.views.dialogs.setHtml(this._handler, htmlContent)

        const dialogResult = await joplin.views.dialogs.open(this._handler)
        console.log(dialogResult)

        if (dialogResult.id === 'ok') {
            const { fileId, filePath } = createTempFile(dialogResult.formData.main.diagram)
            const createdResource = await joplin.data.post(['resources'], null, { title: fileId }, [{ path: filePath }])
            console.log(createdResource)
            // await joplin.commands.execute('insertText', `![${createdResource.title}](:/${createdResource.id})`)
            await joplin.commands.execute('insertText', `<drawio data-id="${createdResource.id}"/>`)
        }
    }

    clearDiskCache(): void {
        fs.rmdirSync(Config.TempFolder, { recursive: true })
        fs.mkdirSync(Config.TempFolder, { recursive: true })
    }
}
