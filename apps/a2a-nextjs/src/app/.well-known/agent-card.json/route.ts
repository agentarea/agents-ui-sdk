export async function GET(req: Request) {
  const origin = new URL(req.url).origin

  const agentCard = {
    name: "Mock A2A Agent",
    description: "Local mock agent implementing minimal A2A surfaces for development/testing",
    capabilities: [
      {
        name: "task-submission",
        description: "Submit a text prompt and receive a mock response",
        inputTypes: ["message"],
        outputTypes: ["message"],
      },
      {
        name: "message-sending",
        description: "Send generic A2A messages via message.send",
        inputTypes: ["message"],
        outputTypes: ["message"],
      },
    ],
    endpoints: { main: origin },
    streaming: false,
    pushNotifications: false,
  }

  return Response.json(agentCard)
}