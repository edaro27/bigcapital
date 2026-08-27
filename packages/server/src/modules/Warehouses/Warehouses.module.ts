import { Module } from '@nestjs/common';
import { WarehousesSettings } from './WarehousesSettings';
import { WarehouseTransactionDTOTransform } from './Integrations/WarehouseTransactionDTOTransform';
import { DeleteItemWarehousesQuantity } from './commands/DeleteItemWarehousesQuantity';
import { DeleteItemWarehousesQuantitySubscriber } from './subscribers/DeleteItemWarehousesQuantitySubscriber';

/**
 * Single-location compatibility module.
 *
 * Inventory transactions retain their legacy schema, while warehouse
 * controllers, transfers, validators, and activation subscribers stay out of
 * the runtime dependency graph.
 */
@Module({
  providers: [
    WarehousesSettings,
    WarehouseTransactionDTOTransform,
    DeleteItemWarehousesQuantity,
    DeleteItemWarehousesQuantitySubscriber,
  ],
  exports: [WarehousesSettings, WarehouseTransactionDTOTransform],
})
export class WarehousesModule {}
