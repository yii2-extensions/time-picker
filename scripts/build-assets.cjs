const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const CleanCSS = require("clean-css");
const { minify } = require("uglify-js");

const assets = resolve(__dirname, "../src/assets");

function read(file) {
  return readFileSync(resolve(assets, file), "utf8");
}

function write(file, content) {
  const target = resolve(assets, file);
  const output = `${content}\n`;
  if (!process.argv.includes("--check")) {
    writeFileSync(target, output);
  } else if (readFileSync(target, "utf8") !== output) {
    console.error(`${file} differs from its source. Run npm run build.`);
    process.exitCode = 1;
  }
}

const js = minify(read("js/bootstrap-timepicker.js"), {
  compress: false,
  mangle: true,
  module: false,
  output: { comments: /^!/ },
});
if (js.error) {
  throw js.error;
}

const css = new CleanCSS({ inline: false }).minify(
  read("css/bootstrap-timepicker.css"),
);
if (css.errors.length) {
  throw new Error(css.errors.join("\n"));
}

write("js/bootstrap-timepicker.min.js", js.code);
write("css/bootstrap-timepicker.min.css", css.styles);
