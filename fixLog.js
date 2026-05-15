const fs = require('fs');

let content = fs.readFileSync('src/app/api/auth/[...nextauth]/route.ts', 'utf8');

// Agregar log detallado del authorize para ver exactamente qué devuelve
content = content.replace(
  `console.log("Acceso en el servidor data:", data);`,
  `console.log("Acceso en el servidor data:", data);
            console.log(">>> platforms en data:", data.platforms);
            console.log(">>> permissions en data:", data.permissions);
            console.log(">>> user.platforms:", data.user ? data.user.platforms : 'N/A');`
);

fs.writeFileSync('src/app/api/auth/[...nextauth]/route.ts', content, 'utf8');
console.log("Log agregado.");
