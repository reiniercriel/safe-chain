import * as os from "os";
import { execSync } from "child_process";

const shellList = {
  bash: {
    name: "Bash",
    executable: "bash",
    getStartupFileCommand: "echo ~/.bashrc",
  },
  zsh: {
    name: "Zsh",
    executable: "zsh",
    getStartupFileCommand: "echo ${ZDOTDIR:-$HOME}/.zshrc",
  },
  fish: {
    name: "Fish",
    executable: "fish",
    getStartupFileCommand: "echo ~/.config/fish/config.fish",
  },
  powershell: {
    name: "PowerShell Core",
    executable: "pwsh",
    getStartupFileCommand: "echo $PROFILE",
  },
  windowsPowerShell: {
    name: "Windows PowerShell",
    executable: "powershell",
    getStartupFileCommand: "echo $PROFILE",
  },
};

export function detectShells() {
  let availableShells = [];

  for (const shellName of Object.keys(shellList)) {
    const shell = shellList[shellName];

    if (isShellAvailable(shell)) {
      const startupFile = getShellStartupFile(shell);
      availableShells.push({
        name: shell.name,
        executable: shell.executable,
        startupFile: startupFile || null,
      });
    }
  }

  return availableShells;
}

function isShellAvailable(shell) {
  try {
    if (os.platform() === "win32") {
      execSync(`where ${shell.executable}`, { stdio: "ignore" });
    } else {
      execSync(`which ${shell.executable}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

function getShellStartupFile(shell) {
  try {
    const command = shell.getStartupFileCommand;
    const output = execSync(command, {
      encoding: "utf8",
      shell: shell.executable,
    }).trim();
    return output;
  } catch {
    return null;
  }
}
