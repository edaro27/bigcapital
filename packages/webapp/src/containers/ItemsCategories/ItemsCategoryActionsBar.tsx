import {
  NavbarGroup,
  NavbarDivider,
  Button,
  Classes,
  Intent,
} from '@blueprintjs/core';
import { useHistory } from 'react-router-dom';
import { useBulkDeleteItemCategoriesDialog } from './hooks/use-bulk-delete-item-categories-dialog';
import { useItemsCategoriesContext } from './ItemsCategoriesProvider';
import { withItemCategories } from './withItemCategories';
import { withItemCategoriesActions } from './withItemCategoriesActions';
import type { WithItemCategoriesActionsProps } from './withItemCategoriesActions';
import type { IFilterRole } from '@/components/AdvancedFilter/interfaces';
import type { WithAlertActionsProps } from '@/containers/Alert/withAlertActions';
import type { WithDialogActionsProps } from '@/containers/Dialog/withDialogActions';
import {
  Icon,
  FormattedMessage as T,
  AdvancedFilterPopover,
  DashboardFilterButton,
  DashboardActionsBar,
} from '@/components';
import { DialogsName } from '@/constants/dialogs';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { compose } from '@/utils';

interface ItemsCategoryActionsBarInnerProps
  extends WithItemCategoriesActionsProps,
    WithDialogActionsProps,
    WithAlertActionsProps {
  itemsCategoriesSelectedRows: number[];
  categoriesFilterConditions: IFilterRole[];
}

/**
 * Items categories actions bar.
 */
function ItemsCategoryActionsBarInner({
  // #withItemCategories
  itemsCategoriesSelectedRows,

  categoriesFilterConditions,

  //
  setItemsCategoriesTableState,

  // #withDialog
  openDialog,

  // #withAlertActions
  openAlert,
}: ItemsCategoryActionsBarInnerProps) {
  const { fields } = useItemsCategoriesContext();
  const history = useHistory();

  const bulkDelete = useBulkDeleteItemCategoriesDialog();
  const { openBulkDeleteDialog } = bulkDelete;

  const onClickNewCategory = () => {
    openDialog('item-category-form', {});
  };

  const handleImportBtnClick = () => {
    history.push('/item/categories/import');
  };

  // Handle the items categories bulk delete.
  const handleBulkDelete = () => {
    openBulkDeleteDialog(itemsCategoriesSelectedRows as number[]);
  };
  // Handle the export button click.
  const handleExportBtnClick = () => {
    openDialog(DialogsName.Export, { resource: 'item_category' });
  };
  if (itemsCategoriesSelectedRows?.length) {
    return (
      <DashboardActionsBar>
        <NavbarGroup>
          <Button
            className={Classes.MINIMAL}
            icon={<Icon icon="trash-16" iconSize={16} />}
            text={<T id={'delete'} />}
            intent={Intent.DANGER}
            onClick={handleBulkDelete}
          />
        </NavbarGroup>
      </DashboardActionsBar>
    );
  }

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="plus" />}
          text={<T id={'new_category'} />}
          onClick={onClickNewCategory}
        />
        <NavbarDivider />

        <AdvancedFilterPopover
          advancedFilterProps={{
            conditions: categoriesFilterConditions,
            defaultFieldKey: 'name',
            fields: fields,
            onFilterChange: (filterConditions: IFilterRole[]) => {
              setItemsCategoriesTableState({ filterRoles: filterConditions });
            },
          }}
        >
          <DashboardFilterButton
            conditionsCount={categoriesFilterConditions.length}
          />
        </AdvancedFilterPopover>

        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="file-import-16" iconSize={16} />}
          text={<T id={'import'} />}
          onClick={handleImportBtnClick}
        />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="file-export-16" iconSize={16} />}
          text={<T id={'export'} />}
          onClick={handleExportBtnClick}
        />
      </NavbarGroup>
    </DashboardActionsBar>
  );
}

export const ItemsCategoryActionsBar = compose(
  withDialogActions,
  withItemCategories(
    ({ itemsCategoriesTableState, itemsCategoriesSelectedRows }) => ({
      itemsCategoriesSelectedRows,
      categoriesFilterConditions: itemsCategoriesTableState.filterRoles,
    }),
  ),
  withAlertActions,
  withItemCategoriesActions,
)(ItemsCategoryActionsBarInner);
