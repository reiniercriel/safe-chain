const escapeChar = "\u001b";
const startMarker = `${escapeChar}[?2004l`;
const endMarker = `${escapeChar}[?2004h`;

/* eslint-disable no-control-regex */
// This module removes control characters and escape sequences from shell output.
// So it is allowed to use control characters in the regex patterns here.

export function parseShellOutput(rawData) {
  const stringData = rawData.join("");

  let output = getDataBetweenStartAndEndMarkers(stringData);
  output = processBackspaces(output);
  output = processEraseCommands(output);
  output = removeOscSequences(output);
  output = removeAnsiSgrSequences(output);
  output = removeRemainingEscapeSequences(output);

  return output.trim();
}

function getDataBetweenStartAndEndMarkers(data) {
  if (!data.includes(startMarker) || !data.includes(endMarker)) {
    return data;
  }

  const startIndex = data.indexOf(startMarker);
  const endIndex = data.indexOf(endMarker, startIndex + startMarker.length);

  if (startIndex === -1 || endIndex === -1) {
    return "";
  }

  return data.slice(startIndex + startMarker.length, endIndex);
}

function processBackspaces(data) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    const char = data[i];

    if (char === "\b") {
      // Backspace: remove the previous character if it exists
      if (result.length > 0) {
        result.pop();
      }
    } else {
      result.push(char);
    }
  }

  return result.join("");
}

function removeOscSequences(data) {
  return data.replace(/\u001b\][0-9]*;[^\u0007\u001b]*(\u0007|\u001b\\)/g, "");
}

function removeAnsiSgrSequences(data) {
  return data.replace(/\u001b\[[0-9;]*m/g, "");
}

function processEraseCommands(data) {
  const lines = data.split("\n");
  const result = [];

  for (let line of lines) {
    // Process erase in line commands
    line = line.replace(/\u001b\[K/g, ""); // Erase to end of line
    line = line.replace(/\u001b\[0K/g, ""); // Erase to end of line
    line = line.replace(/\u001b\[1K/g, ""); // Erase from start of line to cursor
    line = line.replace(/\u001b\[2K/g, ""); // Erase entire line - remove the whole line

    // Skip lines that were completely erased
    if (line.includes("\u001b[2K")) {
      continue;
    }

    result.push(line);
  }

  // Process erase in display commands
  let output = result.join("\n");
  output = output.replace(/\u001b\[J/g, ""); // Erase to end of display
  output = output.replace(/\u001b\[0J/g, ""); // Erase to end of display
  output = output.replace(/\u001b\[1J/g, ""); // Erase from start to cursor
  output = output.replace(/\u001b\[2J/g, ""); // Erase entire display

  return output;
}

function removeRemainingEscapeSequences(data) {
  // Remove mode setting sequences like \u001b[?1h, \u001b[?1l
  data = data.replace(/\u001b\[\?[0-9]+[hl]/g, "");

  // Remove any other CSI sequences we haven't handled
  data = data.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "");

  // Remove incomplete or malformed escape sequences
  data = data.replace(/\u001b[^\u001b]*/g, "");

  return data;
}
