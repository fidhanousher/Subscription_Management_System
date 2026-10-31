-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "resetToken" TEXT,
    "resetTokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "salesPrice" DECIMAL NOT NULL,
    "costPrice" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "priceDelta" DECIMAL NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "interval" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "availableFrom" DATETIME NOT NULL,
    "availableTo" DATETIME,
    "autoCloseOnEnd" BOOLEAN NOT NULL DEFAULT true,
    "allowEarlyClose" BOOLEAN NOT NULL DEFAULT true,
    "allowPause" BOOLEAN NOT NULL DEFAULT true,
    "allowRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "appliesTo" TEXT NOT NULL DEFAULT 'ALL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "minPurchase" DECIMAL,
    "minQuantity" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "applyToSubscription" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DiscountProduct" (
    "discountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    PRIMARY KEY ("discountId", "productId"),
    CONSTRAINT "DiscountProduct_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscountProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscountSubscription" (
    "discountId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,

    PRIMARY KEY ("discountId", "subscriptionId"),
    CONSTRAINT "DiscountSubscription_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscountSubscription_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuotationTemplate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationTemplateLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    CONSTRAINT "QuotationTemplateLine_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuotationTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuotationTemplateLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expiryDate" DATETIME,
    "paymentTerms" TEXT NOT NULL DEFAULT 'Net 30',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "quoteValidUntil" DATETIME,
    "nextBillingAt" DATETIME,
    "lastBilledPeriodKey" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "amount" DECIMAL NOT NULL,
    CONSTRAINT "SubscriptionLine_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubscriptionLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "taxTotal" DECIMAL NOT NULL,
    "discountTotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "amount" DECIMAL NOT NULL,
    CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paidAt" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sequence" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_number_key" ON "Subscription"("number");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingAt_idx" ON "Subscription"("nextBillingAt");

-- CreateIndex
CREATE INDEX "Subscription_customerId_idx" ON "Subscription"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_subscriptionId_periodKey_key" ON "Invoice"("subscriptionId", "periodKey");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
