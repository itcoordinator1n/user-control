const fs = require('fs');
let c = fs.readFileSync('src/app/page/produccion/control-tiempos/[id]/page.tsx', 'utf8');

const functions = [
  'getEmpleadosProduccion',
  'getControlTiemposById',
  'getControlesTiempos',
  'addActividad',
  'iniciarIntervalo',
  'terminarIntervalo',
  'deleteActividad',
  'deleteIntervalo',
  'marcarComoRevisado'
];

functions.forEach(f => {
  // Replace calls like f(arg1, arg2) with f(arg1, arg2, session?.user?.accessToken)
  // or f() with f(session?.user?.accessToken)
  // This is a bit tricky with regex, so we'll do some specific replacements
  const regex = new RegExp(f + '\\((.*?)\\)', 'g');
  c = c.replace(regex, (match, args) => {
    if (args.trim() === '') return f + '(session?.user?.accessToken)';
    if (args.includes('session?.user?.accessToken')) return match;
    return f + '(' + args + ', session?.user?.accessToken)';
  });
});

// Also fix the useEffect dependency
c = c.replace('}, []);', '}, [session?.user?.accessToken, id]);');
c = c.replace('setLoading(true);', 'if (!session?.user?.accessToken) return;\n      setLoading(true);');

fs.writeFileSync('src/app/page/produccion/control-tiempos/[id]/page.tsx', c);
console.log("Done [id]");
