let editor = null

function startDrawio() {
    if (!editor && window.DiagramEditor) {
        const settingsStr = document.getElementById('settings').value
        const settings = JSON.parse(settingsStr)
        console.log(settings)
        const urlParams = [
            'embed=1',
            'pv=0',
            'lang=en',
            'drafts=1',
            'rough=' + (settings.themeRough ? 1 : 0),
            'dark=' + (settings.themeDark ? 1 : 0),
            'ui=' + settings.themeUi,
            'spin=1',
            'noExitBtn=1',
            // 'saveAndExit=0',
            'noSaveBtn=1',
            'notitle=1',
            'stealth=1',
        ]
        console.log(urlParams)
        editor = new DiagramEditor(null, settings.themeUi, dialogDone, null, urlParams)
        editor.editElement(document.getElementById('diagram'))
    }
}

function dialogDone(data, draft, elt) {
    console.log('dialogDone', data, draft, elt)
    editor.postMessage({
        action: 'export', format: editor.format,
        xml: data
    })
}




(function () {
    console.log('Auto load drawio 1')
    startDrawio()
})()

setTimeout(() => {
    console.log('Auto load drawio 2')
    startDrawio()
}, 200)