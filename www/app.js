
document.addEventListener("DOMContentLoaded", function() {
    var connectionUrl = "ws://" + location.host + "/ivanos/packet_debug_stream";
    //var connectionUrl = 'ws://html5rocks.websocket.org/echo';

    app(connectionUrl);
});


function debug(connection) {
    function entry() {
        return {
            string: "secret",
            number: Math.random(),
            boolean: true,
            array: ["1", "2", "3"],
            object: {kitten: "mew"},
            "null": null,
            DOM: document
        }
    }

    setInterval(function() {
        var testJson = {
            "log": {
                "timestamp":  Date.now(),
                "info": "<generating process, etc>",
                "entry": entry()
            }
        };

        connection.send(JSON.stringify(testJson));
    }, 1000);

}

var osl = {};

function app(connectionUrl) {
    var connection = new WebSocket(connectionUrl);

    logView.reset();

    connection.onopen = function () {
        document.querySelector(".status").classList.add("connected");
        console.info('WebSocket Connection established');

        debug(connection);
    };

    // Log errors
    connection.onerror = function (error) {
        document.querySelector(".status").classList.remove("connected");
        console.error('WebSocket Connection Error', error);
    };

    // Log messages from the server
    connection.onmessage = function (e) {
        var log = parseLog(e.data);
        logEntries.push(log);

        publishLog(log);
    };

    function parseLog(message) {
        return JSON.parse(message)["log"];
    }

    function publishLog(log) {
        console.log(new Date(log.timestamp), log.info, log.entry);
        logView.addLogEntry(log);
    }

    var logEntries = [];

    osl.snapshot = function() {
        console.log(logEntries);
        return logEntries;
    };

    return connection;
}

/***
 * log = {
 *      timestamp
 *      info
 *      entry
 * }
 *
 */

var logView = {
    reset: function() {
        var $logsContainer = $(".log-list-container ul");
        $logsContainer.children("li").remove();
        $logsContainer.off();

        $logsContainer.on("click", "li", null, function() {
            $logsContainer.children("li").removeClass("selected");
            $(this).addClass("selected");

            logView.displayLog($(this).data("log"));
        });

        var $logContainer = $(".json-viewer-container > div");
        $logContainer.children("pre").off();
        $logContainer.children().remove();
        $logContainer.append("<h3></h3><time></time><pre class='prettyprint'></pre>");

        $logContainer.children("pre").on("click", ".entry .key", null, function() {
            $(this).parent(".entry").toggleClass("collapsed");
        });

    },

    addLogEntry: function(log) {
        var $entry = $("<li>")
            .text(new Date(log.timestamp) + ", " + log.info)
            .data({log: log});
        $(".log-list-container ul").prepend($entry);
    },

    displayLog: function(log) {
        var $logContainer = $(".json-viewer-container > div");
        $logContainer.children("h3").text(log.info);
        $logContainer.children("time").text(new Date(log.timestamp));

        $logContainer.children("pre").html(getHTMLConverter(log.entry)(log.entry));
        $logContainer.children(".prettyprinted").removeClass("prettyprinted");

    }
};

/**
 * Number	double- precision floating-point format in JavaScript
 String	double-quoted Unicode with backslash escaping
 Boolean	true or false
 Array	an ordered sequence of values
 Value	it can be a string, a number, true or false, null etc
 Object	an unordered collection of key:value pairs
 Whitespace	can be used between any pair of tokens
 null
 * @param $code
 */

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
    squareOpen = "<span class='square open'>[</span>",
    squareClose = "<span class='square close'>]</span>",
    curlyOpen = "<span class='curly open'>{</span>",
    curlyClose = "<span class='curly close'>}</span>";

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
