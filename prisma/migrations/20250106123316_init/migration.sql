/*
  Warnings:

  - You are about to drop the column `price` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - Added the required column `maxTicketsPerUser` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "price",
ADD COLUMN     "maxTicketsPerUser" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Ativo';

-- AlterTable
ALTER TABLE "purchaseOrders" ADD COLUMN     "reservationExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ticketTypes" ADD COLUMN     "reservedQuantity" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "TicketsTypePurchaseOrder" (
    "ticketTypeId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "TicketsTypePurchaseOrder_pkey" PRIMARY KEY ("purchaseOrderId","ticketTypeId")
);

-- AddForeignKey
ALTER TABLE "TicketsTypePurchaseOrder" ADD CONSTRAINT "TicketsTypePurchaseOrder_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticketTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketsTypePurchaseOrder" ADD CONSTRAINT "TicketsTypePurchaseOrder_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchaseOrders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
