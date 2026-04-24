const fs = require('fs');
let c = fs.readFileSync('src/app/page/produccion/control-tiempos/nuevo/page.tsx', 'utf8');

c = c.replace('import { useState, useEffect, Fragment } from "react";', 'import { useState, useEffect, Fragment } from "react";\nimport { useSession } from "next-auth/react";');
c = c.replace('const router = useRouter();', 'const router = useRouter();\n  const { data: session } = useSession();');
c = c.replace('getEmpleadosProduccion(),', 'getEmpleadosProduccion(session?.user?.accessToken),');
c = c.replace('getProductos()', 'getProductos(session?.user?.accessToken)');
c = c.replace('registrado_por: 1 // TODO: get from session', 'registrado_por: 1 // TODO');
c = c.replace('const newControl = await createControlTiempos({\n        proceso: data.proceso,\n        area: data.area,\n        n_lote: data.n_lote,\n        op: data.op,\n        fk_producto: data.fk_producto,\n        registrado_por: 1 // TODO\n      });', 'const newControl = await createControlTiempos({\n        proceso: data.proceso,\n        area: data.area,\n        n_lote: data.n_lote,\n        op: data.op,\n        fk_producto: data.fk_producto,\n        registrado_por: 1\n      }, session?.user?.accessToken);');
c = c.replace('const act = await addActividad({\n        fk_control: control.id,\n        categoria: cat || "General",\n        actividad_nombre: nuevaAct.actividad_nombre,\n        fk_operario: nuevaAct.fk_operario,\n        operario_nombre: e!.nombre_completo\n      });', 'const act = await addActividad({\n        fk_control: control.id,\n        categoria: cat || "General",\n        actividad_nombre: nuevaAct.actividad_nombre,\n        fk_operario: nuevaAct.fk_operario,\n        operario_nombre: e!.nombre_completo\n      }, session?.user?.accessToken);');
c = c.replace('const intervalo = await iniciarIntervalo(act.id);', 'const intervalo = await iniciarIntervalo(act.id, session?.user?.accessToken);');
c = c.replace('const intervaloFin = await terminarIntervalo(intervaloId);', 'const intervaloFin = await terminarIntervalo(intervaloId, session?.user?.accessToken);');
c = c.replace('const nuevoIntervalo = await iniciarIntervalo(actividad.id);', 'const nuevoIntervalo = await iniciarIntervalo(actividad.id, session?.user?.accessToken);');
c = c.replace('await updateControlTiempos(control!.id, obs || "", "FINALIZADO");', 'await updateControlTiempos(control!.id, obs || "", "FINALIZADO", session?.user?.accessToken);');
c = c.replace('const success = await deleteActividad(idActividad);', 'const success = await deleteActividad(idActividad, session?.user?.accessToken);');
c = c.replace('const success = await deleteIntervalo(idIntervalo);', 'const success = await deleteIntervalo(idIntervalo, session?.user?.accessToken);');

fs.writeFileSync('src/app/page/produccion/control-tiempos/nuevo/page.tsx', c);
console.log("Done");
