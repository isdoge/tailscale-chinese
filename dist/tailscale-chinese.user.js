// ==UserScript==
// @name         Tailscale 中文化插件
// @namespace    https://github.com/isdoge/tailscale-chinese
// @version      1.0.2
// @description  中文化 Tailscale 管理控制台界面的部分菜单及内容。
// @author       狗带带子
// @match        https://tailscale.com/*
// @match        https://*.tailscale.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @icon         https://ts2.tc.mm.bing.net/th/id/ODF.MtiBxHB4UlSlj9Wx-6fUYA?w=32&h=32&qlt=90&pcl=fffffc&o=6&pid=1.2
// @homepageURL  https://github.com/isdoge/tailscale-chinese
// @supportURL   https://github.com/isdoge/tailscale-chinese/issues
// @updateURL    https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js
// @downloadURL  https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/dist/tailscale-chinese.user.js
// @run-at       document-idle
// ==/UserScript==
(() => {
  const modules = {
    "src/core/admin-layout.ts": (module, exports, require) => {
        const LAYOUT_STYLE_ID = "tailscale-chinese-layout";
        const NOWRAP_MARKER = "data-tailscale-zh-nowrap";
        const COMPACT_BUTTON_LABELS = new Set([
            "分享…",
            "设备设置"
        ]);
        function getDocumentHead() {
            return typeof document !== "undefined" ? document.head : null;
        }
        function getElementById(id) {
            if (typeof document === "undefined" || typeof document.getElementById !== "function") {
                return null;
            }
            return document.getElementById(id);
        }
        function ensureLayoutStyle() {
            if (getElementById(LAYOUT_STYLE_ID)) {
                return;
            }
            const head = getDocumentHead();
            if (!head) {
                return;
            }
            const style = document.createElement("style");
            style.id = LAYOUT_STYLE_ID;
            style.textContent = `
            button[${NOWRAP_MARKER}] {
              white-space: nowrap;
            }
          `;
            head.appendChild(style);
        }
        function clearCompactButtonLayout() {
            getElementById(LAYOUT_STYLE_ID)?.remove();
            if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
                return;
            }
            for (const button of document.querySelectorAll(`button[${NOWRAP_MARKER}]`)){
                button.removeAttribute(NOWRAP_MARKER);
            }
        }
        function applyCompactButtonLayout() {
            ensureLayoutStyle();
            if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
                return;
            }
            for (const button of document.querySelectorAll("button")){
                const label = button.textContent?.trim();
                if (!label || !COMPACT_BUTTON_LABELS.has(label)) {
                    continue;
                }
                button.setAttribute(NOWRAP_MARKER, "");
            }
        }
        function syncAdminNavigationLayout(enabled) {
            if (!enabled) {
                clearCompactButtonLayout();
                return;
            }
            applyCompactButtonLayout();
        }

        module.exports = { syncAdminNavigationLayout };
        },
    "src/state/language.ts": (module, exports, require) => {
        const STORAGE_KEY = "tailscale-chinese:language";
        const DEFAULT_LANGUAGE = "zh-CN";
        function getLanguagePreference() {
            try {
                if (typeof globalThis.GM_getValue === "function") {
                    return normalizeLanguagePreference(globalThis.GM_getValue(STORAGE_KEY, DEFAULT_LANGUAGE));
                }
                return normalizeLanguagePreference(globalThis.localStorage?.getItem(STORAGE_KEY));
            } catch  {
                return DEFAULT_LANGUAGE;
            }
        }
        function setLanguagePreference(nextLanguage) {
            const language = normalizeLanguagePreference(nextLanguage);
            if (typeof globalThis.GM_setValue === "function") {
                globalThis.GM_setValue(STORAGE_KEY, language);
                return language;
            }
            globalThis.localStorage?.setItem(STORAGE_KEY, language);
            return language;
        }
        function normalizeLanguagePreference(value) {
            return value === "en" ? "en" : DEFAULT_LANGUAGE;
        }

        module.exports = { getLanguagePreference, setLanguagePreference };
        },
    "src/core/control.ts": (module, exports, require) => {
        const { getLanguagePreference, setLanguagePreference } = require("src/state/language.ts");
        function getLocalControlWindow() {
            return globalThis;
        }
        function installControl(rerun) {
            const api = {
                getLanguage () {
                    return getLanguagePreference();
                },
                setLanguage (nextLanguage) {
                    const language = setLanguagePreference(nextLanguage);
                    rerun();
                    return language;
                },
                rerun
            };
            getLocalControlWindow().__tailscaleChinese = api;
            return api;
        }
        function uninstallLegacyControl() {
            const exposedWindow = globalThis;
            const legacyWindow = exposedWindow.unsafeWindow;
            if (!legacyWindow || legacyWindow === exposedWindow) {
                return;
            }
            try {
                delete legacyWindow.__tailscaleChinese;
            } catch  {
                legacyWindow.__tailscaleChinese = undefined;
            }
        }

        module.exports = { installControl, uninstallLegacyControl };
        },
    "src/core/navigation.ts": (module, exports, require) => {
        function observeNavigation(onNavigate) {
            let currentUrl = window.location.href;
            const notifyIfChanged = ()=>{
                const nextUrl = window.location.href;
                if (nextUrl === currentUrl) {
                    return;
                }
                currentUrl = nextUrl;
                onNavigate();
            };
            const originalPushState = window.history.pushState.bind(window.history);
            const originalReplaceState = window.history.replaceState.bind(window.history);
            window.history.pushState = (...args)=>{
                const result = originalPushState(...args);
                notifyIfChanged();
                return result;
            };
            window.history.replaceState = (...args)=>{
                const result = originalReplaceState(...args);
                notifyIfChanged();
                return result;
            };
            window.addEventListener("popstate", notifyIfChanged);
            window.addEventListener("hashchange", notifyIfChanged);
            return ()=>{
                window.history.pushState = originalPushState;
                window.history.replaceState = originalReplaceState;
                window.removeEventListener("popstate", notifyIfChanged);
                window.removeEventListener("hashchange", notifyIfChanged);
            };
        }

        module.exports = { observeNavigation };
        },
    "src/utils/log.ts": (module, exports, require) => {
        const LOG_PREFIX = "[tailscale-chinese]";
        function log(message, extra) {
            if (typeof extra === "undefined") {
                console.info(LOG_PREFIX, message);
                return;
            }
            console.info(LOG_PREFIX, message, extra);
        }

        module.exports = { log };
        },
    "src/core/remote-dictionary.ts": (module, exports, require) => {
        const { log } = require("src/utils/log.ts");
        const SCRIPT_NAME = "Tailscale Chinese";
        const SCRIPT_VERSION = "1.0.2";
        const DICTIONARY_SOURCES = ["https://raw.githubusercontent.com/isdoge/tailscale-chinese/main/locales/zh-CN.online.json","https://cdn.jsdelivr.net/gh/isdoge/tailscale-chinese@main/locales/zh-CN.online.json","https://raw.githubusercontent.com/isdoge/tailscale-chinese/v1.0.2/locales/zh-CN.online.json"];
        const DICTIONARY_CACHE_KEY = "tailscale-zh-remote-dictionary-v1";
        const DICTIONARY_MAX_BYTES = 800_000;
        const LOCK_NAME = "tailscale-zh-dictionary-commit-v1";
        let currentRevision = 0;
        let currentSignature = null;
        let exactText = {};
        let remoteRules = {
            regexText: [],
            attr: []
        };
        let dictionarySource = "none";
        let dictionaryRequest = null;
        function dictionarySignature(entries) {
            return JSON.stringify(entries.slice().sort(([a], [b])=>a < b ? -1 : a > b ? 1 : 0));
        }
        function signatureOf(dictionary) {
            return dictionarySignature(Object.entries(dictionary));
        }
        function parseDictionary(raw) {
            if (typeof raw !== "string" || raw.length > DICTIONARY_MAX_BYTES) return null;
            try {
                const bytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(raw).length : encodeURIComponent(raw).replace(/%[\dA-F]{2}/g, "x").length;
                if (bytes > DICTIONARY_MAX_BYTES) return null;
                const data = JSON.parse(raw);
                if (!data || typeof data !== "object" || Array.isArray(data)) return null;
                if (data.schemaVersion !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 1 || !Number.isSafeInteger(data.entries)) return null;
                const dictionary = data.dictionary;
                const rules = data.rules;
                if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) return null;
                if (!rules || typeof rules !== "object" || Array.isArray(rules) || !Array.isArray(rules.regexText) || !Array.isArray(rules.attr)) return null;
                const entries = Object.entries(dictionary);
                if (entries.length < 20 || entries.length > 5000) return null;
                if (data.entries !== entries.length) return null;
                for (const [key, value] of entries){
                    if (!key.trim() || key.length > 4000 || typeof value !== "string" || !value.trim() || value.length > 8000 || [
                        "__proto__",
                        "prototype",
                        "constructor"
                    ].includes(key)) return null;
                }
                const serialized = JSON.stringify({
                    schemaVersion: 1,
                    revision: data.revision,
                    entries: entries.length,
                    dictionary,
                    rules
                });
                return {
                    revision: data.revision,
                    dictionary: dictionary,
                    rules: rules,
                    signature: signatureOf(dictionary),
                    serialized
                };
            } catch  {
                return null;
            }
        }
        function canApply(parsed) {
            if (parsed.revision < currentRevision) return false;
            if (parsed.revision !== currentRevision) return true;
            return currentSignature === null || parsed.signature === currentSignature;
        }
        function apply(parsed, source) {
            exactText = parsed.dictionary;
            remoteRules = parsed.rules;
            currentRevision = parsed.revision;
            currentSignature = parsed.signature;
            dictionarySource = source;
        }
        function readStored(key) {
            try {
                if (typeof globalThis.GM_getValue === "function") {
                    return globalThis.GM_getValue(key, "");
                }
            } catch  {}
            return "";
        }
        function loadCached() {
            const saved = parseDictionary(readStored(DICTIONARY_CACHE_KEY));
            if (!saved) return;
            if (canApply(saved)) apply(saved, "cache");
        }
        function requestSource(baseUrl, force) {
            return new Promise((resolve, reject)=>{
                if (typeof globalThis.GM_xmlhttpRequest !== "function") {
                    reject(new Error("GM_xmlhttpRequest 不可用"));
                    return;
                }
                globalThis.GM_xmlhttpRequest({
                    method: "GET",
                    url: baseUrl + (force ? "?refresh=" + Date.now() : ""),
                    timeout: 8000,
                    anonymous: true,
                    headers: {
                        Accept: "application/json"
                    },
                    onload (response) {
                        if (response.status !== 200) {
                            reject(new Error("HTTP " + response.status));
                            return;
                        }
                        resolve(response.responseText);
                    },
                    onerror () {
                        reject(new Error("词典请求失败"));
                    },
                    ontimeout () {
                        reject(new Error("词典请求超时"));
                    },
                    onabort () {
                        reject(new Error("词典请求已取消"));
                    }
                });
            });
        }
        function syncShared(strict = false) {
            let raw = "";
            try {
                raw = typeof globalThis.GM_getValue === "function" ? globalThis.GM_getValue(DICTIONARY_CACHE_KEY, "") : "";
            } catch  {
                return;
            }
            const shared = parseDictionary(raw);
            if (!shared || shared.revision < currentRevision) return;
            if (shared.revision === currentRevision) {
                if (strict && shared.signature !== currentSignature) {
                    throw new Error("同版本词典内容冲突");
                }
                return;
            }
            if (canApply(shared)) apply(shared, "cache");
        }
        async function persist(parsed, source) {
            if (typeof navigator === "undefined" || !navigator.locks?.request) {
                throw new Error("浏览器不支持安全的跨标签页词典更新");
            }
            await navigator.locks.request(LOCK_NAME, {
                mode: "exclusive"
            }, async ()=>{
                syncShared(true);
                if (!canApply(parsed)) {
                    throw new Error("词典版本冲突");
                }
                globalThis.GM_setValue(DICTIONARY_CACHE_KEY, parsed.serialized);
                apply(parsed, source);
            });
        }
        async function requestDictionary(force) {
            for (const url of DICTIONARY_SOURCES){
                let parsed;
                try {
                    parsed = parseDictionary(await requestSource(url, force));
                } catch  {
                    continue;
                }
                if (!parsed || !canApply(parsed)) continue;
                try {
                    await persist(parsed, "remote");
                    return;
                } catch (error) {
                    if (error.code === "DICTIONARY_VERSION_CONFLICT" || error.message === "词典版本冲突") {
                        continue;
                    }
                    throw error;
                }
            }
            throw new Error("全部词典来源不可用或版本无效");
        }
        async function refreshDictionary() {
            if (dictionaryRequest) return dictionaryRequest;
            try {
                syncShared();
            } catch  {}
            dictionaryRequest = (async ()=>{
                try {
                    await requestDictionary(false);
                    log(`词典同步成功：${Object.keys(exactText).length} 条`);
                    return true;
                } catch  {
                    log("词典更新失败，继续使用当前词典");
                    return false;
                }
            })();
            try {
                return await dictionaryRequest;
            } finally{
                dictionaryRequest = null;
            }
        }
        function getDictionaryStatus() {
            return {
                version: SCRIPT_VERSION,
                revision: currentRevision,
                source: dictionarySource,
                entries: Object.keys(exactText).length
            };
        }
        function getRemoteRules() {
            return remoteRules;
        }
        function getExactText() {
            return exactText;
        }
        function setupDictionaryMenu() {
            const register = (name, callback)=>{
                try {
                    globalThis.GM_registerMenuCommand?.(name, callback);
                } catch  {}
            };
            register("立即更新中文词典", ()=>{
                void refreshDictionary().then((ok)=>{
                    window.alert(ok ? "中文词典已更新。" : "未能更新，已保留当前词典。请稍后重试。");
                });
            });
            register("查看词典状态", ()=>{
                const status = getDictionaryStatus();
                const sources = {
                    cache: "本地缓存",
                    remote: "在线更新",
                    none: "未加载"
                };
                window.alert(`脚本版本：${status.version}\n词典版本：${status.revision}` + `\n来源：${sources[status.source]}\n有效条目：${status.entries}`);
            });
        }
        function initRemoteDictionary(onLoaded) {
            loadCached();
            setupDictionaryMenu();
            void refreshDictionary().then((ok)=>{
                if (ok && onLoaded) onLoaded();
            });
        }

        module.exports = { refreshDictionary, getDictionaryStatus, getRemoteRules, getExactText, setupDictionaryMenu, initRemoteDictionary };
        },
    "src/dicts/index.ts": (module, exports, require) => {
        const { getExactText, getRemoteRules } = require("src/core/remote-dictionary.ts");
        const sharedRules = [];
        function rebuildSharedRules() {
            sharedRules.length = 0;
            for (const [from, to] of Object.entries(getExactText())){
                sharedRules.push({
                    kind: "text",
                    match: "exact",
                    from,
                    to
                });
            }
            for (const rule of getRemoteRules().regexText){
                sharedRules.push({
                    kind: "text",
                    match: "regex",
                    pattern: rule.pattern,
                    flags: rule.flags,
                    replace: rule.replace
                });
            }
            for (const rule of getRemoteRules().attr){
                if (rule.match === "exact" && rule.from && rule.to) {
                    sharedRules.push({
                        kind: "attr",
                        match: "exact",
                        selector: rule.selector,
                        attr: rule.attr,
                        from: rule.from,
                        to: rule.to
                    });
                } else if (rule.match === "regex" && rule.pattern && rule.replace) {
                    sharedRules.push({
                        kind: "attr",
                        match: "regex",
                        selector: rule.selector,
                        attr: rule.attr,
                        pattern: rule.pattern,
                        flags: rule.flags || undefined,
                        replace: rule.replace
                    });
                }
            }
            return sharedRules;
        }

        module.exports = { rebuildSharedRules, sharedRules };
        },
    "src/core/page-detector.ts": (module, exports, require) => {
        const { sharedRules } = require("src/dicts/index.ts");
        function resolveRules(_pathname) {
            return sharedRules;
        }

        module.exports = { resolveRules };
        },
    "src/core/observer.ts": (module, exports, require) => {
        const OBSERVED_ATTRIBUTES = [
            "aria-label",
            "title",
            "placeholder",
            "data-content"
        ];
        function observeDocument(onMutation) {
            if (!document.body) {
                return null;
            }
            let scheduled = false;
            const observer = new MutationObserver(()=>{
                if (scheduled) {
                    return;
                }
                scheduled = true;
                requestAnimationFrame(()=>{
                    scheduled = false;
                    onMutation();
                });
            });
            const observe = ()=>{
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    attributes: true,
                    attributeFilter: OBSERVED_ATTRIBUTES
                });
            };
            observe();
            return {
                disconnect () {
                    observer.disconnect();
                },
                reconnect () {
                    observer.disconnect();
                    observe();
                }
            };
        }

        module.exports = { observeDocument };
        },
    "src/core/matcher.ts": (module, exports, require) => {
        function applyTextRules(originalText, rules) {
            for (const rule of rules){
                const nextText = applyTextRule(originalText, rule);
                if (nextText && nextText !== originalText) {
                    return nextText;
                }
            }
            return null;
        }
        function applyAttrRule(originalValue, rule) {
            if (rule.match === "exact") {
                return originalValue === rule.from ? rule.to : null;
            }
            const pattern = new RegExp(rule.pattern, rule.flags);
            return pattern.test(originalValue) ? originalValue.replace(pattern, rule.replace) : null;
        }
        function applyTextRule(originalText, rule) {
            if (rule.match === "exact") {
                const trimmedText = originalText.trim();
                if (trimmedText !== rule.from) {
                    return null;
                }
                return originalText.replace(trimmedText, rule.to);
            }
            const pattern = new RegExp(rule.pattern, rule.flags);
            return pattern.test(originalText) ? originalText.replace(pattern, rule.replace) : null;
        }

        module.exports = { applyTextRules, applyAttrRule };
        },
    "src/core/originals.ts": (module, exports, require) => {
        const textSnapshots = new WeakMap();
        const attrSnapshots = new WeakMap();
        const SKIP_TRANSLATION = Symbol("skip-translation");
        function isSkipTranslation(value) {
            return value === SKIP_TRANSLATION;
        }
        function isTextAlreadyTranslated(node) {
            const snapshot = textSnapshots.get(node);
            if (!snapshot || snapshot.translated === null) {
                return false;
            }
            return (node.textContent ?? "") === snapshot.translated;
        }
        function prepareTextSource(node) {
            const currentText = node.textContent ?? "";
            const snapshot = textSnapshots.get(node);
            if (!snapshot) {
                return currentText;
            }
            if (isTextAlreadyTranslated(node)) {
                return SKIP_TRANSLATION;
            }
            if (currentText !== snapshot.original) {
                snapshot.original = currentText;
                snapshot.translated = null;
            }
            return node.textContent ?? "";
        }
        function hasGroupedDrift(groupedNodes) {
            return groupedNodes.some((node)=>{
                const current = node.textContent ?? "";
                const snapshot = textSnapshots.get(node);
                if (!snapshot || snapshot.translated === null) {
                    return false;
                }
                if (current === snapshot.translated) {
                    return false;
                }
                if (current === "" && snapshot.translated === "") {
                    return false;
                }
                return true;
            });
        }
        function getGroupedFragmentSources(groupedNodes) {
            return groupedNodes.map((node)=>{
                const current = node.textContent ?? "";
                const snapshot = textSnapshots.get(node);
                if (current.length > 0 && current !== snapshot?.translated) {
                    return current;
                }
                return snapshot?.original ?? current;
            });
        }
        function buildGroupedSource(groupedNodes) {
            if (!hasGroupedDrift(groupedNodes)) {
                return groupedNodes.map((node)=>node.textContent ?? "").join("");
            }
            return getGroupedFragmentSources(groupedNodes).join("");
        }
        function rememberTextTranslation(node, originalText, translatedText) {
            textSnapshots.set(node, {
                original: originalText,
                translated: translatedText
            });
        }
        function restoreTextNode(node) {
            const snapshot = textSnapshots.get(node);
            if (!snapshot) {
                return false;
            }
            const currentText = node.textContent ?? "";
            if (snapshot.translated !== null && currentText === snapshot.translated) {
                node.textContent = snapshot.original;
                snapshot.translated = null;
                return true;
            }
            if (currentText !== snapshot.original) {
                snapshot.original = currentText;
                snapshot.translated = null;
            }
            return false;
        }
        function prepareAttributeSource(element, attributeName) {
            const currentValue = element.getAttribute(attributeName);
            if (currentValue === null) {
                return null;
            }
            const attributeMap = attrSnapshots.get(element);
            const snapshot = attributeMap?.get(attributeName);
            if (!snapshot) {
                return currentValue;
            }
            if (snapshot.translated !== null && currentValue === snapshot.translated) {
                return SKIP_TRANSLATION;
            }
            if (currentValue !== snapshot.original) {
                snapshot.original = currentValue;
                snapshot.translated = null;
            }
            return element.getAttribute(attributeName);
        }
        function rememberAttributeTranslation(element, attributeName, originalValue, translatedValue) {
            const attributeMap = ensureAttributeMap(element);
            attributeMap.set(attributeName, {
                original: originalValue,
                translated: translatedValue
            });
        }
        function restoreTrackedAttributes(element) {
            const attributeMap = attrSnapshots.get(element);
            if (!attributeMap) {
                return 0;
            }
            let restoredCount = 0;
            for (const [attributeName, snapshot] of attributeMap.entries()){
                const currentValue = element.getAttribute(attributeName);
                if (snapshot.translated !== null && currentValue === snapshot.translated) {
                    setAttributeValue(element, attributeName, snapshot.original);
                    snapshot.translated = null;
                    restoredCount += 1;
                    continue;
                }
                if (currentValue !== snapshot.original) {
                    snapshot.original = currentValue;
                    snapshot.translated = null;
                }
            }
            return restoredCount;
        }
        function ensureAttributeMap(element) {
            const existingMap = attrSnapshots.get(element);
            if (existingMap) {
                return existingMap;
            }
            const nextMap = new Map();
            attrSnapshots.set(element, nextMap);
            return nextMap;
        }
        function setAttributeValue(element, attributeName, value) {
            if (value === null) {
                element.removeAttribute(attributeName);
                return;
            }
            element.setAttribute(attributeName, value);
        }

        module.exports = { isSkipTranslation, isTextAlreadyTranslated, prepareTextSource, hasGroupedDrift, getGroupedFragmentSources, buildGroupedSource, rememberTextTranslation, restoreTextNode, prepareAttributeSource, rememberAttributeTranslation, restoreTrackedAttributes, SKIP_TRANSLATION };
        },
    "src/utils/dom.ts": (module, exports, require) => {
        function walkTextNodes(root, options = {}) {
            const { includeEmpty = false } = options;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode (node) {
                    if (!includeEmpty && (!node.textContent || node.textContent.trim().length === 0)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const parent = node.parentElement;
                    if (!parent) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if ([
                        "SCRIPT",
                        "STYLE",
                        "NOSCRIPT"
                    ].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });
            const textNodes = [];
            let currentNode = walker.nextNode();
            while(currentNode){
                textNodes.push(currentNode);
                currentNode = walker.nextNode();
            }
            return textNodes;
        }
        function selectElements(root, selector) {
            const results = [];
            if (typeof root.matches === "function" && root.matches(selector)) {
                results.push(root);
            }
            if (typeof root.querySelectorAll !== "function") {
                return results;
            }
            results.push(...root.querySelectorAll(selector));
            return results;
        }
        function walkElements(root) {
            return selectElements(root, "*");
        }

        module.exports = { walkTextNodes, selectElements, walkElements };
        },
    "src/core/translator.ts": (module, exports, require) => {
        const { applyAttrRule, applyTextRules } = require("src/core/matcher.ts");
        const { buildGroupedSource, getGroupedFragmentSources, hasGroupedDrift, isSkipTranslation, isTextAlreadyTranslated, prepareAttributeSource, prepareTextSource, rememberAttributeTranslation, rememberTextTranslation, restoreTextNode, restoreTrackedAttributes, SKIP_TRANSLATION } = require("src/core/originals.ts");
        const { selectElements, walkElements, walkTextNodes } = require("src/utils/dom.ts");
        function translateDocument(root, rules) {
            if (!root) {
                return 0;
            }
            const textRules = rules.filter((rule)=>rule.kind === "text");
            const attrRules = rules.filter((rule)=>rule.kind === "attr");
            const attrSources = new WeakMap();
            const translatedAttrs = new WeakMap();
            const consumedTextNodes = new WeakSet();
            let changedCount = 0;
            for (const node of walkTextNodes(root)){
                if (consumedTextNodes.has(node)) {
                    continue;
                }
                const groupedNodes = collectTextSiblings(node);
                if (groupedNodes.length > 1) {
                    if (!hasGroupedDrift(groupedNodes) && groupedNodes.every(isTextAlreadyTranslated)) {
                        for (const groupNode of groupedNodes){
                            consumedTextNodes.add(groupNode);
                        }
                        continue;
                    }
                    const groupedSource = buildGroupedSource(groupedNodes);
                    const groupedNext = applyTextRules(groupedSource, textRules);
                    if (groupedNext && groupedNext !== groupedSource) {
                        const fragmentSources = getGroupedFragmentSources(groupedNodes);
                        groupedNodes[0].textContent = groupedNext;
                        rememberTextTranslation(groupedNodes[0], fragmentSources[0], groupedNext);
                        changedCount += 1;
                        for(let index = 1; index < groupedNodes.length; index += 1){
                            const groupNode = groupedNodes[index];
                            groupNode.textContent = "";
                            rememberTextTranslation(groupNode, fragmentSources[index], "");
                            consumedTextNodes.add(groupNode);
                            changedCount += 1;
                        }
                        consumedTextNodes.add(groupedNodes[0]);
                        continue;
                    }
                }
                if (isTextAlreadyTranslated(node)) {
                    consumedTextNodes.add(node);
                    continue;
                }
                const inlineGroup = collectInlineGroup(node);
                if (inlineGroup) {
                    if (inlineGroup.textNodes.every(isTextAlreadyTranslated)) {
                        for (const textNode of inlineGroup.textNodes){
                            consumedTextNodes.add(textNode);
                        }
                        continue;
                    }
                    const inlineSource = buildInlineGroupSource(inlineGroup.segments);
                    if (isSkipTranslation(inlineSource)) {
                        continue;
                    }
                    const inlineNext = applyTextRules(inlineSource, textRules);
                    if (inlineNext && inlineNext !== inlineSource) {
                        if (applyInlineGroupTranslation(inlineGroup.segments, inlineNext)) {
                            for (const textNode of inlineGroup.textNodes){
                                consumedTextNodes.add(textNode);
                            }
                            changedCount += 1;
                            continue;
                        }
                    }
                }
                const originalText = prepareTextSource(node);
                if (isSkipTranslation(originalText)) {
                    continue;
                }
                const nextText = applyTextRules(originalText, textRules);
                if (!nextText || nextText === originalText) {
                    continue;
                }
                node.textContent = nextText;
                rememberTextTranslation(node, originalText, nextText);
                changedCount += 1;
            }
            for (const rule of attrRules){
                for (const element of selectElements(root, rule.selector)){
                    if (hasTranslatedAttribute(translatedAttrs, element, rule.attr)) {
                        continue;
                    }
                    const originalValue = getAttributeSource(attrSources, element, rule.attr);
                    if (originalValue === null) {
                        continue;
                    }
                    const nextValue = applyAttrRule(originalValue, rule);
                    if (!nextValue || nextValue === originalValue) {
                        continue;
                    }
                    element.setAttribute(rule.attr, nextValue);
                    rememberAttributeTranslation(element, rule.attr, originalValue, nextValue);
                    markTranslatedAttribute(translatedAttrs, element, rule.attr);
                    changedCount += 1;
                }
            }
            return changedCount;
        }
        function restoreDocument(root) {
            if (!root) {
                return 0;
            }
            let restoredCount = 0;
            for (const node of walkTextNodes(root, {
                includeEmpty: true
            })){
                restoredCount += restoreTextNode(node) ? 1 : 0;
            }
            for (const element of walkElements(root)){
                restoredCount += restoreTrackedAttributes(element);
            }
            return restoredCount;
        }
        function getAttributeSource(cache, element, attributeName) {
            const cachedAttributes = cache.get(element);
            if (cachedAttributes?.has(attributeName)) {
                return cachedAttributes.get(attributeName) ?? null;
            }
            const originalValue = prepareAttributeSource(element, attributeName);
            if (originalValue === null || isSkipTranslation(originalValue)) {
                return null;
            }
            const nextAttributes = cachedAttributes ?? new Map();
            nextAttributes.set(attributeName, originalValue);
            cache.set(element, nextAttributes);
            return originalValue;
        }
        function hasTranslatedAttribute(cache, element, attributeName) {
            return cache.get(element)?.has(attributeName) ?? false;
        }
        function markTranslatedAttribute(cache, element, attributeName) {
            const translated = cache.get(element) ?? new Set();
            translated.add(attributeName);
            cache.set(element, translated);
        }
        const INLINE_TAGS = new Set([
            "CODE",
            "STRONG",
            "EM",
            "B",
            "I",
            "SPAN",
            "A",
            "SMALL",
            "SUB",
            "SUP",
            "MARK",
            "ABBR",
            "KBD",
            "SAMP",
            "VAR",
            "TIME"
        ]);
        function isInlineElement(node) {
            return node.nodeType === 1 && INLINE_TAGS.has(node.tagName);
        }
        function isIgnorablePrefixNode(node) {
            if (node.nodeType === 3) {
                return (node.textContent ?? "").trim().length === 0;
            }
            return node.nodeType === 1 && isInlineElement(node);
        }
        function collectInlineGroup(node) {
            const parent = node.parentElement ?? node.parentNode;
            if (!parent) {
                return null;
            }
            const siblings = Array.from(parent.childNodes);
            const index = siblings.indexOf(node);
            if (index < 0) {
                return null;
            }
            for(let siblingIndex = 0; siblingIndex < index; siblingIndex += 1){
                const sibling = siblings[siblingIndex];
                if (!sibling || isIgnorablePrefixNode(sibling)) {
                    continue;
                }
                return null;
            }
            const segments = [];
            const textNodes = [];
            let hasInlineElement = false;
            for(let siblingIndex = index; siblingIndex < siblings.length; siblingIndex += 1){
                const sibling = siblings[siblingIndex];
                if (!sibling) {
                    break;
                }
                if (sibling.nodeType === 3) {
                    segments.push({
                        kind: "text",
                        node: sibling
                    });
                    textNodes.push(sibling);
                    continue;
                }
                if (sibling.nodeType === 1 && sibling.tagName === "BR") {
                    segments.push({
                        kind: "break"
                    });
                    continue;
                }
                if (isInlineElement(sibling)) {
                    hasInlineElement = true;
                    segments.push({
                        kind: "inline",
                        value: sibling.textContent ?? ""
                    });
                    continue;
                }
                break;
            }
            if (!hasInlineElement || segments.length < 2) {
                return null;
            }
            return {
                segments,
                textNodes
            };
        }
        function buildInlineGroupSource(segments) {
            let source = "";
            for (const segment of segments){
                if (segment.kind === "break") {
                    source += " ";
                    continue;
                }
                if (segment.kind === "text") {
                    const textSource = prepareTextSource(segment.node);
                    if (isSkipTranslation(textSource)) {
                        return SKIP_TRANSLATION;
                    }
                    source += textSource;
                    continue;
                }
                source += segment.value;
            }
            return source.replace(/\s+/g, " ").trim();
        }
        function applyInlineGroupTranslation(segments, translated) {
            const inlineValues = segments.filter((segment)=>segment.kind === "inline").map((segment)=>segment.value);
            const textSegments = segments.filter((segment)=>segment.kind === "text");
            let remainder = translated;
            const textParts = [];
            for (const inlineValue of inlineValues){
                const inlineIndex = remainder.indexOf(inlineValue);
                if (inlineIndex < 0) {
                    return false;
                }
                textParts.push(remainder.slice(0, inlineIndex));
                remainder = remainder.slice(inlineIndex + inlineValue.length);
            }
            textParts.push(remainder);
            if (textParts.length !== textSegments.length) {
                return false;
            }
            for(let index = 0; index < textSegments.length; index += 1){
                const segment = textSegments[index];
                const originalText = prepareTextSource(segment.node);
                const nextText = textParts[index];
                if (nextText === originalText) {
                    continue;
                }
                segment.node.textContent = nextText;
                rememberTextTranslation(segment.node, originalText, nextText);
            }
            return true;
        }
        function collectTextSiblings(node) {
            const parent = node.parentElement ?? node.parentNode;
            if (!parent) {
                return [
                    node
                ];
            }
            const siblings = Array.from(parent.childNodes);
            const index = siblings.indexOf(node);
            if (index < 0) {
                return [
                    node
                ];
            }
            let start = index;
            while(start > 0 && siblings[start - 1]?.nodeType === 3){
                start -= 1;
            }
            const textSiblings = [];
            for(let siblingIndex = start; siblingIndex < siblings.length; siblingIndex += 1){
                const sibling = siblings[siblingIndex];
                if (sibling?.nodeType !== 3) {
                    break;
                }
                textSiblings.push(sibling);
            }
            return textSiblings;
        }

        module.exports = { translateDocument, restoreDocument };
        },
    "src/core/runtime.ts": (module, exports, require) => {
        const { syncAdminNavigationLayout } = require("src/core/admin-layout.ts");
        const { installControl, uninstallLegacyControl } = require("src/core/control.ts");
        const { observeNavigation } = require("src/core/navigation.ts");
        const { resolveRules } = require("src/core/page-detector.ts");
        const { observeDocument } = require("src/core/observer.ts");
        const { restoreDocument, translateDocument } = require("src/core/translator.ts");
        const { getLanguagePreference } = require("src/state/language.ts");
        const { initRemoteDictionary } = require("src/core/remote-dictionary.ts");
        const { rebuildSharedRules } = require("src/dicts/index.ts");
        const { log } = require("src/utils/log.ts");
        let documentObserver = null;
        let lastTranslatedPath = null;
        function runTranslation() {
            documentObserver?.disconnect();
            try {
                const root = document.body;
                const pathname = window.location.pathname;
                if (getLanguagePreference() !== "zh-CN") {
                    restoreDocument(root);
                    syncAdminNavigationLayout(false);
                    lastTranslatedPath = null;
                    log("language preference is not zh-CN, restored original content");
                    return 0;
                }
                if (lastTranslatedPath !== pathname) {
                    restoreDocument(root);
                }
                const rules = resolveRules(pathname);
                const changedCount = translateDocument(root, rules);
                syncAdminNavigationLayout(true);
                lastTranslatedPath = pathname;
                if (changedCount > 0) {
                    log(`translated ${changedCount} nodes on ${pathname}`);
                }
                return changedCount;
            } finally{
                documentObserver?.reconnect();
            }
        }
        function createScheduledRunner(runNow) {
            let scheduled = false;
            let settleTimers = [];
            return ()=>{
                if (scheduled) {
                    return;
                }
                scheduled = true;
                const flush = ()=>{
                    scheduled = false;
                    runNow();
                    const settle = ()=>{
                        runNow();
                    };
                    if (typeof requestAnimationFrame === "function") {
                        requestAnimationFrame(settle);
                    } else {
                        queueMicrotask(settle);
                    }
                    for (const timer of settleTimers){
                        clearTimeout(timer);
                    }
                    settleTimers = [
                        200,
                        500,
                        1000
                    ].map((delay)=>setTimeout(()=>{
                            runNow();
                        }, delay));
                };
                if (typeof requestAnimationFrame === "function") {
                    requestAnimationFrame(flush);
                    return;
                }
                queueMicrotask(flush);
            };
        }
        function installHoverRerun(rerun) {
            let hoverTimer = null;
            document.addEventListener("mouseover", ()=>{
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                }
                hoverTimer = setTimeout(()=>{
                    hoverTimer = null;
                    rerun();
                }, 150);
            }, {
                passive: true
            });
        }
        function bootstrap() {
            if (!window.location.hostname.endsWith("tailscale.com")) {
                return;
            }
            const start = ()=>{
                const rerun = createScheduledRunner(runTranslation);
                initRemoteDictionary(()=>{
                    rebuildSharedRules();
                    rerun();
                });
                rebuildSharedRules();
                uninstallLegacyControl();
                installControl(runTranslation);
                installHoverRerun(rerun);
                runTranslation();
                documentObserver = observeDocument(rerun);
                observeNavigation(rerun);
                log("Tailscale Chinese userscript bootstrapped");
            };
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", start, {
                    once: true
                });
                return;
            }
            start();
        }

        module.exports = { bootstrap };
        },
    "src/core/index.ts": (module, exports, require) => {
        const { bootstrap } = require("src/core/runtime.ts");

        module.exports = { bootstrap };
        },
    "src/main.ts": (module, exports, require) => {
        const { bootstrap } = require("src/core/index.ts");
        bootstrap();

        module.exports = {  };
        }
  };

  const cache = {};

  const require = (id) => {
    if (cache[id]) {
      return cache[id].exports;
    }

    if (!modules[id]) {
      throw new Error(`Unknown module: ${id}`);
    }

    const module = { exports: {} };
    cache[id] = module;
    modules[id](module, module.exports, require);
    return module.exports;
  };

  require("src/main.ts");
})();
