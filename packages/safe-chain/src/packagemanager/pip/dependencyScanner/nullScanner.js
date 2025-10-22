/**
 * Null scanner that returns no dependencies
 * Used when a command is not supported for scanning
 */
export function nullScanner() {
  return {
    shouldScan: () => false,
    scan: () => [],
  };
}
