function getFenceOpener(line: string) {
  const match = /^[ \t]{0,3}(`{3,}|~{3,})([^\n]*)$/.exec(line);

  if (!match) {
    return null;
  }

  return {
    marker: match[1],
    markerChar: match[1][0],
    markerLength: match[1].length,
  };
}

function getEmbeddedFenceOpener(line: string) {
  const match = /^(.*\S.*?)(`{3,}|~{3,})([^\n]*)$/.exec(line);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1].replace(/[ \t]+$/, ""),
    opener: `${match[2]}${match[3]}`,
    markerChar: match[2][0],
    markerLength: match[2].length,
  };
}

function isFenceCloser(
  line: string,
  markerChar: string,
  markerLength: number,
) {
  const escapedChar = markerChar === "`" ? "\\`" : markerChar;
  const pattern = new RegExp(
    `^[ \\t]{0,3}${escapedChar}{${markerLength},}[ \\t]*$`,
  );

  return pattern.test(line);
}

function hasMatchingFenceCloser(
  lines: string[],
  startIndex: number,
  markerChar: string,
  markerLength: number,
) {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (isFenceCloser(lines[index], markerChar, markerLength)) {
      return true;
    }
  }

  return false;
}

// Normalizes pasted fence openers like:
// "Intro ```ts"
// into:
// "Intro"
// "```ts"
// so the markdown parser can treat the block as fenced code.
export function normalizeMarkdownContent(content: string) {
  const normalizedNewlines = content.replace(/\r\n?/g, "\n");
  const lines = normalizedNewlines.split("\n");
  const result: string[] = [];

  let activeFence: { markerChar: string; markerLength: number } | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (activeFence) {
      result.push(line);

      if (
        isFenceCloser(
          line,
          activeFence.markerChar,
          activeFence.markerLength,
        )
      ) {
        activeFence = null;
      }

      continue;
    }

    const validOpener = getFenceOpener(line);

    if (validOpener) {
      result.push(line);
      activeFence = {
        markerChar: validOpener.markerChar,
        markerLength: validOpener.markerLength,
      };
      continue;
    }

    const embeddedOpener = getEmbeddedFenceOpener(line);

    if (
      embeddedOpener &&
      hasMatchingFenceCloser(
        lines,
        index,
        embeddedOpener.markerChar,
        embeddedOpener.markerLength,
      )
    ) {
      result.push(embeddedOpener.prefix);
      result.push(embeddedOpener.opener);
      activeFence = {
        markerChar: embeddedOpener.markerChar,
        markerLength: embeddedOpener.markerLength,
      };
      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}
