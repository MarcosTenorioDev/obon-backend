import {
	Address,
	AddressCreate,
	AddressRepository,
} from "../interfaces/address.interface";

class AddressUseCase {
	constructor(private readonly addressRepository: AddressRepository) {}

	async createAddress(address: AddressCreate): Promise<Address> {
		return this.addressRepository.create(address);
	}

	async getAddressById(id: string): Promise<Address> {
		const existingAddress = await this.addressRepository.getAddressById(id);
		if (!existingAddress) {
			throw new Error("Address not found");
		}
		return existingAddress;
	}

	async getUniqueCities(): Promise<{ city: string }[]> {
		return await this.addressRepository.getUniqueCities();
	}
}

export { AddressUseCase };
