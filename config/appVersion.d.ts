type PluginEntry = string | [string, object];

export interface BuildConfig {
  version?: string;
  android?: { package?: string; versionCode?: number; [key: string]: unknown };
  plugins?: PluginEntry[];
  [key: string]: unknown;
}

export function versionFromCommitCount(count: number): { versionName: string; versionCode: number };
export function apkFileName(versionName: string): string;
export function applyBuildConfig(config: BuildConfig, env: Record<string, string | undefined>): BuildConfig;
