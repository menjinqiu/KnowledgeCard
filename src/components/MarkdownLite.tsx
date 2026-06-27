import type { ReactNode } from 'react';

type MarkdownLiteProps = {
  content: string;
};

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'code'; text: string };

function flushParagraph(blocks: Block[], lines: string[]) {
  if (lines.length === 0) return;
  blocks.push({ type: 'paragraph', lines: [...lines] });
  lines.length = 0;
}

function parseMarkdownLite(content: string): Block[] {
  const blocks: Block[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listType: 'unordered-list' | 'ordered-list' | null = null;
  let codeLines: string[] = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    blocks.push({ type: listType, items: [...listItems] });
    listItems = [];
    listType = null;
  };

  const flushCode = () => {
    blocks.push({ type: 'code', text: codeLines.join('\n') });
    codeLines = [];
  };

  content.replace(/\r\n/g, '\n').split('\n').forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph(blocks, paragraphLines);
      flushList();
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (!trimmed) {
      flushParagraph(blocks, paragraphLines);
      flushList();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(blocks, paragraphLines);
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      return;
    }

    const orderedMatch = trimmed.match(/^\d+[.)、]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph(blocks, paragraphLines);
      if (listType && listType !== 'ordered-list') flushList();
      listType = 'ordered-list';
      listItems.push(orderedMatch[1].trim());
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph(blocks, paragraphLines);
      if (listType && listType !== 'unordered-list') flushList();
      listType = 'unordered-list';
      listItems.push(unorderedMatch[1].trim());
      return;
    }

    flushList();
    paragraphLines.push(line.trim());
  });

  if (inCodeBlock) flushCode();
  flushParagraph(blocks, paragraphLines);
  flushList();

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderParagraphLines(lines: string[]) {
  return lines.flatMap((line, lineIndex) => {
    const inlineNodes = renderInline(line);
    if (lineIndex === 0) return inlineNodes;
    return [<br key={`br-${lineIndex}`} />, ...inlineNodes];
  });
}

export function MarkdownLite({ content }: MarkdownLiteProps) {
  const blocks = parseMarkdownLite(content);

  return (
    <div className="markdown-lite">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
          return <HeadingTag key={index}>{renderInline(block.text)}</HeadingTag>;
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={index}>
              <code>{block.text}</code>
            </pre>
          );
        }

        return <p key={index}>{renderParagraphLines(block.lines)}</p>;
      })}
    </div>
  );
}
