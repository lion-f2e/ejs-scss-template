const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Configurations --------------------------------------------------------------
const getHTMLPath = (pageName) => `./src/views/pages/${pageName}.ejs`;
const getEntryPath = (pageName) => `./src/_entries/${pageName}.entry.js`;

const CSS_OUTPUT_FILENAME = "static/css/[name].bundle.css";
const JS_OUTPUT_FILENAME = "static/js/[name].bundle.js";

// Webpack Configuration --------------------------------------------------------
module.exports = (env) => {
  // const devMode = env.NODE_ENV === "development";

  const pageNames = getPageNames();
  const entryObj = getEntries(pageNames);
  const htmlPlugins = getHTMLPlugins(pageNames);

  const plugins = [
    ...htmlPlugins,
    new MiniCssExtractPlugin({ filename: CSS_OUTPUT_FILENAME }),
    new webpack.ProvidePlugin({ $: "jquery", jQuery: "jquery" }),
  ];

  return {
    mode: "none",
    entry: entryObj,
    output: {
      filename: JS_OUTPUT_FILENAME,
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    devtool: "inline-source-map",
    devServer: {
      static: path.join(__dirname, "dist"),
      watchFiles: ["src/**"],
    },
    plugins,
    module: {
      rules: [
        {
          test: /\.ejs$/i,
          use: [
            {
              loader: "html-loader",
              options: {
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
            { loader: "postcss-loader" },
            "sass-loader",
          ],
        },
        {
          test: /\.(?:js|mjs|cjs)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: { presets: ["@babel/preset-env"] },
          },
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

function getHTMLPlugins(pageNames) {
  const htmlPages = pageNames.map(
    (pageName) =>
      new HtmlWebpackPlugin({
        filename: `${pageName}.html`,
        template: getHTMLPath(pageName),
        minify: { collapseWhitespace: false },
        chunks: [pageName],
      }),
  );
  return htmlPages;
}
