import { createClerkClient } from "@clerk/fastify";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { checkPermissions, Role } from "../constants/permissions";
import { env } from "../env";
import { UserRepositoryPrisma } from "../repositories/user.repository";

export async function jwtValidator(req: any, reply: any) {
  try {
    const clerkClient = createClerkClient({
      secretKey: env.CLERK_API_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });

    // Obtém o token do cabeçalho Authorization (sem exigir "Bearer")
    const token = req.headers["authorization"];
    if (!token) {
      reply.code(401).send({ error: "Authorization token is required" });
      return;
    }

    const jwtUri = env.JWT_PUBLIC_KEY!;
    const jwksClientInstance = jwksClient({
      jwksUri: jwtUri,
    });

    const getKey = (header: any, callback: any) => {
      jwksClientInstance.getSigningKey(header.kid, (err, key: any) => {
        if (err) {
          console.error("Error getting signing key:", err);
          callback(err);
        } else {
          const signingKey = key.getPublicKey();
          callback(null, signingKey);
        }
      });
    };

    // Valida o token com JWKS
    const decodedToken: any = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) {
          console.error("Token verification error:", err);
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });

    console.log("Decoded Token:", decodedToken);

    const externalId = decodedToken.sub;
    if (!externalId) {
      reply.code(401).send({ error: "Invalid token: missing subject (sub)" });
      return;
    }

    // Verifica se o usuário existe no Clerk
    const clerkUser = await clerkClient.users.getUser(externalId);
    console.log("Clerk User:", clerkUser);

    if (!clerkUser) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    // Verifica permissões da rota
    const allowedRoles = checkPermissions(
      req.context.config.url,
      req.context.config.method
    );

    if (!allowedRoles) {
      reply.code(403).send({ error: "Forbidden: Operation denied" });
      return;
    }

    const role = clerkUser.privateMetadata.role as Role;
    console.log("User Role:", role);

    if (!allowedRoles.includes(role)) {
      reply.code(403).send({ error: "Forbidden: User role not allowed" });
      return;
    }

    // Verifica se o usuário existe no banco de dados
    const user = await new UserRepositoryPrisma().findUserByExternalOrId(
      externalId
    );

    if (!user) {
      reply.code(404).send({ error: "User not found in database" });
      return;
    }

    // Adiciona o usuário ao request
    req.user = user;
  } catch (error: any) {
    console.error("JWT Validation Error:", error.message);
    reply.code(401).send({ error: error.message });
  }
}
