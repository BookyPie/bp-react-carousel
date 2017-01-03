var path = require('path');
var webpack = require('webpack');

var definePlugin = 

module.exports = {
    entry: './test/TestApp.js',
    output: {
        path: path.join(__dirname, 'test'),
        filename: 'bundle.js',
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV) } })
    ],
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                exlcude: /node_modules/,
                query: {
                    presets: ['es2015', 'stage-0', 'react']
                }
            },
            {
                test: /\.s?css$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    },
    devServer: {
        inline: true,
        port: 3333,
        contentBase: path.join(__dirname, 'test'),
        stats: { colors: true },
        historyApiFallback: true
    }
};