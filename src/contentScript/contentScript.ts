import * as MarkdownIt from "markdown-it"
import { RenderRule } from "markdown-it/lib/renderer"

const htmlTagRegExp = /^drawio$/i
const idAttributeName = 'src'

function extractCodeFromIdAttribute(idAttribute: string): string {
    console.log('extractCodeFromIdAttribute', idAttribute)
    //:/dc918ec87077460fbdbb0986a91c4c9d
    const splitViewMatch = idAttribute.match(/^\:\/([A-Za-z0-9]+)/)
    if (splitViewMatch) {
        return splitViewMatch[1]
    }
    //file://C:/Users/user/.config/joplin-desktop/resources/dc918ec87077460fbdbb0986a91c4c9d.png?t=1647790570726
    const richTextMatch = idAttribute.match(/^file\:\/\/.+?([a-z0-9]+)\.(svg|png)(\?t=[0-9]+)?$/)
    if (richTextMatch) {
        return richTextMatch[1]
    }
    return null
}

function getDiagramTagId(token: any): string {
    if (token.attrs && token.attrs.length > 0) {
        for (const attr of token.attrs) {
            if (attr[0] === idAttributeName) {
                return attr[1]
            }
        }
    }
    return ""
}

function buildRenderer(contentScriptId: string, renderer: RenderRule) {
    const defaultRender = renderer || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    return function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        const defaultOutput = defaultRender(tokens, idx, options, env, self)
        console.log('token', token)
        console.log('defaultOutput', defaultOutput)
        if (htmlTagRegExp.test(token.content)) {
            const diagramId = extractCodeFromIdAttribute(getDiagramTagId(token))
            if (diagramId) {
                const messages = {
                    edit: JSON.stringify({ diagramId: diagramId, action: 'edit' }),
                    check: JSON.stringify({ diagramId: diagramId, action: 'check' }),
                }
                const sendContentToJoplinPlugin = `
                    document.getElementById('drawio-${diagramId}-edit').addEventListener('click', async e => {
                        webviewApi.postMessage('${contentScriptId}', ${messages.edit});
                    });

                    webviewApi.postMessage('${contentScriptId}', ${messages.check}).then((response) => {
                        if (response.isValid) {
                            document.getElementById('drawio-${diagramId}-edit').style = "";
                        } else {
                            document.getElementById('drawio-${diagramId}-edit').remove();
                        }
                    });
                `.replace(/"/g, '&quot;')
                return `
                    <span class="drawio-container">
                        ${defaultOutput}
                        <button id="drawio-${diagramId}-edit" style="display:none">Edit</button>
                    </span>
                    <style onload="${sendContentToJoplinPlugin}"></style>
                `
            }
        }
        return defaultOutput
    }
}

export default function (context: { contentScriptId: string }) {
    return {
        plugin: async function (markdownIt: MarkdownIt, _options) {
            markdownIt.renderer.rules.image = buildRenderer(context.contentScriptId, markdownIt.renderer.rules.image)
        },
        assets: function () {
            return [
                { name: 'style.css' },
            ]
        },
    }
}
