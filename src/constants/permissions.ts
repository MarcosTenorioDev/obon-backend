export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type Role = "user" | "admin";

type RoutePermissions = {
	[method in Method]?: Role[];
};

const permissions: Record<string, RoutePermissions> = {
	"/events": {
		POST: ["admin", "user"],
	},
	"/events/details/:id": {
		GET: ["admin", "user"],
	},
	"/events/title/:title": {
		GET: ["admin", "user"],
	},
	"/events/:id": {
		PUT: ["admin", "user"],
	},
	"/events/created": {
		GET: ["admin", "user"],
	},
	"/ticketType": {
		POST: ["admin", "user"],
	},
	"/ticketType/:id": {
		PUT: ["admin", "user"],
	},
	"/users": {
		GET: ["admin", "user"],
		PATCH: ["admin", "user"],
	},
	"/users/events": {
		GET: ["admin", "user"],
	},
	"/purchaseorders": {
		POST: ["admin", "user"],
	},
	"/purchaseorders/user/event/:eventId": {
		GET: ["admin", "user"],
	},
	"/purchaseorders/reserved/:id": {
		GET: ["admin", "user"],
		PUT: ["admin", "user"],
	},
	"/producers": {
		GET: ["admin", "user"],
		POST: ["admin", "user"],
	},
	"/event/categories": {
		POST: ["admin"],
	},
	"/assets/upload": {
		POST: ["admin", "user"],
	},
	"/assets/upload/:filename": {
		DELETE: ["admin", "user"],
	},
	"/address": {
		POST: ["admin", "user"],
	},
};

export function checkPermissions(
	path: string,
	method: Method
): Role[] | undefined {
	if (!permissions[path]) {
		throw new Error("Path not found in permissions record, please verify");
	}
	if (!permissions[path][method]) {
		throw new Error("Method not allowed");
	}
	return permissions[path]?.[method];
}
