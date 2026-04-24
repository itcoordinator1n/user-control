const fs = require('fs');

// Fix nuevo/page.tsx
let n = fs.readFileSync('src/app/page/produccion/control-tiempos/nuevo/page.tsx', 'utf8');

// There are multiple awaits in nuevo/page.tsx
// e.g., const newControl = await createControlTiempos...
n = n.replace('const newControl = await createControlTiempos({\n        proceso: data.proceso,\n        area: data.area,\n        n_lote: data.n_lote,\n        op: data.op,\n        fk_producto: data.fk_producto,\n        registrado_por: 1\n      }, session?.user?.accessToken);', 
  'let newControl;\n      try {\n        newControl = await createControlTiempos({\n          proceso: data.proceso,\n          area: data.area,\n          n_lote: data.n_lote,\n          op: data.op,\n          fk_producto: data.fk_producto,\n          registrado_por: session?.user?.id ? parseInt(session.user.id) : 1\n        }, session?.user?.accessToken);\n      } catch (err) { alert("Error: " + err.message); setIsSaving(false); return; }');

n = n.replace('const act = await addActividad({\n        fk_control: control.id,\n        categoria: cat || "General",\n        actividad_nombre: nuevaAct.actividad_nombre,\n        fk_operario: nuevaAct.fk_operario,\n        operario_nombre: e!.nombre_completo\n      }, session?.user?.accessToken);\n\n      const intervalo = await iniciarIntervalo(act.id, session?.user?.accessToken);',
  'try {\n        const act = await addActividad({\n          fk_control: control.id,\n          categoria: cat || "General",\n          actividad_nombre: nuevaAct.actividad_nombre,\n          fk_operario: nuevaAct.fk_operario,\n          operario_nombre: e!.nombre_completo\n        }, session?.user?.accessToken);\n\n        const intervalo = await iniciarIntervalo(act.id, session?.user?.accessToken);\n      } catch (err) { alert("Error al iniciar actividad: " + err.message); throw err; }');

fs.writeFileSync('src/app/page/produccion/control-tiempos/nuevo/page.tsx', n);
console.log("Done nuevo");
