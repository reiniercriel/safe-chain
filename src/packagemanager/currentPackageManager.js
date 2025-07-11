import { createNpmPackageManager } from "./npm/createPackageManager.js";
import { createNpxPackageManager } from "./npx/createPackageManager.js";
import { createYarnPackageManager } from "./yarn/createPackageManager.js";

const state = {
  packageManagerName: null,
};

export function initializePackageManager(packageManagerName, version) {
  if (packageManagerName === "npm") {
    state.packageManagerName = createNpmPackageManager(version);
  } else if (packageManagerName === "npx") {
    state.packageManagerName = createNpxPackageManager();
  } else if (packageManagerName === "yarn") {
    state.packageManagerName = createYarnPackageManager();
  } else {
    throw new Error("Unsupported package manager: " + packageManagerName);
  }

  return state.packageManagerName;
}

export function getPackageManager() {
  if (!state.packageManagerName) {
    throw new Error("Package manager not initialized.");
  }
  return state.packageManagerName;
}
