export function walkTextNodes(
  root: ParentNode,
  options: { includeEmpty?: boolean } = {},
) {
  const { includeEmpty = false } = options;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!includeEmpty && (!node.textContent || node.textContent.trim().length === 0)) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }

      if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  return textNodes;
}

export function selectElements(root: ParentNode, selector: string) {
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

export function walkElements(root: ParentNode) {
  return selectElements(root, "*");
}
