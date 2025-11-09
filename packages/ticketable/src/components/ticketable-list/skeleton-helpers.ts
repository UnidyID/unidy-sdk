/**
 * Creates a skeleton loader HTML string with animated placeholder
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
 * Replaces text nodes in a DOM tree with skeleton loaders
 * Skips text nodes inside ticketable-value elements
 * @param node - The root node to process
 * @param createSkeletonFn - Function to create skeleton HTML (defaults to createSkeletonLoader)
 */
export function replaceTextNodesWithSkeletons(
  node: Node,
  createSkeletonFn: (text: string) => string = createSkeletonLoader
): void {
  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let textNode;
  while (textNode = walker.nextNode()) {
    if (textNode.textContent && textNode.textContent.trim()) {
      let parent = textNode.parentNode;
      let isInsideTicketableValue = false;
      while (parent) {
        if (parent.nodeName.toLowerCase() === 'ticketable-value') {
          isInsideTicketableValue = true;
          break;
        }
        parent = parent.parentNode;
      }
      if (!isInsideTicketableValue) {
        textNodes.push(textNode as Text);
      }
    }
  }

  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent) return;

    const text = textNode.textContent || '';
    const placeholderText = text.trim() || 'Sample Text';
    const skeletonSpan = document.createElement('span');
    skeletonSpan.innerHTML = createSkeletonFn(placeholderText);
    parent.replaceChild(skeletonSpan, textNode);
  });
}

