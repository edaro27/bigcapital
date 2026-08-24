import { Knex } from 'knex';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BankTransaction } from '@/modules/BankingTransactions/models/BankTransaction';
import { CreateExpense } from '@/modules/Expenses/commands/CreateExpense.service';
import { Inject } from '@nestjs/common';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { Injectable } from '@nestjs/common';
import { events } from '@/common/events/events';
import {
  ICashflowTransactionCategorizedPayload,
  ICategorizeCashflowTransactioDTO,
} from '../types/BankingCategorize.types';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UncategorizedBankTransaction } from '@/modules/BankingTransactions/models/UncategorizedBankTransaction';
import { DeleteCashflowTransaction } from '@/modules/BankingTransactions/commands/DeleteCashflowTransaction.service';
import { CreateExpenseDto } from '@/modules/Expenses/dtos/Expense.dto';

@Injectable()
export class CategorizeTransactionAsExpense {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly eventPublisher: EventEmitter2,
    private readonly createExpenseService: CreateExpense,
    private readonly deleteCashflowTransaction: DeleteCashflowTransaction,

    @Inject(BankTransaction.name)
    private readonly bankTransactionModel: TenantModelProxy<
      typeof BankTransaction
    >,

    @Inject(UncategorizedBankTransaction.name)
    private readonly uncategorizedBankTransactionModel: TenantModelProxy<
      typeof UncategorizedBankTransaction
    >,
  ) {}

  /**
   * Categorize the transaction as expense transaction.
   * @param {number} cashflowTransactionId
   * @param {CategorizeTransactionAsExpenseDTO} transactionDTO
   */
  public async categorize(
    cashflowTransactionId: number,
    transactionDTO: ICategorizeCashflowTransactioDTO,
  ) {
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const transaction = await this.bankTransactionModel()
        .query(trx)
        .findById(cashflowTransactionId)
        .forUpdate()
        .throwIfNotFound();

      // Triggers `onTransactionUncategorizing` event.
      await this.eventPublisher.emitAsync(
        events.cashflow.onTransactionCategorizingAsExpense,
        {
          trx,
        } as ICashflowTransactionCategorizedPayload,
      );
      const expenseDTO: CreateExpenseDto = {
        paymentDate: transactionDTO.date || transaction.date,
        paymentAccountId: transaction.cashflowAccountId,
        referenceNo: transactionDTO.referenceNo || transaction.referenceNo,
        description: transactionDTO.description || transaction.description,
        exchangeRate: transactionDTO.exchangeRate || transaction.exchangeRate,
        currencyCode: transactionDTO.currencyCode || transaction.currencyCode,
        publish: transaction.isPublished,
        branchId: transactionDTO.branchId || transaction.branchId,
        categories: [
          {
            index: 1,
            expenseAccountId: transactionDTO.creditAccountId,
            amount: transaction.amount,
            description:
              transactionDTO.description || transaction.description,
          },
        ],
      };
      const expenseTransaction = await this.createExpenseService.newExpense(
        expenseDTO,
        trx,
      );

      // Move the imported bank-feed links before deleting the temporary
      // cashflow transaction, then reverse its journal in the same UOW.
      await this.uncategorizedBankTransactionModel()
        .query(trx)
        .where({
          categorizeRefType: 'CashflowTransaction',
          categorizeRefId: cashflowTransactionId,
        })
        .patch({
          categorizeRefType: 'Expense',
          categorizeRefId: expenseTransaction.id,
        });
      await this.deleteCashflowTransaction.deleteCashflowTransaction(
        cashflowTransactionId,
        trx,
      );
      // Triggers `onTransactionUncategorized` event.
      await this.eventPublisher.emitAsync(
        events.cashflow.onTransactionCategorizedAsExpense,
        {
          expenseTransaction,
          trx,
        },
      );
      return expenseTransaction;
    });
  }
}
