const fs = require('fs');
const path = require('path');

const utilPath = path.join(__dirname, '..', 'node_modules', 'webpack-dev-middleware', 'lib', 'util.js');

if (!fs.existsSync(utilPath)) {
  process.exit(0);
}

const source = fs.readFileSync(utilPath, 'utf8');
const needle = "    res.setHeader('Accept-Ranges', 'bytes');\n\n    if (req.headers.range) {";
const replacement = "    res.setHeader('Accept-Ranges', 'bytes');\n\n    if (!content || !req.headers) {\n      return content;\n    }\n\n    if (req.headers.range) {";

if (source.includes(replacement)) {
  process.exit(0);
}

if (source.includes(needle)) {
  fs.writeFileSync(utilPath, source.replace(needle, replacement));
  console.log('Patched webpack-dev-middleware range handling for Angular 9 Karma tests.');
}
