import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const fontCache = new Map<string, Promise<ArrayBuffer>>();

async function loadLocalFont(relativePath: string) {
  if (!fontCache.has(relativePath)) {
    fontCache.set(
      relativePath,
      (async () => {
        const fontPath = resolve(/*turbopackIgnore: true*/ process.cwd(), relativePath);
        const font = await readFile(fontPath);

        return font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength);
      })(),
    );
  }

  return fontCache.get(relativePath)!;
}

export async function getOgFonts() {
  try {
    const regular = await loadLocalFont("public/fonts/Geist-Regular.ttf");

    return [
      { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Geist", data: regular, weight: 500 as const, style: "normal" as const },
      { name: "Geist", data: regular, weight: 700 as const, style: "normal" as const },
      { name: "Geist", data: regular, weight: 800 as const, style: "normal" as const },
    ];
  } catch (error) {
    console.warn("OG font loading failed, falling back to default fonts.", error);
    return [];
  }
}
