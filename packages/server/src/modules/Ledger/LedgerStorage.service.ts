import { Knex } from 'knex';
import { Inject, Injectable } from '@nestjs/common';
import { ILedger, ILedgerEntry } from './types/Ledger.types';
import { LedgerContactsBalanceStorage } from './LedgerContactStorage.service';
import { LedegrAccountsStorage } from './LedgetAccountStorage.service';
import { LedgerEntriesStorageService } from './LedgerEntriesStorage.service';
import { AccountTransaction } from '../Accounts/models/AccountTransaction.model';
import { Ledger } from './Ledger';
import { TenantModelProxy } from '../System/models/TenantBaseModel';
import { Account } from '../Accounts/models/Account.model';
import { UnitOfWork } from '../Tenancy/TenancyDB/UnitOfWork.service';
import { TenancyContext } from '../Tenancy/TenancyContext.service';
import { ServiceError } from '../Items/ServiceError';
import {
  fromCurrencyMinorUnits,
  roundCurrency,
  toCurrencyMinorUnits,
} from '@/utils/money';
import { uniq } from 'lodash';

@Injectable()
export class LedgerStorageService {
  /**
   * @param {LedgerContactsBalanceStorage} ledgerContactsBalance - Ledger contacts balance storage.
   * @param {LedegrAccountsStorage} ledgerAccountsBalance - Ledger accounts balance storage.
   * @param {LedgerEntriesStorageService} ledgerEntriesService - Ledger entries storage service.
   */
  constructor(
    private ledgerContactsBalance: LedgerContactsBalanceStorage,
    private ledgerAccountsBalance: LedegrAccountsStorage,
    private ledgerEntriesService: LedgerEntriesStorageService,
    private readonly uow: UnitOfWork,
    private readonly tenancyContext: TenancyContext,

    @Inject(AccountTransaction.name)
    private accountTransactionModel: TenantModelProxy<
      typeof AccountTransaction
    >,

    @Inject(Account.name)
    private accountModel: TenantModelProxy<typeof Account>,
  ) {}

  /**
   * Normalizes monetary amounts and replaces caller-supplied account normals
   * with the authoritative values stored on the chart of accounts.
   */
  private normalizeLedger = async (
    ledger: ILedger,
    trx: Knex.Transaction,
    requireBalanced: boolean,
  ): Promise<Ledger> => {
    const tenantMeta = await this.tenancyContext.getTenantMetadata();
    const baseCurrency = tenantMeta?.baseCurrency;
    const accountIds = uniq(
      ledger
        .getEntries()
        .map((entry) => entry.accountId)
        .filter((accountId): accountId is number => Boolean(accountId)),
    );
    const accounts = await this.accountModel()
      .query(trx)
      .whereIn('id', accountIds);
    const accountsMap = new Map(
      accounts.map((account) => [account.id, account]),
    );

    if (accounts.length !== accountIds.length) {
      throw new ServiceError(
        'LEDGER_ACCOUNT_NOT_FOUND',
        'One or more ledger accounts do not exist.',
      );
    }
    let rawDebitTotal = 0;
    let rawCreditTotal = 0;
    let normalizedEntries = ledger.getEntries().map((entry): ILedgerEntry => {
      const account = accountsMap.get(entry.accountId);

      if (!account) {
        throw new ServiceError(
          'LEDGER_ACCOUNT_NOT_FOUND',
          `Ledger account ${entry.accountId} does not exist.`,
        );
      }
      const rawDebit = Number(entry.debit || 0);
      const rawCredit = Number(entry.credit || 0);
      const exchangeRate = Number(entry.exchangeRate || 1);

      if (!Number.isFinite(rawDebit) || !Number.isFinite(rawCredit)) {
        throw new ServiceError(
          'LEDGER_INVALID_AMOUNT',
          'Ledger debit and credit amounts must be finite numbers.',
        );
      }
      if (rawDebit < 0 || rawCredit < 0) {
        throw new ServiceError(
          'LEDGER_NEGATIVE_AMOUNT',
          'Ledger debit and credit amounts must not be negative.',
        );
      }
      if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
        throw new ServiceError(
          'LEDGER_INVALID_EXCHANGE_RATE',
          'Ledger exchange rates must be positive finite numbers.',
        );
      }
      const debit = roundCurrency(rawDebit, baseCurrency);
      const credit = roundCurrency(rawCredit, baseCurrency);

      if (debit > 0 && credit > 0) {
        throw new ServiceError(
          'LEDGER_ENTRY_TWO_SIDED',
          'A ledger entry cannot contain both a debit and a credit.',
        );
      }
      rawDebitTotal += rawDebit;
      rawCreditTotal += rawCredit;
      return {
        ...entry,
        debit,
        credit,
        exchangeRate,
        accountNormal: account.accountNormal,
      };
    });

    if (requireBalanced) {
      // Validate the source journal before rounding. A later rounding residual
      // may be distributed, but a genuinely unbalanced source journal may not.
      if (Math.abs(rawDebitTotal - rawCreditTotal) > 0.000001) {
        throw new ServiceError(
          'LEDGER_UNBALANCED',
          'Ledger debits and credits must be equal.',
          {
            debit: rawDebitTotal,
            credit: rawCreditTotal,
            currencyCode: baseCurrency,
          },
        );
      }
      const postingEntries = normalizedEntries.filter(
        (entry) => entry.debit > 0 || entry.credit > 0,
      );
      if (postingEntries.length < 2) {
        throw new ServiceError(
          'LEDGER_EMPTY',
          'A ledger posting must contain at least two non-zero entries.',
        );
      }
      let normalizedLedger = new Ledger(normalizedEntries);
      let totalDebit = toCurrencyMinorUnits(
        normalizedLedger.getClosingDebit(),
        baseCurrency,
      );
      let totalCredit = toCurrencyMinorUnits(
        normalizedLedger.getClosingCredit(),
        baseCurrency,
      );

      // Rounding multiple four-decimal lines to the currency minor unit can
      // create a residual even when the source journal is exactly balanced.
      // Allocate it to a non-control posting rather than changing AR or AP.
      const residual = totalDebit - totalCredit;
      if (residual !== 0 && Math.abs(residual) <= postingEntries.length) {
        const candidates = normalizedEntries
          .map((entry, index) => ({ entry, index }))
          .filter(({ entry }) => {
            const account = accountsMap.get(entry.accountId);

            return (
              (entry.debit > 0 || entry.credit > 0) &&
              !entry.contactId &&
              !['accounts-receivable', 'accounts-payable'].includes(
                account?.accountType,
              )
            );
          })
          .sort((left, right) => {
            const primaryEntryPriority =
              Number(left.entry.index === 1) - Number(right.entry.index === 1);

            return primaryEntryPriority !== 0
              ? primaryEntryPriority
              : right.entry.debit +
                  right.entry.credit -
                  (left.entry.debit + left.entry.credit);
          });
        const adjustment = fromCurrencyMinorUnits(residual, baseCurrency);
        const candidate = candidates.find(({ entry }) =>
          entry.debit > 0
            ? entry.debit - adjustment >= 0
            : entry.credit + adjustment >= 0,
        );

        if (candidate) {
          normalizedEntries = normalizedEntries.map((entry, index) => {
            if (index !== candidate.index) return entry;

            return entry.debit > 0
              ? {
                  ...entry,
                  debit: roundCurrency(entry.debit - adjustment, baseCurrency),
                }
              : {
                  ...entry,
                  credit: roundCurrency(
                    entry.credit + adjustment,
                    baseCurrency,
                  ),
                };
          });
          normalizedLedger = new Ledger(normalizedEntries);
          totalDebit = toCurrencyMinorUnits(
            normalizedLedger.getClosingDebit(),
            baseCurrency,
          );
          totalCredit = toCurrencyMinorUnits(
            normalizedLedger.getClosingCredit(),
            baseCurrency,
          );
        }
      }

      if (totalDebit !== totalCredit) {
        throw new ServiceError(
          'LEDGER_UNBALANCED',
          'Ledger debits and credits must be equal.',
          {
            debit: normalizedLedger.getClosingDebit(),
            credit: normalizedLedger.getClosingCredit(),
            currencyCode: baseCurrency,
          },
        );
      }
    }
    return new Ledger(normalizedEntries);
  };

  private commitWithinTransaction = async (
    ledger: ILedger,
    trx: Knex.Transaction,
  ): Promise<void> => {
    const normalizedLedger = await this.normalizeLedger(ledger, trx, true);
    const tasks = [
      this.ledgerEntriesService.saveEntries(normalizedLedger, trx),
      this.ledgerAccountsBalance.saveAccountsBalance(normalizedLedger, trx),
      this.ledgerContactsBalance.saveContactsBalance(normalizedLedger, trx),
    ];
    await Promise.all(tasks);
  };

  /**
   * Commit the ledger to the storage layer as one unit-of-work.
   * @param {ILedger} ledger
   * @returns {Promise<void>}
   */
  public commit = async (
    ledger: ILedger,
    trx?: Knex.Transaction,
  ): Promise<void> => {
    if (trx) return this.commitWithinTransaction(ledger, trx);

    await this.uow.withTransaction((innerTrx) =>
      this.commitWithinTransaction(ledger, innerTrx),
    );
  };

  /**
   * Deletes the given ledger and revert balances.
   * @param {number} tenantId
   * @param {ILedger} ledger
   * @param {Knex.Transaction} trx
   * @returns {Promise<void>}
   */
  public delete = async (ledger: ILedger, trx?: Knex.Transaction) => {
    if (!trx) {
      return this.uow.withTransaction((innerTrx) =>
        this.delete(ledger, innerTrx),
      );
    }
    const normalizedLedger = await this.normalizeLedger(ledger, trx, false);
    const tasks = [
      // Deletes the ledger entries.
      this.ledgerEntriesService.deleteEntries(normalizedLedger, trx),

      // Mutates the associated accounts balances.
      this.ledgerAccountsBalance.saveAccountsBalance(normalizedLedger, trx),

      // Mutates the associated contacts balances.
      this.ledgerContactsBalance.saveContactsBalance(normalizedLedger, trx),
    ];
    await Promise.all(tasks);
  };

  /**
   * Deletes the ledger entries by the given reference.
   * @param {number | number[]} referenceId - The reference ID.
   * @param {string | string[]} referenceType - The reference type.
   * @param {Knex.Transaction} trx - The knex transaction.
   */
  public deleteByReference = async (
    referenceId: number | number[],
    referenceType: string | string[],
    trx?: Knex.Transaction,
  ) => {
    if (!trx) {
      return this.uow.withTransaction((innerTrx) =>
        this.deleteByReference(referenceId, referenceType, innerTrx),
      );
    }
    // Retrieves the transactions of the given reference.
    const transactions = await this.accountTransactionModel()
      .query(trx)
      .modify('filterByReference', referenceId, referenceType)
      .withGraphFetched('account');

    // Creates a new ledger from transaction and reverse the entries.
    const reversedLedger = Ledger.fromTransactions(transactions).reverse();

    // Deletes and reverts the balances.
    await this.delete(reversedLedger, trx);
  };
}
