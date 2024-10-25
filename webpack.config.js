const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
	entry: {
		index: './src/index.tsx',
		wifi: './src/wifi.tsx',
		update: './src/update.tsx',
	},
	output: {
		filename: '[name].[contenthash].js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: '/',
		clean: true,
	},
	mode: process.env.NODE_ENV || 'development',
	resolve: {
		extensions: ['.js', '.jsx', '.ts', '.tsx'],
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: [
					process.env.NODE_ENV !== 'production'
						? 'style-loader'
						: MiniCssExtractPlugin.loader,
					'css-loader',
				],
			},
			{
				test: /\.(png|jpe?g|gif|svg|webp)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'images/[hash][ext][query]',
				},
			},
			{
				test: /\.(woff(2)?|eot|ttf|otf)$/,
				type: 'asset/resource',
				generator: {
					filename: 'fonts/[hash][ext][query]',
				},
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './public/index.html',
			chunks: ['index'],
			// favicon: './public/favicon.ico',
		}),
		new HtmlWebpackPlugin({
			filename: 'wifi.html',
			template: './public/wifi.html',
			chunks: ['wifi'],
		}),
		new HtmlWebpackPlugin({
			filename: 'update.html',
			template: './public/update.html',
			chunks: ['update'],
		}),
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash].css',
		}),
		new CleanWebpackPlugin(),
		new ForkTsCheckerWebpackPlugin({
			async: false,
		}),
		new Dotenv(),
	],
	devServer: {
		static: path.resolve(__dirname, 'dist'),
		historyApiFallback: {
			rewrites: [
				{ from: /^\/$/, to: '/index.html' },
				{ from: /^\/wifi$/, to: '/wifi.html' },
				{ from: /^\/update$/, to: '/update.html' },
			],
		},
		hot: true,
		open: true,
		port: 3000,
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
		runtimeChunk: 'single',
	},
};
