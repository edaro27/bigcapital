import { AuditLogService } from './AuditLog.service';

describe('AuditLogService', () => {
  const createService = () => {
    const insert = jest.fn().mockResolvedValue(undefined);
    const query = jest.fn().mockReturnValue({ insert });
    const auditLogModel = jest.fn().mockReturnValue({ query });
    const cls = { get: jest.fn().mockReturnValue(null) };
    const tenantKnex = jest.fn().mockReturnValue({});
    const service = new AuditLogService(
      cls as any,
      auditLogModel as any,
      tenantKnex as any,
    );

    return { service, insert };
  };

  it('normalizes numeric route parameter IDs before inserting', async () => {
    const { service, insert } = createService();

    await service.record({
      action: 'deleted',
      subject: 'Customer',
      subjectId: '42',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: 42 }),
    );
  });

  it('rejects invalid subject IDs instead of writing malformed audit rows', async () => {
    const { service, insert } = createService();

    await expect(
      service.record({
        action: 'deleted',
        subject: 'Customer',
        subjectId: 'not-an-id',
      }),
    ).rejects.toThrow('Invalid audit log subject ID');
    expect(insert).not.toHaveBeenCalled();
  });
});
