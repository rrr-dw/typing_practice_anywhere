// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";

const config = {
	entry: {
		// popup: "./src/popup/popup.tsx",
		option: "./src/option/option.tsx",
		background: "./src/background.ts",
		contentScript: "./src/contentScript.tsx",
	},
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
	},
	devtool: "cheap-module-source-map",
	plugins: [
		// new HtmlWebpackPlugin({
		// 	template: "./src/popup/popup.html",
		// 	filename: "popup.html",
		// 	chunks: ['popup'],
		// }),
		new HtmlWebpackPlugin({
			template: "./src/option/option.html",
			filename: "option.html",
			chunks: ['option'],
		}),

		new MiniCssExtractPlugin(),

		new CopyPlugin({
			patterns: [
				{ from: "public", to: "." }
			]
		}),

		new CleanWebpackPlugin(),


		// Add your plugins here
		// Learn more about plugins from https://webpack.js.org/configuration/plugins/
	],
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/i,
				loader: "ts-loader",
				exclude: ["/node_modules/"],
			},
			{
				oneOf: [
					{
						test: /\.module\.s[ac]ss$/i,
						use:
							[
								MiniCssExtractPlugin.loader,
								{
									loader: "css-loader",
									options: {
										modules: true,
										sourceMap: !isProduction
									}
								},
								{
									loader: "sass-loader",
									options: {
										sourceMap: !isProduction
									}
								}
							],
					},
					{
						test: /\.s[ac]ss$/i,
						use:
							[
								MiniCssExtractPlugin.loader,
								{
									loader: "css-loader",
									options: {
										sourceMap: !isProduction
									}
								},
								{
									loader: "sass-loader",
									options: {
										sourceMap: !isProduction
									}
								}
							],
					}
				]
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
				type: "asset",
			},

			// Add your rules for custom modules here
			// Learn more about loaders from https://webpack.js.org/loaders/
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
};

module.exports = () => {
	if (isProduction) {
		config.mode = "production";
	} else {
		config.mode = "development";
	}
	return config;
};
