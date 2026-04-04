import type { PrismaClient } from '@prisma/client';

import { reportsBundleSchema, type InvoiceSummary, type PaymentSummary, type SaleSummary } from '@erptry/contracts';

import { getAnalyticsSnapshot } from './analytics-service.js';
import { listInvoices } from './invoices-service.js';
import { listPayments } from './payments-service.js';
import { listSales } from './sales-service.js';

function formatMoney(valueCents: number) {
  return (valueCents / 100).toFixed(2);
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function toCsv(columns: string[], rows: Array<Record<string, string>>) {
  const lines = [columns.join(',')];

  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsv(row[column] ?? '')).join(','));
  }

  return lines.join('\n');
}

function buildSalesRows(sales: SaleSummary[]) {
  return sales.map((sale) => ({
    referencia: sale.reference,
    titulo: sale.title,
    estado: sale.stage,
    cliente: sale.client.fullName,
    cliente_email: sale.client.email ?? '',
    total_eur: formatMoney(sale.totalCents),
    lineas: String(sale.lines.length),
    notas: sale.notes ?? ''
  }));
}

function buildInvoiceRows(invoices: InvoiceSummary[]) {
  return invoices.map((invoice) => ({
    referencia: invoice.reference,
    venta: invoice.sale.reference,
    cliente: invoice.client.fullName,
    estado: invoice.status,
    emision: invoice.issuedAt.slice(0, 10),
    vencimiento: invoice.dueDate,
    total_eur: formatMoney(invoice.totalCents),
    cobrado_eur: formatMoney(invoice.paidCents),
    saldo_eur: formatMoney(invoice.balanceCents),
    pagos: String(invoice.payments.length)
  }));
}

function buildPaymentRows(payments: PaymentSummary[]) {
  return payments.map((payment) => ({
    referencia: payment.reference,
    factura: payment.invoice.reference,
    venta: payment.invoice.sale.reference,
    cliente: payment.invoice.client.fullName,
    estado: payment.status,
    metodo: payment.method,
    importe_eur: formatMoney(payment.amountCents),
    fecha_recepcion: payment.receivedAt.slice(0, 10),
    saldo_factura_eur: formatMoney(payment.invoice.balanceCents),
    notas: payment.notes ?? ''
  }));
}

export async function getReportsBundle(prisma: PrismaClient, tenantId: string) {
  const [analytics, sales, invoices, payments] = await Promise.all([
    getAnalyticsSnapshot(prisma, tenantId),
    listSales(prisma, tenantId),
    listInvoices(prisma, tenantId),
    listPayments(prisma, tenantId)
  ]);

  const generatedAt = new Date().toISOString();

  const salesColumns = ['referencia', 'titulo', 'estado', 'cliente', 'cliente_email', 'total_eur', 'lineas', 'notas'];
  const salesRows = buildSalesRows(sales);

  const invoiceColumns = ['referencia', 'venta', 'cliente', 'estado', 'emision', 'vencimiento', 'total_eur', 'cobrado_eur', 'saldo_eur', 'pagos'];
  const invoiceRows = buildInvoiceRows(invoices);

  const paymentColumns = ['referencia', 'factura', 'venta', 'cliente', 'estado', 'metodo', 'importe_eur', 'fecha_recepcion', 'saldo_factura_eur', 'notas'];
  const paymentRows = buildPaymentRows(payments);

  return reportsBundleSchema.parse({
    generatedAt,
    analyticsGeneratedAt: analytics.generatedAt,
    exports: [
      {
        type: 'sales',
        title: 'Ventas',
        description: 'Embudo comercial exportable con cliente, etapa, lineas y total.',
        fileName: `ventas-${generatedAt.slice(0, 10)}.csv`,
        generatedAt,
        totalRows: sales.length,
        totalAmountCents: sales.reduce((total, sale) => total + sale.totalCents, 0),
        summary: `${analytics.sales.wonCount} ganadas, ${analytics.sales.openCount} abiertas y ticket medio de ${formatMoney(analytics.sales.averageTicketCents)} EUR.`,
        columns: salesColumns,
        rows: salesRows,
        csvContent: toCsv(salesColumns, salesRows)
      },
      {
        type: 'invoices',
        title: 'Facturas',
        description: 'Libro minimo de facturacion con emision, vencimiento, cobrado y saldo.',
        fileName: `facturas-${generatedAt.slice(0, 10)}.csv`,
        generatedAt,
        totalRows: invoices.length,
        totalAmountCents: analytics.billing.billedCents,
        summary: `${analytics.billing.paidCount} cobradas, ${analytics.billing.issuedCount} emitidas activas y ${analytics.billing.overdueCount} vencidas.`,
        columns: invoiceColumns,
        rows: invoiceRows,
        csvContent: toCsv(invoiceColumns, invoiceRows)
      },
      {
        type: 'payments',
        title: 'Cobros',
        description: 'Registro exportable de cobros con estado, metodo e impacto sobre factura.',
        fileName: `cobros-${generatedAt.slice(0, 10)}.csv`,
        generatedAt,
        totalRows: payments.length,
        totalAmountCents: payments.reduce((total, payment) => total + payment.amountCents, 0),
        summary: `${analytics.payments.confirmedCount} confirmados, ${analytics.payments.pendingCount} pendientes y ultimo cobro ${analytics.payments.lastReceivedAt ? analytics.payments.lastReceivedAt.slice(0, 10) : 'sin fecha'}.`,
        columns: paymentColumns,
        rows: paymentRows,
        csvContent: toCsv(paymentColumns, paymentRows)
      }
    ]
  });
}
