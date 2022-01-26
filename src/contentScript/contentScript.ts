import * as MarkdownIt from "markdown-it"
import { RenderRule } from "markdown-it/lib/renderer"
import { tmpdir } from 'os'
import { sep } from 'path'

const diagramsTempDir = `${tmpdir}${sep}joplin-drawio-plugin${sep}`

const htmlTagRegExp = /<drawio +[^>]+? *\/?>/i
const htmlTagName = 'drawio'
const htmlAttributeName = 'data-id'


function getDiagramId(content: string): string {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(content, "text/xml")
    const elements = xmlDoc.getElementsByTagName(htmlTagName)
    if (elements.length > 0) {
        const element = xmlDoc.getElementsByTagName(htmlTagName)[0]
        if (element.attributes.getNamedItem(htmlAttributeName) !== null) {
            return element.attributes[htmlAttributeName].nodeValue
        }
    }
    return null
}

function buildRenderer(contentScriptId: string, renderer: RenderRule) {
    const defaultRender = renderer || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    return function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        console.log('token', token)
        if (htmlTagRegExp.test(token.content)) {
            const diagramId = getDiagramId(token.content)
            if (diagramId !== null) {
                // TODO: change hardcoded path
                // TODO: detecte file extension
                const extraText = token.content.split('\n').slice(1).join('<br>')
                const pluginRequest = JSON.stringify({ resourceId: diagramId })
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
                document.getElementById('drawio-menu-${diagramId}-copyImage').addEventListener('click', async e => {
                    const img = document.querySelector("#drawio-body-${diagramId}>div>*:first-child");
                    if(img) {
                        const response = await fetch(img.dataset.imageUrl);
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': await response.blob() })
                        ]);
                    }
                });

                // Send fence content to plugin
                webviewApi.postMessage('${contentScriptId}', ${pluginRequest}).then((response) => {
                   document.getElementById('drawio-body-${diagramId}').innerHTML = response;
                });
                `.replace(/"/g, '&quot;')
                return `
                <div class="drawio-container">
                    <div id="drawio-body-${diagramId}" class="flex-center">
                        <object data="${diagramsTempDir}${diagramId}.svg" type="image/svg+xml"></object>
                        <object data="${diagramsTempDir}${diagramId}.png" type="image/png"></object>
                    </div>
                    <div id="drawio-menu-${diagramId}" class="menu">
                        <ul class="menu-options">
                            <li class="menu-option"><button id="drawio-menu-${diagramId}-edit">Edit</button></li>
                            <li class="menu-option"><button id="drawio-menu-${diagramId}-preview">Preview</button></li>
                            <li class="menu-option"><button id="drawio-menu-${diagramId}-prevPage">Previous Page</button></li>
                            <li class="menu-option"><button id="drawio-menu-${diagramId}-nextPage">Next Page</button></li>
                            <li class="menu-option"><button id="drawio-menu-${diagramId}-copyImage">Copy image</button></li>
                        </ul>
                    </div>
                </div>
                <style onload="${sendContentToJoplinPlugin}"></style>
                ${extraText ? '<br>' + extraText : ''}
                `
            } else {
                return `
                <div class="drawio-container">
                    <p><strong>Draw.io error:</strong> no attribute &quot;data-id&quot; specified</p>
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
