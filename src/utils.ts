import * as os from "os";

/**
 * @returns true if running on Windows
 */
export const runningOnMSWindows = () => {
  return os.type().startsWith("Windows");
};

/**
 * On Windows, this function takes in a file path string and
 * if there are single backslash separators, changes those to
 * forward slashes. It then returns the path in double quotes,
 * in case there are whitespace characters in the path.
 * (Quotes are required when the subprocess is spawned in a shell,
 * and forbidden otherwise. Only Windows uses a shell.)
 *
 * On sane OSes, it returns the path unchanged.
 *
 * @param path A file path as a string
 * @returns A useable file path as a string
 */
export const fixMSWindowsPath = (path: string) => {
  if (!runningOnMSWindows()) {
    return path;
  }
  if (!path.match(/[^\\]\\[^\\]/)) {
    return path;
  }
  return `"${path.replace(/\\/g, "/")}"`;
};
