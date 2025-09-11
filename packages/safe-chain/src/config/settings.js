import * as cliArguments from "./cliArguments.js";

export function getMalwareAction() {
  const action = cliArguments.getMalwareAction();

  if (action === MALWARE_ACTION_PROMPT) {
    return MALWARE_ACTION_PROMPT;
  }

  return MALWARE_ACTION_BLOCK;
}

export const MALWARE_ACTION_BLOCK = "block";
export const MALWARE_ACTION_PROMPT = "prompt";
