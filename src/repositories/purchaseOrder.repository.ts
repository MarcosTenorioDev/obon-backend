import { prisma } from "../database/prisma-client";
import {
	PurchaseOrderAndTicketsCreate,
	PurchaseOrderInfo,
	PurchaseOrderRepository,
	PurchaseOrderReserved,
	ReservedPurchaseOrderUpdate,
} from "../interfaces/purchaseOrder.interface";
import { User } from "../interfaces/user.interface";

class PurchaseOrderRepositoryPrisma implements PurchaseOrderRepository {
	findTicketPurchasedByUserAndEventId(
		id: string,
		eventId: string
	): Promise<{ ticketsPurchased: number }[]> {
		throw new Error("Method not implemented.");
	}
	async create(
		data: PurchaseOrderAndTicketsCreate,
		requestedTickets: { quantityReserved: number; ticketTypeId: string }[]
	): Promise<any> {
		try {
			const { user, eventId } = data;
			const totalQuantityTickets = requestedTickets.reduce((acc, curr) => {
				return acc + curr.quantityReserved;
			}, 0);

			return await prisma.$transaction(async (prisma) => {
				let totalPrice = 0;

				for (const requestedTicketTypes of requestedTickets) {
					const { ticketTypeId, quantityReserved } = requestedTicketTypes;

					const ticketType = await prisma.ticketType.findUniqueOrThrow({
						where: { id: ticketTypeId },
					});

					totalPrice += ticketType.price * quantityReserved;

					// Atualiza a quantidade de tickets disponíveis e reservados
					await prisma.ticketType.update({
						where: { id: ticketTypeId },
						data: {
							quantity: ticketType.quantity - quantityReserved, // Ajusta a quantidade disponível subtraindo pela quantidade reservada agora
							reservedQuantity:
								(ticketType.reservedQuantity || 0) + quantityReserved, // Atualiza quantidade reservada
						},
					});
				}

				// Cria a PurchaseOrder
				const purchaseOrder = await prisma.purchaseOrder.create({
					data: {
						userId: user.id,
						eventId,
						totalPrice,
						quantityTickets: totalQuantityTickets,
						reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // Expira em 15 minutos
						status: "reserved",
						reservedTicketTypes: {
							create: requestedTickets.map((ticket) => ({
								ticketType: { connect: { id: ticket.ticketTypeId } },
								quantity: ticket.quantityReserved,
							})),
						},
					},
					include: {
						reservedTicketTypes: true,
					},
				});

				return purchaseOrder;
			});
		} catch (error) {
			throw new Error(`Error creating purchase order: ${error}`);
		}
	}

	async findPurchaseOrdersByUserAndEventId(
		id: string,
		eventId: string
	): Promise<PurchaseOrderInfo[]> {
		try {
			const purchaseOrders = await prisma.purchaseOrder.findMany({
				where: { userId: id, eventId: eventId },
				select: {
					id: true,
					eventId: true,
					status: true,
					tickets: {
						select: {
							id: true,
							ticketTypeId: true,
							ticketType: {
								select: {
									description: true,
									isActive: true,
									price: true,
								},
							},
							participantName: true,
							participantEmail: true,
							price: true,
							status: true,
							purchaseDate: true,
							seatLocation: true,
						},
					},
					event: {
						select: {
							maxTicketsPerUser: true,
						},
					},
				},
			});

			return purchaseOrders;
		} catch (error) {
			console.error("Error finding events by external ID:", error);
			throw error;
		}
	}

	async findTicketQuantityPurchasedByUserAndEventId(
		id: string,
		eventId: string
	): Promise<{ ticketsPurchased: number }> {
		try {
			const purchaseOrders = await prisma.purchaseOrder.findMany({
				where: { userId: id, eventId: eventId },
				select: {
					tickets: {
						select: {
							id: true,
						},
					},
				},
			});

			const ticketsAux = purchaseOrders.map((purchaseOrder) => {
				return purchaseOrder.tickets.length;
			});

			const response = {
				ticketsPurchased: ticketsAux.reduce((acc, curr) => {
					return acc + curr;
				}, 0),
			};

			return response;
		} catch (error) {
			console.error("Error finding events by external ID:", error);
			throw error;
		}
	}

	async findReservedById(
		id: string,
		user: User
	): Promise<PurchaseOrderReserved> {
		try {
			return await prisma.purchaseOrder.findUniqueOrThrow({
				where: {
					id: id,

					status: "reserved",
				},
				select: {
					id: true,
					userId: true,
					eventId: true,
					totalPrice: true,
					quantityTickets: true,
					status: true,
					createdAt: true,
					updatedAt: true,
					reservationExpiresAt: true,
					reservedTicketTypes: {
						select: {
							ticketTypeId: true,
							purchaseOrderId: true,
							quantity: true,
							ticketType: {
								select: {
									description: true,
									price: true,
								},
							},
						},
					},
					event: {
						select: {
							Address: true,
							producers: true,
							ageRating: true,
							category: {
								select: {
									id: true,
									name: true,
									isActive: true,
								},
							},
							startDate: true,
							endDate: true,
							title: true,
							assets: true,
						},
					},
				},
			});
		} catch (error) {
			throw new Error(`Error finding purchase order: ${error}`);
		}
	}

	async reservePurchaseOrder(data: ReservedPurchaseOrderUpdate): Promise<any> {
		try {
			const { user, eventId, ticketTypes, id } = data;

			return await prisma.$transaction(async (prisma) => {
				const ticketCreationData: any[] = [];

				//Validando novamente a existencia da purchaseOrder
				await prisma.purchaseOrder.findUniqueOrThrow({
					where: {
						id,
					},
					include: {
						reservedTicketTypes: {
							include: {
								ticketType: true,
							},
						},
						tickets: true,
					},
				});

				//Atualizando purchaseOrder para ativa

				//atualizar status da purchaseOrder para active - OK
				//atualzar campo de updatedAt para now - OK
				//atualizar campo de reservationExpiresAt para null - OK
				await prisma.purchaseOrder.update({
					where: {
						id,
						userId: user.id,
					},
					data: {
						status: "active",
						updatedAt: new Date(),
						quantityTickets: ticketTypes.length,
						reservationExpiresAt: null,
					},
				});

				//remover todos os reservedTicketTypes que contenha essa purchaseOrderId
				await prisma.ticketsTypePurchaseOrder.deleteMany({
					where: {
						purchaseOrderId: id,
					},
				});

				//Apagando os registros de reservas
				for (const ticketTypeData of ticketTypes) {
					const { ticketTypeId, participantName, participantEmail } =
						ticketTypeData;

					//Verifica novamente a validade do ticketType
					const ticketType = await prisma.ticketType.findUniqueOrThrow({
						where: { id: ticketTypeId },
					});

					ticketCreationData.push({
						ticketTypeId,
						participantName,
						participantEmail,
						price: ticketType.price,
						status: "active",
						purchaseDate: new Date(),
					});

					if (
						ticketType.reservedQuantity == null ||
						ticketType.reservedQuantity == 0
					) {
						throw new Error(
							`The ticket type with ID ${ticketType.id} has no reserved quantity. Please verify the reservation details.`
						);
					}
					//Para cada reservedTicketTypes.quantity, subtrair o valor de ticketType.reservedQuantity
					await prisma.ticketType.update({
						where: { id: ticketTypeId },
						data: { reservedQuantity: ticketType.reservedQuantity - 1 },
					});
				}

				//Criar os tickets de acordo com a quantidade reservada anteriormente.
				await prisma.ticket.createMany({
					data: ticketCreationData.map((ticket) => ({
						...ticket,
						purchaseOrderId: id,
					})),
				});

				return prisma.purchaseOrder.findUniqueOrThrow({
					where: {
						id,
					},
					include: {
						reservedTicketTypes: true,
						tickets: {
							include: {
								ticketType: {
									select: {
										description: true,
										isActive: true,
										price: true,
									},
								},
							},
						},
					},
				});
			});
		} catch (error) {
			throw new Error(`Error updating purchase order: ${error}`);
		}
	}

	async verifyIfHasPurchased(data: { purchaseOrderId: string }): Promise<void> {
		try {
			const purchaseOrder = await prisma.purchaseOrder.findUniqueOrThrow({
				where: {
					id: data.purchaseOrderId,
				},
				include: {
					reservedTicketTypes: {
						include: {
							ticketType: true,
						},
					},
				},
			});

			if (purchaseOrder.status === "reserved") {
				//Criar rotina para devolver os tickets reservados e suas respectivas quantidades, para posteriormente excluir
				console.log("Cancelando reserva da purchaseOrder");
				for (const reservedTicket of purchaseOrder.reservedTicketTypes) {
					const ticketType = await prisma.ticketType.findFirstOrThrow({
						where: {
							id: reservedTicket.ticketTypeId,
						},
					});

					if (
						ticketType.reservedQuantity !== null &&
						ticketType.reservedQuantity > 0
					) {
						//Retirando os tickets de reservado e devolvendo para quantidade disponível
						await prisma.ticketType.update({
							where: {
								id: reservedTicket.ticketTypeId,
							},
							data: {
								reservedQuantity:
									ticketType.reservedQuantity - reservedTicket.quantity,
								quantity: ticketType.quantity + reservedTicket.quantity,
							},
						});
					}
				}

				//remover todos os reservedTicketTypes que contenha essa purchaseOrderId
				await prisma.ticketsTypePurchaseOrder.deleteMany({
					where: {
						purchaseOrderId: data.purchaseOrderId,
					},
				});

				await prisma.purchaseOrder.delete({
					where: {
						id: data.purchaseOrderId,
					},
				});
				return;
			}

			console.log(
				"Checkout da purchaseOrder foi finalizado e ela já foi comprada"
			);
		} catch (error) {
			throw new Error(`Error verifying purchase order: ${error}`);
		}
	}
}

export { PurchaseOrderRepositoryPrisma };
