const fs = require('fs');
let c = fs.readFileSync('src/app/page/dashboard/_components/attendance/attendance-view.tsx', 'utf8');

c = c.replace(/employee\.key \?\? toEmployeeKey\(employee\.name\)/g, 'employee.key ? employee.key : toEmployeeKey(employee.name)');
c = c.replace(/allowedArea \?\? "Todas"/g, 'allowedArea ? allowedArea : "Todas"');
c = c.replace(/hookData\?\.attendanceData \?\? \[\]/g, '(hookData && hookData.attendanceData) ? hookData.attendanceData : []');
c = c.replace(/session\?\.user\?\.accessToken/g, '(session && session.user ? session.user.accessToken : undefined)');
c = c.replace(/s \?\? 0/g, 's != null ? s : 0');
c = c.replace(/sorted\[0\]\?\.fecha\?\.toString\(\) \|\| ""/g, '(sorted[0] && sorted[0].fecha) ? sorted[0].fecha.toString() : ""');
c = c.replace(/sorted\[sorted\.length - 1\]\?\.fecha\?\.toString\(\) \|\| ""/g, '(sorted[sorted.length - 1] && sorted[sorted.length - 1].fecha) ? sorted[sorted.length - 1].fecha.toString() : ""');
c = c.replace(/r\.fecha\?\.toString\(\) \?\? ""/g, 'r.fecha ? r.fecha.toString() : ""');
c = c.replace(/r\.entrada \?\? ""/g, 'r.entrada ? r.entrada : ""');
c = c.replace(/r\.salida \?\? ""/g, 'r.salida ? r.salida : ""');
c = c.replace(/r\.notes      \?\? ""/g, 'r.notes ? r.notes : ""');
c = c.replace(/\} \?\? /g, '} || ');
c = c.replace(/\] \?\? /g, '] || ');
c = c.replace(/effectiveDates\.dateFrom \?\? ""/g, 'effectiveDates.dateFrom ? effectiveDates.dateFrom : ""');
c = c.replace(/effectiveDates\.dateTo   \?\? ""/g, 'effectiveDates.dateTo ? effectiveDates.dateTo : ""');
c = c.replace(/data\[d\.key\] \?\? 0/g, 'data[d.key] != null ? data[d.key] : 0');
c = c.replace(/data\[key\] \?\? 0/g, 'data[key] != null ? data[key] : 0');
c = c.replace(/record\.id \?\? /g, 'record.id ? record.id : ');

fs.writeFileSync('src/app/page/dashboard/_components/attendance/attendance-view.tsx', c);
console.log("Done");
