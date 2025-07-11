export function parseDryRunOutput(output) {
  const lines = output.split(/\r?\n/);
  const packageChanges = [];

  for (const line of lines) {
    if (line.startsWith("add ")) {
      packageChanges.push(parseAdd(line));
    } else if (line.startsWith("remove ")) {
      packageChanges.push(parseRemove(line));
    } else if (line.startsWith("change ")) {
      packageChanges.push(parseChange(line));
    }
  }

  return packageChanges;
}

function parseAdd(line) {
  const splitLine = getLineParts(line);
  const packageName = splitLine[1];
  const packageVersion = splitLine[splitLine.length - 1];
  return addedPackage(packageName, packageVersion);
}

function addedPackage(name, version) {
  return { type: "add", name, version };
}

function parseRemove(line) {
  const splitLine = getLineParts(line);
  const packageName = splitLine[1];
  const packageVersion = splitLine[splitLine.length - 1];
  return removedPackage(packageName, packageVersion);
}

function removedPackage(name, version) {
  return { type: "remove", name, version };
}

function parseChange(line) {
  const splitLine = getLineParts(line);
  const packageName = splitLine[1];
  const packageVersion = splitLine[splitLine.length - 1];
  const oldVersion = splitLine[2];
  return changedPackage(packageName, packageVersion, oldVersion);
}

function getLineParts(line) {
  return line
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function changedPackage(name, version, oldVersion) {
  return { type: "change", name, version, oldVersion };
}
