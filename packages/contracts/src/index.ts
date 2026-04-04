import { z } from 'zod';

export const tenantSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  plan: z.enum(['starter', 'growth', 'scale'])
});

export type Tenant = z.infer<typeof tenantSchema>;

export const userRoleSchema = z.enum(['owner', 'admin', 'manager', 'operator', 'viewer']);

export type UserRole = z.infer<typeof userRoleSchema>;

export const bootstrapUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: userRoleSchema,
  tenantId: z.string().min(1)
});

export type BootstrapUser = z.infer<typeof bootstrapUserSchema>;

export const platformSnapshotSchema = z.object({
  tenant: tenantSchema,
  users: z.array(bootstrapUserSchema),
  capabilities: z.array(z.string().min(1)),
  phase: z.string().min(1)
});

export type PlatformSnapshot = z.infer<typeof platformSnapshotSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
  phase: z.string().min(1),
  timestamp: z.string().datetime()
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const appManifestSchema = z.object({
  name: z.literal('ERPTRY'),
  headline: z.string().min(1),
  modules: z.array(z.string().min(1)),
  priorities: z.array(z.string().min(1))
});

export type AppManifest = z.infer<typeof appManifestSchema>;

export const demoLoginRequestSchema = z.object({
  email: z.string().email()
});

export type DemoLoginRequest = z.infer<typeof demoLoginRequestSchema>;

export const sessionActorSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  role: userRoleSchema,
  fullName: z.string().min(1),
  email: z.string().email()
});

export type SessionActor = z.infer<typeof sessionActorSchema>;

export const demoLoginResponseSchema = z.object({
  token: z.string().min(1),
  actor: sessionActorSchema,
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export type DemoLoginResponse = z.infer<typeof demoLoginResponseSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const sessionEnvelopeSchema = z.object({
  token: z.string().min(1),
  actor: sessionActorSchema,
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export type SessionEnvelope = z.infer<typeof sessionEnvelopeSchema>;

export const meResponseSchema = z.object({
  actor: sessionActorSchema,
  tenant: tenantSchema,
  permissions: z.array(z.string().min(1)),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const userSummarySchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  status: z.enum(['active', 'suspended']),
  tenantId: z.string().min(1),
  roles: z.array(z.string().min(1))
});

export type UserSummary = z.infer<typeof userSummarySchema>;

export const tenantOverviewSchema = z.object({
  tenant: tenantSchema,
  totalUsers: z.number().int().nonnegative(),
  activeSessions: z.number().int().nonnegative()
});

export type TenantOverview = z.infer<typeof tenantOverviewSchema>;

export const createUserRequestSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleCode: z.enum(['owner', 'admin', 'manager', 'operator', 'viewer'])
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const tenantSettingsSchema = z.object({
  brandingName: z.string().min(1),
  defaultLocale: z.string().min(2),
  timezone: z.string().min(2)
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

export const updateTenantSettingsRequestSchema = tenantSettingsSchema;

export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsRequestSchema>;

export const roleSummarySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  permissions: z.array(z.string().min(1))
});

export type RoleSummary = z.infer<typeof roleSummarySchema>;

export const updateUserRoleRequestSchema = z.object({
  userId: z.string().min(1),
  roleCode: z.enum(['owner', 'admin', 'manager', 'operator', 'viewer'])
});

export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;

export const clientSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  segment: z.string().min(1),
  notes: z.string().nullable()
});

export type ClientSummary = z.infer<typeof clientSummarySchema>;

export const createClientRequestSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(3).optional().or(z.literal('')),
  segment: z.string().min(1),
  notes: z.string().optional().or(z.literal(''))
});

export type CreateClientRequest = z.infer<typeof createClientRequestSchema>;

export const updateClientRequestSchema = createClientRequestSchema.extend({
  id: z.string().min(1)
});

export type UpdateClientRequest = z.infer<typeof updateClientRequestSchema>;

export const deleteClientRequestSchema = z.object({
  clientId: z.string().min(1)
});

export type DeleteClientRequest = z.infer<typeof deleteClientRequestSchema>;

export const catalogItemSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['product', 'service']),
  priceCents: z.number().int().nonnegative(),
  durationMin: z.number().int().positive().nullable(),
  status: z.enum(['active', 'archived']),
  sku: z.string().nullable(),
  notes: z.string().nullable()
});

export type CatalogItemSummary = z.infer<typeof catalogItemSummarySchema>;

export const createCatalogItemRequestSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['product', 'service']),
  priceCents: z.number().int().nonnegative(),
  durationMin: z.number().int().positive().optional().nullable(),
  sku: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
});

export type CreateCatalogItemRequest = z.infer<typeof createCatalogItemRequestSchema>;

export const updateCatalogItemRequestSchema = createCatalogItemRequestSchema.extend({
  id: z.string().min(1),
  status: z.enum(['active', 'archived']).default('active')
});

export type UpdateCatalogItemRequest = z.infer<typeof updateCatalogItemRequestSchema>;

export const deleteCatalogItemRequestSchema = z.object({
  itemId: z.string().min(1)
});

export type DeleteCatalogItemRequest = z.infer<typeof deleteCatalogItemRequestSchema>;

export const saleStageSchema = z.enum(['draft', 'sent', 'won', 'lost']);

export type SaleStage = z.infer<typeof saleStageSchema>;

export const createSaleLineRequestSchema = z.object({
  catalogItemId: z.string().min(1),
  quantity: z.number().int().positive()
});

export type CreateSaleLineRequest = z.infer<typeof createSaleLineRequestSchema>;

export const createSaleRequestSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().min(1),
  stage: saleStageSchema.default('draft'),
  notes: z.string().optional().or(z.literal('')),
  lines: z.array(createSaleLineRequestSchema).min(1)
});

export type CreateSaleRequest = z.infer<typeof createSaleRequestSchema>;

export const updateSaleRequestSchema = createSaleRequestSchema.extend({
  id: z.string().min(1)
});

export type UpdateSaleRequest = z.infer<typeof updateSaleRequestSchema>;

export const deleteSaleRequestSchema = z.object({
  saleId: z.string().min(1)
});

export type DeleteSaleRequest = z.infer<typeof deleteSaleRequestSchema>;

export const saleLineSummarySchema = z.object({
  id: z.string().min(1),
  catalogItemId: z.string().min(1),
  catalogItemName: z.string().min(1),
  kind: z.enum(['product', 'service']),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  lineTotalCents: z.number().int().nonnegative()
});

export type SaleLineSummary = z.infer<typeof saleLineSummarySchema>;

export const saleSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  reference: z.string().min(1),
  title: z.string().min(1),
  stage: saleStageSchema,
  client: z.object({
    id: z.string().min(1),
    fullName: z.string().min(1),
    email: z.string().email().nullable()
  }),
  totalCents: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  lines: z.array(saleLineSummarySchema)
});

export type SaleSummary = z.infer<typeof saleSummarySchema>;

export const invoiceStatusSchema = z.enum(['draft', 'issued', 'paid', 'void']);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const paymentStatusSchema = z.enum(['pending', 'confirmed', 'failed']);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentMethodSchema = z.enum(['cash', 'card', 'bank_transfer']);

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const createInvoiceRequestSchema = z.object({
  saleId: z.string().min(1),
  status: z.literal('issued').default('issued'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().or(z.literal(''))
});

export type CreateInvoiceRequest = z.infer<typeof createInvoiceRequestSchema>;

export const updateInvoiceRequestSchema = z.object({
  id: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().or(z.literal('')),
  status: invoiceStatusSchema.default('issued')
});

export type UpdateInvoiceRequest = z.infer<typeof updateInvoiceRequestSchema>;

export const deleteInvoiceRequestSchema = z.object({
  invoiceId: z.string().min(1)
});

export type DeleteInvoiceRequest = z.infer<typeof deleteInvoiceRequestSchema>;

export const invoiceLineSummarySchema = z.object({
  id: z.string().min(1),
  catalogItemId: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(['product', 'service']),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  lineTotalCents: z.number().int().nonnegative()
});

export type InvoiceLineSummary = z.infer<typeof invoiceLineSummarySchema>;

export const paymentSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  invoiceId: z.string().min(1),
  reference: z.string().min(1),
  status: paymentStatusSchema,
  method: paymentMethodSchema,
  amountCents: z.number().int().positive(),
  receivedAt: z.string().datetime(),
  notes: z.string().nullable(),
  invoice: z.object({
    id: z.string().min(1),
    reference: z.string().min(1),
    status: invoiceStatusSchema,
    totalCents: z.number().int().nonnegative(),
    paidCents: z.number().int().nonnegative(),
    balanceCents: z.number().int().nonnegative(),
    sale: z.object({
      id: z.string().min(1),
      reference: z.string().min(1),
      title: z.string().min(1)
    }),
    client: z.object({
      id: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email().nullable()
    })
  })
});

export type PaymentSummary = z.infer<typeof paymentSummarySchema>;

export const createPaymentRequestSchema = z.object({
  invoiceId: z.string().min(1),
  status: paymentStatusSchema.default('confirmed'),
  method: paymentMethodSchema.default('bank_transfer'),
  amountCents: z.number().int().positive(),
  receivedAt: z.string().datetime(),
  notes: z.string().optional().or(z.literal(''))
});

export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;

export const updatePaymentRequestSchema = createPaymentRequestSchema.extend({
  id: z.string().min(1)
});

export type UpdatePaymentRequest = z.infer<typeof updatePaymentRequestSchema>;

export const deletePaymentRequestSchema = z.object({
  paymentId: z.string().min(1)
});

export type DeletePaymentRequest = z.infer<typeof deletePaymentRequestSchema>;

export const invoiceSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  saleId: z.string().min(1),
  reference: z.string().min(1),
  status: invoiceStatusSchema,
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  issuedAt: z.string().datetime(),
  subtotalCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  paidCents: z.number().int().nonnegative(),
  balanceCents: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  sale: z.object({
    id: z.string().min(1),
    reference: z.string().min(1),
    title: z.string().min(1),
    stage: saleStageSchema
  }),
  client: z.object({
    id: z.string().min(1),
    fullName: z.string().min(1),
    email: z.string().email().nullable()
  }),
  lines: z.array(invoiceLineSummarySchema),
  payments: z.array(
    z.object({
      id: z.string().min(1),
      reference: z.string().min(1),
      status: paymentStatusSchema,
      method: paymentMethodSchema,
      amountCents: z.number().int().positive(),
      receivedAt: z.string().datetime(),
      notes: z.string().nullable()
    })
  )
});

export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;

export const analyticsSalesKpiSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  openCount: z.number().int().nonnegative(),
  wonCount: z.number().int().nonnegative(),
  lostCount: z.number().int().nonnegative(),
  pipelineCents: z.number().int().nonnegative(),
  wonRevenueCents: z.number().int().nonnegative(),
  averageTicketCents: z.number().int().nonnegative()
});

export type AnalyticsSalesKpi = z.infer<typeof analyticsSalesKpiSchema>;

export const analyticsBillingKpiSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  issuedCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  billedCents: z.number().int().nonnegative(),
  collectedCents: z.number().int().nonnegative(),
  outstandingCents: z.number().int().nonnegative(),
  collectionRate: z.number().min(0).max(1)
});

export type AnalyticsBillingKpi = z.infer<typeof analyticsBillingKpiSchema>;

export const analyticsPaymentsKpiSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  confirmedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  confirmedCents: z.number().int().nonnegative(),
  pendingCents: z.number().int().nonnegative(),
  failedCents: z.number().int().nonnegative(),
  lastReceivedAt: z.string().datetime().nullable()
});

export type AnalyticsPaymentsKpi = z.infer<typeof analyticsPaymentsKpiSchema>;

export const analyticsStageBreakdownSchema = z.object({
  stage: saleStageSchema,
  count: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative()
});

export type AnalyticsStageBreakdown = z.infer<typeof analyticsStageBreakdownSchema>;

export const analyticsTopClientSchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  salesCount: z.number().int().nonnegative(),
  salesCents: z.number().int().nonnegative(),
  invoicedCents: z.number().int().nonnegative(),
  collectedCents: z.number().int().nonnegative(),
  outstandingCents: z.number().int().nonnegative()
});

export type AnalyticsTopClient = z.infer<typeof analyticsTopClientSchema>;

export const analyticsSnapshotSchema = z.object({
  generatedAt: z.string().datetime(),
  sales: analyticsSalesKpiSchema,
  billing: analyticsBillingKpiSchema,
  payments: analyticsPaymentsKpiSchema,
  salesByStage: z.array(analyticsStageBreakdownSchema),
  topClients: z.array(analyticsTopClientSchema)
});

export type AnalyticsSnapshot = z.infer<typeof analyticsSnapshotSchema>;

export const reportTypeSchema = z.enum(['sales', 'invoices', 'payments']);

export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportExportSchema = z.object({
  type: reportTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  fileName: z.string().min(1),
  generatedAt: z.string().datetime(),
  totalRows: z.number().int().nonnegative(),
  totalAmountCents: z.number().int().nonnegative(),
  summary: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(z.record(z.string(), z.string())),
  csvContent: z.string().min(1)
});

export type ReportExport = z.infer<typeof reportExportSchema>;

export const reportsBundleSchema = z.object({
  generatedAt: z.string().datetime(),
  exports: z.array(reportExportSchema).min(1),
  analyticsGeneratedAt: z.string().datetime()
});

export type ReportsBundle = z.infer<typeof reportsBundleSchema>;

export const notificationTypeSchema = z.enum(['activity', 'reminder', 'finance', 'alert']);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSeveritySchema = z.enum(['info', 'success', 'warning', 'critical']);

export type NotificationSeverity = z.infer<typeof notificationSeveritySchema>;

export const notificationSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  type: notificationTypeSchema,
  severity: notificationSeveritySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  resourceType: z.string().nullable(),
  resourceId: z.string().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime()
});

export type NotificationSummary = z.infer<typeof notificationSummarySchema>;

export const notificationsInboxSchema = z.object({
  generatedAt: z.string().datetime(),
  totalCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  items: z.array(notificationSummarySchema)
});

export type NotificationsInbox = z.infer<typeof notificationsInboxSchema>;

export const markNotificationReadRequestSchema = z.object({
  notificationId: z.string().min(1)
});

export type MarkNotificationReadRequest = z.infer<typeof markNotificationReadRequestSchema>;

export const auditLogSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  actorUserId: z.string().min(1).nullable(),
  actorName: z.string().min(1),
  actorEmail: z.string().email(),
  type: notificationTypeSchema,
  severity: notificationSeveritySchema,
  action: z.string().min(1),
  resourceType: z.string().nullable(),
  resourceId: z.string().nullable(),
  summary: z.string().min(1),
  createdAt: z.string().datetime()
});

export type AuditLogSummary = z.infer<typeof auditLogSummarySchema>;

export const auditLogsFeedSchema = z.object({
  generatedAt: z.string().datetime(),
  totalCount: z.number().int().nonnegative(),
  items: z.array(auditLogSummarySchema)
});

export type AuditLogsFeed = z.infer<typeof auditLogsFeedSchema>;

export const employeeStatusSchema = z.enum(['active', 'on_leave', 'inactive']);

export type EmployeeStatus = z.infer<typeof employeeStatusSchema>;

export const employeeEmploymentTypeSchema = z.enum(['full_time', 'part_time', 'contractor']);

export type EmployeeEmploymentType = z.infer<typeof employeeEmploymentTypeSchema>;

export const employeeSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  linkedUserId: z.string().min(1).nullable(),
  employeeCode: z.string().min(1),
  fullName: z.string().min(1),
  workEmail: z.string().email().nullable(),
  phone: z.string().nullable(),
  department: z.string().min(1),
  jobTitle: z.string().min(1),
  employmentType: employeeEmploymentTypeSchema,
  status: employeeStatusSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().nullable(),
  linkedUser: z
    .object({
      id: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email()
    })
    .nullable()
});

export type EmployeeSummary = z.infer<typeof employeeSummarySchema>;

export const createEmployeeRequestSchema = z.object({
  linkedUserId: z.string().min(1).optional().or(z.literal('')),
  employeeCode: z.string().min(1),
  fullName: z.string().min(1),
  workEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(3).optional().or(z.literal('')),
  department: z.string().min(1),
  jobTitle: z.string().min(1),
  employmentType: employeeEmploymentTypeSchema.default('full_time'),
  status: employeeStatusSchema.default('active'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().or(z.literal(''))
});

export type CreateEmployeeRequest = z.infer<typeof createEmployeeRequestSchema>;

export const updateEmployeeRequestSchema = createEmployeeRequestSchema.extend({
  id: z.string().min(1)
});

export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeRequestSchema>;

export const deleteEmployeeRequestSchema = z.object({
  employeeId: z.string().min(1)
});

export type DeleteEmployeeRequest = z.infer<typeof deleteEmployeeRequestSchema>;

export const internalTaskStatusSchema = z.enum(['todo', 'in_progress', 'blocked', 'done']);

export type InternalTaskStatus = z.infer<typeof internalTaskStatusSchema>;

export const internalTaskPrioritySchema = z.enum(['low', 'medium', 'high']);

export type InternalTaskPriority = z.infer<typeof internalTaskPrioritySchema>;

export const internalTaskSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  taskCode: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  saleId: z.string().min(1).nullable(),
  assigneeEmployeeId: z.string().min(1),
  createdByUserId: z.string().min(1),
  status: internalTaskStatusSchema,
  priority: internalTaskPrioritySchema,
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  completedAt: z.string().datetime().nullable(),
  assigneeEmployee: z.object({
    id: z.string().min(1),
    employeeCode: z.string().min(1),
    fullName: z.string().min(1),
    department: z.string().min(1),
    jobTitle: z.string().min(1),
    status: employeeStatusSchema
  }),
  createdByUser: z.object({
    id: z.string().min(1),
    fullName: z.string().min(1),
    email: z.string().email()
  }),
  sale: z
    .object({
      id: z.string().min(1),
      reference: z.string().min(1),
      title: z.string().min(1),
      stage: saleStageSchema,
      client: z.object({
        id: z.string().min(1),
        fullName: z.string().min(1),
        email: z.string().email().nullable()
      })
    })
    .nullable()
});

export type InternalTaskSummary = z.infer<typeof internalTaskSummarySchema>;

export const createInternalTaskRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  saleId: z.string().min(1).optional().or(z.literal('')),
  assigneeEmployeeId: z.string().min(1),
  status: internalTaskStatusSchema.default('todo'),
  priority: internalTaskPrioritySchema.default('medium'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''))
});

export type CreateInternalTaskRequest = z.infer<typeof createInternalTaskRequestSchema>;

export const updateInternalTaskRequestSchema = createInternalTaskRequestSchema.extend({
  id: z.string().min(1)
});

export type UpdateInternalTaskRequest = z.infer<typeof updateInternalTaskRequestSchema>;

export const deleteInternalTaskRequestSchema = z.object({
  taskId: z.string().min(1)
});

export type DeleteInternalTaskRequest = z.infer<typeof deleteInternalTaskRequestSchema>;

export const reservationStatusSchema = z.enum(['booked', 'confirmed', 'completed', 'cancelled']);

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

export const reservationSummarySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  reservationCode: z.string().min(1),
  title: z.string().min(1),
  notes: z.string().nullable(),
  location: z.string().nullable(),
  assigneeEmployeeId: z.string().min(1),
  createdByUserId: z.string().min(1),
  internalTaskId: z.string().min(1).nullable(),
  status: reservationStatusSchema,
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  assigneeEmployee: z.object({
    id: z.string().min(1),
    employeeCode: z.string().min(1),
    fullName: z.string().min(1),
    department: z.string().min(1),
    jobTitle: z.string().min(1),
    status: employeeStatusSchema
  }),
  createdByUser: z.object({
    id: z.string().min(1),
    fullName: z.string().min(1),
    email: z.string().email()
  }),
  internalTask: z
    .object({
      id: z.string().min(1),
      taskCode: z.string().min(1),
      title: z.string().min(1),
      status: internalTaskStatusSchema,
      priority: internalTaskPrioritySchema,
      sale: z
        .object({
          id: z.string().min(1),
          reference: z.string().min(1),
          title: z.string().min(1),
          stage: saleStageSchema,
          client: z.object({
            id: z.string().min(1),
            fullName: z.string().min(1),
            email: z.string().email().nullable()
          })
        })
        .nullable()
    })
    .nullable()
});

export type ReservationSummary = z.infer<typeof reservationSummarySchema>;

export const createReservationRequestSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  assigneeEmployeeId: z.string().min(1),
  internalTaskId: z.string().min(1).optional().or(z.literal('')),
  status: reservationStatusSchema.default('booked'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime()
});

export type CreateReservationRequest = z.infer<typeof createReservationRequestSchema>;

export const updateReservationRequestSchema = createReservationRequestSchema.extend({
  id: z.string().min(1)
});

export type UpdateReservationRequest = z.infer<typeof updateReservationRequestSchema>;

export const deleteReservationRequestSchema = z.object({
  reservationId: z.string().min(1)
});

export type DeleteReservationRequest = z.infer<typeof deleteReservationRequestSchema>;
