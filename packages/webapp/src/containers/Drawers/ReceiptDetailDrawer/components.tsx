import { Intent, Tag } from '@blueprintjs/core';
import React from 'react';
import type { ReceiptDetail } from './ReceiptDetailDrawerProvider';
import { Choose, T } from '@/components';

interface ReceiptDetailsStatusProps {
  receipt: ReceiptDetail;
}

/**
 * Receipt details status.
 */
export function ReceiptDetailsStatus({ receipt }: ReceiptDetailsStatusProps) {
  return (
    <Choose>
      <Choose.When condition={receipt.isClosed}>
        <Tag round={true} intent={Intent.SUCCESS}>
          <T id={'closed'} />
        </Tag>
      </Choose.When>

      <Choose.Otherwise>
        <Tag intent={Intent.WARNING} round={true}>
          <T id={'draft'} />
        </Tag>
      </Choose.Otherwise>
    </Choose>
  );
}
