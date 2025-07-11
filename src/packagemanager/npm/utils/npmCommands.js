import { deref } from "./cmd-list.js";

export function getNpmCommandForArgs(args) {
  if (args.length === 0) {
    return null;
  }

  const argCommand = deref(args[0]);
  if (!argCommand) {
    return null;
  }

  return argCommand;
}

export function hasDryRunArg(args) {
  return args.some((arg) => arg === "--dry-run");
}

export const npmInstallCommand = "install";
export const npmCiCommand = "ci";
export const npmInstallTestCommand = "install-test";
export const npmInstallCiTestCommand = "install-ci-test";
export const npmUpdateCommand = "update";
export const npmAuditCommand = "audit";
export const npmExecCommand = "exec";
