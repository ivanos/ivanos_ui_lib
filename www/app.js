
document.addEventListener("DOMContentLoaded", function() {
    var connectionUrl = "ws://" + location.host + "/lager/websocket";
    //var connectionUrl = "ws://localhost:8080/lager/websocket";

    app(connectionUrl);
});

function app(connectionUrl) {

    logView.reset();

    var logEntries = [],
        connection = createConnection();

    function createConnection() {
        //connection.close();

        var ws = new WebSocket(connectionUrl);

        ws.onopen = function () {
            document.querySelector(".status").classList.add("connected");
            console.info('WebSocket Connection established');
        };

        // Log errors
        ws.onerror = function (error) {
            document.querySelector(".status").classList.remove("connected");
            console.error('WebSocket Connection Error', error);
        };

        ws.onclose = function (error) {
            document.querySelector(".status").classList.remove("connected");
            console.error('WebSocket Connection closed', error);

            setTimeout(createConnection, 5000);
        };

        // Log messages from the server
        ws.onmessage = function (e) {
            var log = parseLog(e.data);

            logEntries.push(log);

            publishLog(log);
        };

        return ws;
    }

    function parseLog(message) {
        return JSON.parse(message);
    }

    function publishLog(log) {
        console.log(log);
        logView.addLogEntry(log);
    }

    return connection;
}

var logView = {
    reset: function() {
        var $logsContainer = $(".log-list-container>div.list-group");
        $logsContainer.children().remove();
        $logsContainer.off();

        $logsContainer.on("click", "a", null, function() {
            $logsContainer.children("a").removeClass("active");
            $(this).addClass("active");

            logView.displayLog($(this).data("log"));
        });

        var $logContainer = $(".json-viewer-container>div");
        $logContainer.off();
        $logContainer.children().remove();

        $logContainer.on("click", ".entry .key", null, function() {
            $(this).parent(".entry").toggleClass("collapsed");
        });

    },

    displayLogTimestamp: function(log) {
        return "<p class='list-group-item-text'>" + log.date + " " + log.time + "</p>";
    },

    displayLogSeverity: function(log) {
        return '<div class="badge alert-' + getSeverityPostfix(log.severity) + '">' + log.severity + '</div>';
    },

    displayLogMessage: function(log) {
        return "<h4 class='list-group-item-heading'>" + log.message + "</h4>"
    },

    displayLogEntry: function(log) {
        return this.displayLogSeverity(log) + this.displayLogTimestamp(log) + this.displayLogMessage(log);
    },

    addLogEntry: function(log) {
        var $entry = $("<a href='#'>")
            .addClass("list-group-item")
            .addClass("list-group-item--" + getSeverityPostfix(log.severity))
            .html(this.displayLogEntry(log))
            .data({log: log});
        $(".log-list-container>div").prepend($entry);
    },

    displayLog: function(log) {

        var $logContainer = $(".json-viewer-container > div"),
            logContent = [
                '<div class="panel panel-default panel-', getSeverityPostfix(log.severity),'">',
                    '<div class="panel-heading">',
                        '<h3 class="panel-title">',
                            '<span class="severity-label label label-', getSeverityPostfix(log.severity) ,'">', log.severity, '</span> ',
                            '<span>', log.message, '</span></h3>',
                    '</div>',
                    '<div class="panel-heading">',
                        '<div class="panel-title">', this.displayLogTimestamp(log), '</div>',
                    '</div>',
                    '<div class="panel-body">',
                        '<pre>', getHTMLConverter(log.metadata)(log.metadata),'</pre>',
                    '</div>',
                '</div>'
            ].join("");


        $logContainer.html(logContent);

    }
};

function getSeverityPostfix(severity) {
    // available severity levels
    //debug | info | notice | warning | error | critical | alert | emergency | none
    //debug, (info, notice, warning), error, (critical, alert, emergency)

    return {
            "debug": "info",
            "info": "success",
            "notice": "success",
            //"info": "info",
            //"notice": "info",
            "warning": "warning",
            "error": "danger",
            "critical": "danger",
            "alert": "danger",
            "emergency": "danger"
        }[severity] || ""
}


function getHTMLConverter(token) {
    switch (typeof token) {
        case 'object':
            if (token === null) {return nullToHTML}
            if (Array.isArray(token)) {return arrToHTML}
            return objToHTML;
        case 'boolean':
            return boolToHTML;
        case 'string':
            return strToHTML;
        case 'number':
            return numToHTML;
        default:
            return function() {return "error parsing json"}
    }
}

var comma = "<span class='comma'>,</span>",
    squareOpen = "<span class='square begin'>[</span>",
    squareClose = "<span class='square end'>]</span>",
    curlyOpen = "<span class='curly begin'>{</span>",
    curlyClose = "<span class='curly end'>}</span>";

function objToHTML(obj) {
    var keys = Object.keys(obj);
    return keys.reduce(function(res, key, index, items) {
        var token = obj[key],
            converter = getHTMLConverter(token);
            return res +=
                "<span class='entry'><span class='key'>\"" +
                    key +
                "\"</span><span class='col'>:</span><span class='val'>" + converter(token) + "</span>" + (index + 1 == items.length ? "" : comma) + "</span>";
    }, "<span class='obj' data-items='Object{" + keys.length + "}'>" + curlyOpen) + curlyClose + "</span>"
}

function arrToHTML(arr) {
    return arr.reduce(function(res, token, index, items) {
            var converter = getHTMLConverter(token);
            return res += "<span class='entry'><span class='val'>" + converter(token) + "</span>" + (index + 1 == items.length ? "" : comma) + "</span>";
        }, "<span class='arr' data-items='Array[" + arr.length + "]'>" + squareOpen) + squareClose + "</span>"
}

function strToHTML(str) {
    return "<span class='str'>\"" + str + "\"</span>"
}

function boolToHTML(bool) {
    return "<span class='bool'>" + (bool ? "true" : "false") + "</span>"
}

function numToHTML(num) {
    return "<span class='num'>" + num + "</span>"
}

function nullToHTML() {
    return "<span class='null'>null</span>"
}
