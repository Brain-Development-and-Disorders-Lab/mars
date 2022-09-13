// Libraries
import * as chokidar from "chokidar";
import consola from "consola";

/**
 * Monitor a directory using the Chokidar library, watching for changes
 * to files and file structures.
 * @param {string} path file path to monitor
 */
export const watchFiles = async (path: string) => {
  // Initialize Chokidar watcher
  const watcher = chokidar.watch(path, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });

  // Configure logging
  const logInfo = consola.info.bind(consola);
  const logSuccess = consola.success.bind(consola);
  const logError = consola.error.bind(consola);

  // Configure event listeners
  watcher
    .on("add", (path, stats) => {
      logInfo(`File ${path} has been added`);
      logInfo(stats);
    })
    .on("change", path => logInfo(`File ${path} has been changed`))
    .on("unlink", path => logInfo(`File ${path} has been removed`))
    .on("addDir", (path, stats) => {
      logSuccess(`Directory ${path} has been added`);
      logInfo(stats);
    })
    .on("unlinkDir", path => logInfo(`Directory ${path} has been removed`))
    .on("error", error => logError(`Watcher error: ${error}`))
    .on("ready", () => logSuccess("Initial scan complete. Ready for changes"));
}
