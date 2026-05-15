const fs = require('fs');

let content = fs.readFileSync('src/app/api/auth/[...nextauth]/route.ts', 'utf8');

// Reemplazar el bloque jwt callback completo con la nueva lógica de inferencia de plataformas
const oldJwtBlock = `  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.id = user.id;
        if ((user as any).permissions) token.permissions = (user as any).permissions;
        if ((user as any).platforms) token.platforms = (user as any).platforms;
        if ((user as any).platformPermissions) token.platformPermissions = (user as any).platformPermissions;
      }

      if (token.accessToken) {
        try {
          const payload: Pay = jwtDecode(token.accessToken as string);
          token.permissions = token.permissions ?? payload?.permissions ?? [];
          token.platforms = token.platforms ?? payload?.platforms ?? [];
          token.platformPermissions = token.platformPermissions ?? payload?.platformPermissions ?? {};
          token.area = payload?.area ?? null;
          token.idEmployee = payload?.idEmployee ?? null;
          // Asignar nombre y email desde el token para el avatar
          if (payload.name) token.name = payload.name;
          if (payload.email) token.email = payload.email;
          if (payload.id) token.id = payload.id.toString();
        } catch (error) {
          console.error("Error decoding JWT in callback:", error);
        }
      }`;

const newJwtBlock = `  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.id = user.id;
      }

      if (token.accessToken) {
        try {
          const payload: Pay = jwtDecode(token.accessToken as string);
          
          // Permisos: tomar directamente del payload del JWT (fuente de verdad del backend)
          const rawPermissions: string[] = payload?.permissions ?? [];
          token.permissions = rawPermissions;
          
          // Plataformas: el backend envía platforms en el JWT, pero puede estar vacío.
          // Si está vacío, lo inferimos desde los permisos (workaround temporal).
          let rawPlatforms: string[] = payload?.platforms ?? [];
          
          if (rawPlatforms.length === 0) {
            // Inferencia de plataformas a partir de los permisos presentes en el JWT
            const inferredPlatforms: string[] = [];
            const permsSet = new Set(rawPermissions);
            
            if (
              permsSet.has('RRHH:PERMITS_VIEW') ||
              permsSet.has('RRHH:PERMITS_REQUEST') ||
              permsSet.has('EMPLOYEE:PERMITS') ||
              permsSet.has('RRHH:ADMIN') ||
              permsSet.has('RRHH:DASHBOARD') ||
              permsSet.has('RRHH:APPLICATIONS_MANAGE')
            ) {
              inferredPlatforms.push('permisos');
            }
            if (
              permsSet.has('TICKET:READ') ||
              permsSet.has('TICKET:CREATE') ||
              permsSet.has('TICKET:RESPOND') ||
              permsSet.has('TICKET:ADMIN') ||
              permsSet.has('TICKET:TECH') ||
              permsSet.has('TICKET:MGMT')
            ) {
              inferredPlatforms.push('tickets');
            }
            if (
              permsSet.has('PROD:REGISTER') ||
              permsSet.has('PROD:VIEW') ||
              permsSet.has('PROD:ADMIN') ||
              permsSet.has('PRODUCCION:TIEMPOS')
            ) {
              inferredPlatforms.push('produccion');
            }
            if (
              permsSet.has('USER:CREATE') ||
              permsSet.has('ROLE:VIEW') ||
              permsSet.has('ADMIN:VIEW')
            ) {
              inferredPlatforms.push('admin');
            }
            rawPlatforms = inferredPlatforms;
            if (rawPlatforms.length > 0) {
              console.log(">>> [NextAuth] Plataformas inferidas desde permisos:", rawPlatforms);
            }
          }
          token.platforms = rawPlatforms;
          
          // platformPermissions: construir desde el payload
          // Si el backend envía clave "_global", mapearla a cada plataforma inferida
          const rawPlatformPerms: Record<string, string[]> = payload?.platformPermissions ?? {};
          const globalPerms = rawPlatformPerms['_global'] ?? [];
          
          if (globalPerms.length > 0 && rawPlatforms.length > 0) {
            const normalized: Record<string, string[]> = {};
            for (const plat of rawPlatforms) {
              normalized[plat] = globalPerms;
            }
            token.platformPermissions = normalized;
            console.log(">>> [NextAuth] platformPermissions normalizado:", normalized);
          } else {
            token.platformPermissions = rawPlatformPerms;
          }
          
          token.area = payload?.area ?? null;
          token.idEmployee = payload?.idEmployee ?? null;
          // Asignar nombre y email desde el token para el avatar
          if (payload.name) token.name = payload.name;
          if (payload.email) token.email = payload.email;
          if (payload.id) token.id = payload.id.toString();
        } catch (error) {
          console.error("Error decoding JWT in callback:", error);
        }
      }`;

if (content.includes('if ((user as any).permissions) token.permissions = (user as any).permissions;')) {
  content = content.replace(oldJwtBlock, newJwtBlock);
  fs.writeFileSync('src/app/api/auth/[...nextauth]/route.ts', content, 'utf8');
  console.log("✅ Fix aplicado: inferencia de plataformas desde permisos.");
} else {
  // Intentar con regex
  const result = content.replace(
    /callbacks: \{\s+async jwt\(\{ token, user \}\) \{[\s\S]+?if \(token\.accessToken\) \{\s+try \{[\s\S]+?\} catch \(error\) \{\s+console\.error\("Error decoding JWT in callback:", error\);\s+\}\s+\}/,
    newJwtBlock.replace('  callbacks: {\n    async jwt({ token, user }) {', 'callbacks: {\n    async jwt({ token, user }) {')
  );
  fs.writeFileSync('src/app/api/auth/[...nextauth]/route.ts', result, 'utf8');
  console.log("✅ Fix aplicado via regex.");
}
