import { describe, it, expect } from 'vitest';
import { buildGatewayNodeRuntimeArgs } from '@electron/gateway/runtime-args';

describe('buildGatewayNodeRuntimeArgs', () => {
  it('includes experimental warning suppression by default', () => {
    expect(buildGatewayNodeRuntimeArgs()).toEqual(['--disable-warning=ExperimentalWarning']);
  });

  it('can disable warning suppression explicitly', () => {
    expect(
      buildGatewayNodeRuntimeArgs({ disableExperimentalWarning: false }),
    ).toEqual([]);
  });

  it('appends require modules as explicit runtime args', () => {
    expect(
      buildGatewayNodeRuntimeArgs({
        requireModules: ['C:/Users/test/gateway-fetch-preload.cjs'],
      }),
    ).toEqual([
      '--disable-warning=ExperimentalWarning',
      '--require',
      'C:/Users/test/gateway-fetch-preload.cjs',
    ]);
  });

  it('skips empty require module entries', () => {
    expect(
      buildGatewayNodeRuntimeArgs({
        requireModules: ['', 'D:/app/preload.cjs'],
      }),
    ).toEqual([
      '--disable-warning=ExperimentalWarning',
      '--require',
      'D:/app/preload.cjs',
    ]);
  });
});
