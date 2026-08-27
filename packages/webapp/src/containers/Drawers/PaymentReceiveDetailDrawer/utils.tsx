import React from 'react';
import intl from 'react-intl-universal';
import { usePaymentReceiveDetailContext } from './PaymentReceiveDetailProvider';
import { getColumnWidth } from '@/utils';

/**
 * Retrieve payment entries table columns.
 */
export const usePaymentReceiveEntriesColumns = () => {
  const { paymentReceive } = usePaymentReceiveDetailContext();
  const entries = paymentReceive?.entries ?? [];

  return React.useMemo(
    () => [
      {
        Header: intl.get('date'),
        accessor: 'invoice.invoiceDateFormatted',
        width: 100,
        className: 'date',
        disableSortBy: true,
      },
      {
        Header: intl.get('invoice_no'),
        accessor: 'invoice.invoiceNo',
        width: 150,
        className: 'invoice_number',
        disableSortBy: true,
      },
      {
        Header: intl.get('invoice_amount'),
        accessor: 'invoice.totalFormatted',
        width: getColumnWidth(entries, 'invoice.totalFormatted', {
          minWidth: 60,
          magicSpacing: 5,
        }),
        align: 'right',
        textOverview: true,
      },
      {
        Header: intl.get('amount_due'),
        accessor: 'invoice.dueAmountFormatted',
        align: 'right',
        width: getColumnWidth(entries, 'invoice.dueAmountFormatted', {
          minWidth: 60,
          magicSpacing: 5,
        }),
        disableSortBy: true,
        textOverview: true,
      },
      {
        Header: intl.get('payment_amount'),
        accessor: 'paymentAmountFormatted',
        align: 'right',
        width: getColumnWidth(entries, 'paymentAmountFormatted', {
          minWidth: 60,
          magicSpacing: 5,
        }),
        disableSortBy: true,
        textOverview: true,
      },
    ],
    [entries],
  );
};
