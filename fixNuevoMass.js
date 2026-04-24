const fs = require('fs');
let c = fs.readFileSync('src/app/page/produccion/control-tiempos/nuevo/page.tsx', 'utf8');

const functions = [
  'createControlTiempos',
  'getEmpleadosProduccion',
  'getProductos',
  'addActividad',
  'iniciarIntervalo',
  'terminarIntervalo',
  'updateControlTiempos',
  'deleteActividad',
  'deleteIntervalo'
];

functions.forEach(f => {
  const regex = new RegExp(f + '\\((.*?)\\)', 'g');
  c = c.replace(regex, (match, args) => {
    if (args.trim() === '') return f + '(session?.user?.accessToken)';
    if (args.includes('session?.user?.accessToken')) return match;
    return f + '(' + args + ', session?.user?.accessToken)';
  });
});

fs.writeFileSync('src/app/page/produccion/control-tiempos/nuevo/page.tsx', c);
console.log("Done nuevo mass fix");
