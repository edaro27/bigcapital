import { Knex } from 'knex';
import {
  ICashflowTransactionUncategorizedPayload,
  ICashflowTransactionUncategorizingPayload,
} from '../types/BankingCategorize.types';
import { validateTransactionShouldBeCategorized } from '../../BankingTransactions/utils';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { events } from '@/common/events/events';
import { UncategorizedBankTransaction } from '../../BankingTransactions/models/UncategorizedBankTransaction';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { DeleteExpense } from '@/modules/Expenses/commands/DeleteExpense.service';

@Injectable()
export class UncategorizeBankTransactionService {
  constructor(
    private readonly eventPublisher: EventEmitter2,
    private readonly uow: UnitOfWork,
    private readonly deleteExpense: DeleteExpense,

    @Inject(UncategorizedBankTransaction.name)
    private readonly uncategorizedBankTransactionModel: TenantModelProxy<
      typeof UncategorizedBankTransaction
    >,
  ) {}

  /**
   * Uncategorizes the given cashflow transaction.
   * @param {number} cashflowTransactionId - The id of the cashflow transaction to be uncategorized.
   * @returns {Promise<Array<number>>}
   */
  public async uncategorize(
    uncategorizedTransactionId: number,
  ): Promise<Array<number>> {
    // Updates the transaction under UOW.
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const oldMainUncategorizedTransaction =
        await this.uncategorizedBankTransactionModel()
          .query(trx)
          .findById(uncategorizedTransactionId)
          .forUpdate()
          .throwIfNotFound();

      validateTransactionShouldBeCategorized(oldMainUncategorizedTransaction);
      const associatedUncategorizedTransactions =
        await this.uncategorizedBankTransactionModel()
          .query(trx)
          .where(
            'categorizeRefId',
            oldMainUncategorizedTransaction.categorizeRefId,
          )
          .where(
            'categorizeRefType',
            oldMainUncategorizedTransaction.categorizeRefType,
          )
          .whereNot('id', uncategorizedTransactionId)
          .forUpdate();
      const oldUncategorizedTransactions = [
        oldMainUncategorizedTransaction,
        ...associatedUncategorizedTransactions,
      ];
      const oldUncategoirzedTransactionsIds = oldUncategorizedTransactions.map(
        (transaction) => transaction.id,
      );

      // Triggers `onTransactionUncategorizing` event.
      await this.eventPublisher.emitAsync(
        events.cashflow.onTransactionUncategorizing,
        {
          uncategorizedTransactionId,
          oldUncategorizedTransactions,
          trx,
        } as ICashflowTransactionUncategorizingPayload,
      );
      if (oldMainUncategorizedTransaction.categorizeRefType === 'Expense') {
        await this.deleteExpense.deleteExpense(
          oldMainUncategorizedTransaction.categorizeRefId,
          trx,
        );
      }
      // Removes the ref relation with the related transaction.
      await this.uncategorizedBankTransactionModel()
        .query(trx)
        .whereIn('id', oldUncategoirzedTransactionsIds)
        .patch({
          categorized: false,
          categorizeRefId: null,
          categorizeRefType: null,
        });
      const uncategorizedTransactions =
        await this.uncategorizedBankTransactionModel()
          .query(trx)
          .whereIn('id', oldUncategoirzedTransactionsIds);
      // Triggers `onTransactionUncategorized` event.
      await this.eventPublisher.emitAsync(
        events.cashflow.onTransactionUncategorized,
        {
          uncategorizedTransactionId,
          oldMainUncategorizedTransaction,
          uncategorizedTransactions,
          oldUncategorizedTransactions,
          trx,
        } as ICashflowTransactionUncategorizedPayload,
      );
      return oldUncategoirzedTransactionsIds;
    });
  }
}
