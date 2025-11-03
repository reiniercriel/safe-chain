import fs from "fs";
import path from "path";
import os from "os";
import { ui } from "../environment/userInteraction.js";

/**
 * @typedef {Object} SafeChainConfig
 * @property {any} scanTimeout // This should be a number
 */

/**
 * @returns {number}
 */
export function getScanTimeout() {
  const config = readConfigFile();

  if (process.env.AIKIDO_SCAN_TIMEOUT_MS) {
    const scanTimeout = Number(process.env.AIKIDO_SCAN_TIMEOUT_MS);
    if (!Number.isNaN(scanTimeout) && scanTimeout > 0) {
      return scanTimeout;
    }
  }

  if (config.scanTimeout) {
    const scanTimeout = Number(config.scanTimeout);
    if (!Number.isNaN(scanTimeout) && scanTimeout > 0) {
      return scanTimeout;
    }
  }

  return 10000; // Default to 10 seconds
}

/**
 * @param {import("../api/aikido.js").MalwarePackage[]} data
 * @param {string | number} version
 *
 * @returns {void}
 */
export function writeDatabaseToLocalCache(data, version) {
  try {
    const databasePath = getDatabasePath();
    const versionPath = getDatabaseVersionPath();

    fs.writeFileSync(databasePath, JSON.stringify(data));
    fs.writeFileSync(versionPath, version.toString());
  } catch {
    ui.writeWarning(
      "Failed to write malware database to local cache, next time the database will be fetched from the server again."
    );
  }
}

/**
 * @returns {{malwareDatabase: import("../api/aikido.js").MalwarePackage[] | null, version: string | null}}
 */
export function readDatabaseFromLocalCache() {
  try {
    const databasePath = getDatabasePath();
    if (!fs.existsSync(databasePath)) {
      return {
        malwareDatabase: null,
        version: null,
      };
    }
    const data = fs.readFileSync(databasePath, "utf8");
    const malwareDatabase = JSON.parse(data);
    const versionPath = getDatabaseVersionPath();
    let version = null;
    if (fs.existsSync(versionPath)) {
      version = fs.readFileSync(versionPath, "utf8").trim();
    }
    return {
      malwareDatabase: malwareDatabase,
      version: version,
    };
  } catch {
    ui.writeWarning(
      "Failed to read malware database from local cache. Continuing without local cache."
    );
    return {
      malwareDatabase: null,
      version: null,
    };
  }
}

/**
 * @returns {SafeChainConfig}
 */
function readConfigFile() {
  const configFilePath = getConfigFilePath();

  if (!fs.existsSync(configFilePath)) {
    return {
      scanTimeout: undefined,
    };
  }

  const data = fs.readFileSync(configFilePath, "utf8");
  return JSON.parse(data);
}

/**
 * @returns {string}
 */
function getDatabasePath() {
  const aikidoDir = getAikidoDirectory();
  return path.join(aikidoDir, "malwareDatabase.json");
}

function getDatabaseVersionPath() {
  const aikidoDir = getAikidoDirectory();
  return path.join(aikidoDir, "version.txt");
}

/**
 * @returns {string}
 */
function getConfigFilePath() {
  return path.join(getAikidoDirectory(), "config.json");
}

/**
 * @returns {string}
 */
function getAikidoDirectory() {
  const homeDir = os.homedir();
  const aikidoDir = path.join(homeDir, ".aikido");

  if (!fs.existsSync(aikidoDir)) {
    fs.mkdirSync(aikidoDir, { recursive: true });
  }
  return aikidoDir;
}
