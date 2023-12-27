const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

// Configurations --------------------------------------------------------------
const getHTMLPath = (pageName) => `./src/views/pages/${pageName}.ejs`;
const getEntryPath = (pageName) => `./src/_entries/${pageName}.entry.js`;

const CSS_OUTPUT_FILENAME = "static/css/[name].bundle.css";
const JS_OUTPUT_FILENAME = "static/js/[name].bundle.js";
const ASSET_OUTPUT_FILENAME = "static/imgs/[name][ext]";

// Webpack Configuration --------------------------------------------------------
module.exports = (env) => {
  // const devMode = env.NODE_ENV === "development";

  const pageNames = getPageNames();
  const entryObj = getEntries(pageNames);
  const htmlPlugins = generateHTMLPlugins(pageNames);

  return {
    mode: "none",
    entry: entryObj,
    output: {
      filename: JS_OUTPUT_FILENAME,
      path: path.resolve(__dirname, "dist"),
      assetModuleFilename: ASSET_OUTPUT_FILENAME,
      clean: true,
    },
    devtool: "inline-source-map",
    devServer: {
      static: path.join(__dirname, "dist"),
      watchFiles: ["src/**"],
    },
    plugins: [
      ...htmlPlugins,
      new MiniCssExtractPlugin({ filename: CSS_OUTPUT_FILENAME }),
      new webpack.ProvidePlugin({ $: "jquery", jQuery: "jquery" }),
      new CopyPlugin({
        patterns: [{ from: "./src/js/backend", to: "./static/js/backend" }],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.ejs$/i,
          use: [
            {
              loader: "html-loader",
              options: {
                sources: {
                  list: [
                    "...",
                    {
                      tag: "script",
                      attribute: "src",
                      type: "src",
                      // Disable processing of <script> tags
                      filter: () => false,
                    },
                  ],
                },
                minimize: {
                  collapseWhitespace: false,
                  removeComments: false,
                },
              },
            },
            "template-ejs-loader",
          ],
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "postcss-loader",
            "sass-loader",
          ],
        },
        {
          test: /\.(?:js|mjs|cjs)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: { presets: [["@babel/preset-env", { modules: false }]] },
          },
        },
        {
          test: /\.(jpe?g|png|gif|svg|webp|avif|ico)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      alias: {
        "@scss": path.resolve(__dirname, "src/scss"),
        "@js": path.resolve(__dirname, "src/js"),
      },
    },
  };
};

// Helpers ---------------------------------------------------------------------
function getPageNames() {
  const pageDir = path.join(__dirname, "src/views/pages");
  const pages = fs
    .readdirSync(pageDir)
    .filter((page) => page.endsWith(".ejs"))
    .map((page) => page.replace(".ejs", ""));
  return pages;
}

function getEntries(pageNames) {
  const entryObj = pageNames.reduce((acc, pageName) => {
    acc[pageName] = getEntryPath(pageName);
    return acc;
  }, {});
  return entryObj;
}

function generateHTMLPlugins(pageNames) {
  const htmlPages = pageNames.map(
    (pageName) =>
      new HtmlWebpackPlugin({
        filename: `${pageName}.html`,
        template: getHTMLPath(pageName),
        minify: { collapseWhitespace: false },
        chunks: [pageName],
        inject: false,
      }),
  );
  return htmlPages;
}
