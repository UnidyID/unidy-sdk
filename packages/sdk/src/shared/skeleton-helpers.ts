/**
 * Creates a skeleton loader HTML string with animated placeholder.
 * The text is rendered transparent and overlaid with an animated rectangle,
 * which keeps the skeleton at the same intrinsic width as the final content.
 * @param text - The text to use as a placeholder (will be transparent)
 * @returns HTML string for skeleton loader
 */
export function createSkeletonLoader(text: string): string {
  return `
    <span style="position: relative;">
      <span style="color: transparent;">${text}</span>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0; pointer-events: none;">
        <rect width="100%" height="100%" fill="#e0e0e0" rx="4">
          <animate attributeName="fill" values="#e0e0e0;#f0f0f0;#e0e0e0" dur="1.5s" repeatCount="indefinite"/>
        </rect>
      </svg>
    </span>
  `;
}

/**
 * Replaces text nodes in a DOM tree with skeleton loaders.
 * Text nodes whose ancestor chain includes any tag in `skipInsideTags`
 * are left untouched — the per-list component already replaces those values.
 * @param node - The root node to process
 * @param options - Options object
 * @param options.skipInsideTags - Lowercase tag names whose descendant text nodes should be left alone.
 * @param options.createSkeletonFn - Function to create skeleton HTML (defaults to createSkeletonLoader)
 */
export function replaceTextNodesWithSkeletons(
  node: Node,
  options: {
    skipInsideTags: readonly string[];
    createSkeletonFn?: (text: string) => string;
  },
): void {
  const { skipInsideTags, createSkeletonFn = createSkeletonLoader } = options;
  const skipSet = new Set(skipInsideTags.map((t) => t.toLowerCase()));
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);

  const textNodes: Text[] = [];
  for (let curTextNode = walker.nextNode(); curTextNode; curTextNode = walker.nextNode()) {
    if (curTextNode.textContent?.trim()) {
      let parent = curTextNode.parentNode;
      let insideSkippedNode = false;
      while (parent) {
        if (skipSet.has(parent.nodeName.toLowerCase())) {
          insideSkippedNode = true;
          break;
        }
        parent = parent.parentNode;
      }
      if (!insideSkippedNode) {
        textNodes.push(curTextNode as Text);
      }
    }
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    if (!parent) continue;

    const text = textNode.textContent || "";
    const placeholderText = text.trim() || "Sample Text";
    const skeletonSpan = document.createElement("span");
    skeletonSpan.innerHTML = createSkeletonFn(placeholderText);
    parent.replaceChild(skeletonSpan, textNode);
  }
}
