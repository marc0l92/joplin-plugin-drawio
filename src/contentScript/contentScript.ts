import * as MarkdownIt from "markdown-it"
import { RenderRule } from "markdown-it/lib/renderer"

const htmlTagRegExp = /<drawio +[^>]+? *\/?>/i
const htmlTagName = 'drawio'
const idAttributeName = 'id'

function extractCodeFromIdAttribute(idAttribute: string): { id?: string, path?: string } {
    console.log('extractCodeFromIdAttribute', idAttribute)
    //](:/dc918ec87077460fbdbb0986a91c4c9d)
    const splitViewMatch = idAttribute.match(/\]\(\:\/([A-Za-z0-9]+)\)/)
    if (splitViewMatch) {
        return { id: splitViewMatch[1] }
    }
    //](file://C:/Users/user/.config/joplin-desktop/resources/dc918ec87077460fbdbb0986a91c4c9d.png?t=1647790570726)
    const richTextMatch = idAttribute.match(/^\]\((file\:\/\/.+)\)$/)
    if (richTextMatch) {
        return { path: richTextMatch[1] }
    }
    return {}
}

function getDiagramTagId(content: string): string {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(content, "text/xml")
    const diagramsHtml = xmlDoc.getElementsByTagName(htmlTagName)
    if (diagramsHtml.length > 0 && diagramsHtml[0].attributes.getNamedItem(idAttributeName) !== null) {
        return diagramsHtml[0].attributes[idAttributeName].nodeValue
    }
    return ""
}

function getImageType(path: string): string {
    const extension = path.split('.').pop()
    if (extension.startsWith('png')) {
        return 'image/png'
    }
    return 'image/svg+xml'
}

function buildRenderer(contentScriptId: string, renderer: RenderRule) {
    const defaultRender = renderer || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    return function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        console.log('token', token)
        if (!htmlTagRegExp.test(token.content)) {
            return defaultRender(tokens, idx, options, env, self)
        }
        let outputHtml = ''
        const { id: diagramId, path: diagramPath } = extractCodeFromIdAttribute(getDiagramTagId(token.content))
        if (diagramId) {
            // Valid diagram id in markdown split mode
            const messages = {
                init: JSON.stringify({ diagramId: diagramId, action: 'init' }),
                edit: JSON.stringify({ diagramId: diagramId, action: 'edit' }),
                preview: JSON.stringify({ diagramId: diagramId, action: 'preview' }),
            }
            const sendContentToJoplinPlugin = `
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
                });
                `.replace(/"/g, '&quot;')
            outputHtml += `
                <div class="drawio-container" tabindex="-1">
                    <div id="drawio-body-${diagramId}" class="flex-center"></div>
                    <div id="drawio-menu-${diagramId}" class="menu">
                        <div class="menu-options">
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-edit" value="Edit" /></div>
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-preview" value="Preview" /></div>
                            <div class="menu-option"><input type="submit" id="drawio-menu-${diagramId}-copyImage" value="Copy image" /></div>
                        </div>
                    </div>
                </div>
                <style onload="${sendContentToJoplinPlugin}"></style>
                `
        } else if (diagramPath) {
            // Valid diagram id in rich text mode
            // TODO: HIGH fix rich text support
            outputHtml += `
                <div style="display:none">
                    ${token.content.replace(/</g, '< ')}
                </div>
                <object data="${diagramPath}" type="${getImageType(diagramPath)}"></object>
                `
        } else {
            // Invalid diagram id
            outputHtml += `
                <div class="drawio-container">
                    <p><strong>Draw.io error:</strong> no valid attribute &quot;${idAttributeName}&quot; specified</p>
                </div>
                `
        }
        // TODO LOW: Improve support for html_block with another html_block in the extraText
        const extraText = token.content.split('\n').slice(1).join('<br>')
        outputHtml += `${extraText ? '<br>' + extraText : ''}`
        return outputHtml
    }
}

export default function (context: { contentScriptId: string }) {
    return {
        plugin: async function (markdownIt: MarkdownIt, _options) {
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
