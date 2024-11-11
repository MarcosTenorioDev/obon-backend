import { prisma } from "../database/prisma-client";
import {
	Asset,
	AssetCreate,
	AssetRepository,
} from "../interfaces/asset.interface";
import { User } from "../interfaces/user.interface";

class AssetRepositoryPrisma implements AssetRepository {
	async createAsset(data: AssetCreate, user: User): Promise<Asset> {
		try {
			const event = await prisma.event.findUniqueOrThrow({
				where: {
					id: data.eventId,
					creatorId: user.id,
				},
				select: {
					id: true,
				},
			});
			await prisma.asset.deleteMany({
				where: {
					eventId: event.id,
				},
			});

			return await prisma.asset.create({
				data: {
					eventId: event.id,
					type: data.type,
					url: data.url,
					description: data.description,
				},
			});
		} catch (error) {
			throw new Error("Unable to create asset");
		}
	}

	async deleteAsset(id: string): Promise<void> {
		try {
			await prisma.asset.delete({
				where: { id },
			});
		} catch (error) {
			throw new Error("Failed to delete asset");
		}
	}
}

export { AssetRepositoryPrisma };
