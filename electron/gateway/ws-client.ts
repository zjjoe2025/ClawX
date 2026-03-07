import WebSocket from 'ws';
import type { DeviceIdentity } from '../utils/device-identity';
import {
  buildDeviceAuthPayload,
  publicKeyRawBase64UrlFromPem,
  signDevicePayload,
} from '../utils/device-identity';

export async function probeGatewayReady(
  port: number,
  timeoutMs = 2000,
): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const testWs = new WebSocket(`ws://localhost:${port}/ws`);
    const timeout = setTimeout(() => {
      testWs.close();
      resolve(false);
    }, timeoutMs);

    testWs.on('open', () => {
      clearTimeout(timeout);
      testWs.close();
      resolve(true);
    });

    testWs.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

export function buildGatewayConnectFrame(options: {
  challengeNonce: string;
  token: string;
  deviceIdentity: DeviceIdentity | null;
  platform: string;
}): { connectId: string; frame: Record<string, unknown> } {
  const connectId = `connect-${Date.now()}`;
  const role = 'operator';
  const scopes = ['operator.admin'];
  const signedAtMs = Date.now();
  const clientId = 'gateway-client';
  const clientMode = 'ui';

  const device = (() => {
    if (!options.deviceIdentity) return undefined;

    const payload = buildDeviceAuthPayload({
      deviceId: options.deviceIdentity.deviceId,
      clientId,
      clientMode,
      role,
      scopes,
      signedAtMs,
      token: options.token ?? null,
      nonce: options.challengeNonce,
    });
    const signature = signDevicePayload(options.deviceIdentity.privateKeyPem, payload);
    return {
      id: options.deviceIdentity.deviceId,
      publicKey: publicKeyRawBase64UrlFromPem(options.deviceIdentity.publicKeyPem),
      signature,
      signedAt: signedAtMs,
      nonce: options.challengeNonce,
    };
  })();

  return {
    connectId,
    frame: {
      type: 'req',
      id: connectId,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: clientId,
          displayName: 'ClawX',
          version: '0.1.0',
          platform: options.platform,
          mode: clientMode,
        },
        auth: {
          token: options.token,
        },
        caps: [],
        role,
        scopes,
        device,
      },
    },
  };
}
