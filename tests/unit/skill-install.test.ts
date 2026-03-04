import { describe, it, expect } from 'vitest';
import {
  getBuiltinSkillInstallErrorCode,
  getBuiltinSkillInstallRetryDelayMs,
  isBuiltinSkillChmodError,
  isBuiltinSkillWindowsPermissionError,
  shouldRetryBuiltinSkillInstallError,
  shouldTreatBuiltinSkillInstallErrorAsSuccess,
} from '@electron/utils/skill-install';

describe('skill-install helpers', () => {
  it('extracts errno code from error-like objects', () => {
    expect(getBuiltinSkillInstallErrorCode({ code: 'EPERM' })).toBe('EPERM');
    expect(getBuiltinSkillInstallErrorCode(new Error('x'))).toBeUndefined();
    expect(getBuiltinSkillInstallErrorCode(null)).toBeUndefined();
  });

  it('classifies Windows permission-style copy errors', () => {
    expect(isBuiltinSkillWindowsPermissionError({ code: 'EPERM' })).toBe(true);
    expect(isBuiltinSkillWindowsPermissionError({ code: 'EACCES' })).toBe(true);
    expect(isBuiltinSkillWindowsPermissionError({ code: 'EBUSY' })).toBe(true);
    expect(isBuiltinSkillWindowsPermissionError({ code: 'ENOENT' })).toBe(false);
  });

  it('detects chmod-related errors', () => {
    expect(isBuiltinSkillChmodError({ syscall: 'chmod' })).toBe(true);
    expect(isBuiltinSkillChmodError({ message: 'operation not permitted, chmod x' })).toBe(true);
    expect(isBuiltinSkillChmodError({ message: 'copy failed' })).toBe(false);
  });

  it('retries only transient permission errors on Windows', () => {
    const err = { code: 'EPERM' };
    expect(shouldRetryBuiltinSkillInstallError(err, 'win32')).toBe(true);
    expect(shouldRetryBuiltinSkillInstallError(err, 'linux')).toBe(false);
    expect(shouldRetryBuiltinSkillInstallError({ code: 'ENOENT' }, 'win32')).toBe(false);
  });

  it('downgrades to success when manifest exists after Windows chmod/permission race', () => {
    expect(
      shouldTreatBuiltinSkillInstallErrorAsSuccess({ code: 'EPERM' }, true, 'win32'),
    ).toBe(true);
    expect(
      shouldTreatBuiltinSkillInstallErrorAsSuccess({ message: 'chmod failed' }, true, 'win32'),
    ).toBe(true);
    expect(
      shouldTreatBuiltinSkillInstallErrorAsSuccess({ code: 'EPERM' }, false, 'win32'),
    ).toBe(false);
    expect(
      shouldTreatBuiltinSkillInstallErrorAsSuccess({ code: 'EPERM' }, true, 'linux'),
    ).toBe(false);
  });

  it('uses bounded exponential retry delays', () => {
    expect(getBuiltinSkillInstallRetryDelayMs(1)).toBe(120);
    expect(getBuiltinSkillInstallRetryDelayMs(2)).toBe(240);
    expect(getBuiltinSkillInstallRetryDelayMs(3)).toBe(480);
    expect(getBuiltinSkillInstallRetryDelayMs(4)).toBe(960);
    expect(getBuiltinSkillInstallRetryDelayMs(10)).toBe(960);
  });
});
