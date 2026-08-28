// @ts-nocheck
import React from 'react';
import { AccountsPayableSection } from './AccountsPayableSection';
import { AccountsReceivableSection } from './AccountsReceivableSection';
import { FinancialAccountingSection } from './FinancialAccountingSection';
import { ProductsServicesSection } from './ProductsServicesSection';
import '@/style/pages/HomePage/HomePage.scss';

export function HomepageContent() {
  return (
    <div className="financial-reports homepage-shortcuts">
      <AccountsReceivableSection />
      <AccountsPayableSection />
      <FinancialAccountingSection />
      <ProductsServicesSection />
    </div>
  );
}
