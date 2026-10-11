import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const configUrl = new URL("../release.config.json", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));
const dictionary = JSON.parse(await readFile(new URL("../locales/zh-CN.json", import.meta.url), "utf8"));
if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) {
  throw new Error("词典必须为 JSON 对象");
}
const entries = Object.entries(dictionary);
if (entries.length < 20 || entries.length > 5000) throw new Error("词典条数超出范围");
for (const [key, value] of entries) {
  if (!key.trim() || key.length > 4000 || typeof value !== "string" || !value.trim()
    || value.length > 8000 || ["__proto__", "prototype", "constructor"].includes(key)) {
    throw new Error("词典中存在无效条目");
  }
}
const sortedEntries = entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
const fingerprint = createHash("sha256")
  .update(JSON.stringify(Object.fromEntries(sortedEntries)))
  .digest("hex");
if (fingerprint === config.dictionarySha256) {
  console.log("词典没有变化，版本保持不变。");
} else {
  if (!Number.isSafeInteger(config.dictionaryRevision + 1)) {
    throw new Error("版本号超出安全整数范围");
  }
  config.dictionaryRevision += 1;
  config.dictionarySha256 = fingerprint;
  await writeFile(configUrl, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log("已递增词典 revision：" + config.dictionaryRevision);
  console.log("下一步：npm run build && npm test，并提交词典、配置与全部生成产物。");
}
