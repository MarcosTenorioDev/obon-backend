import { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma-client";
import {
  Event,
  EventById,
  EventCreate,
  EventPreview,
  EventRepository,
  EventValidate,
  IEventDetails,
  IEventEditPayload,
  IEventFilter,
  IEventSearch,
  RecentEvents,
} from "../interfaces/event.interface";
import { User } from "../interfaces/user.interface";
class EventRepositoryPrisma implements EventRepository {
  async create(data: EventCreate): Promise<Event> {
    try {
      return await prisma.$transaction(async (prisma) => {
        const event = await prisma.event.create({
          data: {
            title: data.title,
            description: data.description,
            addressId: data.addressId,
            capacity: data.capacity,
            categoryId: data.categoryId,
            startDate: data.startDate,
            endDate: data.endDate,
            maxTicketsPerUser: data.maxTicketsPerUser,
            format: data.format,
            ageRating: data.ageRating,
            additionalDetails: data.additionalDetails,
            creatorId: data.creatorId,
            producerId: data.producerId,
          },
        });

        const ticketTypes = await prisma.ticketType.createMany({
          data: data.ticketTypes.map((ticketType) => {
            return {
              eventId: event.id,
              description: ticketType.description,
              price: ticketType.price,
              quantity: ticketType.quantity,
              salesStartDate: ticketType.salesEndDate,
              salesEndDate: ticketType.salesEndDate,
              isActive: ticketType.isActive,
            };
          }),
        });

        return {
          ...event,
          tickeTypes: ticketTypes,
        };
      });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === "P2002") {
        throw new Error(
          "Duplicate entry. The event data conflicts with an existing record."
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          "Validation error. Please check the data you are sending."
        );
      }
      throw new Error("An unexpected error occurred while creating the event.");
    }
  }

  async getEventsByCategory(categoryId: string): Promise<RecentEvents[]> {
    try {
      return await prisma.event.findMany({
        where: {
          categoryId,
          status: {
            equals: "Ativo",
          },
        },
        select: {
          id: true,
          title: true,
          addressId: true,
          startDate: true,
          Address: true,
          assets: {
            select: {
              id: true,
              url: true,
              type: true,
              description: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error("Unable to get events by category");
    }
  }

  async getEventById(id: string): Promise<EventById> {
    try {
      const event = await prisma.event.findUniqueOrThrow({
        where: {
          id,
          status: {
            equals: "Ativo",
          },
        },
        include: {
          ticketTypes: {
            select: {
              id: true,
              description: true,
              price: true,
              quantity: true,
              salesStartDate: true,
              salesEndDate: true,
              isActive: true,
            },
            where: {
              isActive: {
                equals: true,
              },
            },
          },
          assets: {
            select: {
              id: true,
              url: true,
              type: true,
              description: true,
            },
          },
          attractions: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
            },
          },
          producers: {
            select: {
              id: true,
              name: true,
              email: true,
              description: true,
              imageUrl: true,
            },
          },
          Address: {
            select: {
              city: true,
              complement: true,
              neighborhood: true,
              number: true,
              state: true,
              street: true,
              zipCode: true,
            },
          },
        },
      });

      // Caso a quantidade de tickets por usuário for menor do que o total disponível, vamos retornar a quantidade de tickets por usuário.
      const ticketTypesAvailable = event.ticketTypes.map(
        ({ quantity, ...ticket }) => {
          return {
            ...ticket,
            quantityAvailablePerUser:
              event.maxTicketsPerUser < quantity
                ? event.maxTicketsPerUser
                : quantity,
          };
        }
      );

      // Retornamos o evento com os ticketTypes modificados
      return {
        ...event,
        ticketTypes: ticketTypesAvailable,
      };
    } catch (error) {
      throw new Error("Unable to get event by id");
    }
  }

  async getEventsByCreatorId(creatorId: string): Promise<EventPreview[]> {
    try {
      return await prisma.event.findMany({
        where: {
          creatorId,
        },
        select: {
          id: true,
          title: true,
          addressId: true,
          startDate: true,
          description: true,
          endDate: true,
          format: true,
          status: true,
          assets: {
            select: {
              id: true,
              url: true,
              type: true,
              description: true,
            },
          },
          Address: true,
        },
      });
    } catch (error) {
      throw new Error("Unable to get events by creator id");
    }
  }

  async getRecentEvents(): Promise<RecentEvents[]> {
    try {
      return await prisma.event.findMany({
        take: 10,
        orderBy: {
          startDate: "desc",
        },
        where: {
          status: {
            equals: "Ativo",
          },
        },
        select: {
          id: true,
          title: true,
          addressId: true,
          startDate: true,
          Address: true,
          assets: {
            select: {
              id: true,
              url: true,
              type: true,
              description: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error("Unable to get recent events");
    }
  }

  async getEventToValidate(id: string): Promise<EventValidate> {
    try {
      return prisma.event.findFirstOrThrow({
        where: {
          id,
        },
        select: {
          id: true,
          creatorId: true,
        },
      });
    } catch (error) {
      throw new Error("Unable to get event by id");
    }
  }

  async getEventDetailsById(data: {
    id: string;
    user: User;
  }): Promise<IEventDetails> {
    try {
      const event = await prisma.event.findUniqueOrThrow({
        where: {
          id: data.id,
          creatorId: data.user.id,
        },
        include: {
          assets: true,
          ticketTypes: true,
        },
      });

      return event;
    } catch (err) {
      throw new Error("Unable to get event by id");
    }
  }

  async update(data: {
    payload: IEventEditPayload;
    id: string;
    user: User;
  }): Promise<IEventDetails> {
    try {
      const {
        additionalDetails,
        addressId,
        ageRating,
        capacity,
        categoryId,
        description,
        endDate,
        format,
        maxTicketsPerUser,
        producerId,
        startDate,
        status,
        title,
      } = data.payload;
      const event = await prisma.event.update({
        where: {
          id: data.id,
          creatorId: data.user.id,
        },
        data: {
          additionalDetails,
          addressId,
          ageRating,
          capacity,
          categoryId,
          description,
          endDate,
          format,
          maxTicketsPerUser,
          producerId,
          startDate,
          status,
          title,
        },
        include: {
          assets: true,
          ticketTypes: true,
        },
      });

      return event;
    } catch (err) {
      throw new Error("Unable to Edit event");
    }
  }

  async getEventByTitle(data: {
    title: string;
    user: User;
  }): Promise<IEventSearch[]> {
    try {
      const event = await prisma.event.findMany({
        where: {
          title: {
            contains: data.title,
          },
          creatorId: data.user.id,
        },
        select: {
          id: true,
          title: true,
          status: true,
          assets: true,
        },
      });

      return event;
    } catch (err) {
      throw new Error("Unable to get event by id");
    }
  }

  async getFilteredEvents(data: IEventFilter): Promise<RecentEvents[]> {
	const { cities, categoryId, dateRange } = data;
	try {
	  return await prisma.event.findMany({
		where: {
			...(categoryId ? { categoryId } : {}),
			...(dateRange?.from && dateRange?.to
			  ? {
				  startDate: { gte: new Date(dateRange.from) },
				  endDate: { lte: new Date(dateRange.to) },
				}
			  : dateRange?.from
			  ? {
				  startDate: {
					gte: new Date(new Date(dateRange.from).setHours(0, 0, 0, 0)),
					lte: new Date(new Date(dateRange.from).setHours(23, 59, 59, 999))
				  }
				}
			  : {}),
			...(cities && cities.length > 0
			  ? { Address: { city: { in: cities } } }
			  : {}),
        status: {
          equals: "Ativo",
        },
		  },
		select: {
		  id: true,
		  title: true,
		  addressId: true,
		  startDate: true,
		  Address: true,
		  assets: {
			select: {
			  id: true,
			  url: true,
			  type: true,
			  description: true,
			},
		  },
		},
		take: 20,
	  });
	} catch (error) {
	  console.error("Error fetching events:", error);
	  throw new Error("An unexpected error occurred while fetching events.");
	}
  }
  
}

export { EventRepositoryPrisma };
