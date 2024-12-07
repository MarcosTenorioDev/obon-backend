import { createClerkClient } from "@clerk/fastify";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { checkPermissions, Role } from "../constants/permissions";
import { env } from "../env";
import { UserRepositoryPrisma } from "../repositories/user.repository";

export async function jwtValidator(req: any, reply: any) {
	try {
		// Log para verificar o cabeçalho Authorization
		console.log("Authorization Header:", req.headers["authorization"]);

		// Obtém o token do cabeçalho Authorization
		const authorizationHeader = req.headers["authorization"];
		if (!authorizationHeader) {
			reply.code(401).send({ error: "Authorization header is missing" });
			return;
		}

		// Verifica o formato do cabeçalho
		const token = authorizationHeader.split(" ")[1];
		if (!token) {
			reply.code(401).send({ error: "Authorization token is required" });
			return;
		}

		// Inicializa o cliente Clerk
		const clerkClient = createClerkClient({
			secretKey: env.CLERK_API_KEY,
			publishableKey: env.CLERK_PUBLISHABLE_KEY,
		});

		// Configuração do JWKS para validação do token
		const jwtUri = env.JWT_PUBLIC_KEY!;
		const jwksClientInstance = jwksClient({
			jwksUri: jwtUri,
		});

		const getKey = (header: any, callback: any) => {
			jwksClientInstance.getSigningKey(header.kid, (err, key: any) => {
				if (err) {
					console.error("Error getting signing key:", err);
					callback(err);
				}
				const signingKey = key.getPublicKey();
				callback(null, signingKey);
			});
		};

		// Valida o token recebido
		const decodedToken: any = await new Promise((resolve, reject) => {
			jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
				if (err) {
					reject(err instanceof Error ? err : new Error(err));
				} else {
					resolve(decoded);
				}
			});
		});

		// Obtém um novo token usando o template `tokenDev`
		const newToken = await clerkClient.sessions.getToken({
			template: "tokenDev",
		});

		if (!newToken) {
			reply.code(401).send({ error: "Failed to retrieve token from Clerk" });
			return;
		}

		// Valida o novo token
		const verifiedNewToken: any = await new Promise((resolve, reject) => {
			jwt.verify(newToken, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
				if (err) {
					reject(err instanceof Error ? err : new Error(err));
				} else {
					resolve(decoded);
				}
			});
		});

		// Lógica adicional
		const externalId = decodedToken.sub;
		const clerkUser = await clerkClient.users.getUser(externalId);

		if (!clerkUser) {
			reply.code(401).send({ error: "Unauthorized" });
			return;
		}

		// Adiciona o usuário ao request
		req.user = clerkUser;
	} catch (error: any) {
		console.error("JWT Verification Error:", error.message);
		reply.code(401).send({ error: error.message });
	}
}
