import { Knex } from 'knex';
import { uniq } from 'lodash';
import { ILedger } from './types/Ledger.types';
import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../Accounts/models/Account.model';
import { AccountRepository } from '../Accounts/repositories/Account.repository';
import { TenancyContext } from '../Tenancy/TenancyContext.service';
import { TenantModelProxy } from '../System/models/TenantBaseModel';

@Injectable()
export class LedegrAccountsStorage {
  /**
   * @param {typeof Account} accountModel
   * @param {AccountRepository} accountRepository -
   */
  constructor(
    private tenancyContext: TenancyContext,
    private accountRepository: AccountRepository,

    @Inject(Account.name)
    private accountModel: TenantModelProxy<typeof Account>,
  ) {}

  /**
   * Retrieve depepants ids of the give accounts ids.
   * @param {number[]} accountsIds
   * @param depGraph
   * @returns {number[]}
   */
  private getDependantsAccountsIds = (
    accountsIds: number[],
    depGraph,
  ): number[] => {
    const depAccountsIds = [];

    accountsIds.forEach((accountId: number) => {
      const depAccountIds = depGraph.dependantsOf(accountId);
      depAccountsIds.push(accountId, ...depAccountIds);
    });
    return uniq(depAccountsIds);
  };

  /**
   * Finds the dependant accounts ids.
   * @param {number[]} accountsIds
   * @returns {number[]}
   */
  /** Atomic mutation for direct accounts and every affected parent balance. */
  public saveAccountsBalance = async (
    ledger: ILedger,
    trx?: Knex.Transaction,
  ): Promise<void> => {
    const accountsGraph = await this.accountRepository.getDependencyGraph(
      null,
      trx,
    );
    const affectedAccountIds = this.getDependantsAccountsIds(
      ledger.getAccountsIds(),
      accountsGraph,
    ).sort((left, right) => left - right);

    // Acquire account row locks in a stable order across concurrent postings.
    for (const accountId of affectedAccountIds) {
      const descendantAccountIds = accountsGraph.dependenciesOf(accountId);
      await this.saveAccountBalanceFromLedger(
        ledger,
        accountId,
        uniq([accountId, ...descendantAccountIds]),
        trx,
      );
    }
  };

  /**
   * Saves specific account balance from the given ledger.
   * @param   {number} tenantId
   * @param   {ILedger} ledger
   * @param   {number} accountId
   * @param   {Knex.Transaction} trx -
   * @returns {Promise<void>}
   */
  private saveAccountBalanceFromLedger = async (
    ledger: ILedger,
    accountId: number,
    rolledUpAccountIds: number[],
    trx?: Knex.Transaction,
  ): Promise<void> => {
    const account = await this.accountModel().query(trx).findById(accountId);

    // A parent balance includes every entry posted to its descendants.
    const accountLedger = ledger.whereAccountsIds(rolledUpAccountIds);

    // Retrieves the given tenant metadata.
    const tenant = await this.tenancyContext.getTenant(true);

    // Detarmines whether the account has foreign currency.
    const isAccountForeign =
      account.currencyCode !== tenant.metadata?.baseCurrency;

    // Calculates the closing foreign balance by the given currency if account was has
    // foreign currency otherwise get closing balance.
    const accountEntries = accountLedger.getEntries();
    const closingBalance = isAccountForeign
      ? accountEntries
          .filter((entry) => entry.currencyCode === account.currencyCode)
          .reduce((balance, entry) => {
            const exchangeRate = entry.exchangeRate || 1;
            const amount =
              account.accountNormal === 'credit'
                ? entry.credit - entry.debit
                : entry.debit - entry.credit;

            return balance + amount / exchangeRate;
          }, 0)
      : accountEntries.reduce((balance, entry) => {
          const amount =
            account.accountNormal === 'credit'
              ? entry.credit - entry.debit
              : entry.debit - entry.credit;

          return balance + amount;
        }, 0);

    await this.saveAccountBalance(accountId, closingBalance, trx);
  };

  /**
   * Saves the account balance.
   * @param {number} accountId
   * @param {number} change
   * @param {Knex.Transaction} trx -
   * @returns {Promise<void>}
   */
  private saveAccountBalance = async (
    accountId: number,
    change: number,
    trx?: Knex.Transaction,
  ) => {
    // Ensure the account has atleast zero in amount.
    await this.accountModel()
      .query(trx)
      .findById(accountId)
      .whereNull('amount')
      .patch({ amount: 0 });

    await this.accountModel()
      .query(trx)
      .changeAmount({ id: accountId }, 'amount', change);
  };
}
