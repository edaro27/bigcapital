// @ts-nocheck
import {
  Button,
  Classes,
  NavbarDivider,
  NavbarGroup,
  Alignment,
} from '@blueprintjs/core';
import React from 'react';
import { projectTranslations } from './common';
import { ProjectTransactionsSelect } from './components';
import { useProjectDetailContext } from './ProjectDetailProvider';
import {
  Icon,
  FormattedMessage as T,
  DashboardActionsBar,
} from '@/components';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { compose } from '@/utils';

/**
 * Project detail actions bar.
 * @returns
 */
function ProjectDetailActionsBarInner({
  // #withDialogActions
  openDialog,
}) {
  const { projectId } = useProjectDetailContext();
  // Handle new transaction button click.
  const handleNewTransactionBtnClick = ({ path }) => {
    switch (path) {
      case 'project_task':
        openDialog('project-task-form', { projectId });
        break;
      case 'invoincing':
        openDialog('project-invoicing-form');
        break;
      case 'expense':
        openDialog('project-expense-form', { projectId });
        break;
      case 'estimated_expense':
        openDialog('estimated-expense-form', { projectId });
    }
  };

  const handleEditProjectBtnClick = () => {
    openDialog('project-form', {
      projectId,
    });
  };
  const handleTimeEntryBtnClick = () => {
    openDialog('project-time-entry-form', {
      projectId,
    });
  };

  // Handle the refresh button click.
  const handleRefreshBtnClick = () => {};

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <ProjectTransactionsSelect
          transactions={projectTranslations}
          onItemSelect={handleNewTransactionBtnClick}
        />
        <NavbarDivider />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'time-24'} iconSize={16} />}
          text={<T id={'projcet_details.action.time_entry'} />}
          onClick={handleTimeEntryBtnClick}
        />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="pen-18" />}
          text={<T id={'projcet_details.action.edit_project'} />}
          onClick={handleEditProjectBtnClick}
        />
        <NavbarDivider />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'print-16'} iconSize={'16'} />}
          text={<T id={'print'} />}
        />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'file-import-16'} />}
          text={<T id={'import'} />}
        />
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon={'file-export-16'} iconSize={'16'} />}
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
export const ProjectDetailActionsBar = compose(withDialogActions)(
  ProjectDetailActionsBarInner,
);
