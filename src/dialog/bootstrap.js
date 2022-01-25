let editor = null

function startDrawio() {
    if (!editor && window.DiagramEditor) {
        const settingsStr = document.getElementById('settings').value
        const themeUi = document.getElementById('setting-theme-ui').value
        const settings = JSON.parse(settingsStr)
        console.log(settings)
        const urlParams = [
            'embed=1',
            'lang=' + settings.language,
            'drafts=1',
            'rough=' + (settings.themeRough ? 1 : 0), // TODO: to test
            'dark=' + (settings.themeDark ? 1 : 0),
            'ui=' + themeUi,
            'spin=1',
            'noExitBtn=1',
            'saveAndExit=0',
            'noSaveBtn=1',
            'notitle=1',
            'stealth=1',
            'splash=0',
            'grid=' + (settings.grid ? 1 : 0),
            'pv=' + (settings.pageVisible ? 1 : 0), // TODO: when the page view is disabled the export command makes the diagram move
            `ruler=` + (settings.ruler ? 1 : 0),
        ]
        console.log(urlParams)
        editor = new DiagramEditor(null, settings.themeUi, dialogDone, null, urlParams)
        editor.editElement(document.getElementById('diagram'))
    }
}

function dialogDone(data, draft, elt) {
    console.log('dialogDone', data, draft, elt)
    // TODO: embed in the DiagramEditor.js
    editor.postMessage({
        action: 'export', format: editor.format,
        xml: data
    })
}




(function () {
    console.log('Auto load drawio 1')
    startDrawio()
})()

// TODO: remove if the autoload 1 works
setTimeout(() => {
    console.log('Auto load drawio 2')
    startDrawio()
}, 200)