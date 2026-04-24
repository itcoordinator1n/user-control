const fs = require('fs');

let c = fs.readFileSync('src/lib/services/produccion.service.ts', 'utf8');
c = c.replace(/if \(\!res\.ok\) throw new Error\((.*?)\);/g, 'if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error($1 + ": " + res.status + " " + txt); }');
fs.writeFileSync('src/lib/services/produccion.service.ts', c);

// Fix Historial.tsx
let h = fs.readFileSync('src/app/page/produccion/control-tiempos/components/Historial.tsx', 'utf8');
h = h.replace('const data = await getControlesTiempos(session?.user?.accessToken);\n    setControles(data);\n    setLoading(false);', 'try {\n      const data = await getControlesTiempos(session?.user?.accessToken);\n      setControles(data);\n    } catch(e) { console.error(e); setControles([]); }\n    finally { setLoading(false); }');
fs.writeFileSync('src/app/page/produccion/control-tiempos/components/Historial.tsx', h);

// Fix Revisiones.tsx
let r = fs.readFileSync('src/app/page/produccion/control-tiempos/components/Revisiones.tsx', 'utf8');
r = r.replace('const data = await getRevisionesPendientes(session?.user?.accessToken);\n    setControles(data);\n    setLoading(false);', 'try {\n      const data = await getRevisionesPendientes(session?.user?.accessToken);\n      setControles(data);\n    } catch(e) { console.error(e); setControles([]); }\n    finally { setLoading(false); }');
fs.writeFileSync('src/app/page/produccion/control-tiempos/components/Revisiones.tsx', r);

// Fix TableroOcupacion.tsx
let t = fs.readFileSync('src/app/page/produccion/control-tiempos/components/TableroOcupacion.tsx', 'utf8');
t = t.replace('const data = await getOcupacionGlobal(session?.user?.accessToken);\n      setOcupacion(data);\n      setLastUpdate(new Date());', 'const data = await getOcupacionGlobal(session?.user?.accessToken);\n      setOcupacion(data);\n      setLastUpdate(new Date());'); // Already has try catch
fs.writeFileSync('src/app/page/produccion/control-tiempos/components/TableroOcupacion.tsx', t);

console.log("Done");
