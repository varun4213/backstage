import { PermissionPolicy } from '@backstage/plugin-permission-node';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

export class AllowAllPermissionPolicy implements PermissionPolicy {
  async handle(): Promise<{ result: AuthorizeResult.ALLOW }> {
    return { result: AuthorizeResult.ALLOW };
  }
}

export const allowAllPolicy = new AllowAllPermissionPolicy();
 