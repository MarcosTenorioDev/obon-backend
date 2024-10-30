import { FastifyInstance } from "fastify";
import {
	PurchaseOrderReserved,
	TicketTypeQuantity,
} from "../interfaces/purchaseOrder.interface";
import { createQueues, getQueue } from "../lib/queue.lib";
import { jwtValidator } from "../middlewares/auth.middleware";
import { User } from "../interfaces/user.interface";
import { PurchaseOrderUseCase } from "../usecases/purchaseOrder.usecase";

export async function purchaseOrderRoutes(fastify: FastifyInstance) {
	createQueues();
	const purchaseOrderUseCase = new PurchaseOrderUseCase();
	fastify.post<{ Body: PurchaseOrderReserved }>("/", {
		preHandler: [],
		handler: async (req, reply) => {
			const user = {
				id: "614fd3f4-042d-4bcb-9787-2e5e742e38a0",
				externalId: "12345",
				firstName: "John",
				lastName: "Doe",
				email: "johndoe@example.com",
				phone: "1234567890",
				cpf: "123.456.789-00",
			};
			try {
				const queue = getQueue("purchaseOrder");
				console.log("Adding job to queue:", req.body);
				const job = await queue.add({ ...req.body, user });
				const result = await job.finished();
				reply.code(201).send(result);
			} catch (error) {
				console.error(error);
				reply.code(400).send({
					error:
						error instanceof Error
							? error.message
							: "An unknown error occurred",
				});
			}
		},
	});

	fastify.get<{ Params: { id: string } }>(
		"/reserved/:id",
		{
			preHandler: [
				/* jwtValidator */
			],
		},
		async (req, reply) => {
			const user = req.user as User;
			const { id } = req.params;
			try {
				const data = await purchaseOrderUseCase.findReservedById(id, user);
				reply.code(200).send(data);
			} catch (error) {
				console.error(error);
				reply.code(400).send({
					error:
						error instanceof Error
							? error.message
							: "An unknown error occurred",
				});
			}
		}
	);

	fastify.put<{
		Params: { id: string };
		Body: { eventId: string; ticketTypes: TicketTypeQuantity[] };
	}>(
		"/reserved/:id",
		{
			preHandler: [
				/* jwtValidator */
			],
		},
		async (req, reply) => {
			const user = {
				id: "614fd3f4-042d-4bcb-9787-2e5e742e38a0",
				externalId: "12345",
				firstName: "John",
				lastName: "Doe",
				email: "johndoe@example.com",
				phone: "1234567890",
				cpf: "123.456.789-00",
			};
			const { id } = req.params;
			const { eventId, ticketTypes } = req.body;
			try {
				const data = await purchaseOrderUseCase.reservePurchaseOrder({
					id,
					eventId,
					ticketTypes,
					user,
				});
				reply.code(200).send(data);
			} catch (error) {
				console.error(error);
				reply.code(400).send({
					error:
						error instanceof Error
							? error.message
							: "An unknown error occurred",
				});
			}
		}
	);
}
