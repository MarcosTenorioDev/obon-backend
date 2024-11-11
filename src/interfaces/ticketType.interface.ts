import { User } from "./user.interface";

export interface TicketTypeCreate {
	eventId: string;
	description: string;
	price: number;
	quantity: number;
	salesStartDate?: Date;
	salesEndDate?: Date;
	isActive?: boolean;
}

export interface TicketType {
	id: string;
	eventId: string;
	description: string;
	price: number;
	quantity: number;
	salesStartDate: Date | null;
	salesEndDate: Date | null;
	isActive: boolean;
}

export interface TicketTypeUpdate {
	quantity: number;
	salesStartDate: Date | string;
	salesEndDate: Date | string;
	isActive: boolean;
	eventId: string;
}

export interface TicketTypeRepository {
	create(data: TicketTypeCreate): Promise<TicketType>;
	update(data: TicketTypeUpdate, id: string, user: User): Promise<TicketType>;
	findTicketTypeById(ticketTypeId: string): Promise<TicketType>;
}
