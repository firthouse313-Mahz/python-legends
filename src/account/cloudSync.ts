// Bridges progressService (local, synchronous, network-agnostic) to the
// backend: once a student is logged in, every progress change — a level
// completed, a boss defeated, the pathway toggle — gets pushed up as a
// fresh snapshot. progressService itself stays free of any network code;
// this is the only thing that knows the two are connected.

import { progressService } from '../progress/progressService';
import { accountService, type AccountIdentity } from './accountService';

let unsubscribe: (() => void) | null = null;

export const cloudSync = {
  start(identity: AccountIdentity) {
    cloudSync.stop();
    const sid = identity.sid;
    unsubscribe = progressService.subscribe(() => {
      accountService.saveProgress(sid, progressService.getSnapshot());
    });
  },

  stop() {
    unsubscribe?.();
    unsubscribe = null;
  },
};
