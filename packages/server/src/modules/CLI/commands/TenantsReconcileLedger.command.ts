import { Injectable } from '@nestjs/common';
import { Command, Option } from 'nest-commander';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import { ACCOUNT_TYPES } from '@/constants/accounts';
import { BaseCommand } from './BaseCommand';

interface ReconcileOptions {
  tenant_id?: string;
  fix?: boolean;
}

interface ReconcileResult {
  organizationId: string;
  unbalancedTransactions: any[];
  invalidLedgerRows: any[];
  orphanLedgerRows: any[];
  duplicateDocumentNumbers: any[];
  accountCacheMismatches: any[];
  contactCacheMismatches: any[];
  documentCacheMismatches: any[];
  itemQuantityMismatches: any[];
  fixed: boolean;
}

const EPSILON = 0.0005;
const numberValue = (value: unknown) => Number(value || 0);
const differs = (left: unknown, right: unknown) =>
  Math.abs(numberValue(left) - numberValue(right)) >= EPSILON;

@Injectable()
@Command({
  name: 'tenants:reconcile-ledger',
  description:
    'Audit journal integrity and derived accounting balances; optionally rebuild safe caches.',
})
export class TenantsReconcileLedgerCommand extends BaseCommand {
  constructor(configService: ConfigService) {
    super(configService);
  }

  @Option({
    flags: '-t, --tenant_id [tenant_id]',
    description: 'Only reconcile this organization id.',
  })
  parseTenantId(value: string): string {
    return value;
  }

  @Option({
    flags: '--fix',
    description:
      'Rebuild account, contact, document, and inventory quantity caches.',
  })
  parseFix(): boolean {
    return true;
  }

  async run(_passedParams: string[], options: ReconcileOptions): Promise<void> {
    const systemKnex = this.initSystemKnex();
    const tenantConnections: Knex[] = [];

    try {
      let tenants = await this.getAllInitializedTenants(systemKnex);
      if (options.tenant_id) {
        tenants = tenants.filter(
          (tenant: any) => tenant.organizationId === options.tenant_id,
        );
        if (tenants.length === 0) {
          this.exit(`Tenant ${options.tenant_id} does not exist.`);
        }
      }

      let hasIssues = false;
      for (const tenant of tenants) {
        const metadata = await systemKnex('tenantsMetadata')
          .where({ tenantId: tenant.id })
          .first();
        if (!metadata?.baseCurrency) {
          throw new Error(
            `Tenant ${tenant.organizationId} has no configured base currency.`,
          );
        }
        const tenantKnex = this.initTenantKnex(tenant.organizationId);
        tenantConnections.push(tenantKnex);

        const result = await this.reconcileTenant(
          tenantKnex,
          tenant.organizationId,
          metadata.baseCurrency,
          Boolean(options.fix),
        );
        hasIssues = hasIssues || this.resultHasIssues(result);
        this.printResult(result);
      }

      await Promise.all(
        tenantConnections.map((connection) => connection.destroy()),
      );
      await systemKnex.destroy();

      if (hasIssues) {
        this.exit(
          options.fix
            ? 'Reconciliation completed, but journal-integrity issues still require review.'
            : 'Reconciliation found differences. Review the report or rerun with --fix for safe derived caches.',
        );
      }
      this.success('Accounting reconciliation completed with no differences.');
    } catch (error) {
      await Promise.all(
        tenantConnections.map((connection) => connection.destroy()),
      );
      await systemKnex.destroy();
      this.exit(error);
    }
  }

  private async reconcileTenant(
    knex: Knex,
    organizationId: string,
    baseCurrency: string,
    fix: boolean,
  ): Promise<ReconcileResult> {
    const [
      unbalancedTransactions,
      invalidLedgerRows,
      orphanLedgerRows,
      duplicateDocumentNumbers,
      accountState,
      contactState,
      documentState,
      itemState,
    ] = await Promise.all([
      this.findUnbalancedTransactions(knex),
      this.findInvalidLedgerRows(knex),
      this.findOrphanLedgerRows(knex),
      this.findDuplicateDocumentNumbers(knex),
      this.getAccountCacheState(knex, baseCurrency),
      this.getContactCacheState(knex, baseCurrency),
      this.getDocumentCacheState(knex),
      this.getItemQuantityState(knex),
    ]);

    const integrityErrors =
      unbalancedTransactions.length +
      invalidLedgerRows.length +
      orphanLedgerRows.length;

    if (fix && integrityErrors > 0) {
      throw new Error(
        `Refusing to rebuild ${organizationId} caches from an invalid ledger (${integrityErrors} integrity errors).`,
      );
    }
    if (fix) {
      await knex.transaction(async (trx) => {
        await this.applyCacheRepairs(
          trx,
          accountState,
          contactState,
          documentState,
          itemState,
        );
      });
    }

    return {
      organizationId,
      unbalancedTransactions,
      invalidLedgerRows,
      orphanLedgerRows,
      duplicateDocumentNumbers,
      accountCacheMismatches: accountState.mismatches,
      contactCacheMismatches: contactState.mismatches,
      documentCacheMismatches: documentState.mismatches,
      itemQuantityMismatches: itemState.mismatches,
      fixed: fix,
    };
  }

  private async findUnbalancedTransactions(knex: Knex) {
    const groups = await knex('accountsTransactions')
      .select('referenceType', 'referenceId')
      .sum({ debit: 'debit', credit: 'credit' })
      .groupBy('referenceType', 'referenceId');

    return groups
      .filter((row) => differs(row.debit, row.credit))
      .map((row) => ({
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        debit: numberValue(row.debit),
        credit: numberValue(row.credit),
        difference: numberValue(row.debit) - numberValue(row.credit),
      }));
  }

  private findInvalidLedgerRows(knex: Knex) {
    return knex('accountsTransactions')
      .select('id', 'referenceType', 'referenceId', 'debit', 'credit')
      .where((query) => {
        query
          .where('debit', '<', 0)
          .orWhere('credit', '<', 0)
          .orWhere((bothSides) => {
            bothSides.where('debit', '>', 0).where('credit', '>', 0);
          })
          .orWhere((blank) => {
            blank.where('debit', 0).where('credit', 0);
          });
      });
  }

  private findOrphanLedgerRows(knex: Knex) {
    return knex('accountsTransactions as transaction')
      .leftJoin('accounts as account', 'account.id', 'transaction.accountId')
      .whereNull('account.id')
      .select(
        'transaction.id',
        'transaction.referenceType',
        'transaction.referenceId',
        'transaction.accountId',
      );
  }

  private async findDuplicateDocumentNumbers(knex: Knex) {
    const definitions: Array<[string, string]> = [
      ['salesInvoices', 'invoiceNo'],
      ['bills', 'billNumber'],
      ['salesReceipts', 'receiptNumber'],
      ['paymentReceives', 'paymentReceiveNo'],
      ['billsPayments', 'paymentNumber'],
      ['creditNotes', 'creditNoteNumber'],
      ['vendorCredits', 'vendorCreditNumber'],
      ['manualJournals', 'journalNumber'],
      ['salesEstimates', 'estimateNumber'],
    ];
    const results = await Promise.all(
      definitions.map(async ([tableName, columnName]) => {
        const duplicates = await knex(tableName)
          .select(columnName)
          .count({ count: 'id' })
          .whereNotNull(columnName)
          .whereNot(columnName, '')
          .groupBy(columnName)
          .havingRaw('COUNT(`id`) > 1');
        return duplicates.map((row) => ({
          tableName,
          columnName,
          value: row[columnName],
          count: numberValue(row.count),
        }));
      }),
    );
    return results.flat();
  }

  private async getAccountCacheState(knex: Knex, baseCurrency: string) {
    const accounts = await knex('accounts').select(
      'id',
      'parentAccountId',
      'accountType',
      'currencyCode',
      'amount',
    );
    const totals = await knex('accountsTransactions')
      .select('accountId', 'currencyCode')
      .sum({ debit: 'debit', credit: 'credit' })
      .sum({
        foreignDebit: knex.raw(
          '`debit` / NULLIF(COALESCE(`exchange_rate`, 1), 0)',
        ),
        foreignCredit: knex.raw(
          '`credit` / NULLIF(COALESCE(`exchange_rate`, 1), 0)',
        ),
      })
      .groupBy('accountId', 'currencyCode');
    const accountTypes = new Map(
      ACCOUNT_TYPES.map((accountType) => [accountType.key, accountType]),
    );
    const children = new Map<number, number[]>();
    accounts.forEach((account) => {
      if (!account.parentAccountId) return;
      children.set(account.parentAccountId, [
        ...(children.get(account.parentAccountId) || []),
        account.id,
      ]);
    });
    const totalsByAccount = new Map<number, any[]>();
    totals.forEach((total) => {
      totalsByAccount.set(total.accountId, [
        ...(totalsByAccount.get(total.accountId) || []),
        total,
      ]);
    });
    const descendants = (accountId: number, path = new Set<number>()) => {
      if (path.has(accountId)) {
        throw new Error(`Circular account hierarchy detected at ${accountId}.`);
      }
      const nextPath = new Set(path).add(accountId);
      return (children.get(accountId) || []).flatMap((childId) => [
        childId,
        ...descendants(childId, nextPath),
      ]);
    };

    const expected = new Map<number, number>();
    accounts.forEach((account) => {
      const accountIds = [account.id, ...descendants(account.id)];
      const rows = accountIds.flatMap((id) => totalsByAccount.get(id) || []);
      const isForeign =
        account.currencyCode && account.currencyCode !== baseCurrency;
      const selectedRows = isForeign
        ? rows.filter((row) => row.currencyCode === account.currencyCode)
        : rows;
      const debit = selectedRows.reduce(
        (total, row) =>
          total + numberValue(isForeign ? row.foreignDebit : row.debit),
        0,
      );
      const credit = selectedRows.reduce(
        (total, row) =>
          total + numberValue(isForeign ? row.foreignCredit : row.credit),
        0,
      );
      const normal = accountTypes.get(account.accountType)?.normal;
      if (!normal) {
        throw new Error(`Unknown account type ${account.accountType}.`);
      }
      expected.set(
        account.id,
        normal === 'credit' ? credit - debit : debit - credit,
      );
    });

    return {
      expected,
      mismatches: accounts
        .filter((account) => differs(account.amount, expected.get(account.id)))
        .map((account) => ({
          id: account.id,
          stored: numberValue(account.amount),
          expected: expected.get(account.id),
        })),
    };
  }

  private async getContactCacheState(knex: Knex, baseCurrency: string) {
    const contacts = await knex('contacts').select(
      'id',
      'contactService',
      'currencyCode',
      'balance',
    );
    const totals = await knex('accountsTransactions as transaction')
      .join('accounts as account', 'account.id', 'transaction.accountId')
      .whereNotNull('transaction.contactId')
      .whereIn('account.accountType', [
        'accounts-receivable',
        'accounts-payable',
      ])
      .select('transaction.contactId', 'transaction.currencyCode')
      .sum({ debit: 'transaction.debit', credit: 'transaction.credit' })
      .sum({
        foreignDebit: knex.raw(
          '`transaction`.`debit` / NULLIF(COALESCE(`transaction`.`exchange_rate`, 1), 0)',
        ),
        foreignCredit: knex.raw(
          '`transaction`.`credit` / NULLIF(COALESCE(`transaction`.`exchange_rate`, 1), 0)',
        ),
      })
      .groupBy('transaction.contactId', 'transaction.currencyCode');
    const byContact = new Map<number, any[]>();
    totals.forEach((total) => {
      byContact.set(total.contactId, [
        ...(byContact.get(total.contactId) || []),
        total,
      ]);
    });
    const expected = new Map<number, number>();
    contacts.forEach((contact) => {
      const isForeign =
        contact.currencyCode && contact.currencyCode !== baseCurrency;
      const rows = (byContact.get(contact.id) || []).filter(
        (row) => !isForeign || row.currencyCode === contact.currencyCode,
      );
      const debit = rows.reduce(
        (total, row) =>
          total + numberValue(isForeign ? row.foreignDebit : row.debit),
        0,
      );
      const credit = rows.reduce(
        (total, row) =>
          total + numberValue(isForeign ? row.foreignCredit : row.credit),
        0,
      );
      expected.set(
        contact.id,
        contact.contactService === 'vendor' ? credit - debit : debit - credit,
      );
    });
    return {
      expected,
      mismatches: contacts
        .filter((contact) => differs(contact.balance, expected.get(contact.id)))
        .map((contact) => ({
          id: contact.id,
          stored: numberValue(contact.balance),
          expected: expected.get(contact.id),
        })),
    };
  }

  private async getDocumentCacheState(knex: Knex) {
    const definitions: Array<{
      table: string;
      fields: Array<[string, string, string]>;
    }> = [
      {
        table: 'salesInvoices',
        fields: [
          ['paymentAmount', 'paymentReceivesEntries', 'invoiceId'],
          ['creditedAmount', 'creditNoteAppliedInvoice', 'invoiceId'],
        ],
      },
      {
        table: 'bills',
        fields: [
          ['paymentAmount', 'billsPaymentsEntries', 'billId'],
          ['creditedAmount', 'vendorCreditAppliedBill', 'billId'],
        ],
      },
      {
        table: 'creditNotes',
        fields: [
          ['refundedAmount', 'refundCreditNoteTransactions', 'creditNoteId'],
          ['invoicesAmount', 'creditNoteAppliedInvoice', 'creditNoteId'],
        ],
      },
      {
        table: 'vendorCredits',
        fields: [
          [
            'refundedAmount',
            'refundVendorCreditTransactions',
            'vendorCreditId',
          ],
          ['invoicedAmount', 'vendorCreditAppliedBill', 'vendorCreditId'],
        ],
      },
    ];
    const repairs: Array<{
      table: string;
      id: number;
      values: Record<string, number>;
    }> = [];
    const mismatches = [];

    for (const definition of definitions) {
      const documents: any[] = await knex(definition.table).select([
        'id',
        ...definition.fields.map(([field]) => field),
      ]);
      const expectedByField = new Map<string, Map<number, number>>();
      for (const [field, sourceTable, sourceKey] of definition.fields) {
        const rows = await knex(sourceTable)
          .select(sourceKey)
          .sum({ amount: 'amount' })
          .groupBy(sourceKey);
        expectedByField.set(
          field,
          new Map(rows.map((row) => [row[sourceKey], numberValue(row.amount)])),
        );
      }
      documents.forEach((document) => {
        const values: Record<string, number> = {};
        definition.fields.forEach(([field]) => {
          const expected = expectedByField.get(field)?.get(document.id) || 0;
          if (differs(document[field], expected)) {
            values[field] = expected;
            mismatches.push({
              table: definition.table,
              id: document.id,
              field,
              stored: numberValue(document[field]),
              expected,
            });
          }
        });
        if (Object.keys(values).length > 0) {
          repairs.push({ table: definition.table, id: document.id, values });
        }
      });
    }
    return { repairs, mismatches };
  }

  private async getItemQuantityState(knex: Knex) {
    const items = await knex('items')
      .select('id', 'quantityOnHand')
      .where('type', 'inventory');
    const totals = await knex('inventoryTransactions')
      .select('itemId')
      .sum({
        quantityOnHand: knex.raw(
          "CASE WHEN `direction` = 'IN' THEN `quantity` ELSE -`quantity` END",
        ),
      })
      .groupBy('itemId');
    const expected = new Map(
      totals.map((row) => [row.itemId, numberValue(row.quantityOnHand)]),
    );
    return {
      expected,
      mismatches: items
        .filter((item) =>
          differs(item.quantityOnHand, expected.get(item.id) || 0),
        )
        .map((item) => ({
          id: item.id,
          stored: numberValue(item.quantityOnHand),
          expected: expected.get(item.id) || 0,
        })),
    };
  }

  private async applyCacheRepairs(
    trx: Knex.Transaction,
    accountState,
    contactState,
    documentState,
    itemState,
  ) {
    for (const mismatch of accountState.mismatches) {
      await trx('accounts')
        .where('id', mismatch.id)
        .update({
          amount: accountState.expected.get(mismatch.id),
        });
    }
    for (const mismatch of contactState.mismatches) {
      await trx('contacts')
        .where('id', mismatch.id)
        .update({
          balance: contactState.expected.get(mismatch.id),
        });
    }
    for (const repair of documentState.repairs) {
      await trx(repair.table).where('id', repair.id).update(repair.values);
    }
    for (const mismatch of itemState.mismatches) {
      await trx('items')
        .where('id', mismatch.id)
        .update({
          quantityOnHand: itemState.expected.get(mismatch.id) || 0,
        });
    }
  }

  private resultHasIssues(result: ReconcileResult) {
    if (result.fixed) {
      return (
        result.unbalancedTransactions.length > 0 ||
        result.invalidLedgerRows.length > 0 ||
        result.orphanLedgerRows.length > 0 ||
        result.duplicateDocumentNumbers.length > 0
      );
    }
    return Object.entries(result).some(
      ([key, value]) =>
        key !== 'organizationId' &&
        key !== 'fixed' &&
        Array.isArray(value) &&
        value.length > 0,
    );
  }

  private printResult(result: ReconcileResult) {
    const summary = {
      organizationId: result.organizationId,
      fixed: result.fixed,
      unbalancedTransactions: result.unbalancedTransactions.length,
      invalidLedgerRows: result.invalidLedgerRows.length,
      orphanLedgerRows: result.orphanLedgerRows.length,
      duplicateDocumentNumbers: result.duplicateDocumentNumbers.length,
      accountCacheMismatches: result.accountCacheMismatches.length,
      contactCacheMismatches: result.contactCacheMismatches.length,
      documentCacheMismatches: result.documentCacheMismatches.length,
      itemQuantityMismatches: result.itemQuantityMismatches.length,
    };
    this.log(JSON.stringify(summary, null, 2));
    if (result.unbalancedTransactions.length > 0) {
      this.log(
        `Unbalanced transactions (first 20): ${JSON.stringify(
          result.unbalancedTransactions.slice(0, 20),
          null,
          2,
        )}`,
      );
    }
    if (result.duplicateDocumentNumbers.length > 0) {
      this.log(
        `Duplicate numbers: ${JSON.stringify(
          result.duplicateDocumentNumbers,
          null,
          2,
        )}`,
      );
    }
  }
}
