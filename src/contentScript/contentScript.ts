import * as MarkdownIt from "markdown-it"
import { RenderRule } from "markdown-it/lib/renderer"
import { tmpdir } from 'os'
import { sep } from 'path'

interface IDiagramTag {
    id?: string
}

const diagramsTempDir = `${tmpdir}${sep}joplin-drawio-plugin${sep}`

const htmlTagRegExp = /<drawio +[^>]+? *\/?>/i
const htmlTagName = 'drawio'
const idAttributeName = 'id'

function htmlEscape(str: string): string {
    return str.replace(/</g, '< ') // TODO: improve richtext compatibility
}

function getDiagramTags(content: string): IDiagramTag[] {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(content, "text/xml")
    console.log('getDiagramTags xmlDoc', xmlDoc)
    const diagramsHtml = xmlDoc.getElementsByTagName(htmlTagName)
    console.log('getDiagramTags diagramsHtml', diagramsHtml)
    let diagramsTag: IDiagramTag[] = []
    for (const diagramHtml of diagramsHtml) {
        const diagramTag: IDiagramTag = {}
        if (diagramHtml.attributes.getNamedItem(idAttributeName) !== null) {
            diagramTag.id = diagramHtml.attributes[idAttributeName].nodeValue
        }
        diagramsTag.push(diagramTag)
    }
    return diagramsTag
}

function buildRenderer(contentScriptId: string, renderer: RenderRule) {
    const defaultRender = renderer || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    return function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        console.log('token', token)
        if (htmlTagRegExp.test(token.content)) {
            const diagramsTag = getDiagramTags(token.content)
            let outputHtml = ''
            for (const diagramTag of diagramsTag) {
                const diagramId = diagramTag.id
                if (diagramId) {
                    // TODO: Redesign UI of right click menu
                    // TODO: Implement next/previous page buttons
                    // TODO: Implement preview
                    // TODO: Improve support for html_block with another html_block in the extraText
                    const extraText = token.content.split('\n').slice(1).join('<br>')
                    const messages = {
                        init: JSON.stringify({ diagramId: diagramId, action: 'init' }),
                        edit: JSON.stringify({ diagramId: diagramId, action: 'edit' }),
                        preview: JSON.stringify({ diagramId: diagramId, action: 'preview' }),
                    }
                    const sendContentToJoplinPlugin = `
                        let diagram = null;
                        // Configure context menu
                        document.getElementById('drawio-body-${diagramId}').addEventListener('mousedown', e => {
                            const menu = document.getElementById('drawio-menu-${diagramId}');
                            menu.style.display = e.button === 2 ? '' : 'none';
                        });
                        document.getElementById('drawio-menu-${diagramId}-edit').addEventListener('click', async e => {
                            webviewApi.postMessage('${contentScriptId}', ${messages.edit});
                        });
                        document.getElementById('drawio-menu-${diagramId}-preview').addEventListener('click', async e => {
                            webviewApi.postMessage('${contentScriptId}', ${messages.preview});
                        });
                        document.getElementById('drawio-menu-${diagramId}-copyImage').addEventListener('click', async e => {
                            const img = document.querySelector("#drawio-body-${diagramId}>div>*:first-child");
                            console.log('copyImage', img);
                            if(img && img.tagName === 'IMG') {
                                let src = img.src;
                                if (img.src.startsWith('data:image/svg')) {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    src = canvas.toDataURL('image/png');
                                }
                                const response = await fetch(src);
                                navigator.clipboard.write([
                                    new ClipboardItem({ 'image/png': await response.blob() })
                                ]);
                            }
                        });

                        // Send fence content to plugin
                        webviewApi.postMessage('${contentScriptId}', ${messages.init}).then((response) => {
                            document.getElementById('drawio-body-${diagramId}').innerHTML = response;
                            document.getElementById('drawio-menu-${diagramId}').style = "";
                            diagram = document.querySelector("#drawio-body-${diagramId}>div>*:first-child");
                        });
                        `.replace(/"/g, '&quot;')
                    outputHtml += `
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
                                    <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-copyImage" value="Copy image" /></div>
                                </div>
                            </div>
                        </div>
                        <style onload="${sendContentToJoplinPlugin}"></style>
                        ${extraText ? '<br>' + extraText : ''}
                        `
                } else {
                    outputHtml += `
                        <div class="drawio-container">
                            <p><strong>Draw.io error:</strong> no attribute &quot;${idAttributeName}&quot; specified</p>
                        </div>
                        `
                }
            }
            return outputHtml
        }
        return defaultRender(tokens, idx, options, env, self)
    }
}

export default function (context: { contentScriptId: string }) {
    return {
        plugin: async function (markdownIt: MarkdownIt, _options) {
            console.log('start drawio contentScript')
            // html_inline: html tag with text before or after the tag
            markdownIt.renderer.rules.html_inline = buildRenderer(context.contentScriptId, markdownIt.renderer.rules.html_inline)
            // html_block: html tag without text before or after the tag
            markdownIt.renderer.rules.html_block = buildRenderer(context.contentScriptId, markdownIt.renderer.rules.html_block)
        },
        assets: function () {
            return [
                { name: 'style.css' },
            ]
        },
    }
}
