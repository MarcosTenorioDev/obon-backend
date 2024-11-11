import { User } from "./user.interface";

export interface Asset {
	id: string;
	eventId: string;
	type: string;
	url: string;
	description: string | null;
}
export interface AssetCreate {
	eventId: string;
	type: string;
	url: string;
	description: string | null;
}
export interface AssetRepository {
	createAsset(data: AssetCreate, user: User): Promise<Asset>;
	deleteAsset(id: string): Promise<void>;
}
