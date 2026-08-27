import { Injectable } from '@nestjs/common';

@Injectable()
export class WarehousesSettings {
  /**
   * Marks multi-warehouses as activated.
   */
  public markMutliwarehoussAsActivated = async () => {
    return;
  };

  /**
   * Determines multi-warehouses is active.
   * @param {number} tenantId
   * @returns {boolean}
   */
  public isMultiWarehousesActive = async () => {
    return false;
  };
}
