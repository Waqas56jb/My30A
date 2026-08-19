const MAX_RECS = 4;
const BOLD_REC = /^\s*(?:\d+\.\s+)?\*\*[^*]+\*\*\s*[—–−-]/;
const BULLET_REC = /^\s*[-*]\s+\*\*/;
const NUMBERED_REC = /^\s*\d+\.\s+\*\*/;

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

/** Turn a dense name dump into scannable markdown, then keep at most 4 recommendation bullets. */
export function normalizeVitoriaMarkdown(text: string) {
  let next = decodeHtmlEntities(String(text ?? '')).replace(/\r\n/g, '\n').trim();
  if (!next) return next;

  next = bulletizeNameDump(next);
  next = capRecommendationBullets(next, MAX_RECS);
  next = next.replace(/\n{3,}/g, '\n\n').trim();
  return next;
}

function bulletizeNameDump(text: string) {
  const lines = text.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (BOLD_REC.test(trimmed) && !BULLET_REC.test(trimmed) && !/^\s*[-*]\s+/.test(trimmed)) {
      out.push(`- ${trimmed.replace(/^\s*(?:\d+\.\s+)?/, '')}`);
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

function capRecommendationBullets(text: string, max: number) {
  const lines = text.split('\n');
  const out: string[] = [];
  let run = 0;
  for (const line of lines) {
    const isRec = BULLET_REC.test(line) || NUMBERED_REC.test(line) || (BOLD_REC.test(line) && /^\s*[-*]/.test(line));
    if (isRec) {
      run += 1;
      if (run > max) continue;
      out.push(line.replace(/^\s*\d+\.\s+/, '- '));
      continue;
    }
    if (line.trim() === '') {
      run = 0;
      out.push(line);
      continue;
    }
    run = 0;
    out.push(line);
  }
  return out.join('\n');
}
