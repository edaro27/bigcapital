import { BadRequestException } from '@nestjs/common';
import {
  SalesChannelsService,
  SalesChannelValidator,
} from './SalesChannels.service';

describe('SalesChannelValidator', () => {
  const findById = jest.fn();
  const service = { findById } as unknown as SalesChannelsService;
  const validator = new SalesChannelValidator(service);

  beforeEach(() => findById.mockReset());

  it('allows an invoice without a sales channel', async () => {
    await expect(validator.validateSelectable(null)).resolves.toBeUndefined();
    expect(findById).not.toHaveBeenCalled();
  });

  it('allows an active sales channel', async () => {
    findById.mockResolvedValue({ id: 2, active: true });

    await expect(validator.validateSelectable(2)).resolves.toBeUndefined();
  });

  it('rejects assigning an archived channel to another invoice', async () => {
    findById.mockResolvedValue({ id: 2, active: false });

    await expect(validator.validateSelectable(2, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('preserves an archived channel already assigned to the invoice', async () => {
    findById.mockResolvedValue({ id: 2, active: false });

    await expect(validator.validateSelectable(2, 2)).resolves.toBeUndefined();
  });
});
