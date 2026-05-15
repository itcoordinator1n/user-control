const fs = require('fs');
let content = fs.readFileSync('src/app/api/auth/[...nextauth]/route.ts', 'utf8');

content = content.replace(
  /if \(res\.ok && data\) \{\s+return \{\s+id: data\.user \? data\.user\.id_usuario : \(data\.id \|\| 1\),\s+token: data\.token,\s+permissions: data\.permissions,\s+platforms: data\.platforms,\s+platformPermissions: data\.platformPermissions\s+\};\s+\}/m,
  `if (res.ok && data) {
              return {
                id: data.user ? data.user.id_usuario : (data.id || 1),
                token: data.token,
                permissions: data.permissions || (data.user && data.user.permissions),
                platforms: data.platforms || (data.user && data.user.platforms),
                platformPermissions: data.platformPermissions || (data.user && data.user.platformPermissions)
              };
            }`
);

fs.writeFileSync('src/app/api/auth/[...nextauth]/route.ts', content, 'utf8');
console.log("Fix aplicado para buscar dentro de data.user.");
