import { FastifyInstance } from "fastify";
import { jwtValidator } from "../middlewares/auth.middleware";
import { UserUseCase } from "../usecases/user.usecase";
import { User, UserUpdate } from "../interfaces/user.interface";

const userUseCase = new UserUseCase();

export async function userRoutes(fastify: FastifyInstance) {
	fastify.get("/events", {
		preHandler: [jwtValidator],
		handler: async (req, reply) => {
			try {
				const user = req.user as User
				const data = await userUseCase.findAllEventsByUserId(user.id);
				reply.code(200).send(data);
			} catch (error) {
				reply.code(404).send(error);
			}
		},
	});

	fastify.get<{ Params: { externalId: string } }>("/", {
		preHandler: [jwtValidator],
		handler: async (req, reply) => {
			const externalId = req.params.externalId;
			try {
				const data = await userUseCase.findUserByExternalOrId(externalId);
				reply.code(200).send(data);
			} catch (error) {
				reply.code(404).send(error);
			}
		},
	});

	fastify.patch<{ Body: UserUpdate; Params: { externalId: string } }>("/", {
		preHandler: [jwtValidator],
		handler: async (req, reply) => {
			const externalId = req.params.externalId;
			const { role, cpf, phone } = req.body;
			try {
				const data = await userUseCase.update({
					id: externalId,
					role,
					cpf,
					phone,
				});
				reply.code(200).send(data);
			} catch (error) {
				reply.code(400).send(error);
			}
		},
	});
}
