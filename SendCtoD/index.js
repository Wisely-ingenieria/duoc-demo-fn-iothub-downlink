import azureFunctions from "@azure/functions";
import iotHub from "azure-iothub";
import iotCommon from "azure-iot-common";

const { app } = azureFunctions;
const { Client } = iotHub;
const { Message } = iotCommon;

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

// Send a cloud-to-device message through IoT Hub.
async function sendCommand(request, context) {
  context.log("Received command request", { requestBody: request.body });
  let body;
  try {
    body = await request.json();
  } catch {
    return { status: 400, jsonBody: { error: "Request body must be valid JSON" } };
  }

  if (!body.deviceId || !body.payload) {
    return { status: 400, jsonBody: { error: "deviceId and payload are required" } };
  }

  if (body.deviceId !== 'DUOC-TEST') {
    return { status: 400, jsonBody: { error: "Invalid deviceId" } };
  }

  const client = Client.fromConnectionString(process.env.IOTHUB_CONNECTION_STRING);
  try {
    const message = new Message(JSON.stringify(body.payload));
    await client.open();
    await client.send(body.deviceId, message);
    context.log("Command sent", { deviceId: body.deviceId });
    return { status: 202, jsonBody: { status: "accepted" } };
  } catch (error) {
    context.error("Command failed", { error: error.message });
    return { status: 500, jsonBody: { error: "Failed to send the command" } };
  } finally {
    await client.close();
  }
}

app.http("SendCtoD", {
  methods: ["POST"],
  authLevel: "function",
  route: "SendCtoD",
  handler: sendCommand,
});
