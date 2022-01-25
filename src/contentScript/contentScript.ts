import * as MarkdownIt from "markdown-it"
import { RenderRule } from "markdown-it/lib/renderer"

const htmlTagRegExp = /<drawio +[^>]+? *\/?>/i
const htmlTagName = 'drawio'
const htmlAttributeName = 'data-id'


function getDrawioId(content: string): string {
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

function buildRenderer(renderer: RenderRule) {
    const defaultRender = renderer || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    return function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        console.log('token', token)
        if (htmlTagRegExp.test(token.content)) {
            const drawioId = getDrawioId(token.content)
            if (drawioId !== null) {
                // TODO: change hardcoded path
                // TODO: detecte file extension
                const extraText = token.content.split('\n').slice(1).join('<br>')
                return `
                <div class="drawio-container">
                    <img class="drawio-image" data-resource-id="${drawioId}" alt="Error while loading Draw.io diagram" src="file://C:/Users/marco/.config/joplin-desktop/resources/${drawioId}.png"/>
                    ${extraText ? '<br>' + extraText : ''}
                </div>
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
            markdownIt.renderer.rules.html_inline = buildRenderer(markdownIt.renderer.rules.html_inline)
            markdownIt.renderer.rules.html_block = buildRenderer(markdownIt.renderer.rules.html_block)
        },
        assets: function () {
            return [
                { name: 'style.css' },
            ]
        },
    }
}
