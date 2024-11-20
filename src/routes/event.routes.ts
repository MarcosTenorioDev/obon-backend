import { FastifyInstance } from "fastify";
import { EventCreate, IEventEditPayload } from "../interfaces/event.interface";
import { User } from "../interfaces/user.interface";
import { jwtValidator } from "../middlewares/auth.middleware";
import { EventRepositoryPrisma } from "../repositories/event.repository";
import { EventUseCase } from "../usecases/event.usecase";

const eventRepository = new EventRepositoryPrisma();
const eventUseCase = new EventUseCase(eventRepository);

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: EventCreate }>("/", {
    preHandler: [jwtValidator],
    handler: async (req, reply) => {
      const {
        title,
        description,
        capacity,
        addressId,
        categoryId,
        startDate,
        endDate,
        format,
        producerId,
        ageRating,
        additionalDetails,
        maxTicketsPerUser,
        ticketTypes,
      } = req.body;
      const user = req.user as User;
      try {
        const data = await eventUseCase.create({
          title,
          description,
          capacity,
          addressId,
          categoryId,
          startDate,
          endDate,
          format,
          producerId,
          ageRating,
          additionalDetails,
          creatorId: user.id,
          maxTicketsPerUser,
          ticketTypes,
        });
        reply.code(201).send(data);
      } catch (error: any) {
        console.error("Error in event creation route:", error);
        reply
          .code(400)
          .send({ error: error.message || "Unable to create event" });
      }
    },
  });

  fastify.get<{ Params: { categoryId: string } }>("/category/:categoryId", {
    handler: async (req, reply) => {
      const { categoryId } = req.params;
      try {
        const data = await eventUseCase.getEventsByCategory(categoryId);
        reply.code(200).send(data);
      } catch (error) {
        reply.code(404).send(error);
      }
    },
  });

  fastify.get<{ Params: { id: string } }>("/:id", {
    handler: async (req, reply) => {
      const { id } = req.params;
      try {
        const data = await eventUseCase.getEventById(id);
        reply.code(200).send(data);
      } catch (error) {
        reply.code(404).send(error);
      }
    },
  });

  fastify.get<{ Params: { creatorId: string } }>("/created", {
    preHandler: [jwtValidator],
    handler: async (req, reply) => {
      const { id } = req.user as User;
      try {
        const data = await eventUseCase.getEventsByCreatorId(id);
        reply.code(200).send(data);
      } catch (error) {
        reply.code(404).send(error);
      }
    },
  });

  fastify.get("/recent", async (req, reply) => {
    try {
      const data = await eventUseCase.getRecentEvents();
      reply.code(200).send(data);
    } catch (error) {
      reply.code(404).send(error);
    }
  });

  fastify.get<{ Params: { id: string } }>("/details/:id", {
    preHandler: [jwtValidator],
    handler: async (req, reply) => {
      const { id } = req.params;
      const user = req.user as User;
      try {
        const data = await eventUseCase.getEventDetailsById({ id, user });
        reply.code(200).send(data);
      } catch (error) {
        reply.code(404).send(error);
      }
    },
  });

  fastify.put<{ Params: { id: string }; Body: IEventEditPayload }>("/:id", {
    preHandler: [jwtValidator],
    handler: async (req, reply) => {
      const { id } = req.params;
      const user = req.user as User;
      const payload: IEventEditPayload = req.body;
      try {
        const data = await eventUseCase.update({ payload, id, user });
        reply.code(200).send(data);
      } catch (error) {
        reply.code(404).send(error);
      }
    },
  });

  fastify.get<{ Params: { title: string } }>("/title/:title", {
    preHandler: [jwtValidator],
    handler: async (req, reply) => {
      const { title } = req.params;
      const user = req.user as User;
      try {
        const data = await eventUseCase.getEventByTitle({ title, user });
        reply.code(200).send(data);
      } catch (error) {
        reply.code(404).send(error);
      }
    },
  });

  fastify.get<{
    Querystring: {
      city?: string;
      category?: string;
      dateFrom?: string;
      dateTo?: string;
    };
  }>("/filtered", async (req, reply) => {
    try {
      const { city, category, dateFrom, dateTo } = req.query;

      const data = await eventUseCase.getFilteredEvents({
        city,
        category,
        dateFrom,
        dateTo,
      });

      reply.code(200).send(data);
    } catch (error) {
      console.error(error);
      reply
        .code(500)
        .send({ message: `An error occurred while fetching events. ${error}` });
    }
  });
}
