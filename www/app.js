
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
            object: {kitten: "mew"}
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
        $logContainer.children().remove();

        $logContainer.append("<h3></h3><time></time><pre></pre>");
    },

    addLogEntry: function(log) {
        var $entry = $("<li>")
            .text(new Date(log.timestamp) + ", " + log.info)
            .data({log: log});
        $(".log-list-container ul").append($entry)
    },

    displayLog: function(log) {
        var $logContainer = $(".json-viewer-container > div");
        $logContainer.children("pre").text(JSON.stringify(log.entry, null, 4));
        $logContainer.children("h3").text(log.info);
        $logContainer.children("time").text(new Date(log.timestamp));
    }
};

