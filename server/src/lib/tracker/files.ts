import * as path from "path";
import { promises as fs } from "fs";

export const scan = async (directory: string) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  const directories = entries.filter(d => d.isDirectory()).map(d => d.name);
  const files = entries.filter(f => f.isFile()).map(f => f.name);

  console.log(`${directory}:`, files, directories);

  directories.forEach((d) => {
    scan(path.join(directory, d));
  });
}
