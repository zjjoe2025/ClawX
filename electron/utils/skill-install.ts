/**
 * Built-in skill installation helpers.
 *
 * These helpers are intentionally pure and Electron-free so they can be
 * unit-tested without mocking app runtime APIs.
 */

type ErrnoLike = {
  code?: string;
  syscall?: string;
  message?: string;
};

function toErrnoLike(error: unknown): ErrnoLike {
  if (!error || typeof error !== 'object') return {};
  return error as ErrnoLike;
}

export function getBuiltinSkillInstallErrorCode(error: unknown): string | undefined {
  const { code } = toErrnoLike(error);
  return typeof code === 'string' ? code : undefined;
}

export function isBuiltinSkillWindowsPermissionError(error: unknown): boolean {
  const code = getBuiltinSkillInstallErrorCode(error);
  return code === 'EPERM' || code === 'EACCES' || code === 'EBUSY';
}

export function isBuiltinSkillChmodError(error: unknown): boolean {
  const { syscall, message } = toErrnoLike(error);
  if (typeof syscall === 'string' && syscall.toLowerCase() === 'chmod') {
    return true;
  }
  return typeof message === 'string' && message.toLowerCase().includes('chmod');
}

/**
 * Whether we should retry this installation error.
 *
 * On Windows, file locking / antivirus / concurrent-copy timing can produce
 * transient EPERM/EACCES/EBUSY failures during fs.cp recursion.
 */
export function shouldRetryBuiltinSkillInstallError(
  error: unknown,
  platform = process.platform,
): boolean {
  return platform === 'win32' && isBuiltinSkillWindowsPermissionError(error);
}

/**
 * Whether an installation error can be safely downgraded because the manifest
 * already exists after the failed copy attempt.
 *
 * This handles concurrent startup races where another app instance finishes the
 * installation first, causing fs.cp/chmod in this process to throw.
 */
export function shouldTreatBuiltinSkillInstallErrorAsSuccess(
  error: unknown,
  targetManifestExists: boolean,
  platform = process.platform,
): boolean {
  if (!targetManifestExists) return false;
  if (platform !== 'win32') return false;
  return isBuiltinSkillWindowsPermissionError(error) || isBuiltinSkillChmodError(error);
}

export function getBuiltinSkillInstallRetryDelayMs(attempt: number): number {
  if (attempt <= 1) return 120;
  const cappedAttempt = Math.min(attempt, 4);
  return 120 * (2 ** (cappedAttempt - 1));
}
