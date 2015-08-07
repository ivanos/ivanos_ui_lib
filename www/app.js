
document.addEventListener("DOMContentLoaded", function() {
    var connectionUrl = "ws://" + location.host + "/ivanos/packet_debug_stream";
    //var connectionUrl = 'ws://html5rocks.websocket.org/echo';

    app(connectionUrl);
});


function debug(connection) {
    function entry() {
        return {
            string: "secret",
            number: 123,
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
    }

    var logEntries = [];

    osl.snapshot = function() {
        console.log(logEntries);
        return logEntries;
    };

    return connection;
}
