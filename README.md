# Curso IoT Duoc — Clase 4: práctica con Azure Functions

Código de ejemplo para conectar dispositivos, la nube y una base de datos. La práctica muestra dos flujos: recibir telemetría de un dispositivo y guardarla en PostgreSQL, y enviar un comando a un dispositivo desde una petición HTTP.

## 1. Qué vamos a construir

```text
Telemetría (device-to-cloud / D2C)
Dispositivo → IoT Hub → EventHubTriggerIoT → PostgreSQL

Comandos (cloud-to-device / C2D)
Cliente HTTP → SendCtoD → IoT Hub → Dispositivo
```

| Function | Se activa cuando… | Resultado |
| --- | --- | --- |
| `EventHubTriggerIoT` | Llega un evento al endpoint compatible con Event Hubs de IoT Hub. | Guarda el payload y los metadatos del evento en PostgreSQL. |
| `SendCtoD` | Recibe un POST en `/api/SendCtoD`. | Envía el payload al dispositivo y responde cuando IoT Hub lo acepta. |

HTTP `202` significa que IoT Hub aceptó el comando. No confirma que el dispositivo lo haya recibido o ejecutado.

## 2. Requisitos de la práctica

- Node.js **24.12.0 o superior dentro de la versión 24**, con npm.
- Azure Functions Core Tools **v4** (comando `func`).
- Azurite para el almacenamiento local de Azure Functions, o una conexión a Azure Storage.
- IoT Hub con un dispositivo registrado. Para comandos C2D no sirve el nivel Basic.
- Un dispositivo o simulador que envíe telemetría JSON y escuche mensajes C2D.
- PostgreSQL accesible desde el equipo.
- Un cliente SQL para ejecutar el esquema y consultar los datos.

## 3. Mapa del código

| Archivo | Qué hace |
| --- | --- |
| `EventHubTriggerIoT/index.js` | Trigger de IoT Hub, conexión a PostgreSQL y guardado del payload. |
| `SendCtoD/index.js` | Función HTTP que envía un comando a un dispositivo por IoT Hub. |
| `database/schema.sql` | Crea la tabla `iot_data_test`. |

Cada función se registra en su propio archivo con el modelo de programación v4 (`app.eventHub` y `app.http`).

## 4. Preparar el entorno local

### Paso 1: instalar las dependencias

```bash
npm ci
```

### Paso 2: crear los archivos de configuración

Ejecuta este comando una sola vez. Crea `.env` y `local.settings.json` a partir de las plantillas:

```bash
npm run setup
```

Si los archivos ya existen, no los sobrescribe.

### Paso 3: completar los valores de la clase

Abre `.env` y escribe los valores entregados en clase:

```dotenv
PGHOST=localhost
PGPORT=5432
PGDATABASE=curso_duoc
PGUSER=user_curso_duoc
PGPASSWORD=tu_contraseña
PGSSL=false
IOTHUB_CONNECTION_STRING=la_conexion_de_servicio_de_iot_hub
```

Abre `local.settings.json` y completa solo la conexión del Event Hub:

```json
"IOT_EVENT_HUB_CONNECTION": "la_conexion_integrada_de_iot_hub"
"IOT_EVENT_HUB_NAME": "duoc-iothub",
"IOT_EVENT_HUB_CONSUMER_GROUP": "test"
```

Dos conexiones distintas: `IOT_EVENT_HUB_CONNECTION` recibe telemetría; `IOTHUB_CONNECTION_STRING` envía comandos. `PGSSL` es `true` en Azure y `false` con una base local. Ambos archivos están excluidos de Git y no se publican.

### Paso 4: crear la tabla

Conéctate a la base de la práctica y ejecuta `database/schema.sql`. La tabla `iot_data_test` guarda el identificador del dispositivo (`deviceid`), el payload (`data`) y los metadatos del evento (`meta_data`).

### Paso 5: iniciar la aplicación (local)

Inicia Azurite si usas `UseDevelopmentStorage=true`. Luego:

```bash
npm start
```

El host mostrará las funciones registradas y la dirección HTTP, por defecto `http://localhost:7071/api/SendCtoD`.

## 5. Práctica A: recibir y consultar telemetría

1. Conecta el dispositivo o simulador a IoT Hub con sus credenciales.
2. Envía un objeto JSON:

   ```json
   {
     "temperature": 24.5,
     "humidity": 61,
     "unit": "celsius"
   }
   ```

3. Busca `Telemetry stored` en la consola de Azure Functions.
4. Consulta la base de datos:

   ```sql
   SELECT deviceid, data, received_at
   FROM iot_data_test
   ORDER BY received_at DESC
   LIMIT 10;
   ```

El `deviceid` se toma de los metadatos autenticados de IoT Hub. El payload se guarda tal cual en la columna `data`, de tipo JSONB.

## 6. Práctica B: enviar un comando al dispositivo

Con el dispositivo escuchando mensajes C2D, envía:

```bash
curl -i -X POST http://localhost:7071/api/SendCtoD \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"your-device-id","payload":{"command":"setLed","value":true}}'
```

Reemplaza `your-device-id` por el identificador registrado en IoT Hub. `setLed` es un ejemplo: el firmware o simulador debe interpretar ese comando.

Respuesta esperada:0

```json
{ "status": "accepted" }
```

Estado HTTP **202**. Solo el contenido de `payload` viaja como cuerpo del mensaje C2D; `deviceId` selecciona el destino.

| Estado HTTP | Significado |
| --- | --- |
| `202` | IoT Hub aceptó el mensaje. |
| `400` | Falta `deviceId` o `payload`, o el cuerpo no es JSON válido. |
| `500` | Fallo al enviar el comando a IoT Hub. |

En Azure, el endpoint requiere una function key (encabezado `x-functions-key`). Core Tools normalmente no la exige en local.

## 7. Cargar las variables en la Function App de Azure

La forma más rápida es pegar todas las variables de una vez desde el portal:

1. Entra al portal de Azure y abre la Function App del curso.
2. Menú izquierdo: **Settings → Environment variables** (Configuración → Variables de entorno).
3. En la pestaña **App settings**, haz clic en **Advanced edit** (Edición avanzada).
4. **Importante:** verás un JSON con variables que ya existen (`AzureWebJobsStorage`, `APPLICATIONINSIGHTS_CONNECTION_STRING`, `DEPLOYMENT_STORAGE_CONNECTION_STRING`). **No las borres.**
5. Agrega al final (antes del `]` de cierre) las 10 variables de `azure-app-settings.example.json`. Pon una coma después de la última variable que ya estaba.
6. Completa los valores vacíos (`PGPASSWORD`, `IOTHUB_CONNECTION_STRING`, `IOT_EVENT_HUB_CONNECTION`) con los datos de la clase.
7. Haz clic en **OK** y luego en **Apply / Save**. La aplicación se reinicia sola.

`PGSSL` debe ser `true` en Azure. En Flex Consumption no agregues `FUNCTIONS_WORKER_RUNTIME` ni `FUNCTIONS_EXTENSION_VERSION`: el runtime (Node 24) ya está definido en la Function App. Los archivos locales `.env` y `local.settings.json` no se publican.
