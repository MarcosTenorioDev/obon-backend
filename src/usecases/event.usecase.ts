import {
  Event,
  EventCreate,
  EventPreview,
  EventRepository,
  IEventDetails,
  IEventEditPayload,
  IEventSearch,
  RecentEvents,
} from "../interfaces/event.interface";
import { User } from "../interfaces/user.interface";
import { parseISO, isValid } from "date-fns";

class EventUseCase {
  private readonly eventRepository: EventRepository;
  constructor(eventRepository: EventRepository) {
    this.eventRepository = eventRepository;
  }

  async create(eventData: EventCreate): Promise<Event> {
    try {
      return await this.eventRepository.create(eventData);
    } catch (error: any) {
      console.error("Error in EventUseCase create:", error);
      throw new Error(
        "Error creating event. Please check your data and try again."
      );
    }
  }

  async getEventsByCategory(categoryId: string): Promise<RecentEvents[]> {
    return await this.eventRepository.getEventsByCategory(categoryId);
  }

  async getEventById(id: string): Promise<any> {
    return await this.eventRepository.getEventById(id);
  }

  async getEventsByCreatorId(creatorId: string): Promise<EventPreview[]> {
    return await this.eventRepository.getEventsByCreatorId(creatorId);
  }

  async getRecentEvents(): Promise<RecentEvents[]> {
    return await this.eventRepository.getRecentEvents();
  }

  async getEventDetailsById(data: {
    id: string;
    user: User;
  }): Promise<IEventDetails> {
    return await this.eventRepository.getEventDetailsById(data);
  }

  async update(data: { payload: IEventEditPayload; id: string; user: User }) {
    return await this.eventRepository.update(data);
  }

  async getEventByTitle(data: {
    title: string;
    user: User;
  }): Promise<IEventSearch[]> {
    return await this.eventRepository.getEventByTitle(data);
  }

  async getFilteredEvents(data: {
	city?: string;
	category?: string;
	dateFrom?: string;
	dateTo?: string;
  }): Promise<RecentEvents[]> {
	const { city, category, dateFrom, dateTo } = data;
  
	// Verificar se pelo menos um parâmetro foi fornecido
	if (!city && !category && !dateFrom && !dateTo) {
	  throw new Error(
		"At least one query parameter (city, category, dateFrom, or dateTo) is required."
	  );
	}
  
	// Validar dependência entre "dateFrom" e "dateTo"
	if (dateTo && !dateFrom) {
	  throw new Error("dateTo cannot be provided without dateFrom.");
	}
  
	const isValidDate = (date: string | undefined): boolean => {
	  if (!date || date.trim() === "") return true;
	  const parsedDate = parseISO(date);
	  return isValid(parsedDate);
	};
  
	if (!isValidDate(dateFrom)) {
	  throw new Error("Invalid date format for dateFrom. Use a valid date.");
	}
  
	if (!isValidDate(dateTo)) {
	  throw new Error("Invalid date format for dateTo. Use a valid date.");
	}
  
	//Formatando valores
	const cities = city ? city.split(",").map((city) => city.trim()) : [];
	const categoryId = category;
	const dateRange =
	  dateFrom || dateTo
		? {
			from: dateFrom || undefined,
			to: dateTo || undefined,
		  }
		: undefined;
  
	return await this.eventRepository.getFilteredEvents({
	  cities,
	  categoryId,
	  dateRange,
	});
  }
  
}

export { EventUseCase };
