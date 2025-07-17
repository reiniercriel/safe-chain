import zsh from "./supported-shells/zsh.js";
import bash from "./supported-shells/bash.js";
import powershell from "./supported-shells/powershell.js";
import windowsPowershell from "./supported-shells/windowsPowershell.js";
import fish from "./supported-shells/fish.js";

export function detectShells() {
  let possibleShells = [zsh, bash, powershell, windowsPowershell, fish];
  let availableShells = [];

  for (const shell of possibleShells) {
    if (shell.isInstalled()) {
      availableShells.push(shell);
    }
  }

  return availableShells;
}
