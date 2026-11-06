// Turns the reviewer output into a GitHub review payload.
//
// usage: node post-review.mjs <result.txt> <raw.diff> <out-dir>
// env:   HEAD_SHA, RUN_URL, MODEL
//
// Writes <out-dir>/review.json (inline comments plus summary) and
// <out-dir>/fallback.md (everything in one comment, for when GitHub rejects
// the review). Exits 1 when the output is not valid JSON.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = '<!-- ai-review -->';
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

const [resultPath, diffPath, outDir] = process.argv.slice(2);
const { HEAD_SHA, RUN_URL, MODEL } = process.env;

function parseResult(text) {
  const stripped = text.replace(/```(?:json)?/g, '');
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('no JSON object in the reviewer output');
  }
  return JSON.parse(stripped.slice(start, end + 1));
}

// The comments are public. A reviewer can quote a secret that it found, or a
// prompt injection can make it print one. Replace anything that looks like a
// credential before it is posted.
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\b(?:sk|pk|rk)[-_](?:ant-|live_|test_|proj-)?[A-Za-z0-9_-]{16,}/g,
  /\b(?:ghp|gho|ghs|ghu|ghr|github_pat)_[A-Za-z0-9_]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b/g,
];

function redact(text) {
  return SECRET_PATTERNS.reduce((t, re) => t.replace(re, '[redacted]'), String(text ?? ''));
}

// Lines on the right side of each hunk. GitHub accepts inline comments only there.
// File headers occur only between "diff --git" and the first hunk, so an added
// line "+++ x" inside a hunk stays a hunk line.
function commentableLines(diff) {
  const files = new Map();
  let lines = null;
  let inHunk = false;
  let n = 0;
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      inHunk = false;
      lines = null;
    } else if (!inHunk && line.startsWith('+++ ')) {
      const path = line.slice(4).replace(/^b\//, '');
      lines = path === '/dev/null' ? null : new Set();
      if (lines) files.set(path, lines);
    } else if (line.startsWith('@@')) {
      inHunk = true;
      n = Number(/\+(\d+)/.exec(line)?.[1] ?? 0);
    } else if (inHunk && lines && (line.startsWith('+') || line.startsWith(' '))) {
      lines.add(n++);
    }
  }
  return files;
}

// Strip a diff prefix (a/, b/) only when the path without it is in the diff,
// so a real top-level a/ or b/ directory keeps its inline comments.
function normalizePath(path, files) {
  const p = String(path ?? '').trim().replace(/^\.\//, '');
  const stripped = p.replace(/^[ab]\//, '');
  return !files.has(p) && files.has(stripped) ? stripped : p;
}

function formatFinding(f) {
  return `**${f.category}** (${f.severity}): ${redact(f.message)}`;
}

function section(title, items) {
  return items.length ? `\n### ${title}\n\n${items.map((i) => `- ${i}`).join('\n')}\n` : '';
}

const result = parseResult(readFileSync(resultPath, 'utf8'));
const files = commentableLines(readFileSync(diffPath, 'utf8'));

const findings = (result.findings ?? [])
  .map((f) => ({ ...f, file: normalizePath(f.file, files), line: Number(f.line) }))
  .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3));

const inline = [];
const notInline = [];
const repeats = [];
for (const f of findings) {
  const location = `\`${f.file}:${f.line}\``;
  if (f.repeat) {
    repeats.push(`${location} ${formatFinding(f)}`);
  } else if (files.get(f.file)?.has(f.line)) {
    inline.push(f);
  } else {
    notInline.push(`${location} ${formatFinding(f)}`);
  }
}

const below = (result.below_threshold ?? []).map(redact);
const notVerified = (result.not_verified ?? []).map(redact);
const footer = `\n---\n<sub>pi review, model \`${MODEL}\`. [Run log](${RUN_URL})</sub>\n`;
const header = `${MARKER}\n## AI review\n\n${redact(result.summary ?? '')}\n`;
const verdict = findings.length
  ? `\n${findings.length} finding(s), ${inline.length} as inline comments.\n`
  : '\nNo issues found.\n';
const tail =
  section('Still open from an earlier review', repeats) +
  section('Below the threshold', below) +
  section('Not verified', notVerified) +
  footer;

const review = {
  commit_id: HEAD_SHA,
  event: 'COMMENT',
  body: header + verdict + section('Findings outside the diff', notInline) + tail,
  comments: inline.map((f) => ({
    path: f.file,
    line: f.line,
    side: 'RIGHT',
    body: `${MARKER}\n${formatFinding(f)}`,
  })),
};

const allFindings = inline.map((f) => `\`${f.file}:${f.line}\` ${formatFinding(f)}`).concat(notInline);
const fallback = header + verdict + section('Findings', allFindings) + tail;

writeFileSync(join(outDir, 'review.json'), JSON.stringify(review, null, 2));
writeFileSync(join(outDir, 'fallback.md'), fallback);
console.log(`findings=${findings.length} inline=${inline.length} not_inline=${notInline.length} repeats=${repeats.length}`);
