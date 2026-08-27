import {
  Button,
  Classes,
  NavbarDivider,
  NavbarGroup,
  Alignment,
} from '@blueprintjs/core';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useWarehouseTranfersListContext } from './WarehouseTransfersListProvider';
import { withWarehouseTransfers } from './withWarehouseTransfers';
import { withWarehouseTransfersActions } from './withWarehouseTransfersActions';
import type { WithWarehouseTransfersActionsProps } from './withWarehouseTransfersActions';
import type { IFilterRole } from '@/components/AdvancedFilter/interfaces';
import {
  Icon,
  FormattedMessage as T,
  AdvancedFilterPopover,
  DashboardFilterButton,
  DashboardActionViewsList,
  DashboardActionsBar,
} from '@/components';
import { compose } from '@/utils';

interface WarehouseTransfersActionsBarInnerProps
  extends Pick<
    WithWarehouseTransfersActionsProps,
    'setWarehouseTransferTableState'
  > {
  warehouseTransferFilterRoles: IFilterRole[];
}

interface ViewOption {
  slug?: string;
}

/**
 * Warehouse Transfers actions bar.
 */
function WarehouseTransfersActionsBarInner({
  // #withWarehouseTransfers
  warehouseTransferFilterRoles,

  // #withWarehouseTransfersActions
  setWarehouseTransferTableState,
}: WarehouseTransfersActionsBarInnerProps) {
  const history = useHistory();

  // credit note list context.
  const { WarehouseTransferView, fields, refresh } =
    useWarehouseTranfersListContext();

  // Handle new warehouse transfer button click.
  const handleClickNewWarehouseTransfer = () => {
    history.push('/warehouses-transfers/new');
  };

  // Handle click a refresh warehouse transfers
  const handleRefreshBtnClick = () => {
    refresh();
  };

  // Handle views tab change.
  const handleTabChange = (view: ViewOption | null) => {
    setWarehouseTransferTableState({ viewSlug: view ? view.slug : null });
  };

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <DashboardActionViewsList
          allMenuItem={true}
          resourceName={'warehouse_transfer'}
          views={WarehouseTransferView}
          onChange={handleTabChange}
        />
        <NavbarDivider />

        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'plus'} />}
          text={<T id={'warehouse_transfer.action.new_warehouse_transfer'} />}
          onClick={handleClickNewWarehouseTransfer}
        />
        <NavbarDivider />

        <AdvancedFilterPopover
          advancedFilterProps={{
            conditions: warehouseTransferFilterRoles,
            defaultFieldKey: 'created_at',
            fields: fields,
            onFilterChange: (filterConditions: IFilterRole[]) => {
              setWarehouseTransferTableState({
                filterRoles: filterConditions,
              });
            },
          }}
        >
          <DashboardFilterButton
            conditionsCount={warehouseTransferFilterRoles.length}
          />
        </AdvancedFilterPopover>

        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'print-16'} iconSize={16} />}
          text={<T id={'print'} />}
        />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'file-import-16'} />}
          text={<T id={'import'} />}
        />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'file-export-16'} iconSize={16} />}
          text={<T id={'export'} />}
        />
      </NavbarGroup>
      <NavbarGroup align={Alignment.RIGHT}>
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="refresh-16" iconSize={14} />}
          onClick={handleRefreshBtnClick}
        />
      </NavbarGroup>
    </DashboardActionsBar>
  );
}

export const WarehouseTransfersActionsBar = compose(
  withWarehouseTransfersActions,
  withWarehouseTransfers(({ warehouseTransferTableState }) => ({
    warehouseTransferFilterRoles:
      warehouseTransferTableState?.filterRoles ?? [],
  })),
)(WarehouseTransfersActionsBarInner);
