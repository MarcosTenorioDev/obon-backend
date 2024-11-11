import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	TicketTypeCreate,
	TicketTypeUpdate,
} from "../interfaces/ticketType.interface";
import { User } from "../interfaces/user.interface";
import { jwtValidator } from "../middlewares/auth.middleware";
import { TicketTypeUseCase } from "../usecases/ticketType.usecase";

const ticketTypeUseCase = new TicketTypeUseCase();

export async function ticketTypeRoutes(fastify: FastifyInstance) {
	postTicketType(fastify);
	updateTicketType(fastify);
}

function postTicketType(fastify: FastifyInstance) {
	fastify.post("/", {
		preHandler: [jwtValidator],
		handler: async (
			req: FastifyRequest<{
				Body: TicketTypeCreate;
			}>,
			reply: FastifyReply
		) => {
			const user = req.user as User;
			try {
				const data = await ticketTypeUseCase.create(req.body, user);
				reply.code(201).send(data);
			} catch (error) {
				reply.code(400).send(error);
			}
		},
	});
}

function updateTicketType(fastify: FastifyInstance) {
	fastify.put("/:id", {
		preHandler: [jwtValidator],
		handler: async (
			req: FastifyRequest<{
				Body: TicketTypeUpdate;
				Params: { id: string };
			}>,
			reply: FastifyReply
		) => {
			const user = req.user as User;
			const { id } = req.params;
			try {
				const data = await ticketTypeUseCase.update(req.body, id, user);
				reply.code(200).send(data);
			} catch (error) {
				reply.code(400).send(error);
			}
		},
	});
}
