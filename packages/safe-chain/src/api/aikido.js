import fetch from "make-fetch-happen";
import { getEcoSystem } from "../config/settings.js";

const malwareDatabaseUrls = {
  js: "https://malware-list.aikido.dev/malware_predictions.json",
  py: "https://malware-list.aikido.dev/malware_pypi.json",
};

export async function fetchMalwareDatabase() {
  const ecosystem = getEcoSystem() || "js";
  const malwareDatabaseUrl = malwareDatabaseUrls[ecosystem];
  const response = await fetch(malwareDatabaseUrl);
  if (!response.ok) {
    throw new Error(`Error fetching ${ecosystem} malware database: ${response.statusText}`);
  }

  try {
    let malwareDatabase = await response.json();
    return {
      malwareDatabase: malwareDatabase,
      version: response.headers.get("etag") || undefined,
    };
  } catch (error) {
    throw new Error(`Error parsing ${ecosystem} malware database: ${error.message}`);
  }
}

export async function fetchMalwareDatabaseVersion() {
  const ecosystem = getEcoSystem() || "js";

  const malwareDatabaseUrl = malwareDatabaseUrls[ecosystem];
  const response = await fetch(malwareDatabaseUrl, {
    method: "HEAD",
  });

  if (!response.ok) {
    throw new Error(
      `Error fetching ${ecosystem} malware database version: ${response.statusText}`
    );
  }
  return response.headers.get("etag") || undefined;
}
