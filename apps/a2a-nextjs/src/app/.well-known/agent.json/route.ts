export async function GET(req: Request) {
  const origin = new URL(req.url).origin

  const agent = {
    name: "Mock A2A Agent",
    description: "Local mock agent (agent.json) for A2A discovery fallback",
    url: origin,
    defaultInputModes: ["message"],
    defaultOutputModes: ["message"],
    skills: [
      {
        name: "task-submission",
        description: "Submit a text prompt and receive a mock response",
        defaultInputModes: ["message"],
        defaultOutputModes: ["message"],
      },
      {
        name: "message-sending",
        description: "Send generic A2A messages via message.send",
        defaultInputModes: ["message"],
        defaultOutputModes: ["message"],
      },
    ],
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
  }

  return Response.json(agent)
}