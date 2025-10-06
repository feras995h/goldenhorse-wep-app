# تقرير التوافق بين النماذج وقاعدة البيانات

**تاريخ الفحص:** ٥‏/١٠‏/٢٠٢٥، ٢:١١:٣٣ م

## ملخص عام

- **إجمالي النماذج:** 38
- **إجمالي الجداول:** 33
- **الجداول المتطابقة:** 29
- **الجداول المفقودة:** 9
- **الجداول الإضافية:** 4

## إحصائيات المشاكل

- **إجمالي المشاكل:** 181
  - 🔴 **حرجة:** 9
  - 🟠 **عالية:** 83
  - 🟡 **متوسطة:** 89

## 🔴 الجداول المفقودة

الجداول التالية موجودة في النماذج ولكن مفقودة من قاعدة البيانات:

- `accounting_periods`
- `audit_logs`
- `company_logo`
- `purchase_invoice_payments`
- `sales_invoice_items`
- `sales_invoice_payments`
- `sales_returns`
- `stock_movements`
- `warehouse_release_orders`

## ⚠️ الجداول الإضافية

الجداول التالية موجودة في قاعدة البيانات ولكن لا يوجد لها نماذج:

- `invoice_items`
- `gl_entry_details`
- `vouchers`
- `migrations_log`

## تفاصيل المشاكل حسب النموذج

### Account (`accounts`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### AccountMapping (`account_mappings`)

**مشاكل عالية:**

- 🟠 الحقل localCustomersAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل foreignCustomersAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل discountAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل shippingRevenueAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل handlingFeeAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل customsClearanceAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل insuranceAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل storageAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل createdBy موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل updatedBy موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### AccountProvision (`account_provisions`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### AccountingPeriod (`accounting_periods`)

**مشاكل حرجة:**

- 🔴 الجدول accounting_periods غير موجود في قاعدة البيانات

### AuditLog (`audit_logs`)

**مشاكل حرجة:**

- 🔴 الجدول audit_logs غير موجود في قاعدة البيانات

### CompanyLogo (`company_logo`)

**مشاكل حرجة:**

- 🔴 الجدول company_logo غير موجود في قاعدة البيانات

### Customer (`customers`)

**مشاكل عالية:**

- 🟠 الحقل accountId موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل customerType موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل nationality موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل passportNumber موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل residencyStatus موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل category موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### Employee (`employees`)

**مشاكل عالية:**

- 🟠 الحقل code موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل terminationDate موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل accountId موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل bankAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل bankName موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل taxNumber موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل emergencyContact موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل emergencyPhone موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل notes موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل employeeNumber موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### EmployeeAdvance (`employee_advances`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### FixedAsset (`fixed_assets`)

**مشاكل عالية:**

- 🟠 الحقل categoryAccountId موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### GLEntry (`gl_entries`)

**مشاكل عالية:**

- 🟠 الحقل postingDate موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل accountId موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل debit موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل credit موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل voucherType موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل voucherNo موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل journalEntryId موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل remarks موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل isCancelled موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل cancelledAt موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل cancelledBy موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل createdBy موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل currency موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل exchangeRate موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل entryNumber موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل date موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل reference موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل description موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل totalDebit موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل totalCredit موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل status موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل postedBy موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل postedAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### Invoice (`invoices`)

**مشاكل عالية:**

- 🟠 الحقل dueDate موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل subtotal موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل taxAmount موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل totalAmount موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل isActive موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### InvoicePayment (`invoice_payments`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### InvoiceReceipt (`invoice_receipts`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### JournalEntry (`journal_entries`)

**مشاكل متوسطة:**

- 🟡 الحقل reference موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### JournalEntryDetail (`journal_entry_details`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### Notification (`notifications`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### Payment (`payments`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### PaymentVoucher (`payment_vouchers`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### PayrollEntry (`payroll_entries`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### PurchaseInvoice (`purchase_invoices`)

**مشاكل عالية:**

- 🟠 الحقل outstandingAmount موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل outstandingamount موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### PurchaseInvoicePayment (`purchase_invoice_payments`)

**مشاكل حرجة:**

- 🔴 الجدول purchase_invoice_payments غير موجود في قاعدة البيانات

### Receipt (`receipts`)

**مشاكل عالية:**

- 🟠 الحقل receiptNo موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل receiptDate موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل referenceNo موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل bankAccount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل checkNumber موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل currency موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل exchangeRate موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل remarks موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل createdBy موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل completedAt موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل completedBy موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل receiptNumber موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل date موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل reference موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل notes موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### ReceiptVoucher (`receipt_vouchers`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### Role (`roles`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### SalesInvoice (`sales_invoices`)

**مشاكل عالية:**

- 🟠 الحقل subtotal موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل discountAmount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل taxAmount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل total موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل currency موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل exchangeRate موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل paymentStatus موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل paymentMethod موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل invoiceDate موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل postedStatus موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل postedAt موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل postedBy موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل documentNo موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل fiscalYear موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل canEdit موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل voidReason موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل createdBy موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل serviceDescription موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل serviceDescriptionEn موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل shipmentNumbers موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل serviceType موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل weight موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل volume موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل cbm موجود في قاعدة البيانات ولكن ليس في النموذج

### SalesInvoiceItem (`sales_invoice_items`)

**مشاكل حرجة:**

- 🔴 الجدول sales_invoice_items غير موجود في قاعدة البيانات

### SalesInvoicePayment (`sales_invoice_payments`)

**مشاكل حرجة:**

- 🔴 الجدول sales_invoice_payments غير موجود في قاعدة البيانات

### SalesReturn (`sales_returns`)

**مشاكل حرجة:**

- 🔴 الجدول sales_returns غير موجود في قاعدة البيانات

### Setting (`settings`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### Shipment (`shipments`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### ShipmentMovement (`shipment_movements`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### ShippingInvoice (`shipping_invoices`)

**مشاكل عالية:**

- 🟠 الحقل invoiceNumber موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل customerId موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل totalAmount موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل isActive موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل shipmentId موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل outstandingAmount موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل invoice_number موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل customer_id موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل total_amount موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل paid_amount موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل created_at موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updated_at موجود في قاعدة البيانات ولكن ليس في النموذج

### StockMovement (`stock_movements`)

**مشاكل حرجة:**

- 🔴 الجدول stock_movements غير موجود في قاعدة البيانات

### Supplier (`suppliers`)

**مشاكل عالية:**

- 🟠 الحقل city موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل country موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل paymentTerms موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل currency موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل notes موجود في النموذج ولكن ليس في قاعدة البيانات
- 🟠 الحقل createdBy موجود في النموذج ولكن ليس في قاعدة البيانات

**مشاكل متوسطة:**

- 🟡 الحقل balance موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### User (`users`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### Warehouse (`warehouse`)

**مشاكل متوسطة:**

- 🟡 الحقل createdAt موجود في قاعدة البيانات ولكن ليس في النموذج
- 🟡 الحقل updatedAt موجود في قاعدة البيانات ولكن ليس في النموذج

### WarehouseReleaseOrder (`warehouse_release_orders`)

**مشاكل حرجة:**

- 🔴 الجدول warehouse_release_orders غير موجود في قاعدة البيانات

## 💡 التوصيات

### 1. 🔴 إنشاء الجداول المفقودة

**الأولوية:** HIGH

**التفاصيل:** الجداول التالية مفقودة من قاعدة البيانات: accounting_periods, audit_logs, company_logo, purchase_invoice_payments, sales_invoice_items, sales_invoice_payments, sales_returns, stock_movements, warehouse_release_orders

### 2. 🟡 مراجعة الجداول الإضافية

**الأولوية:** MEDIUM

**التفاصيل:** الجداول التالية موجودة في قاعدة البيانات ولكن لا يوجد لها نماذج: invoice_items, gl_entry_details, vouchers, migrations_log

### 3. 🟡 تحديث نموذج Account

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 4. 🔴 إضافة حقول مفقودة في جدول account_mappings

**الأولوية:** HIGH

**التفاصيل:** الحقول: localCustomersAccount, foreignCustomersAccount, discountAccount, shippingRevenueAccount, handlingFeeAccount, customsClearanceAccount, insuranceAccount, storageAccount, createdBy, updatedBy

### 5. 🟡 تحديث نموذج AccountMapping

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 6. 🟡 تحديث نموذج AccountProvision

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 7. 🔴 إضافة حقول مفقودة في جدول customers

**الأولوية:** HIGH

**التفاصيل:** الحقول: accountId, customerType, nationality, passportNumber, residencyStatus

### 8. 🟡 تحديث نموذج Customer

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: category, createdAt, updatedAt

### 9. 🔴 إضافة حقول مفقودة في جدول employees

**الأولوية:** HIGH

**التفاصيل:** الحقول: code, terminationDate, accountId, bankAccount, bankName, taxNumber, emergencyContact, emergencyPhone, notes

### 10. 🟡 تحديث نموذج Employee

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: employeeNumber, createdAt, updatedAt

### 11. 🟡 تحديث نموذج EmployeeAdvance

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 12. 🔴 إضافة حقول مفقودة في جدول fixed_assets

**الأولوية:** HIGH

**التفاصيل:** الحقول: categoryAccountId

### 13. 🟡 تحديث نموذج FixedAsset

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 14. 🔴 إضافة حقول مفقودة في جدول gl_entries

**الأولوية:** HIGH

**التفاصيل:** الحقول: postingDate, accountId, debit, credit, voucherType, voucherNo, journalEntryId, remarks, isCancelled, cancelledAt, cancelledBy, createdBy, currency, exchangeRate

### 15. 🟡 تحديث نموذج GLEntry

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: entryNumber, date, reference, description, totalDebit, totalCredit, status, postedBy, postedAt, createdAt, updatedAt

### 16. 🔴 إضافة حقول مفقودة في جدول invoices

**الأولوية:** HIGH

**التفاصيل:** الحقول: dueDate, subtotal, taxAmount

### 17. 🟡 تحديث نموذج Invoice

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: totalAmount, isActive, createdAt, updatedAt

### 18. 🟡 تحديث نموذج InvoicePayment

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 19. 🟡 تحديث نموذج InvoiceReceipt

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 20. 🟡 تحديث نموذج JournalEntry

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: reference, createdAt, updatedAt

### 21. 🟡 تحديث نموذج JournalEntryDetail

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 22. 🟡 تحديث نموذج Notification

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 23. 🟡 تحديث نموذج Payment

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 24. 🟡 تحديث نموذج PaymentVoucher

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 25. 🟡 تحديث نموذج PayrollEntry

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 26. 🔴 إضافة حقول مفقودة في جدول purchase_invoices

**الأولوية:** HIGH

**التفاصيل:** الحقول: outstandingAmount

### 27. 🟡 تحديث نموذج PurchaseInvoice

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: outstandingamount, createdAt, updatedAt

### 28. 🔴 إضافة حقول مفقودة في جدول receipts

**الأولوية:** HIGH

**التفاصيل:** الحقول: receiptNo, receiptDate, referenceNo, bankAccount, checkNumber, currency, exchangeRate, remarks, createdBy, completedAt, completedBy

### 29. 🟡 تحديث نموذج Receipt

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: receiptNumber, date, reference, notes, createdAt, updatedAt

### 30. 🟡 تحديث نموذج ReceiptVoucher

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 31. 🟡 تحديث نموذج Role

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 32. 🔴 إضافة حقول مفقودة في جدول sales_invoices

**الأولوية:** HIGH

**التفاصيل:** الحقول: subtotal, discountAmount, taxAmount, total, currency, exchangeRate, paymentStatus, paymentMethod, invoiceDate, postedStatus, postedAt, postedBy, documentNo, fiscalYear, canEdit, voidReason, createdBy

### 33. 🟡 تحديث نموذج SalesInvoice

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt, serviceDescription, serviceDescriptionEn, shipmentNumbers, serviceType, weight, volume, cbm

### 34. 🟡 تحديث نموذج Setting

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 35. 🟡 تحديث نموذج Shipment

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 36. 🟡 تحديث نموذج ShipmentMovement

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 37. 🔴 إضافة حقول مفقودة في جدول shipping_invoices

**الأولوية:** HIGH

**التفاصيل:** الحقول: invoiceNumber, customerId, totalAmount, isActive, shipmentId, outstandingAmount

### 38. 🟡 تحديث نموذج ShippingInvoice

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: invoice_number, customer_id, total_amount, paid_amount, created_at, updated_at

### 39. 🔴 إضافة حقول مفقودة في جدول suppliers

**الأولوية:** HIGH

**التفاصيل:** الحقول: city, country, paymentTerms, currency, notes, createdBy

### 40. 🟡 تحديث نموذج Supplier

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: balance, createdAt, updatedAt

### 41. 🟡 تحديث نموذج User

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

### 42. 🟡 تحديث نموذج Warehouse

**الأولوية:** MEDIUM

**التفاصيل:** إضافة الحقول التالية إلى النموذج: createdAt, updatedAt

## تفاصيل الحقول

### Account

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `code` | ✓ | ✓ | character varying | NOT NULL |
| `name` | ✓ | ✓ | character varying | NOT NULL |
| `nameEn` | ✓ | ✓ | character varying | - |
| `type` | ✓ | ✓ | USER-DEFINED | NOT NULL |
| `rootType` | ✓ | ✓ | USER-DEFINED | NOT NULL |
| `reportType` | ✓ | ✓ | USER-DEFINED | NOT NULL |
| `accountCategory` | ✓ | ✓ | character varying | - |
| `parentId` | ✓ | ✓ | uuid | - |
| `level` | ✓ | ✓ | integer | Default: 1 |
| `isGroup` | ✓ | ✓ | boolean | Default: false |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `freezeAccount` | ✓ | ✓ | boolean | Default: false |
| `balance` | ✓ | ✓ | numeric | Default: 0 |
| `currency` | ✓ | ✓ | character varying | Default: 'LYD'::character varying |
| `description` | ✓ | ✓ | text | - |
| `accountType` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'main'::"enum_accounts_accountType" |
| `nature` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'debit'::enum_accounts_nature |
| `notes` | ✓ | ✓ | text | - |
| `isSystemAccount` | ✓ | ✓ | boolean | Default: false |
| `isMonitored` | ✓ | ✓ | boolean | Default: false |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### AccountMapping

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `salesRevenueAccount` | ✓ | ✓ | uuid | - |
| `salesTaxAccount` | ✓ | ✓ | uuid | - |
| `accountsReceivableAccount` | ✓ | ✓ | uuid | - |
| `localCustomersAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `foreignCustomersAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `discountAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `shippingRevenueAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `handlingFeeAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `customsClearanceAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `insuranceAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `storageAccount` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `description` | ✓ | ✓ | text | - |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `updatedBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `createdAt` | ✗ | ✓ | timestamp without time zone | NOT NULL, Default: now(), ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp without time zone | NOT NULL, Default: now(), ⚠️ مفقود من النموذج |

### AccountProvision

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `mainAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `provisionAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `provisionType` | ✓ | ✓ | USER-DEFINED | NOT NULL |
| `provisionRate` | ✓ | ✓ | numeric | - |
| `fixedAmount` | ✓ | ✓ | numeric | - |
| `calculationMethod` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'percentage'::"enum_account_provisions_calculationMethod" |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `autoCalculate` | ✓ | ✓ | boolean | Default: true |
| `calculationFrequency` | ✓ | ✓ | USER-DEFINED | Default: 'monthly'::"enum_account_provisions_calculationFrequency" |
| `lastCalculationDate` | ✓ | ✓ | date | - |
| `nextCalculationDate` | ✓ | ✓ | date | - |
| `currentProvisionAmount` | ✓ | ✓ | numeric | Default: 0 |
| `description` | ✓ | ✓ | text | - |
| `notes` | ✓ | ✓ | text | - |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `lastUpdatedBy` | ✓ | ✓ | uuid | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |

### AccountingPeriod

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `year` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `month` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `status` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `startDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `endDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `closedAt` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `closedBy` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `archivedAt` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `archivedBy` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `totalTransactions` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `totalDebit` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `totalCredit` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |

### AuditLog

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `tableName` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `recordId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `action` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `userId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `oldValues` | ✓ | ✗ | JSONB | ⚠️ مفقود من قاعدة البيانات |
| `newValues` | ✓ | ✗ | JSONB | ⚠️ مفقود من قاعدة البيانات |
| `changedFields` | ✓ | ✗ | ARRAY | ⚠️ مفقود من قاعدة البيانات |
| `description` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `ipAddress` | ✓ | ✗ | INET | ⚠️ مفقود من قاعدة البيانات |
| `userAgent` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `sessionId` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `isSystemAction` | ✓ | ✗ | BOOLEAN | ⚠️ مفقود من قاعدة البيانات |
| `severity` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `category` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `relatedRecords` | ✓ | ✗ | JSONB | ⚠️ مفقود من قاعدة البيانات |
| `businessImpact` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `complianceFlags` | ✓ | ✗ | ARRAY | ⚠️ مفقود من قاعدة البيانات |

### CompanyLogo

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `filename` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `original_name` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `mimetype` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `size` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `data` | ✓ | ✗ | BLOB | ⚠️ مفقود من قاعدة البيانات |
| `upload_date` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `is_active` | ✓ | ✗ | BOOLEAN | ⚠️ مفقود من قاعدة البيانات |

### Customer

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `code` | ✓ | ✓ | character varying | NOT NULL |
| `accountId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `name` | ✓ | ✓ | character varying | NOT NULL |
| `nameEn` | ✓ | ✓ | character varying | - |
| `email` | ✓ | ✓ | character varying | - |
| `phone` | ✓ | ✓ | character varying | - |
| `address` | ✓ | ✓ | text | - |
| `taxNumber` | ✓ | ✓ | character varying | - |
| `creditLimit` | ✓ | ✓ | numeric | Default: 0 |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `balance` | ✓ | ✓ | numeric | Default: 0 |
| `contactPerson` | ✓ | ✓ | character varying | - |
| `type` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'individual'::enum_customers_type |
| `customerType` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `nationality` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `passportNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `residencyStatus` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `paymentTerms` | ✓ | ✓ | integer | Default: 30 |
| `currency` | ✓ | ✓ | USER-DEFINED | Default: 'LYD'::enum_customers_currency |
| `category` | ✗ | ✓ | character varying | Default: 'wholesale'::character varying, ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### Employee

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `code` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `name` | ✓ | ✓ | character varying | NOT NULL |
| `nameEn` | ✓ | ✓ | character varying | - |
| `email` | ✓ | ✓ | character varying | - |
| `phone` | ✓ | ✓ | character varying | - |
| `address` | ✓ | ✓ | text | - |
| `position` | ✓ | ✓ | character varying | - |
| `department` | ✓ | ✓ | character varying | - |
| `salary` | ✓ | ✓ | numeric | - |
| `hireDate` | ✓ | ✓ | date | - |
| `terminationDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `accountId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `bankAccount` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `bankName` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `taxNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `emergencyContact` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `emergencyPhone` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `branch` | ✓ | ✓ | character varying | - |
| `currency` | ✓ | ✓ | USER-DEFINED | Default: 'LYD'::enum_employees_currency |
| `salaryAccountId` | ✓ | ✓ | uuid | - |
| `advanceAccountId` | ✓ | ✓ | uuid | - |
| `custodyAccountId` | ✓ | ✓ | uuid | - |
| `currentBalance` | ✓ | ✓ | numeric | Default: 0 |
| `employeeNumber` | ✗ | ✓ | character varying | NOT NULL, ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### EmployeeAdvance

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `advanceNumber` | ✓ | ✓ | character varying | NOT NULL |
| `employeeId` | ✓ | ✓ | uuid | NOT NULL |
| `amount` | ✓ | ✓ | numeric | NOT NULL |
| `date` | ✓ | ✓ | date | NOT NULL |
| `purpose` | ✓ | ✓ | text | - |
| `repaymentSchedule` | ✓ | ✓ | text | - |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'pending'::enum_employee_advances_status |
| `approvedBy` | ✓ | ✓ | uuid | - |
| `approvedAt` | ✓ | ✓ | timestamp with time zone | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### FixedAsset

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `assetNumber` | ✓ | ✓ | character varying | NOT NULL |
| `name` | ✓ | ✓ | character varying | NOT NULL |
| `category` | ✓ | ✓ | character varying | - |
| `purchaseDate` | ✓ | ✓ | date | - |
| `purchaseCost` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `salvageValue` | ✓ | ✓ | numeric | Default: 0 |
| `usefulLife` | ✓ | ✓ | integer | - |
| `depreciationMethod` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'straight_line'::"enum_fixed_assets_depreciationMethod" |
| `currentValue` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'active'::enum_fixed_assets_status |
| `location` | ✓ | ✓ | character varying | - |
| `description` | ✓ | ✓ | text | - |
| `categoryAccountId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### GLEntry

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `postingDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `accountId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `debit` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `credit` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `voucherType` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `voucherNo` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `journalEntryId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `remarks` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `isCancelled` | ✓ | ✗ | BOOLEAN | ⚠️ مفقود من قاعدة البيانات |
| `cancelledAt` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `cancelledBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `currency` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `exchangeRate` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `entryNumber` | ✗ | ✓ | character varying | NOT NULL, ⚠️ مفقود من النموذج |
| `date` | ✗ | ✓ | date | NOT NULL, ⚠️ مفقود من النموذج |
| `reference` | ✗ | ✓ | character varying | ⚠️ مفقود من النموذج |
| `description` | ✗ | ✓ | text | ⚠️ مفقود من النموذج |
| `totalDebit` | ✗ | ✓ | numeric | NOT NULL, Default: 0, ⚠️ مفقود من النموذج |
| `totalCredit` | ✗ | ✓ | numeric | NOT NULL, Default: 0, ⚠️ مفقود من النموذج |
| `status` | ✗ | ✓ | USER-DEFINED | NOT NULL, Default: 'draft'::enum_gl_entries_status, ⚠️ مفقود من النموذج |
| `postedBy` | ✗ | ✓ | uuid | ⚠️ مفقود من النموذج |
| `postedAt` | ✗ | ✓ | timestamp with time zone | ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### Invoice

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `invoiceNumber` | ✓ | ✓ | character varying | NOT NULL |
| `customerId` | ✓ | ✓ | uuid | - |
| `date` | ✓ | ✓ | date | Default: CURRENT_DATE |
| `dueDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `subtotal` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `taxAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `total` | ✓ | ✓ | numeric | Default: 0 |
| `paidAmount` | ✓ | ✓ | numeric | Default: 0 |
| `status` | ✓ | ✓ | USER-DEFINED | Default: 'draft'::enum_invoices_status |
| `outstandingAmount` | ✓ | ✓ | numeric | Default: 0 |
| `accountId` | ✓ | ✓ | uuid | - |
| `currency` | ✓ | ✓ | character varying | Default: 'LYD'::character varying |
| `exchangeRate` | ✓ | ✓ | numeric | Default: 1 |
| `createdBy` | ✓ | ✓ | uuid | - |
| `notes` | ✓ | ✓ | text | - |
| `totalAmount` | ✗ | ✓ | numeric | Default: 0, ⚠️ مفقود من النموذج |
| `isActive` | ✗ | ✓ | boolean | Default: true, ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### InvoicePayment

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `invoiceId` | ✓ | ✓ | uuid | NOT NULL |
| `paymentId` | ✓ | ✓ | uuid | NOT NULL |
| `allocatedAmount` | ✓ | ✓ | numeric | NOT NULL |
| `currency` | ✓ | ✓ | character varying | Default: 'LYD'::character varying |
| `exchangeRate` | ✓ | ✓ | numeric | Default: 1 |
| `allocationDate` | ✓ | ✓ | date | NOT NULL |
| `settlementOrder` | ✓ | ✓ | integer | NOT NULL |
| `isFullySettled` | ✓ | ✓ | boolean | Default: false |
| `remainingAmount` | ✓ | ✓ | numeric | Default: 0 |
| `notes` | ✓ | ✓ | text | - |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `isReversed` | ✓ | ✓ | boolean | Default: false |
| `reversedAt` | ✓ | ✓ | timestamp with time zone | - |
| `reversedBy` | ✓ | ✓ | uuid | - |
| `reversalReason` | ✓ | ✓ | text | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |

### InvoiceReceipt

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `invoiceId` | ✓ | ✓ | uuid | NOT NULL |
| `receiptId` | ✓ | ✓ | uuid | NOT NULL |
| `allocatedAmount` | ✓ | ✓ | numeric | NOT NULL |
| `currency` | ✓ | ✓ | character varying | Default: 'LYD'::character varying |
| `exchangeRate` | ✓ | ✓ | numeric | Default: 1 |
| `allocationDate` | ✓ | ✓ | date | NOT NULL |
| `settlementOrder` | ✓ | ✓ | integer | NOT NULL |
| `isFullySettled` | ✓ | ✓ | boolean | Default: false |
| `remainingAmount` | ✓ | ✓ | numeric | Default: 0 |
| `notes` | ✓ | ✓ | text | - |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `isReversed` | ✓ | ✓ | boolean | Default: false |
| `reversedAt` | ✓ | ✓ | timestamp with time zone | - |
| `reversedBy` | ✓ | ✓ | uuid | - |
| `reversalReason` | ✓ | ✓ | text | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |

### JournalEntry

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `entryNumber` | ✓ | ✓ | character varying | NOT NULL |
| `date` | ✓ | ✓ | date | NOT NULL |
| `totalDebit` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `totalCredit` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'draft'::enum_journal_entries_status |
| `description` | ✓ | ✓ | text | - |
| `postedAt` | ✓ | ✓ | timestamp with time zone | - |
| `postedBy` | ✓ | ✓ | uuid | - |
| `reference` | ✗ | ✓ | character varying | ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### JournalEntryDetail

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `journalEntryId` | ✓ | ✓ | uuid | NOT NULL |
| `accountId` | ✓ | ✓ | uuid | NOT NULL |
| `debit` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `credit` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `description` | ✓ | ✓ | text | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### Notification

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `title` | ✓ | ✓ | character varying | NOT NULL |
| `message` | ✓ | ✓ | text | NOT NULL |
| `type` | ✓ | ✓ | USER-DEFINED | Default: 'info'::enum_notifications_type |
| `priority` | ✓ | ✓ | USER-DEFINED | Default: 'medium'::enum_notifications_priority |
| `category` | ✓ | ✓ | USER-DEFINED | Default: 'system'::enum_notifications_category |
| `userId` | ✓ | ✓ | uuid | - |
| `read` | ✓ | ✓ | boolean | Default: false |
| `readAt` | ✓ | ✓ | timestamp with time zone | - |
| `actionUrl` | ✓ | ✓ | character varying | - |
| `actionLabel` | ✓ | ✓ | character varying | - |
| `metadata` | ✓ | ✓ | text | - |
| `expiresAt` | ✓ | ✓ | timestamp with time zone | - |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### Payment

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `paymentNumber` | ✓ | ✓ | character varying | NOT NULL |
| `customerId` | ✓ | ✓ | uuid | NOT NULL |
| `accountId` | ✓ | ✓ | uuid | - |
| `partyType` | ✓ | ✓ | USER-DEFINED | Default: 'customer'::"enum_payments_partyType" |
| `partyId` | ✓ | ✓ | uuid | - |
| `voucherType` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'payment'::"enum_payments_voucherType" |
| `date` | ✓ | ✓ | date | NOT NULL |
| `amount` | ✓ | ✓ | numeric | NOT NULL |
| `paymentMethod` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'cash'::"enum_payments_paymentMethod" |
| `reference` | ✓ | ✓ | character varying | - |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'pending'::enum_payments_status |
| `notes` | ✓ | ✓ | text | - |
| `currency` | ✓ | ✓ | character varying | Default: 'LYD'::character varying |
| `exchangeRate` | ✓ | ✓ | numeric | Default: 1 |
| `createdBy` | ✓ | ✓ | uuid | - |
| `completedAt` | ✓ | ✓ | timestamp with time zone | - |
| `completedBy` | ✓ | ✓ | uuid | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### PaymentVoucher

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `voucherNumber` | ✓ | ✓ | character varying | NOT NULL |
| `date` | ✓ | ✓ | date | NOT NULL |
| `beneficiaryId` | ✓ | ✓ | uuid | - |
| `beneficiaryName` | ✓ | ✓ | character varying | NOT NULL |
| `purpose` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'invoice_payment'::enum_payment_vouchers_purpose |
| `purposeDescription` | ✓ | ✓ | character varying | - |
| `paymentMethod` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'cash'::"enum_payment_vouchers_paymentMethod" |
| `currency` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'LYD'::enum_payment_vouchers_currency |
| `amount` | ✓ | ✓ | numeric | NOT NULL |
| `debitAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `creditAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `exchangeRate` | ✓ | ✓ | numeric | NOT NULL, Default: 1 |
| `notes` | ✓ | ✓ | text | - |
| `attachments` | ✓ | ✓ | json | Default: '[]'::json |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'draft'::enum_payment_vouchers_status |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `approvedBy` | ✓ | ✓ | uuid | - |
| `approvedAt` | ✓ | ✓ | timestamp with time zone | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |

### PayrollEntry

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `entryNumber` | ✓ | ✓ | character varying | NOT NULL |
| `employeeId` | ✓ | ✓ | uuid | NOT NULL |
| `date` | ✓ | ✓ | date | NOT NULL |
| `basicSalary` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `allowances` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `deductions` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `netSalary` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'draft'::enum_payroll_entries_status |
| `notes` | ✓ | ✓ | text | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### PurchaseInvoice

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `invoiceNumber` | ✓ | ✓ | character varying | NOT NULL |
| `date` | ✓ | ✓ | date | NOT NULL |
| `dueDate` | ✓ | ✓ | date | NOT NULL |
| `supplierId` | ✓ | ✓ | uuid | NOT NULL |
| `shipmentId` | ✓ | ✓ | uuid | - |
| `serviceDescription` | ✓ | ✓ | text | NOT NULL |
| `serviceDescriptionEn` | ✓ | ✓ | text | - |
| `quantity` | ✓ | ✓ | numeric | NOT NULL, Default: 1 |
| `unitPrice` | ✓ | ✓ | numeric | NOT NULL |
| `subtotal` | ✓ | ✓ | numeric | NOT NULL |
| `taxAmount` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `total` | ✓ | ✓ | numeric | NOT NULL |
| `paidAmount` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `outstandingAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `currency` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'LYD'::enum_purchase_invoices_currency |
| `exchangeRate` | ✓ | ✓ | numeric | NOT NULL, Default: 1 |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'draft'::enum_purchase_invoices_status |
| `paymentStatus` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'unpaid'::"enum_purchase_invoices_paymentStatus" |
| `debitAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `creditAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `notes` | ✓ | ✓ | text | - |
| `attachments` | ✓ | ✓ | json | Default: '[]'::json |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `outstandingamount` | ✗ | ✓ | numeric | NOT NULL, Default: 0, ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |

### PurchaseInvoicePayment

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `invoiceId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `paymentId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `allocatedAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `currency` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `exchangeRate` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `allocationDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `settlementOrder` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `isFullySettled` | ✓ | ✗ | BOOLEAN | ⚠️ مفقود من قاعدة البيانات |
| `remainingAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `isReversed` | ✓ | ✗ | BOOLEAN | ⚠️ مفقود من قاعدة البيانات |
| `reversedAt` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `reversedBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `reversalReason` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |

### Receipt

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `receiptNo` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `supplierId` | ✓ | ✓ | uuid | NOT NULL |
| `accountId` | ✓ | ✓ | uuid | - |
| `partyType` | ✓ | ✓ | USER-DEFINED | Default: 'supplier'::"enum_receipts_partyType" |
| `partyId` | ✓ | ✓ | uuid | - |
| `voucherType` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'receipt'::"enum_receipts_voucherType" |
| `receiptDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `amount` | ✓ | ✓ | numeric | NOT NULL |
| `paymentMethod` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'cash'::"enum_receipts_paymentMethod" |
| `referenceNo` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `bankAccount` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `checkNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'pending'::enum_receipts_status |
| `currency` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `exchangeRate` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `remarks` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `completedAt` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `completedBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `receiptNumber` | ✗ | ✓ | character varying | NOT NULL, ⚠️ مفقود من النموذج |
| `date` | ✗ | ✓ | date | NOT NULL, ⚠️ مفقود من النموذج |
| `reference` | ✗ | ✓ | character varying | ⚠️ مفقود من النموذج |
| `notes` | ✗ | ✓ | text | ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### ReceiptVoucher

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `voucherNumber` | ✓ | ✓ | character varying | NOT NULL |
| `date` | ✓ | ✓ | date | NOT NULL |
| `customerId` | ✓ | ✓ | uuid | - |
| `customerName` | ✓ | ✓ | character varying | NOT NULL |
| `shipmentId` | ✓ | ✓ | uuid | - |
| `paymentMethod` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'cash'::"enum_receipt_vouchers_paymentMethod" |
| `currency` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'LYD'::enum_receipt_vouchers_currency |
| `amount` | ✓ | ✓ | numeric | NOT NULL |
| `purpose` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'invoice_payment'::enum_receipt_vouchers_purpose |
| `purposeDescription` | ✓ | ✓ | character varying | - |
| `debitAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `creditAccountId` | ✓ | ✓ | uuid | NOT NULL |
| `exchangeRate` | ✓ | ✓ | numeric | NOT NULL, Default: 1 |
| `notes` | ✓ | ✓ | text | - |
| `attachments` | ✓ | ✓ | json | Default: '[]'::json |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'draft'::enum_receipt_vouchers_status |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `approvedBy` | ✓ | ✓ | uuid | - |
| `approvedAt` | ✓ | ✓ | timestamp with time zone | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |

### Role

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `name` | ✓ | ✓ | character varying | NOT NULL |
| `description` | ✓ | ✓ | text | - |
| `permissions` | ✓ | ✓ | text | Default: '{}'::text |
| `isActive` | ✓ | ✓ | boolean | NOT NULL, Default: true |
| `isSystem` | ✓ | ✓ | boolean | NOT NULL, Default: false |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### SalesInvoice

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `invoiceNumber` | ✓ | ✓ | character varying | NOT NULL |
| `customerId` | ✓ | ✓ | uuid | - |
| `date` | ✓ | ✓ | date | Default: CURRENT_DATE |
| `dueDate` | ✓ | ✓ | date | - |
| `subtotal` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `discountAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `taxAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `total` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `paidAmount` | ✓ | ✓ | numeric | Default: 0 |
| `outstandingAmount` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `currency` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `exchangeRate` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `status` | ✓ | ✓ | character varying | Default: 'pending'::character varying |
| `paymentStatus` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `paymentMethod` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✓ | text | - |
| `invoiceDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `totalAmount` | ✓ | ✓ | numeric | Default: 0 |
| `postedStatus` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `postedAt` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `postedBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `documentNo` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `fiscalYear` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `canEdit` | ✓ | ✗ | BOOLEAN | ⚠️ مفقود من قاعدة البيانات |
| `voidReason` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `serviceDescription` | ✗ | ✓ | text | ⚠️ مفقود من النموذج |
| `serviceDescriptionEn` | ✗ | ✓ | text | ⚠️ مفقود من النموذج |
| `shipmentNumbers` | ✗ | ✓ | json | Default: '[]'::json, ⚠️ مفقود من النموذج |
| `serviceType` | ✗ | ✓ | USER-DEFINED | Default: 'sea_freight'::"enum_sales_invoices_serviceType", ⚠️ مفقود من النموذج |
| `weight` | ✗ | ✓ | numeric | ⚠️ مفقود من النموذج |
| `volume` | ✗ | ✓ | numeric | ⚠️ مفقود من النموذج |
| `cbm` | ✗ | ✓ | numeric | ⚠️ مفقود من النموذج |

### SalesInvoiceItem

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `invoiceId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `itemCode` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `description` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `descriptionEn` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `category` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `quantity` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `unit` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `unitPrice` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `discountPercent` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `discountAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `taxPercent` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `taxAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `lineTotal` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `weight` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `dimensions` | ✓ | ✗ | JSON | ⚠️ مفقود من قاعدة البيانات |
| `color` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `size` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `brand` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `model` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `serialNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `warrantyPeriod` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `stockLocation` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `batchNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `expiryDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |

### SalesInvoicePayment

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `invoiceId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `paymentId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `allocatedAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `currency` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `exchangeRate` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `allocationDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |

### SalesReturn

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `returnNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `date` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `customerId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `salesInvoiceId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `reason` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `reasonDescription` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `items` | ✓ | ✗ | JSON | ⚠️ مفقود من قاعدة البيانات |
| `subtotal` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `taxAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `total` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `refundAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `currency` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `exchangeRate` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `status` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `refundStatus` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `refundMethod` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `attachments` | ✓ | ✗ | JSON | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `approvedBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `approvedAt` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |

### Setting

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `key` | ✓ | ✓ | character varying | NOT NULL |
| `value` | ✓ | ✓ | text | - |
| `type` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'string'::enum_settings_type |
| `description` | ✓ | ✓ | text | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### Shipment

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `trackingNumber` | ✓ | ✓ | character varying | NOT NULL |
| `customerId` | ✓ | ✓ | uuid | NOT NULL |
| `customerName` | ✓ | ✓ | character varying | NOT NULL |
| `customerPhone` | ✓ | ✓ | character varying | - |
| `itemDescription` | ✓ | ✓ | text | NOT NULL |
| `itemDescriptionEn` | ✓ | ✓ | text | - |
| `category` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'other'::enum_shipments_category |
| `quantity` | ✓ | ✓ | integer | NOT NULL, Default: 1 |
| `weight` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `length` | ✓ | ✓ | numeric | - |
| `width` | ✓ | ✓ | numeric | - |
| `height` | ✓ | ✓ | numeric | - |
| `volume` | ✓ | ✓ | numeric | - |
| `volumeOverride` | ✓ | ✓ | numeric | - |
| `declaredValue` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `shippingCost` | ✓ | ✓ | numeric | NOT NULL, Default: 0 |
| `originLocation` | ✓ | ✓ | character varying | NOT NULL |
| `destinationLocation` | ✓ | ✓ | character varying | NOT NULL |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'received_china'::enum_shipments_status |
| `receivedDate` | ✓ | ✓ | date | NOT NULL |
| `estimatedDelivery` | ✓ | ✓ | date | - |
| `actualDeliveryDate` | ✓ | ✓ | date | - |
| `notes` | ✓ | ✓ | text | - |
| `isFragile` | ✓ | ✓ | boolean | Default: false |
| `requiresSpecialHandling` | ✓ | ✓ | boolean | Default: false |
| `customsDeclaration` | ✓ | ✓ | text | - |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### ShipmentMovement

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `shipmentId` | ✓ | ✓ | uuid | NOT NULL |
| `trackingNumber` | ✓ | ✓ | character varying | NOT NULL |
| `type` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'status_update'::enum_shipment_movements_type |
| `previousStatus` | ✓ | ✓ | USER-DEFINED | - |
| `newStatus` | ✓ | ✓ | USER-DEFINED | NOT NULL |
| `location` | ✓ | ✓ | character varying | NOT NULL |
| `date` | ✓ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP |
| `notes` | ✓ | ✓ | text | - |
| `handledBy` | ✓ | ✓ | character varying | - |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `warehouseReleaseOrderId` | ✓ | ✓ | uuid | - |
| `isSystemGenerated` | ✓ | ✓ | boolean | Default: false |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### ShippingInvoice

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `invoiceNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `date` | ✓ | ✓ | date | Default: CURRENT_DATE |
| `customerId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `totalAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `status` | ✓ | ✓ | character varying | Default: 'pending'::character varying |
| `notes` | ✓ | ✓ | text | - |
| `isActive` | ✓ | ✗ | BOOLEAN | ⚠️ مفقود من قاعدة البيانات |
| `shipmentId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `outstandingAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `invoice_number` | ✗ | ✓ | character varying | NOT NULL, ⚠️ مفقود من النموذج |
| `customer_id` | ✗ | ✓ | uuid | ⚠️ مفقود من النموذج |
| `total_amount` | ✗ | ✓ | numeric | Default: 0, ⚠️ مفقود من النموذج |
| `paid_amount` | ✗ | ✓ | numeric | Default: 0, ⚠️ مفقود من النموذج |
| `created_at` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updated_at` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### StockMovement

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `itemCode` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `description` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `quantity` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `unit` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `direction` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `reason` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `referenceType` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `referenceId` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `warehouseLocation` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `date` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `shipmentId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `warehouseReleaseOrderId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `invoiceId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |

### Supplier

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `code` | ✓ | ✓ | character varying | NOT NULL |
| `name` | ✓ | ✓ | character varying | NOT NULL |
| `nameEn` | ✓ | ✓ | character varying | - |
| `contactPerson` | ✓ | ✓ | character varying | - |
| `phone` | ✓ | ✓ | character varying | - |
| `email` | ✓ | ✓ | character varying | - |
| `address` | ✓ | ✓ | text | - |
| `city` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `country` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `taxNumber` | ✓ | ✓ | character varying | - |
| `creditLimit` | ✓ | ✓ | numeric | Default: 0 |
| `paymentTerms` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `currency` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `balance` | ✗ | ✓ | numeric | Default: 0, ⚠️ مفقود من النموذج |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### User

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `username` | ✓ | ✓ | character varying | NOT NULL |
| `password` | ✓ | ✓ | character varying | NOT NULL |
| `name` | ✓ | ✓ | character varying | NOT NULL |
| `email` | ✓ | ✓ | character varying | - |
| `role` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'user'::enum_users_role |
| `isActive` | ✓ | ✓ | boolean | Default: true |
| `lastLoginAt` | ✓ | ✓ | timestamp with time zone | - |
| `passwordChangedAt` | ✓ | ✓ | timestamp with time zone | - |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, Default: CURRENT_TIMESTAMP, ⚠️ مفقود من النموذج |

### Warehouse

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✓ | uuid | PK, NOT NULL |
| `internalShipmentNumber` | ✓ | ✓ | character varying | NOT NULL |
| `trackingNumber` | ✓ | ✓ | character varying | - |
| `customerId` | ✓ | ✓ | uuid | NOT NULL |
| `supplierId` | ✓ | ✓ | uuid | - |
| `originCountry` | ✓ | ✓ | character varying | NOT NULL, Default: 'China'::character varying |
| `destinationCountry` | ✓ | ✓ | character varying | NOT NULL, Default: 'Libya'::character varying |
| `weight` | ✓ | ✓ | numeric | NOT NULL |
| `volume` | ✓ | ✓ | numeric | - |
| `cargoType` | ✓ | ✓ | character varying | NOT NULL |
| `arrivalDate` | ✓ | ✓ | date | - |
| `departureDate` | ✓ | ✓ | date | - |
| `storageLocation` | ✓ | ✓ | character varying | - |
| `status` | ✓ | ✓ | USER-DEFINED | NOT NULL, Default: 'stored'::enum_warehouse_status |
| `salesInvoiceId` | ✓ | ✓ | uuid | - |
| `purchaseInvoiceId` | ✓ | ✓ | uuid | - |
| `notes` | ✓ | ✓ | text | - |
| `createdBy` | ✓ | ✓ | uuid | NOT NULL |
| `createdAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |
| `updatedAt` | ✗ | ✓ | timestamp with time zone | NOT NULL, ⚠️ مفقود من النموذج |

### WarehouseReleaseOrder

| الحقل | في النموذج | في قاعدة البيانات | نوع البيانات | ملاحظات |
|-------|------------|-------------------|--------------|----------|
| `id` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `orderNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `shipmentId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `customerId` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `trackingNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `releaseDate` | ✓ | ✗ | DATEONLY | ⚠️ مفقود من قاعدة البيانات |
| `requestedBy` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `requestedByPhone` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `authorizedBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `warehouseLocation` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `itemDescription` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `quantity` | ✓ | ✗ | INTEGER | ⚠️ مفقود من قاعدة البيانات |
| `weight` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `volume` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `releaseConditions` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `documentsRequired` | ✓ | ✗ | JSON | ⚠️ مفقود من قاعدة البيانات |
| `documentsReceived` | ✓ | ✗ | JSON | ⚠️ مفقود من قاعدة البيانات |
| `storageFeesAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `handlingFeesAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `totalFeesAmount` | ✓ | ✗ | DECIMAL | ⚠️ مفقود من قاعدة البيانات |
| `paymentStatus` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `paymentMethod` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `paymentReference` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `status` | ✓ | ✗ | ENUM | ⚠️ مفقود من قاعدة البيانات |
| `approvalDate` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `releaseExecutedDate` | ✓ | ✗ | DATE | ⚠️ مفقود من قاعدة البيانات |
| `releasedToName` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `releasedToPhone` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `releasedToIdNumber` | ✓ | ✗ | STRING | ⚠️ مفقود من قاعدة البيانات |
| `notes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `internalNotes` | ✓ | ✗ | TEXT | ⚠️ مفقود من قاعدة البيانات |
| `createdBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |
| `releasedBy` | ✓ | ✗ | UUID | ⚠️ مفقود من قاعدة البيانات |

