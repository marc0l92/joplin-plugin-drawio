var DRAW_IFRAME_URL = 'https://embed.diagrams.net/?embed=1';
var graph = null;
var xml = null;
var doc = document.documentElement.outerHTML;

function mxClientOnLoad(stylesheet) {
    xml = document.getElementById('mxfile').innerHTML;
    xml = decodeURIComponent(xml);

    // Removes all illegal control characters before parsing
    var checked = [];

    for (var i = 0; i < xml.length; i++) {
        var code = xml.charCodeAt(i);

        // Removes all control chars except TAB, LF and CR
        if (code >= 32 || code == 9 || code == 10 || code == 13) {
            checked.push(xml.charAt(i));
        }
    }

    xml = checked.join('');

    var div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.position = 'relative';
    document.body.appendChild(div);
    graph = new mxGraph(div);

    graph.resetViewOnRootChange = false;
    graph.foldingEnabled = false;
    // NOTE: Tooltips require CSS
    graph.setTooltips(false);
    graph.setEnabled(false);

    // Loads the stylesheet
    if (stylesheet != null) {
        var xmlDoc = mxUtils.parseXml(stylesheet);
        var dec = new mxCodec(xmlDoc);
        dec.decode(xmlDoc.documentElement, graph.getStylesheet());
    }

    var xmlDoc = mxUtils.parseXml(xml);
    var codec = new mxCodec(xmlDoc);
    codec.decode(codec.document.documentElement, graph.getModel());
    graph.maxFitScale = 1;
    graph.fit();
    graph.center(true, false);

    window.addEventListener('resize', function () {
        graph.fit();
        graph.center(true, false);
    });
}

function edit(url) {
    var border = 0;
    var iframe = document.createElement('iframe');
    iframe.style.zIndex = '9999';
    iframe.style.position = 'absolute';
    iframe.style.top = border + 'px';
    iframe.style.left = border + 'px';

    if (border == 0) {
        iframe.setAttribute('frameborder', '0');
    }

    var resize = function () {
        iframe.setAttribute('width', document.body.clientWidth - 2 * border);
        iframe.setAttribute('height', document.body.clientHeight - 2 * border);
    };

    window.addEventListener('resize', resize);
    resize();

    var receive = function (evt) {
        if (evt.data == 'ready') {
            iframe.contentWindow.postMessage(xml, '*');
            resize();
        }
        else {
            if (evt.data.length > 0) {
                // Update the graph
                var xmlDoc = mxUtils.parseXml(evt.data);
                var codec = new mxCodec(xmlDoc);
                codec.decode(codec.document.documentElement, graph.getModel());
                graph.fit();
                graph.center(true, false);

                var data = encodeURIComponent(evt.data);
                var idx = doc.indexOf('<div ' + 'id="mxfile"');
                var newdoc = doc.substring(0, idx) + '\n<div ' + 'id="mxfile" style="display:none;">' +
                    data + '</d' + 'iv>' +
                    '\n<script type="text/javascript">\nvar doc = document.documentElement.outerHTML;\n</' + 'script>' +
                    '\n<script type="text/javascript" src="https://www.draw.io/embed.js"></' + 'script></body></html>';

                save(newdoc, location.pathname.substring(location.pathname.lastIndexOf("/") + 1));
            }

            window.removeEventListener('resize', resize);
            window.removeEventListener('message', receive);
            document.body.removeChild(iframe);
        }
    };

    window.addEventListener('message', receive);
    iframe.setAttribute('src', DRAW_IFRAME_URL);
    document.body.appendChild(iframe);
}

function save(data, filename) {
    try {
        if (mxClient.IS_QUIRKS || document.documentMode >= 8) {
            var win = window.open('about:blank', '_blank');
            win.document.write(data);
            win.document.close();
            win.document.execCommand('SaveAs', true, filename);
            win.close();
        }
        else if (mxClient.IS_SF) {
            // Opens new tab (user saves file). No workaround to force dialog in Safari.
            window.open('data:application/octet-stream,' + encodeURIComponent(data), filename);
        }
        else {
            var a = document.createElement('a');

            // NOTE: URL.revokeObjectURL(a.href) after click breaks download in FF
            a.href = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.parentNode.removeChild(a);
            URL.revokeObjectURL(a.href);
        }
    }
    catch (e) {
        console.log('error', e);
        console.log('html', data);
    }
};