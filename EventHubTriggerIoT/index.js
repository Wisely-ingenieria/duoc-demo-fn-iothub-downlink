import azureFunctions from "@azure/functions";
import { Pool } from "pg";

const { app } = azureFunctions;

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

const devices = (process.env.DEVICES ?? "")
  .split(",")
  .map((deviceId) => deviceId.trim())
  .filter(Boolean);

// Verify the certificate on Azure; disable SSL locally with PGSSL=false.
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : false,
});

// Store each IoT Hub message: device id, payload and the trigger metadata.
async function receiveTelemetry(message, context) {
    
  const deviceId = context.triggerMetadata.systemProperties["iothub-connection-device-id"];
  if (!devices.includes(deviceId)) {
    context.log("Telemetry ignored", { deviceId });
    return;
  }

  context.log("Received telemetry", { message, triggerMetadata: context.triggerMetadata });

    const data = typeof message === "string" ? JSON.parse(message) : message;
    await pool.query(
        "INSERT INTO iot_data_test (deviceid, data, meta_data) VALUES ($1, $2::jsonb, $3::jsonb)",
        [deviceId, JSON.stringify(data), JSON.stringify(context.triggerMetadata)],
    );
    context.log("Telemetry stored", { deviceId });
}

app.eventHub("EventHubTriggerIoT", {
  connection: "IOT_EVENT_HUB_CONNECTION",
  eventHubName: "%IOT_EVENT_HUB_NAME%",
  consumerGroup: "%IOT_EVENT_HUB_CONSUMER_GROUP%",
  cardinality: "one",
  handler: receiveTelemetry,
});
