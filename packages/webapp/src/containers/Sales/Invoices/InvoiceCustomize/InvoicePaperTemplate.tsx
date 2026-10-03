import { RJ_BUSINESS_FORMS_LOGO_DATA_URI } from '@bigcapital/utils';
import { Classes, Text } from '@blueprintjs/core';
import {
  PaperTemplate,
  PaperTemplateProps,
  PaperTemplateTotalBorder,
} from './PaperTemplate';
import { Box, Group, Stack } from '@/components';
import {
  DefaultPdfTemplateTerms,
  DefaultPdfTemplateItemDescription,
  DefaultPdfTemplateStatement,
  DefaultPdfTemplateItemName,
  DefaultPdfTemplateAddressBilledTo,
  DefaultPdfTemplateAddressBilledFrom,
} from '@/constants/PdfTemplates';

interface PapaerLine {
  item?: string;
  description?: string;
  quantity?: string;
  rate?: string;
  total?: string;
}

interface PaperTax {
  label: string;
  amount: string;
}

export interface InvoicePaperTemplateProps extends PaperTemplateProps {
  primaryColor?: string;
  secondaryColor?: string;

  showCompanyLogo?: boolean;
  companyLogoUri?: string;

  showInvoiceNumber?: boolean;
  invoiceNumber?: string;
  invoiceNumberLabel?: string;

  showPurchaseOrderNumber?: boolean;
  purchaseOrderNumber?: string;
  purchaseOrderNumberLabel?: string;

  showDateIssue?: boolean;
  dateIssue?: string;
  dateIssueLabel?: string;

  showDueDate?: boolean;
  dueDate?: string;
  dueDateLabel?: string;

  showPaymentTerm?: boolean;
  paymentTerm?: string;
  paymentTermLabel?: string;

  companyName?: string;
  bigtitle?: string;

  // Address
  showCustomerAddress?: boolean;
  customerAddress?: string;

  showCompanyAddress?: boolean;
  companyAddress?: string;

  billedToLabel?: string;

  // Entries
  lineItemLabel?: string;
  lineQuantityLabel?: string;
  lineRateLabel?: string;
  lineTotalLabel?: string;

  // Totals
  showTotal?: boolean;
  totalLabel?: string;
  total?: string;

  showDiscount?: boolean;
  discountLabel?: string;
  discount?: string;

  showSubtotal?: boolean;
  subtotalLabel?: string;
  subtotal?: string;

  showPaymentMade?: boolean;
  paymentMadeLabel?: string;
  paymentMade?: string;

  showTaxes?: boolean;

  showDueAmount?: boolean;
  showBalanceDue?: boolean;
  balanceDueLabel?: string;
  balanceDue?: string;

  // Footer
  termsConditionsLabel?: string;
  showTermsConditions?: boolean;
  termsConditions?: string;

  statementLabel?: string;
  showStatement?: boolean;
  statement?: string;

  lines?: Array<PapaerLine>;
  taxes?: Array<PaperTax>;
}

export function InvoicePaperTemplate({
  primaryColor,
  secondaryColor,

  companyName = 'Bigcapital Technology, Inc.',

  showCompanyLogo = true,
  companyLogoUri = '',

  dueDate = 'September 3, 2024',
  dueDateLabel = 'Date due',
  showDueDate = true,

  paymentTerm = 'Net 30',
  paymentTermLabel = 'Terms',
  showPaymentTerm = true,

  dateIssue = 'September 3, 2024',
  dateIssueLabel = 'Date of issue',
  showDateIssue = true,

  // dateIssue,
  invoiceNumberLabel = 'Invoice number',
  invoiceNumber = '346D3D40-0001',
  showInvoiceNumber = true,

  purchaseOrderNumberLabel = 'PO Number',
  purchaseOrderNumber = 'PO-1001',
  showPurchaseOrderNumber = true,

  // Address
  showCustomerAddress = true,
  customerAddress = DefaultPdfTemplateAddressBilledTo,

  showCompanyAddress = true,
  companyAddress = DefaultPdfTemplateAddressBilledFrom,

  billedToLabel = 'Billed To',

  // Entries
  lineItemLabel = 'Item',
  lineQuantityLabel = 'Qty',
  lineRateLabel = 'Rate',
  lineTotalLabel = 'Amount',

  totalLabel = 'Total',
  subtotalLabel = 'Subtotal',
  discountLabel = 'Discount',
  paymentMadeLabel = 'Payment Made',
  balanceDueLabel = 'Balance Due',

  // Totals
  showTotal = true,
  showSubtotal = true,
  showDiscount = true,
  showTaxes = true,
  showPaymentMade = true,
  showDueAmount = true,
  showBalanceDue = true,

  total = '$662.75',
  subtotal = '630.00',
  discount = '0.00',
  paymentMade = '100.00',
  balanceDue = '$562.75',

  // Footer paragraphs.
  termsConditionsLabel = 'Conditions',
  showTermsConditions = true,
  termsConditions = DefaultPdfTemplateTerms,

  lines = [
    {
      item: DefaultPdfTemplateItemName,
      description: DefaultPdfTemplateItemDescription,
      rate: '1',
      quantity: '1000',
      total: '$1000.00',
    },
  ],
  taxes = [
    { label: 'Sample Tax1 (4.70%)', amount: '11.75' },
    { label: 'Sample Tax2 (7.00%)', amount: '21.74' },
  ],

  statementLabel = 'Statement',
  showStatement = true,
  statement = DefaultPdfTemplateStatement,
  ...props
}: InvoicePaperTemplateProps) {
  const resolvedCompanyLogoUri =
    companyLogoUri?.trim() || RJ_BUSINESS_FORMS_LOGO_DATA_URI;

  return (
    <PaperTemplate
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      {...props}
    >
      <Stack spacing={24}>
        <Group align="start" position="apart" spacing={32} noWrap>
          <Stack spacing={12}>
            {showCompanyLogo && (
              <PaperTemplate.Logo logoUri={resolvedCompanyLogoUri} />
            )}
            <PaperTemplate.TermsList>
              {showInvoiceNumber && (
                <PaperTemplate.TermsItem label={invoiceNumberLabel}>
                  {invoiceNumber}
                </PaperTemplate.TermsItem>
              )}
              {showPurchaseOrderNumber && purchaseOrderNumber && (
                <PaperTemplate.TermsItem label={purchaseOrderNumberLabel}>
                  {purchaseOrderNumber}
                </PaperTemplate.TermsItem>
              )}
              {showDateIssue && (
                <PaperTemplate.TermsItem label={dateIssueLabel}>
                  {dateIssue}
                </PaperTemplate.TermsItem>
              )}
              {showDueDate && (
                <PaperTemplate.TermsItem label={dueDateLabel}>
                  {dueDate}
                </PaperTemplate.TermsItem>
              )}
              {showPaymentTerm && paymentTerm && (
                <PaperTemplate.TermsItem label={paymentTermLabel}>
                  {paymentTerm}
                </PaperTemplate.TermsItem>
              )}
            </PaperTemplate.TermsList>
          </Stack>

          <Box textAlign="right">
            <PaperTemplate.BigTitle title={'Invoice'} />
          </Box>
        </Group>

        <PaperTemplate.AddressesGroup>
          {showCompanyAddress && (
            <PaperTemplate.Address>
              <Box dangerouslySetInnerHTML={{ __html: companyAddress }} />
            </PaperTemplate.Address>
          )}
          {showCustomerAddress && (
            <PaperTemplate.Address>
              <strong>{billedToLabel}</strong>
              <Box dangerouslySetInnerHTML={{ __html: customerAddress }} />
            </PaperTemplate.Address>
          )}
        </PaperTemplate.AddressesGroup>

        <Stack spacing={0}>
          <PaperTemplate.Table
            columns={[
              {
                label: lineItemLabel,
                accessor: (data) => (
                  <Stack spacing={2}>
                    <Text>{data.item}</Text>
                    <Text
                      className={Classes.TEXT_MUTED}
                      style={{ fontSize: 12 }}
                    >
                      {data.description}
                    </Text>
                  </Stack>
                ),
              },
              { label: lineQuantityLabel, accessor: 'quantity' },
              { label: lineTotalLabel, accessor: 'total', align: 'right' },
            ]}
            data={lines}
          />
          <PaperTemplate.Totals>
            {showSubtotal && (
              <PaperTemplate.TotalLine
                label={subtotalLabel}
                amount={subtotal}
                border={PaperTemplateTotalBorder.Gray}
              />
            )}
            {showDiscount && (
              <PaperTemplate.TotalLine
                label={discountLabel}
                amount={discount}
              />
            )}
            {showTaxes && (
              <>
                {taxes.map((tax, index) => (
                  <PaperTemplate.TotalLine
                    key={index}
                    label={tax.label}
                    amount={tax.amount}
                  />
                ))}
              </>
            )}
            {showTotal && (
              <PaperTemplate.TotalLine
                label={totalLabel}
                amount={total}
                border={PaperTemplateTotalBorder.Dark}
                style={{ fontWeight: 500 }}
              />
            )}
            {showPaymentMade && (
              <PaperTemplate.TotalLine
                label={paymentMadeLabel}
                amount={paymentMade}
              />
            )}
            {showBalanceDue && (
              <PaperTemplate.TotalLine
                label={balanceDueLabel}
                amount={balanceDue}
                border={PaperTemplateTotalBorder.Dark}
                style={{ fontWeight: 500 }}
              />
            )}
          </PaperTemplate.Totals>
        </Stack>

        <Stack spacing={0}>
          {showTermsConditions && termsConditions && (
            <PaperTemplate.Statement label={termsConditionsLabel}>
              {termsConditions}
            </PaperTemplate.Statement>
          )}

          {showStatement && statement && (
            <PaperTemplate.Statement label={statementLabel}>
              {statement}
            </PaperTemplate.Statement>
          )}
        </Stack>
      </Stack>
    </PaperTemplate>
  );
}
