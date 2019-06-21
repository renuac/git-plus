export interface Hunk {
  oldFile: string;
  newFile: string;
  lines: string[];
  text: string;
  lineRange: [number, number];
}

export function parseDiff(text: string): Hunk[] {
  const hunks: Hunk[] = [];
  const parser = new TextParser(text);

  let currentHunk: Partial<Hunk> | undefined = undefined;
  let line = parser.readLine();
  while (line) {
    if (line.startsWith("diff --git")) {
      if (currentHunk !== undefined) {
        hunks.push(currentHunk as Hunk);
      }
      currentHunk = {
        lines: [],
        text: ""
      };
    } else if (line.startsWith("index ")) {
    } else if (line.startsWith("@@") && line.endsWith("@@")) {
      const match = line.match(/\+\d+,\d+\s/);
      if (match != null) {
        const [start, end] = match[0].substring(1, match[0].length - 1).split(",");
        currentHunk!.lineRange = [parseInt(start, 10), parseInt(end, 10)];
      }
    } else if (line.startsWith("---")) {
      const [, oldFile] = line.split(" ");
      currentHunk!.oldFile = oldFile;
    } else if (line.startsWith("+++")) {
      const [, newFile] = line.split(" ");
      currentHunk!.newFile = newFile;
    } else {
      currentHunk!.lines!.push(line);
      currentHunk!.text = `${currentHunk!.text}${line}\n`;
    }

    line = parser.readLine();
    if (line === undefined) {
      hunks.push(currentHunk as Hunk);
    }
  }

  return hunks;
}

class TextParser {
  private finished = false;
  private cursor = 0;

  constructor(readonly text: string) {}

  readLine() {
    if (this.finished) return undefined;

    const result = this.text.substring(this.cursor).match("\n");
    if (result == null) {
      const line = this.text.substring(this.cursor);
      this.finished = true;
      return line;
    }

    const nextBreak = this.cursor + result.index!;

    const line = this.text.substring(this.cursor, nextBreak);
    this.cursor = nextBreak + 1;

    return line;
  }
}
