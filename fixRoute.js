const fs = require('fs');
let content = fs.readFileSync('src/app/api/auth/[...nextauth]/route.ts', 'utf8');

content = content.replace(
  /if \(res\.ok && data\) \{\s+return \{\s+id: data\.user\.id_usuario,\s+token: data\.token\s+\};\s+\}/m,
  `if (res.ok && data) {
              return {
                id: data.user ? data.user.id_usuario : (data.id || 1),
                token: data.token,
                permissions: data.permissions,
                platforms: data.platforms,
                platformPermissions: data.platformPermissions
              };
            }`
);

content = content.replace(
  /async jwt\(\{ token, user \}\) \{\s+if \(user\) \{\s+token\.accessToken = \(user as any\)\.token;\s+token\.id = user\.id;\s+\}/m,
  `async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.id = user.id;
        if ((user as any).permissions) token.permissions = (user as any).permissions;
        if ((user as any).platforms) token.platforms = (user as any).platforms;
        if ((user as any).platformPermissions) token.platformPermissions = (user as any).platformPermissions;
      }`
);

content = content.replace(
  /try \{\s+const payload: Pay = jwtDecode\(token\.accessToken as string\);\s+token\.permissions = payload\?\.permissions \?\? \[\];\s+token\.platforms = payload\?\.platforms \?\? \[\];\s+token\.platformPermissions = payload\?\.platformPermissions \?\? \{\};/m,
  `try {
          const payload: Pay = jwtDecode(token.accessToken as string);
          token.permissions = token.permissions ?? payload?.permissions ?? [];
          token.platforms = token.platforms ?? payload?.platforms ?? [];
          token.platformPermissions = token.platformPermissions ?? payload?.platformPermissions ?? {};`
);

fs.writeFileSync('src/app/api/auth/[...nextauth]/route.ts', content, 'utf8');
console.log("Fix aplicado con Regex.");
