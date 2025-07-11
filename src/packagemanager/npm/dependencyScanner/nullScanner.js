export function nullScanner() {
  return {
    scan: () => [],
    shouldScan: () => false,
  };
}
