export const AI_PLAIN_TEXT_STYLE_INSTRUCTION =
  'Reply in plain, natural text. Do not use Markdown, bold markers, headings, tables, or code formatting. Keep the tone practical and human.';

export function withPlainTextAiStyle(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return AI_PLAIN_TEXT_STYLE_INSTRUCTION;
  }

  return `${trimmed}\n\nStyle: ${AI_PLAIN_TEXT_STYLE_INSTRUCTION}`;
}

export function formatAiResponseText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/(^|[\s([{])\*([^*\n]+)\*(?=$|[\s.,;:!?)\]])/g, '$1$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*]\s+/gm, '- ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
