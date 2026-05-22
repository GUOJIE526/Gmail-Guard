import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const extensionDir = path.join(root, "extension");
const manifestPath = path.join(extensionDir, "manifest.json");

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

if (!fs.existsSync(manifestPath)) fail("missing extension/manifest.json");

const manifest = readJson(manifestPath);

if (manifest.manifest_version !== 3) fail("manifest_version must be 3");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) fail("version must be x.y.z");
if (!manifest.name || manifest.name.length > 75) fail("manifest name is missing or too long");

const permissions = manifest.permissions || [];
const allowedPermissions = new Set(["storage"]);
for (const permission of permissions) {
  if (!allowedPermissions.has(permission)) fail(`unexpected permission: ${permission}`);
}

if (manifest.host_permissions && manifest.host_permissions.length > 0) {
  fail("host_permissions should not be declared; content script match is enough for this release");
}

const scripts = manifest.content_scripts || [];
if (scripts.length !== 1) fail("expected exactly one content script declaration");
const matches = scripts[0].matches || [];
if (matches.length !== 1 || matches[0] !== "https://mail.google.com/*") {
  fail("content script must be limited to https://mail.google.com/*");
}

for (const size of [16, 32, 48, 128]) {
  const iconPath = path.join(extensionDir, "assets", `icon-${size}.png`);
  if (!fs.existsSync(iconPath)) fail(`missing icon-${size}.png; run npm run icons`);
}

const textFiles = walk(extensionDir).filter((file) => /\.(js|html|css|json)$/i.test(file));
for (const filePath of textFiles) {
  const text = fs.readFileSync(filePath, "utf8");
  const rel = path.relative(extensionDir, filePath);

  if (/script\s+[^>]*src=["']https?:\/\//i.test(text)) fail(`remote script source in ${rel}`);
  if (/\beval\s*\(/.test(text)) fail(`eval usage in ${rel}`);
  if (/\bnew\s+Function\s*\(/.test(text)) fail(`new Function usage in ${rel}`);
  if (/chrome\.tabs\b/.test(text)) fail(`tabs API usage in ${rel}`);
  if (/chrome\.scripting\b/.test(text)) fail(`scripting API usage in ${rel}`);
  if (/chrome\.identity\b/.test(text)) fail(`identity API usage in ${rel}`);
  if (/\bfetch\s*\(/.test(text) || /\bXMLHttpRequest\b/.test(text)) fail(`network request API usage in ${rel}`);
}

console.log("Extension validation passed.");
