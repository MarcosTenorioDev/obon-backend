import { EventRepository } from "../interfaces/event.interface";
import {
	TicketType,
	TicketTypeCreate,
	TicketTypeRepository,
	TicketTypeUpdate,
} from "../interfaces/ticketType.interface";
import { User } from "../interfaces/user.interface";
import { EventRepositoryPrisma } from "../repositories/event.repository";
import { TicketTypeRepositoryPrisma } from "../repositories/ticketType.repository";

class TicketTypeUseCase {
	private readonly ticketTypeRepository: TicketTypeRepository =
		new TicketTypeRepositoryPrisma();
	private readonly eventRepository: EventRepository =
		new EventRepositoryPrisma();

	async create(data: TicketTypeCreate, user: User): Promise<TicketType> {
		const event = await this.eventRepository.getEventToValidate(data.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		if (user.id !== event.creatorId) {
			throw new Error("operation denied");
		}

		return await this.ticketTypeRepository.create(data);
	}

	async update(
		data: TicketTypeUpdate,
		id: string,
		user: User
	): Promise<TicketType> {
		return await this.ticketTypeRepository.update(data, id, user);
	}
}

export { TicketTypeUseCase };
