import joplin from 'api'
import { v4 as uuidv4 } from 'uuid'
import { tmpdir } from 'os'
import { sep } from 'path'
const fs = joplin.require('fs-extra')

const Config = {
    TempFolder: `${tmpdir}${sep}joplin-drawio-plugin${sep}`,
    DataImageRegex: /^data:image\/(?<extension>png|svg)(?:\+xml)?;base64,(?<blob>.*)/,
    TitlePrefix: 'drawio-',
}

export interface IDiagramOptions {
    sketch?: boolean
}

function generateId() {
    return uuidv4().replace(/-/g, '')
}

function buildTitle(options: any): string {
    return Config.TitlePrefix + JSON.stringify(options)
}
function parseTitle(title: string): any {
    return JSON.parse(title.replace(Config.TitlePrefix, ''))
}

export function clearDiskCache(): void {
    fs.rmdirSync(Config.TempFolder, { recursive: true })
    fs.mkdirSync(Config.TempFolder, { recursive: true })
}

async function writeTempFile(name: string, data: string, filePath: string = null): Promise<string> {
    const matches = data.match(Config.DataImageRegex)
    if (!matches) {
        throw new Error('Invalid image data')
    }
    if (!filePath) {
        filePath = `${Config.TempFolder}${name}.${matches.groups.extension}`
    }
    await fs.writeFile(filePath, matches.groups.blob, 'base64')
    return filePath
}

export async function getDiagramResource(diagramId: string): Promise<{ body: string, options: IDiagramOptions }> {
    const resourceProperties = await joplin.data.get(['resources', diagramId])
    const resourceData = await joplin.data.get(['resources', diagramId, 'file'])
    console.log('getDiagramResource', resourceProperties, resourceData)

    if (!resourceData.contentType.startsWith('image')) {
        throw new Error('Invalid resource content type. The resource must be an image')
    }

    let options: IDiagramOptions = {}
    try {
        options = parseTitle(resourceProperties.title)
    } catch (e) {
        console.warn('getDiagramResource - Option parsing failed:', e)
    }

    return {
        body: `data:${resourceData.contentType};base64,${Buffer.from(resourceData.body).toString('base64')}`,
        options: options
    }
}

export async function createDiagramResource(data: string, options: IDiagramOptions): Promise<string> {
    const diagramId = generateId()
    const filePath = await writeTempFile(diagramId, data)
    const createdResource = await joplin.data.post(['resources'], null, { id: diagramId, title: buildTitle(options) }, [{ path: filePath }])
    console.log('createdResource', createdResource)
    return diagramId
}

export async function updateDiagramResource(diagramId: string, data: string, options: IDiagramOptions): Promise<string> {
    const newDiagramId = generateId()
    const filePath = await writeTempFile(newDiagramId, data)
    const createdResource = await joplin.data.post(['resources'], null, { id: newDiagramId, title: buildTitle(options) }, [{ path: filePath }])
    // I will not delete the previous resource just in case it has been copied in another note
    // await joplin.data.delete(['resources', diagramId])
    console.log('createdResource', createdResource)
    return newDiagramId
}

export async function isDiagramResource(diagramId: string): Promise<boolean> {
    const resourceProperties = await joplin.data.get(['resources', diagramId])
    return resourceProperties.title.startsWith(Config.TitlePrefix)
}