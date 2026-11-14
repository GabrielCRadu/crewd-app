export function envValue(envFileText: string, name: string): string | null;
export function missingRequirements(input: { javaFound: boolean; sdkDir: string | null; envFileText: string | null }): string[];
export function parseAdbDevices(stdout: string): string[];
