import { FastifyInstance } from "fastify";
import { AddressCreate } from "../interfaces/address.interface";
import { jwtValidator } from "../middlewares/auth.middleware";
import { AddressRepositoryPrisma } from "../repositories/address.repository";
import { AddressUseCase } from "../usecases/address.usecases";

const addressRepository = new AddressRepositoryPrisma();
const addressUseCase = new AddressUseCase(addressRepository);

export async function addressRoutes(fastify: FastifyInstance) {
	registerAddressRoute(fastify);
	getAddressById(fastify);
	getCities(fastify);
}

function registerAddressRoute(fastify: FastifyInstance) {
	fastify.post<{ Body: AddressCreate }>(
		"/",
		{ preHandler: [jwtValidator] },
		async (req, reply) => {
			const { street, number, complement, neighborhood, city, state, zipCode } =
				req.body;
			try {
				const data = await addressUseCase.createAddress({
					street,
					number,
					complement,
					neighborhood,
					city,
					state,
					zipCode,
				});
				reply.code(201).send(data);
			} catch (error) {
				reply.code(400).send(error);
			}
		}
	);
}

function getAddressById(fastify: FastifyInstance) {
	fastify.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
		const { id } = req.params;
		try {
			const data = await addressUseCase.getAddressById(id);
			reply.code(200).send(data);
		} catch (error) {
			reply.code(404).send(error);
		}
	});
}

function getCities(fastify: FastifyInstance) {
	fastify.get("/cities", async (req, reply) => {
		try {
			const data = await addressUseCase.getUniqueCities();
			reply.code(200).send(data);
		} catch (error) {
			reply.code(404).send(error);
		}
	});
}
