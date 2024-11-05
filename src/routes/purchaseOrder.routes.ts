import { FastifyInstance } from "fastify";
import {
	PurchaseOrderReserved,
	TicketTypeQuantity,
} from "../interfaces/purchaseOrder.interface";
import { User } from "../interfaces/user.interface";
import { createQueues, getQueue } from "../lib/queue.lib";
import { jwtValidator } from "../middlewares/auth.middleware";
import { PurchaseOrderUseCase } from "../usecases/purchaseOrder.usecase";

export async function purchaseOrderRoutes(fastify: FastifyInstance) {
	createQueues();
	const purchaseOrderUseCase = new PurchaseOrderUseCase();
	fastify.post<{ Body: PurchaseOrderReserved }>("/", {
		preHandler: [jwtValidator],
		handler: async (req, reply) => {
			const user = req.user as User;
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
			preHandler: [jwtValidator],
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
			preHandler: [jwtValidator],
		},
		async (req, reply) => {
			const user = req.user as User;
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

	fastify.get<{ Params: { eventId: string } }>(
		"/user/event/:eventId",
		{
			preHandler: [jwtValidator],
		},
		async (req, reply) => {
			const user = req.user as User;
			const { eventId } = req.params;
			try {
				const data =
					await purchaseOrderUseCase.findPurchaseOrdersByUserAndEventId(
						eventId,
						user.id
					);
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
