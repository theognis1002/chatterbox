const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        content: './src/content.ts',
        background: './src/background.ts',
        popup: './src/popup.ts',
        styles: './src/styles.css'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: './'
                        }
                    },
                    'css-loader'
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    experiments: {
        topLevelAwait: true,
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.css',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'manifest.json',
                    to: 'manifest.json',
                    transform(content) {
                        // Fix paths in manifest to point to correct locations
                        const manifest = JSON.parse(content);
                        manifest.background.service_worker = 'background.js';
                        manifest.background.type = 'module'; // Ensure module type is set
                        manifest.content_scripts[0].js = ['content.js'];
                        manifest.content_scripts[0].css = ['styles.css'];
                        return JSON.stringify(manifest, null, 2);
                    }
                },
                { from: 'popup.html', to: 'popup.html' },
                { from: 'icons', to: 'icons' },
                { from: 'src/prompts', to: 'prompts' },
            ],
        }),
    ],
}; 