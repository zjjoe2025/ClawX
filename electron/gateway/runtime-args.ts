/**
 * Helper utilities for building Node runtime args for Gateway child processes.
 *
 * Packaged Electron apps should prefer explicit runtime CLI args over
 * NODE_OPTIONS to avoid Electron's "Most NODE_OPTIONs are not supported in
 * packaged apps" warning noise.
 */

export interface GatewayRuntimeArgsOptions {
  disableExperimentalWarning?: boolean;
  requireModules?: string[];
}

export function buildGatewayNodeRuntimeArgs(options: GatewayRuntimeArgsOptions = {}): string[] {
  const args: string[] = [];
  const shouldDisableExperimentalWarning = options.disableExperimentalWarning ?? true;

  if (shouldDisableExperimentalWarning) {
    args.push('--disable-warning=ExperimentalWarning');
  }

  for (const modulePath of options.requireModules ?? []) {
    if (!modulePath) continue;
    args.push('--require', modulePath);
  }

  return args;
}
