import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed de um usuário
  const user = await prisma.user.create({
    data: {
      externalId: '12345',
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      phone: '1234567890',
      cpf: '123.456.789-00',
    },
  });

  // Seed de uma categoria de evento
  const category = await prisma.eventCategory.create({
    data: {
      name: 'Music',
    },
  });

  // Seed de um endereço
  const address = await prisma.address.create({
    data: {
      street: '123 Main St',
      number: '10',
      city: 'Metropolis',
      state: 'NY',
      zipCode: '12345',
      neighborhood: 'Downtown',
    },
  });

  const producer = await prisma.producer.create({
    data: {
      name: 'Nome do Produtor',
      email: 'produtor@example.com',
      description: 'Descrição do produtor',
      imageUrl: 'https://example.com/image.jpg',
    },
  });

  // Seed de um evento
  const event = await prisma.event.create({
    data: {
      title: 'Live Concert',
      description: 'An amazing music concert.',
      capacity: 500,
      categoryId: category.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      maxTicketsPerUser: 5,
      format: 'In-Person',
      ageRating: 18,
      additionalDetails: 'Bring your ID.',
      creatorId: user.id,
      producerId: producer.id,
      addressId: address.id,
    },
  });

  // Seed de um tipo de ticket
  const ticketType = await prisma.ticketType.create({
    data: {
      eventId: event.id,
      description: 'General Admission',
      price: 50.0,
      quantity: 100,
      salesStartDate: new Date(),
      salesEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  // Seed de uma ordem de compra
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      userId: user.id,
      eventId: event.id,
      totalPrice: 100.0,
      quantityTickets: 2,
      status: 'reserved',
      reservationExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
    },
  });

  // Seed de um ticket reservado
  await prisma.ticket.create({
    data: {
      ticketTypeId: ticketType.id,
      purchaseOrderId: purchaseOrder.id,
      participantName: 'John Doe',
      participantEmail: 'johndoe@example.com',
      price: 50.0,
      status: 'reserved',
    },
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
