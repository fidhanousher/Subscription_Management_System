import {
  BillingInterval,
  DiscountType,
  InvoiceStatus,
  PaymentMethod,
  PrismaClient,
  Role,
  SubscriptionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addMonths, subDays, subMonths } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.discountSubscription.deleteMany();
  await prisma.discountProduct.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.quotationTemplateLine.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.sequence.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Admin123!", 12);
  const staffPassword = await bcrypt.hash("Staff123!", 12);
  const customerPassword = await bcrypt.hash("Customer123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@brightloop.test",
      name: "Amina Okonkwo",
      company: "Brightloop Software",
      role: Role.ADMIN,
      passwordHash: password,
    },
  });

  await prisma.user.create({
    data: {
      email: "staff@brightloop.test",
      name: "Luis Ferreira",
      company: "Brightloop Software",
      role: Role.STAFF,
      passwordHash: staffPassword,
    },
  });

  const acme = await prisma.user.create({
    data: {
      email: "customer@acme.test",
      name: "Priya Shah",
      company: "Acme Bakery",
      role: Role.CUSTOMER,
      passwordHash: customerPassword,
    },
  });

  const northwind = await prisma.user.create({
    data: {
      email: "ops@northwind.test",
      name: "Chen Wei",
      company: "Northwind Trading",
      role: Role.CUSTOMER,
      passwordHash: customerPassword,
    },
  });

  const crm = await prisma.product.create({
    data: {
      name: "Brightloop CRM",
      type: "Software",
      salesPrice: 89,
      costPrice: 22,
      notes: "Core CRM billed per seat.",
      variants: {
        create: [
          { name: "Brand", value: "Standard", priceDelta: 0 },
          { name: "Brand", value: "Odoo", priceDelta: 560 },
        ],
      },
    },
    include: { variants: true },
  });

  const support = await prisma.product.create({
    data: {
      name: "Priority Support",
      type: "Add-on",
      salesPrice: 49,
      costPrice: 12,
      notes: "Business-hours plus emergency line.",
    },
  });

  const monthly = await prisma.plan.create({
    data: {
      name: "Growth Monthly",
      price: 29,
      interval: BillingInterval.MONTHLY,
      minQuantity: 1,
      availableFrom: subMonths(new Date(), 6),
      availableTo: addMonths(new Date(), 18),
      autoCloseOnEnd: false,
      allowEarlyClose: true,
      allowPause: true,
      allowRenew: true,
    },
  });

  const yearly = await prisma.plan.create({
    data: {
      name: "Enterprise Yearly",
      price: 240,
      interval: BillingInterval.YEARLY,
      minQuantity: 5,
      availableFrom: subMonths(new Date(), 6),
      availableTo: addMonths(new Date(), 24),
      autoCloseOnEnd: true,
      allowEarlyClose: false,
      allowPause: false,
      allowRenew: true,
    },
  });

  const tax = await prisma.taxRule.create({
    data: {
      name: "Standard VAT",
      rate: 10,
      appliesTo: "ALL",
      active: true,
    },
  });

  const odooVariant = crm.variants.find((v) => v.value === "Odoo");
  const odooPrice = Number(crm.salesPrice) + 560;

  const template = await prisma.quotationTemplate.create({
    data: {
      name: "Enterprise Odoo pack",
      planId: yearly.id,
      validityDays: 21,
      lines: {
        create: [
          {
            productId: crm.id,
            variantId: odooVariant?.id,
            quantity: 8,
            unitPrice: odooPrice,
          },
          {
            productId: support.id,
            quantity: 1,
            unitPrice: support.salesPrice,
          },
        ],
      },
    },
  });

  const volumeDiscount = await prisma.discount.create({
    data: {
      name: "Seat volume 10%",
      type: DiscountType.PERCENT,
      value: 10,
      minQuantity: 5,
      startDate: subMonths(new Date(), 1),
      endDate: addMonths(new Date(), 6),
      maxUses: 100,
      applyToSubscription: false,
      products: { create: [{ productId: crm.id }] },
    },
  });

  await prisma.sequence.createMany({
    data: [
      { name: "SUB", value: 2 },
      { name: "INV", value: 1 },
    ],
  });

  const activeSub = await prisma.subscription.create({
    data: {
      number: "SUB-00001",
      customerId: acme.id,
      planId: monthly.id,
      startDate: subMonths(new Date(), 2),
      expiryDate: addMonths(new Date(), 10),
      paymentTerms: "Net 15",
      status: SubscriptionStatus.ACTIVE,
      nextBillingAt: subDays(new Date(), 1),
      notes: "Bakery monthly seats.",
      lines: {
        create: [
          {
            productId: crm.id,
            variantId: crm.variants.find((v) => v.value === "Standard")?.id,
            description: "Brightloop CRM · Standard",
            quantity: 3,
            unitPrice: crm.salesPrice,
            taxRate: tax.rate,
            amount: 3 * Number(crm.salesPrice),
          },
          {
            productId: support.id,
            description: "Priority Support",
            quantity: 1,
            unitPrice: support.salesPrice,
            taxRate: tax.rate,
            amount: support.salesPrice,
          },
        ],
      },
    },
  });

  const yearlySub = await prisma.subscription.create({
    data: {
      number: "SUB-00002",
      customerId: northwind.id,
      planId: yearly.id,
      startDate: subMonths(new Date(), 1),
      expiryDate: addMonths(new Date(), 11),
      paymentTerms: "Net 30",
      status: SubscriptionStatus.ACTIVE,
      nextBillingAt: addDays(new Date(), 20),
      notes: "Yearly enterprise contract.",
      lines: {
        create: [
          {
            productId: crm.id,
            variantId: odooVariant?.id,
            description: "Brightloop CRM · Odoo",
            quantity: 8,
            unitPrice: odooPrice,
            taxRate: tax.rate,
            amount: 8 * odooPrice,
          },
        ],
      },
      discounts: { create: [{ discountId: volumeDiscount.id }] },
    },
  });

  const overdue = await prisma.invoice.create({
    data: {
      number: "INV-00001",
      customerId: northwind.id,
      customerName: northwind.name,
      customerEmail: northwind.email,
      subscriptionId: yearlySub.id,
      periodKey: "2025-seed",
      status: InvoiceStatus.CONFIRMED,
      issueDate: subDays(new Date(), 45),
      dueDate: subDays(new Date(), 15),
      subtotal: 5432,
      taxTotal: 543.2,
      discountTotal: 543.2,
      total: 5432,
      lines: {
        create: [
          {
            description: "Brightloop CRM · Odoo × 8",
            productId: crm.id,
            quantity: 8,
            unitPrice: odooPrice,
            taxRate: 10,
            discountAmount: 543.2,
            amount: 5432,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: overdue.id,
      method: PaymentMethod.BANK_TRANSFER,
      amount: 1000,
      paidAt: subDays(new Date(), 10),
      note: "Partial payment on account.",
    },
  });

  console.log("Seeded Brightloop demo data.");
  console.log("Admin    admin@brightloop.test / Admin123!");
  console.log("Staff    staff@brightloop.test / Staff123!");
  console.log("Customer customer@acme.test / Customer123!");
  console.log(`Template ${template.name}; active sub ${activeSub.number}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
