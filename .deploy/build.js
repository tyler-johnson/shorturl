const fs = require("fs");
const path = require("path");
const {template} = require("lodash");
const minimist = require("minimist");
const yaml = require("js-yaml");

const argv = minimist(process.argv.slice(2));
const conf = {};

try {
  const src = fs.readFileSync(path.resolve(__dirname, "../deploy-config.yml"));
  const yml = yaml.safeLoad(src);
  Object.assign(conf, yml);
  if (argv.env && yml[argv.env]) Object.assign(conf, yml[argv.env]);
  else if (yml.env && yml[yml.env]) Object.assign(conf, yml[yml.env]);
} catch(e) {
  if (e.code !== "ENOENT") console.error(e);
}

Object.assign(conf, argv);

function walkfs(file, exts, fn) {
  const stat = fs.statSync(file);

  if (stat.isDirectory()) {
    fs.readdirSync(file).forEach(name => {
      walkfs(path.join(file, name), exts, fn);
    });
  } else if (exts.includes(path.extname(file))) {
    const src = fs.readFileSync(file, "utf-8");
    fn(src, file);
  }
}

function build(dir, out, exts, join="", mode) {
  const result = [];

  walkfs(dir, exts, (src, file) => {
    const data = Object.assign({}, conf, {
      __filename: file,
      __dirname: path.dirname(file)
    });

    const opts = {
      variable: "$",
      imports: {}
    };

    result.push(template(src, opts)(data).trim() + "\n");
  });

  if (result) {
    fs.writeFileSync(out, result.join(join + "\n"), { mode });
  }
}

build(
  path.join(__dirname, "kube-conf"),
  path.resolve(__dirname, "../kubernetes.yml"),
  [ ".yml" ],
  "---"
);
