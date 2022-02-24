import * as MarkdownIt from "markdown-it"
import { RenderRule } from "markdown-it/lib/renderer"
import { tmpdir } from 'os'
import { sep } from 'path'

interface IDiagramData {
    id?: string
}

const diagramsTempDir = `${tmpdir}${sep}joplin-drawio-plugin${sep}`

const htmlTagRegExp = /<drawio +[^>]+? *\/?>/i
const htmlTagName = 'drawio'
const idAttributeName = 'id'

function htmlEscape(str: string): string {
    return str.replace(/</g, '< ') // TODO: improve richtext compatibility
}

function getDiagramData(content: string): IDiagramData {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(content, "text/xml")
    const elements = xmlDoc.getElementsByTagName(htmlTagName)
    let data: IDiagramData = {}
    if (elements.length > 0) {
        const element = xmlDoc.getElementsByTagName(htmlTagName)[0]
        if (element.attributes.getNamedItem(idAttributeName) !== null) {
            data.id = element.attributes[idAttributeName].nodeValue
        }
    }
    return data
}

function buildRenderer(contentScriptId: string, renderer: RenderRule) {
    const defaultRender = renderer || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    return function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        console.log('token', token)
        if (htmlTagRegExp.test(token.content)) {
            const diagramData = getDiagramData(token.content)
            const diagramId = diagramData.id
            if (diagramId) {
                // TODO: change hardcoded path
                // TODO: Redesign right click menu
                // TODO: Implement right click menu
                const extraText = token.content.split('\n').slice(1).join('<br>')
                const initMessage = JSON.stringify({ diagramId: diagramId, action: 'init' })
                const editMessage = JSON.stringify({ diagramId: diagramId, action: 'edit' })
                const sendContentToJoplinPlugin = `
                // Configure context menu
                document.getElementById('drawio-body-${diagramId}').addEventListener('mousedown', e => {
                    const menu = document.getElementById('drawio-menu-${diagramId}');
                    if(e.button === 2) {
                        menu.style.display = '';
                    } else {
                        menu.style.display = 'none';
                    }
                });
                document.getElementById('drawio-menu-${diagramId}-edit').addEventListener('click', async e => {
                    const img = document.querySelector("#drawio-body-${diagramId}>div>*:first-child");
                    if(img && img.tagName === 'IMG') {
                        webviewApi.postMessage('${contentScriptId}', ${editMessage});
                    }
                });
                document.getElementById('drawio-menu-${diagramId}-copyImage').addEventListener('click', async e => {
                    const img = document.querySelector("#drawio-body-${diagramId}>div>*:first-child");
                    if(img && img.tagName === 'IMG') {
                        console.log(img);
                        // navigator.clipboard.write([
                        //     new ClipboardItem({ 'image/png': await response.blob() })
                        // ]);
                    }
                });

                // Send fence content to plugin
                webviewApi.postMessage('${contentScriptId}', ${initMessage}).then((response) => {
                   document.getElementById('drawio-body-${diagramId}').innerHTML = response;
                   document.getElementById('drawio-menu-${diagramId}').style = "";
                });
                `.replace(/"/g, '&quot;')
                return `
                <div class="drawio-container" tabindex="-1">
                    <div class="hidden" style="display:none">
                        ${htmlEscape(token.content)}
                    </div>
                    <div id="drawio-body-${diagramId}" class="flex-center">
                        <object data="${diagramsTempDir}${diagramId}.svg" type="image/svg+xml"></object>
                        <object data="${diagramsTempDir}${diagramId}.png" type="image/png"></object>
                    </div>
                    <div id="drawio-menu-${diagramId}" class="menu" style="display:none">
                        <div class="menu-options">
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-edit" value="Edit" /></div>
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-preview" value="Preview" /></div>
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-prevPage" value="Previous Page" /></div>
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-nextPage" value="Next Page" /></div>
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-copyImage" value="Copy image" /></div>
                        </div>
                    </div>
                </div>
                <style onload="${sendContentToJoplinPlugin}"></style>
                ${extraText ? '<br>' + extraText : ''}
                `
            } else {
                return `
                <div class="drawio-container">
                    <p><strong>Draw.io error:</strong> no attribute &quot;${idAttributeName}&quot; specified</p>
                </div>
                `
            }
        }
        return defaultRender(tokens, idx, options, env, self)
    }
}

export default function (context: { contentScriptId: string }) {
    return {
        plugin: async function (markdownIt: MarkdownIt, _options) {
            console.log('start drawio contentScript')
            markdownIt.renderer.rules.html_inline = buildRenderer(context.contentScriptId, markdownIt.renderer.rules.html_inline)
            markdownIt.renderer.rules.html_block = buildRenderer(context.contentScriptId, markdownIt.renderer.rules.html_block)
        },
        assets: function () {
            return [
                { name: 'style.css' },
            ]
        },
    }
}
