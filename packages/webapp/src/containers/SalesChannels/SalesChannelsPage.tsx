import {
  Button,
  Card,
  Classes,
  HTMLTable,
  InputGroup,
  Intent,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import React from 'react';
import styled from 'styled-components';
import type { SalesChannel } from '@bigcapital/sdk-ts';
import {
  AppToaster,
  DashboardActionsBar,
  DashboardPageContent,
} from '@/components';
import {
  useArchiveSalesChannel,
  useCreateSalesChannel,
  useEditSalesChannel,
  useRestoreSalesChannel,
  useSalesChannels,
} from '@/hooks/query/sales-channels';

export function SalesChannelsPage() {
  const { data: salesChannels = [], isLoading } = useSalesChannels(true);
  const { mutateAsync: createChannel, isPending: isCreating } =
    useCreateSalesChannel();
  const { mutateAsync: editChannel } = useEditSalesChannel();
  const { mutateAsync: archiveChannel } = useArchiveSalesChannel();
  const { mutateAsync: restoreChannel } = useRestoreSalesChannel();
  const [newName, setNewName] = React.useState('');
  const [names, setNames] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    setNames(
      salesChannels.reduce(
        (result, channel) => ({ ...result, [channel.id]: channel.name }),
        {},
      ),
    );
  }, [salesChannels]);

  const notifyError = () =>
    AppToaster.show({
      message: 'The sales channel could not be saved.',
      intent: Intent.DANGER,
    });

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    try {
      await createChannel({ name });
      setNewName('');
      AppToaster.show({
        message: 'Sales channel added.',
        intent: Intent.SUCCESS,
      });
    } catch {
      notifyError();
    }
  };

  const handleSave = async (channel: SalesChannel) => {
    const name = names[channel.id]?.trim();
    if (!name || name === channel.name) return;

    try {
      await editChannel({ id: channel.id, body: { name } });
      AppToaster.show({
        message: 'Sales channel updated.',
        intent: Intent.SUCCESS,
      });
    } catch {
      notifyError();
    }
  };

  const handleToggleActive = async (channel: SalesChannel) => {
    try {
      if (channel.active) await archiveChannel(channel.id);
      else await restoreChannel(channel.id);
      AppToaster.show({
        message: channel.active
          ? 'Sales channel archived. Historical invoices are unchanged.'
          : 'Sales channel restored.',
        intent: Intent.SUCCESS,
      });
    } catch {
      notifyError();
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    const current = salesChannels[index];
    const target = salesChannels[targetIndex];
    if (!current || !target) return;

    try {
      await Promise.all([
        editChannel({
          id: current.id,
          body: { sortOrder: target.sortOrder },
        }),
        editChannel({
          id: target.id,
          body: { sortOrder: current.sortOrder },
        }),
      ]);
    } catch {
      notifyError();
    }
  };

  return (
    <>
      <DashboardActionsBar />
      <DashboardPageContent>
        <PageCard elevation={0}>
          <h2>Sales Channels</h2>
          <p className={Classes.TEXT_MUTED}>
            Manage the internal choices available on invoices. Archived channels
            remain attached to historical invoices and reports.
          </p>

          <AddRow>
            <InputGroup
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAdd();
              }}
              placeholder="New sales channel"
              maxLength={120}
            />
            <Button
              intent={Intent.PRIMARY}
              text="Add channel"
              onClick={handleAdd}
              loading={isCreating}
              disabled={!newName.trim()}
            />
          </AddRow>

          {isLoading ? (
            <LoadingRow>
              <Spinner size={24} />
            </LoadingRow>
          ) : (
            <ChannelsTable striped interactive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesChannels.map((channel, index) => (
                  <tr key={channel.id}>
                    <td>
                      <InputGroup
                        value={names[channel.id] ?? channel.name}
                        onChange={(event) =>
                          setNames((current) => ({
                            ...current,
                            [channel.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleSave(channel);
                        }}
                        disabled={!channel.active}
                        maxLength={120}
                      />
                    </td>
                    <td>
                      <Tag
                        intent={channel.active ? Intent.SUCCESS : Intent.NONE}
                      >
                        {channel.active ? 'Active' : 'Archived'}
                      </Tag>
                    </td>
                    <td>
                      <Button
                        minimal
                        small
                        icon="arrow-up"
                        aria-label={`Move ${channel.name} up`}
                        disabled={index === 0}
                        onClick={() => handleMove(index, -1)}
                      />
                      <Button
                        minimal
                        small
                        icon="arrow-down"
                        aria-label={`Move ${channel.name} down`}
                        disabled={index === salesChannels.length - 1}
                        onClick={() => handleMove(index, 1)}
                      />
                    </td>
                    <td>
                      {channel.active && (
                        <Button
                          small
                          text="Save"
                          onClick={() => handleSave(channel)}
                          disabled={
                            !names[channel.id]?.trim() ||
                            names[channel.id]?.trim() === channel.name
                          }
                        />
                      )}
                      <Button
                        minimal
                        small
                        intent={channel.active ? Intent.WARNING : Intent.NONE}
                        text={channel.active ? 'Archive' : 'Restore'}
                        onClick={() => handleToggleActive(channel)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </ChannelsTable>
          )}
        </PageCard>
      </DashboardPageContent>
    </>
  );
}

const PageCard = styled(Card)`
  max-width: 900px;
  padding: 24px;

  h2 {
    margin: 0 0 8px;
  }
`;

const AddRow = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto;
  gap: 10px;
  max-width: 560px;
  margin: 24px 0;
`;

const LoadingRow = styled.div`
  padding: 36px;
  display: flex;
  justify-content: center;
`;

const ChannelsTable = styled(HTMLTable)`
  width: 100%;

  th:nth-of-type(1) {
    width: 45%;
  }

  td:last-of-type {
    white-space: nowrap;
  }
`;
