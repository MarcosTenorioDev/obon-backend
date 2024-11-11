import { Address } from "./address.interface";
import { TicketType } from "./ticketType.interface";
import { User } from "./user.interface";

export interface Event {
	id: string;
	title: string;
	description: string;
	capacity: number;
	categoryId: string;
	startDate: Date;
	endDate: Date;
	maxTicketsPerUser: number;
	format: string;
	producerId: string;
	ageRating: number;
	additionalDetails: string;
	creatorId: string;
	addressId: string;
}

export interface EventPreview {
	id: string;
	title: string;
	description: string;
	addressId: string;
	startDate: Date;
	endDate: Date;
	format: string;
	assets: {
		id: string;
		url: string;
		type: string;
		description: string | null;
	}[];
	Address: Address;
}

export interface EventCreate {
	title: string;
	description: string;
	capacity: number;
	categoryId: string;
	startDate: Date;
	endDate: Date;
	format: string;
	maxTicketsPerUser: number;
	producerId: string;
	ageRating: number;
	additionalDetails: string;
	creatorId: string;
	addressId: string;
	ticketTypes: {
		description: string;
		price: number;
		quantity: number;
		salesStartDate: Date;
		salesEndDate: Date;
		isActive: boolean;
	}[];
}

export interface EventById {
	id: string;
	title: string;
	description: string;
	capacity: number;
	status: string | null;
	maxTicketsPerUser: number;
	startDate: Date;
	endDate: Date;
	salesStartDate: Date | null;
	showStartDate: Date | null;
	format: string;
	ageRating: number;
	additionalDetails: string;
	Address: {
		city: string;
		complement: string | null;
		neighborhood: string;
		number: string;
		state: string;
		street: string;
		zipCode: string;
	};
	ticketTypes: {
		id: string;
		description: string;
		price: number;
		salesStartDate: Date | null;
		salesEndDate: Date | null;
		isActive: boolean;
	}[];
	assets: {
		id: string;
		url: string;
		type: string;
		description: string | null;
	}[];
	attractions: {
		id: string;
		name: string;
		description: string | null;
		imageUrl: string;
	}[];
	producers: {
		id: string;
		name: string;
		email: string;
		description: string | null;
		imageUrl: string;
	};
}

export interface RecentEvents {
	id: string;
	title: string;
	addressId: string;
	Address: Address;
	startDate: Date;
	assets: {
		id: string;
		url: string;
		type: string;
		description: string | null;
	}[];
}

export interface EventValidate {
	id: string;
	creatorId: string;
}

export interface IEventDetails {
	id: string;
	title: string;
	description: string;
	capacity: number;
	categoryId: string;
	startDate: Date;
	endDate: Date;
	status: string | null;
	format: string;
	ageRating: number;
	maxTicketsPerUser: number;
	additionalDetails: string;
	producerId: string;
	addressId: string;
	ticketTypes: TicketType[];
}

export interface IEventEditPayload {
	title: string;
	description: string;
	capacity: number;
	categoryId: string;
	startDate: Date;
	endDate: Date;
	status: string;
	format: string;
	ageRating: number;
	maxTicketsPerUser: number;
	additionalDetails: string;
	producerId: string;
	addressId: string;
}

export interface EventRepository {
	create(data: EventCreate): Promise<Event>;
	getEventsByCategory(categoryId: string): Promise<EventPreview[]>;
	getEventById(id: string): Promise<EventById>;
	getEventsByCreatorId(creatorId: string): Promise<EventPreview[]>;
	getRecentEvents(): Promise<RecentEvents[]>;
	getEventToValidate(id: string): Promise<EventValidate>;
	getEventDetailsById(data: { id: string; user: User }): Promise<IEventDetails>;
	update(data: {
		payload: IEventEditPayload;
		id: string;
		user: User;
	}): Promise<IEventDetails>;
}
