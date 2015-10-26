var path = require("path");

module.exports = {
    context: path.join(__dirname, "app"),
    entry: {
        javascript: "./app.js",
        html: "./index.html"
    },
    output: {
        path: path.join(__dirname, "www"),
        filename: "app.js"
    },
    devtool: 'source-map',
    devServer: {
        port: 8020,
        proxy: {
            '*': {
                target: 'localhost:8080'
            }
        }
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loaders: ["babel-loader?stage=0"]
        }, {
            test: /\.html$/,
            loader: "file?name=[name].[ext]"
        }, {
            test: /\.css$/,
            loader: "style-loader!css-loader"
        }, {
            test: /\.less$/,
            loader: "style-loader!css-loader!less-loader"
        }, {
            test: /\.(woff|woff2)$/,
            loader: "url-loader?limit=10000&mimetype=application/font-woff"
        }, {
            test: /\.ttf$/,
            loader: "file-loader"
        }, {
            test: /\.eot$/,
            loader: "file-loader"
        }, {
            test: /\.svg$/,
            loader: "file-loader"
        }]
    }
};
