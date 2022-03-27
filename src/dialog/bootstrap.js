let editor = null
let settings = null

function startDrawio() {
    if (!editor && window.DiagramEditor) {
        const settingsStr = document.getElementById('settings').value
        const themeUi = document.getElementById('setting-theme-ui').value
        settings = JSON.parse(settingsStr)
        // console.log(settings)
        const urlParams = [
            'embed=1',
            `lang=${settings.languageUi}`,
            'drafts=1',
            `rough=${(settings.themeRough ? 1 : 0)}`,
            `dark=${(settings.themeDark ? 1 : 0)}`,
            `ui=${themeUi}`,
            'spin=1',
            'noExitBtn=1',
            'saveAndExit=0',
            'noSaveBtn=1',
            'notitle=1',
            'stealth=1',
            'splash=0',
            `grid=${(settings.grid ? 1 : 0)}`,
            // TODO LOW: when the page view is disabled the export command makes the diagram move
            `pv=${(settings.pageVisible ? 1 : 0)}`,
            `ruler=${(settings.ruler ? 1 : 0)}`,
        ]
        // console.log(urlParams)
        editor = new DiagramEditor(null, settings.themeUi, dialogDone, null, urlParams)
        editor.drawDomain = settings.server
        editor.editElement(document.getElementById('diagram'))
    }
}

function dialogDone(data, draft, elt) {
    // console.log('dialogDone', data, draft, elt)
    editor.postMessage({
        action: 'export',
        format: editor.format,
        xml: data,
        keepTheme: true,
        grid: settings.exportGrid,
        shadow: settings.exportShadows,
        transparent: settings.exportTransparentBackground,
        border: 0,
        zoom: 1,
        scale: 1,
    })
}

// Auto load the editor
// Method 1
(function () {
    startDrawio()
})()
// Method 2
// TODO LOW: remove if the auto load 1 works
setTimeout(() => {
    // console.log('Auto load drawio 2')
    startDrawio()
}, 200)