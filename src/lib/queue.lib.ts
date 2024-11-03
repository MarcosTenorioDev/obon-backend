import Bull, { Job } from "bull";
import { env } from "../env";
import { PurchaseOrderUseCase } from "../usecases/purchaseOrder.usecase";
import { PurchaseOrderRepositoryPrisma } from "../repositories/purchaseOrder.repository";

interface QueueConfig {
	name: string;
	processJob: (job: Job) => Promise<any>;
}

const queuesConfig: QueueConfig[] = [
	{
		name: "purchaseOrder",
		processJob: async (job) => {
			const purchaseOrderUseCase = new PurchaseOrderUseCase()
			console.log("Processing job");
      		console.log(job.data)
			const purchaseOrder = await purchaseOrderUseCase.create(job.data)

			if (!purchaseOrder || !purchaseOrder.reservationExpiresAt) {
				throw new Error("Unable to create purchaseOrder");
			} 

			// Adiciona um job para verificar após 15 minutos
			getQueue("verifyPurchaseOrder").add(
				{ purchaseOrderId: purchaseOrder.id },
				{ delay: 15 * 60 * 1000 } // 15 minutos em milissegundos
			);

			return purchaseOrder; // Retorna o pedido criado
		},
	},
	{
		name: "verifyPurchaseOrder",
		processJob: async (job) => {
			const purchaseOrderUseCase = new PurchaseOrderUseCase();
			console.log("Indo verificar purchaseOrder", job.data);
			purchaseOrderUseCase.verifyIfHasPurchased(job.data);
		},
	},
];

const queues: Record<string, Bull.Queue> = {};

export function createQueues(): void {
	for (const queueConfig of queuesConfig) {
		const { name, processJob } = queueConfig;
		queues[name] = new Bull(name, {
			redis: {
				host: env.REDIS_HOST as string,
				port: parseInt(env.REDIS_PORT as string),
				password: env.REDIS_PASSWORD as string,
				username: env.REDIS_USERNAME as string,
			},
		});
		queues[name].process(processJob);
		console.log(`Queue ${name} created and processing jobs.`);
	}
}

export function getQueue(name: string): Bull.Queue {
	if (!queues[name]) {
		throw new Error(`Queue ${name} does not exist.`);
	}

	console.log(`Returning queue ${name}`);
	return queues[name];
}
