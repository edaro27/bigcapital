import { Injectable } from '@nestjs/common';

@Injectable()
export class BranchesSettingsService {
  /**
   * Marks multi-branches as activated.
   */
  public markMultiBranchesAsActivated = async () => {
    return;
  };

  /**
   * Retrieves whether multi-branches is active.
   */
  public isMultiBranchesActive = async () => {
    return false;
  };
}
