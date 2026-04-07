# 📋 Reporte Diario de Actividades — TI INFARMA
**Fecha:** Lunes, 30 de marzo de 2026
**Equipo:** Tecnologías de la Información
**Responsable:** Isaac Cano
**Dirigido a:** Gerencia / Personal Administrativo

---

## ☀️ Resumen del Día

Hoy fue un día productivo para el equipo de TI. Se trabajó principalmente en **mejorar la automatización de la comparación de precios** frente a la competencia, se resolvieron problemas que venían afectando la recolección de datos de Kielsa, y se dio el primer paso para modernizar la forma en que generamos reportes internos.

---

## ✅ Actividades Realizadas

---

### 1. Corrección del Sistema de Comparación de Precios — Kielsa

El sistema que revisa automáticamente los precios de la competencia (Kielsa, Punto Farma, Farmacia Siman) estaba **fallando en identificar correctamente varios de nuestros productos** cuando consultaba la página web de Kielsa.

**¿Qué pasaba?**
El sistema buscaba el producto en la página de Kielsa, obtenía los resultados, pero al momento de *leer* el nombre del producto desde la pantalla, tomaba por error una **etiqueta de precio** (`"Precio Unitario"`) en lugar del nombre real del artículo. Esto hacía que el sistema comparara peras con manzanas y, al no encontrar coincidencia, reportaba el precio como *no encontrado*.

**¿Qué se corrigió?**
Se actualizó el sistema para que sepa ignorar esa etiqueta y leer directamente el nombre correcto del producto. De esta forma, la comparación de precios ahora funciona correctamente.

**¿Qué significa esto para el negocio?**
- Los precios de Kielsa se actualizarán correctamente en la **próxima ejecución automática** (programada para las 5:00 AM del martes 1 de abril).
- Los reportes de comparación de precios que se reciben por correo deberían mostrar **significativamente menos errores**.
- Se espera que productos como *ALIVIOL FORTE*, *PANADOL ULTRA*, *ALIVIOL MIGRAÑA*, *GRIPEX PLUS*, *VITAFLENACO*, *MENTOLINA SUEÑO*, entre otros, ya aparezcan con su precio correcto.

---

### 2. Diagnóstico de Productos con Error — Lista de Fallos

Se revisó la lista de productos que reportaron error en la última ejecución y se clasificaron en dos grupos:

**Grupo A — Corregidos automáticamente** (ya deberían funcionar en la próxima actualización):
Productos que fallaban únicamente por el error técnico descrito arriba. Ejemplo: PANADOL MUJER, SUDAGRIP, SINAGRUR, ALEVE, entre otros.

**Grupo B — Requieren revisión manual** (posible discrepancia de nombre con Kielsa):
Algunos productos pueden estar registrados en nuestro sistema con un nombre ligeramente diferente al que usa Kielsa en su página web. Estos requieren que alguien del equipo los verifique manualmente en [kielsa.com](https://kielsa.com):

| Producto | Observación |
|---|---|
| REUMAZOLON 50MG TAB X100 | Podría no estar en el catálogo de Kielsa |
| RAYO UNG 12GRS UND X12 | No fue encontrado en verificaciones anteriores |
| DIACOR 2.0MG TAB X50 | Posible nombre diferente en Kielsa |
| TAPON 25SOB X2TAB | Posible nombre diferente en Kielsa |
| VISCOF 25SOB X4TAB | Presentación posiblemente no disponible |
| ALKA-AD TAB X 72 | Verificar si existe en catálogo |
| VITAPYRENA SOB X50 | Verificar si existe en catálogo |

> 📌 **Acción requerida:** Si alguno de estos productos está disponible en Kielsa bajo un nombre diferente, comunicarlo a TI para actualizar el sistema.

---

### 3. Creación de Tabla "Cubo" — Primer Paso hacia Reportería por Base de Datos

Se inició el proceso de **migración de reportes** del formato Excel al sistema de base de datos.

**¿Qué significa esto?**
Actualmente, varios reportes de la empresa (comparaciones de precios, inventarios, pedidos) se generan descargando archivos de Excel y procesándolos manualmente. Esto consume tiempo y depende de que alguien esté disponible para hacer el proceso.

**¿Qué es la tabla "Cubo"?**
Es una estructura especial dentro de nuestra base de datos que sirve como *repositorio central de información* para reportes. Funciona como un "resumen inteligente" que consolida datos de diferentes áreas del sistema en un solo lugar, listo para consultarse en cualquier momento sin necesidad de descargar nada.

**¿Qué beneficios traerá?**
- Los reportes estarán disponibles **en tiempo real**, sin esperar descargas manuales.
- La información estará **centralizada y estandarizada**, reduciendo errores humanos.
- Será la base para el **Dashboard de Precios** que se tiene planificado (ver Tareas Pendientes).

---

## ⏳ Tareas Pendientes

---

### 🎯 Tarea 1: Actualización del Frontend (Interfaz Visual)

**¿En qué consiste?**
El sistema tiene una interfaz web donde el equipo puede visualizar pedidos, comparaciones y reportes. Actualmente, esta interfaz **no refleja todavía los datos de comparación de precios** que el sistema recolecta automáticamente.

**¿Qué se necesita hacer?**
Conectar la interfaz existente con los datos de precios almacenados en la base de datos, para que el personal pueda ver la información actualizada desde cualquier navegador, sin depender de correos o archivos Excel.

**Impacto esperado:** El equipo de mercadeo y compras podrá consultar precios de la competencia directamente desde la plataforma, en tiempo real.

---

### 🎯 Tarea 2: Creación del Dashboard de Scraping de Precios

**¿En qué consiste?**
Diseñar y desarrollar un **tablero visual** (dashboard) que muestre de forma clara y gráfica:
- El historial de precios por producto y por farmacia
- Comparaciones entre farmacias
- Alertas cuando un precio de la competencia es significativamente diferente al nuestro
- El estado del sistema (cuántos productos se actualizaron correctamente, cuántos fallaron)

**¿Por qué es importante?**
Actualmente la información llega por correo electrónico como texto plano, lo cual dificulta detectar tendencias o tomar decisiones rápidas. Un dashboard permitiría tomar decisiones de precios de forma más ágil y fundamentada.

**Estado:** Planificación inicial — se trabajará en el diseño una vez se complete la Tarea 1.

---

## 📊 Estado General del Sistema

| Sistema | Estado | Próxima ejecución |
|---|---|---|
| Scraping Kielsa | ✅ Corregido | Martes 1 de abril, 5:00 AM |
| Scraping Punto Farma | ✅ Funcionando | Martes 1 de abril, 5:00 AM |
| Scraping Farmacia Siman | ✅ Funcionando | Martes 1 de abril, 5:00 AM |
| Envío de correos de errores | ✅ Funcionando | Tras cada ejecución automática |
| Frontend / Dashboard precios | 🔲 Pendiente de desarrollo | — |
| Tabla Cubo (reportería BD) | 🟡 En progreso (fase inicial) | — |

---

> 📬 **Nota:** En la siguiente actualización automática de precios (martes 1 de abril a las 5:00 AM), los datos corregidos deberían verse reflejados en el correo de reporte que se envía al finalizar el proceso. Si los productos que venían fallando ya muestran precios válidos, significa que las correcciones funcionaron correctamente.

---

*Reporte generado el 30 de marzo de 2026 — Uso interno INFARMA*
*Equipo de Tecnologías de la Información*
