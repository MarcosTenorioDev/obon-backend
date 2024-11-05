import { EventRepository } from "../interfaces/event.interface";
import {
	PurchaseOrder,
	PurchaseOrderRepository,
	ReservedPurchaseOrderCreate,
	ReservedPurchaseOrderUpdate,
} from "../interfaces/purchaseOrder.interface";
import { TicketTypeRepository } from "../interfaces/ticketType.interface";
import { User } from "../interfaces/user.interface";
import { EventRepositoryPrisma } from "../repositories/event.repository";
import { PurchaseOrderRepositoryPrisma } from "../repositories/purchaseOrder.repository";
import { TicketTypeRepositoryPrisma } from "../repositories/ticketType.repository";

class PurchaseOrderUseCase {
	private purchaseOrderRepository: PurchaseOrderRepository;
	private ticketTypeRepository: TicketTypeRepository;
	private eventRepository: EventRepository;

	constructor() {
		this.purchaseOrderRepository = new PurchaseOrderRepositoryPrisma();
		this.ticketTypeRepository = new TicketTypeRepositoryPrisma();
		this.eventRepository = new EventRepositoryPrisma();
	}

	async create(data: ReservedPurchaseOrderCreate) {
		const purchaseOrders =
			await this.purchaseOrderRepository.findPurchaseOrdersByUserAndEventId(
				data.user.id,
				data.eventId
			);
		const ticketsQuantityPurchased = purchaseOrders.reduce(
			(acc, purchaseOrder) => {
				return acc + purchaseOrder.tickets.length;
			},
			0
		);
		const ticketTypeIds: string[] | [] = Array.from(
			new Set(
				data.ticketTypes.map(
					(ticketType: { ticketTypeId: string }) => ticketType.ticketTypeId
				)
			)
		);
		//Validar se o eventId é válido
		const event = await this.eventRepository.getEventById(data.eventId);

		//Validar se há algum ticketTypeId inválido e mapear a quantidade solicitada na requisição.
		const ticketTypes = await Promise.all(
			ticketTypeIds.map(async (id) => {
				const ticketType = await this.ticketTypeRepository.findTicketTypeById(
					id
				);

				return {
					...ticketType,
					requestedCount: data.ticketTypes.reduce(
						(acc: number, currentTicket: any) => {
							if (currentTicket.ticketTypeId === ticketType.id) {
								return acc + 1;
							}
							return acc;
						},
						0
					),
				};
			})
		);

		//Validar se o usuário já tem a quantidade máxima de tickets
		if (ticketsQuantityPurchased >= event.maxTicketsPerUser) {
			throw new Error(
				"User already reached the maximum quantity tickets in this event"
			);
		}

		//Validar se a compra vai superar a quantidade máxima de tickets do evento
		if (
			data.ticketTypes.length + ticketsQuantityPurchased >
			event.maxTicketsPerUser
		) {
			throw new Error(
				"Maximum quantity per user exceeded when purchasing tickets"
			);
		}

		//Validar se a quantidade requisitada pelo usuário está disponível
		ticketTypes.forEach((ticketType) => {
			if (ticketType.quantity < ticketType.requestedCount) {
				throw new Error(
					`Insufficient ticket quantity available for ${ticketType?.description}. Available: ${ticketType?.quantity}, Requested: ${ticketType.requestedCount}`
				);
			}
		});

		const ticketsArr = ticketTypes.map((ticket) => {
			return {
				ticketTypeId: ticket.id,
				quantityReserved: ticket.requestedCount,
			};
		});

		return await this.purchaseOrderRepository.create(data, ticketsArr);
	}

	async findReservedById(id: string, user: User) {
		return await this.purchaseOrderRepository.findReservedById(id, user);
	}

	async reservePurchaseOrder(
		data: ReservedPurchaseOrderUpdate
	): Promise<PurchaseOrder> {
		//Verificar se a purchaseOrderExiste
		//Verificar se está com status de reservada
		//Verificar se o usuário pode acessar a purchaseOrder
		const purchaseOrder = await this.purchaseOrderRepository.findReservedById(
			data.id,
			data.user
		);

		// Verificar se a quantidade comprada é igual a quantidade reservada e se a quantidade reservada está sendo devidamente comprada

		// Agrupar ticketTypes comprados
		const purchasedTicketsCount = data.ticketTypes.reduce((acc, ticket) => {
			acc[ticket.ticketTypeId] = (acc[ticket.ticketTypeId] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		// Agrupar reservedTicketTypes
		const reservedTicketsCount = purchaseOrder.reservedTicketTypes.reduce(
			(acc, ticket) => {
				acc[ticket.ticketTypeId] = ticket.quantity;
				return acc;
			},
			{} as Record<string, number>
		);

		// Comparar quantidades
		for (const ticketTypeId of Object.keys(reservedTicketsCount)) {
			const reservedQuantity = reservedTicketsCount[ticketTypeId];
			const purchasedQuantity = purchasedTicketsCount[ticketTypeId] || 0;

			// Se a quantidade comprada não é igual à quantidade reservada
			if (purchasedQuantity !== reservedQuantity) {
				throw new Error(
					`Mismatch in ticket quantities for ticket type ${ticketTypeId}: reserved quantity is ${reservedQuantity}, but purchased quantity is ${purchasedQuantity}. Please ensure that the number of tickets purchased matches the reserved quantity.`
				);
			}
		}

		// Verificar se todos os tickets comprados estão reservados
		for (const ticketTypeId of Object.keys(purchasedTicketsCount)) {
			if (!(ticketTypeId in reservedTicketsCount)) {
				throw new Error(
					`Ticket type ${ticketTypeId} was purchased but not reserved. Please ensure that all purchased tickets were reserved first.`
				);
			}
		}

		return await this.purchaseOrderRepository.reservePurchaseOrder(data);
	}

	verifyIfHasPurchased(data: { purchaseOrderId: string }) {
		this.purchaseOrderRepository.verifyIfHasPurchased(data);
	}

	async findPurchaseOrdersByUserAndEventId(
		eventId: string,
		userId: string
	): Promise<{ ticketsPurchased: number }> {
		return await this.purchaseOrderRepository.findTicketQuantityPurchasedByUserAndEventId(
			userId,
			eventId
		);
	}
}

export { PurchaseOrderUseCase };
