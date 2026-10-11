import { existsSync } from "node:fs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const entryFile = path.join(rootDir, "src", "main.ts");
const outputFile = path.join(rootDir, "dist", "tailscale-chinese.user.js");
const packageJson = JSON.parse(
  await readFile(path.join(rootDir, "package.json"), "utf8"),
);
const releaseConfig = JSON.parse(
  await readFile(path.join(rootDir, "release.config.json"), "utf8"),
);
const dictionary = JSON.parse(
  await readFile(path.join(rootDir, "locales/zh-CN.json"), "utf8"),
);
const rules = JSON.parse(
  await readFile(path.join(rootDir, "locales/rules.json"), "utf8"),
);

const importFromPattern =
  /^\s*import\s+(type\s+)?([^'";]+?)\s+from\s+["'](.+?)["'];?\s*$/gm;
const bareImportPattern = /^\s*import\s+["'](.+?)["'];?\s*$/gm;
const exportFunctionPattern =
  /^\s*export\s+(async\s+function|function)\s+([A-Za-z0-9_$]+)\s*\(/gm;
const exportClassPattern =
  /^\s*export\s+class\s+([A-Za-z0-9_$]+)\s*/gm;
const exportValuePattern =
  /^\s*export\s+(const|let|var)\s+([A-Za-z0-9_$]+)\s*=/gm;
const exportListPattern = /^\s*export\s*\{([^}]+)\};?\s*$/gm;

await buildUserscript();

async function buildUserscript() {
  const orderedFiles = [];
  await collectModuleGraph(entryFile, orderedFiles, new Set());

  const bundledModules = [];
  for (const filePath of orderedFiles) {
    const transformed = await transformModule(filePath);
    bundledModules.push(
      `${JSON.stringify(toModuleId(filePath))}: (module, exports, require) => {\n${indent(
        transformed,
        4,
      )}\n    }`,
    );
  }

  // 在线词典 envelope：schemaVersion + revision + entries + dictionary + rules。
  const envelope = {
    schemaVersion: 1,
    revision: releaseConfig.dictionaryRevision,
    entries: Object.keys(dictionary).length,
    dictionary,
    rules,
  };
  const onlineJson = JSON.stringify(envelope, null, 2) + "\n";
  await writeFile(path.join(rootDir, "locales/zh-CN.online.json"), onlineJson, "utf8");

  const bundle = `${createUserscriptHeader()}
(() => {
  const modules = {
${indent(bundledModules.join(",\n"), 4)}
  };

  const cache = {};

  const require = (id) => {
    if (cache[id]) {
      return cache[id].exports;
    }

    if (!modules[id]) {
      throw new Error(\`Unknown module: \${id}\`);
    }

    const module = { exports: {} };
    cache[id] = module;
    modules[id](module, module.exports, require);
    return module.exports;
  };

  require(${JSON.stringify(toModuleId(entryFile))});
})();
`;

  const sources = [
    "https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/locales/zh-CN.online.json",
    "https://cdn.jsdelivr.net/gh/isdoge/tailscale-chinese@main/locales/zh-CN.online.json",
    "https://raw.githubusercontent.com/isdoge/tailscale-chinese/v" + packageJson.version + "/locales/zh-CN.online.json",
  ];
  const finalBundle = bundle
    .replace('"__SCRIPT_VERSION__"', JSON.stringify(packageJson.version))
    .replace("__DICTIONARY_SOURCES__", JSON.stringify(sources));

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, finalBundle, "utf8");
  console.log(`Built ${path.relative(rootDir, outputFile)}（词典 revision ${releaseConfig.dictionaryRevision}，${envelope.entries} 条）`);
}

async function collectModuleGraph(filePath, orderedFiles, visited) {
  if (visited.has(filePath)) {
    return;
  }

  visited.add(filePath);
  const source = await readFile(filePath, "utf8");
  const dependencies = collectDependencies(source, filePath);

  for (const dependency of dependencies) {
    await collectModuleGraph(dependency, orderedFiles, visited);
  }

  orderedFiles.push(filePath);
}

function collectDependencies(source, importerPath) {
  const dependencies = new Set();

  for (const match of source.matchAll(importFromPattern)) {
    const [, typeModifier, , specifier] = match;
    if (typeModifier || !specifier.startsWith(".")) {
      continue;
    }

    dependencies.add(resolveLocalModule(importerPath, specifier));
  }

  for (const match of source.matchAll(bareImportPattern)) {
    const [, specifier] = match;
    if (!specifier.startsWith(".")) {
      continue;
    }

    dependencies.add(resolveLocalModule(importerPath, specifier));
  }

  return [...dependencies];
}

async function transformModule(filePath) {
  const source = await readFile(filePath, "utf8");
  let code = stripTypeScriptTypes(source, { mode: "transform" });
  const exportedNames = [];

  code = code.replace(importFromPattern, (_, typeModifier, bindings, specifier) => {
    if (typeModifier) {
      return "";
    }

    const requiredId = specifier.startsWith(".")
      ? toModuleId(resolveLocalModule(filePath, specifier))
      : specifier;

    return `const ${bindings.trim()} = require(${JSON.stringify(requiredId)});`;
  });

  code = code.replace(bareImportPattern, (_, specifier) => {
    const requiredId = specifier.startsWith(".")
      ? toModuleId(resolveLocalModule(filePath, specifier))
      : specifier;

    return `require(${JSON.stringify(requiredId)});`;
  });

  code = code.replace(exportFunctionPattern, (_, kind, name) => {
    exportedNames.push(name);
    return `${kind} ${name}(`;
  });

  code = code.replace(exportClassPattern, (_, name) => {
    exportedNames.push(name);
    return `class ${name} `;
  });

  code = code.replace(exportValuePattern, (_, keyword, name) => {
    exportedNames.push(name);
    return `${keyword} ${name} =`;
  });

  code = code.replace(exportListPattern, (_, names) => {
    const entries = names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    for (const entry of entries) {
      const [originalName, aliasName] = entry.split(/\s+as\s+/);
      exportedNames.push((aliasName ?? originalName).trim());
    }

    return "";
  });

  const exportObject = [...new Set(exportedNames)].join(", ");
  return `${code.trimEnd()}\n\nmodule.exports = { ${exportObject} };`;
}

function resolveLocalModule(importerPath, specifier) {
  const importerDir = path.dirname(importerPath);
  const basePath = path.resolve(importerDir, specifier);
  const candidates = basePath.endsWith(".ts")
    ? [basePath]
    : [`${basePath}.ts`, path.join(basePath, "index.ts")];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Cannot resolve ${specifier} from ${importerPath}`);
}

function createUserscriptHeader() {
  const userscript = packageJson.userscript ?? {};
  const lines = [
    "// ==UserScript==",
    formatHeaderLine("name", userscript.displayName ?? packageJson.name),
    formatHeaderLine("namespace", userscript.namespace ?? packageJson.name),
    formatHeaderLine("version", packageJson.version ?? "0.0.0"),
    formatHeaderLine("description", userscript.description ?? packageJson.description ?? packageJson.name),
    formatHeaderLine("author", userscript.author ?? "unknown"),
    ...(userscript.matches ?? []).map((value) => formatHeaderLine("match", value)),
    ...(userscript.grants ?? []).map((value) => formatHeaderLine("grant", value)),
    ...(userscript.connect ?? []).map((value) => formatHeaderLine("connect", value)),
    formatOptionalHeaderLine("icon", userscript.icon),
    formatOptionalHeaderLine("homepageURL", userscript.homepageURL),
    formatOptionalHeaderLine("supportURL", userscript.supportURL),
    formatOptionalHeaderLine("updateURL", userscript.updateURL),
    formatOptionalHeaderLine("downloadURL", userscript.downloadURL),
    formatHeaderLine("run-at", userscript.runAt ?? "document-idle"),
    "// ==/UserScript==",
  ].filter(Boolean);

  return lines.join("\n");
}

function formatHeaderLine(key, value) {
  return `// @${key.padEnd(12, " ")} ${value}`;
}

function formatOptionalHeaderLine(key, value) {
  if (!value) {
    return "";
  }

  return formatHeaderLine(key, value);
}

function indent(value, spaces) {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join("\n");
}

function toModuleId(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}
