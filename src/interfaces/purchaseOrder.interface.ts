import { Address } from "./address.interface";
import { Asset } from "./asset.interface";
import { EventCategory } from "./eventCategory.interface";
import { Producer } from "./producer.interface";
import { User } from "./user.interface";

export interface TicketTypeQuantity {
	ticketTypeId: string;
	participantName: string;
	participantEmail: string;
}

export interface PurchaseOrder {
	id: string;
	userId: string;
	eventId: string;
	totalPrice: number;
	status: string;
	quantityTickets: number;
	createdAt: Date;
	updatedAt: Date | null;
	reservationExpiresAt: Date | null;
	reservedTicketTypes: {
		ticketTypeId: string;
		purchaseOrderId: string;
		quantity: number;
	}[];
}

export interface PurchaseOrderAndTicketsCreate {
	eventId: string;
	ticketTypes: TicketTypeQuantity[];
	user: User;
}

export interface ReservedPurchaseOrderCreate {
	eventId: string;
	ticketTypes: { ticketTypeId: string }[];
	user: User;
}

export interface ReservedPurchaseOrderUpdate {
	id:string
	eventId: string;
	ticketTypes: TicketTypeQuantity[];
	user: User;
}

interface TicketTypeInfo {
	description: string;
	isActive: boolean;
	price: number;
}

interface TicketInfo {
	id: string;
	ticketTypeId: string;
	ticketType: TicketTypeInfo;
	participantName: string;
	participantEmail: string;
	price: number;
	status: string;
	purchaseDate: Date | null;
	seatLocation: string | null;
}

export interface PurchaseOrderInfo {
	id: string;
	eventId: string;
	status: string;
	tickets: TicketInfo[];
	event: {
		maxTicketsPerUser: number;
	};
}

export interface PurchaseOrderReserved {
	id: string;
	userId: string;
	eventId: string;
	totalPrice: number;
	quantityTickets: number;
	status: string;
	createdAt: Date;
	updatedAt: Date | null;
	reservationExpiresAt: Date | null;
	reservedTicketTypes: {
		ticketTypeId: string;
		purchaseOrderId: string;
		quantity: number;
		ticketType:{
			description:string,
			price:number
		}
	}[];
	event: {
		Address: Address;
		producers: Producer;
		category: EventCategory | null;
		startDate: Date;
		endDate: Date;
		title: string;
		ageRating:number;
		assets: Asset[]
	};
}

export interface PurchaseOrderRepository {
	create(
		data: ReservedPurchaseOrderCreate,
		reservedTickets: {ticketTypeId:string, quantityReserved:number}[]
	): Promise<PurchaseOrder | undefined>;
	findPurchaseOrdersByUserAndEventId(
		id: string,
		eventId: string
	): Promise<PurchaseOrderInfo[]>;
	findReservedById(id: string, user: User): Promise<PurchaseOrderReserved>;
	reservePurchaseOrder(data:ReservedPurchaseOrderUpdate):Promise<PurchaseOrder>;
	verifyIfHasPurchased(data:{purchaseOrderId:string}):void;
}
