import type { Parent, PhrasingContent, Text } from 'mdast';

/**
 * Helper for inline rules: since mdast-util-to-markdown escapes markdown
 * syntax characters inside text nodes, rules that *generate* inline markdown
 * (links, strong, …) must construct real AST nodes. This splices replacement
 * phrasing nodes into the parent in place of the original text node.
 */
export function spliceTextSegments(
  parent: Parent | undefined,
  index: number | null | undefined,
  segments: PhrasingContent[],
): void {
  if (!parent || index === null || index === undefined) return;
  const nonEmpty = segments.filter((s) => s.type !== 'text' || s.value !== '');
  parent.children.splice(index, 1, ...nonEmpty);
}

export function textNode(value: string): Text {
  return { type: 'text', value };
}
