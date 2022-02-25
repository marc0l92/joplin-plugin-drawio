import joplin from 'api'
import { v4 as uuidv4 } from 'uuid'
import { tmpdir } from 'os'
import { sep } from 'path'
const fs = joplin.require('fs-extra')

const Config = {
    TempFolder: `${tmpdir}${sep}joplin-drawio-plugin${sep}`,
    DataImageRegex: /^data:image\/(?<extension>png|svg)(?:\+xml)?;base64,(?<blob>.*)/,
}

export interface IDiagramOptions {
    sketch?: boolean
}

function generateId() {
    return uuidv4().replace(/-/g, '')
}

export function clearDiskCache(): void {
    fs.rmdirSync(Config.TempFolder, { recursive: true })
    fs.mkdirSync(Config.TempFolder, { recursive: true })
}

export async function writeTempFile(name: string, data: string): Promise<string> {
    const matches = data.match(Config.DataImageRegex)
    if (!matches) {
        throw new Error('Invalid image data')
    }

    let filePath = `${Config.TempFolder}${name}.${matches.groups.extension}`
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
        options = JSON.parse(resourceProperties.title)
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
    const createdResource = await joplin.data.post(['resources'], null, { id: diagramId, title: JSON.stringify(options) }, [{ path: filePath }])
    console.log('createdResource', createdResource)
    return diagramId
}

export async function updateDiagramResource(diagramId: string, data: string, options: IDiagramOptions): Promise<void> {
    const filePath = await writeTempFile(diagramId, data)
    await joplin.data.delete(['resources', diagramId])
    const createdResource = await joplin.data.post(['resources'], null, { id: diagramId, title: JSON.stringify(options) }, [{ path: filePath }])
    console.log('createdResource', createdResource)
}