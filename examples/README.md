# Examples

This directory contains example applications demonstrating how to use the AgentArea UI SDK.

## Available Examples

### React Example

A complete React application showcasing the SDK's capabilities:

```bash
cd react-example
pnpm install
pnpm dev
```

Features demonstrated:
- Agent connection configuration
- Task creation and submission
- Real-time status updates
- Agent capabilities display
- Error handling

## Running Examples

Each example is a standalone application that imports the SDK:

1. **Build the SDK first** (from root directory):
   ```bash
   pnpm build
   ```

2. **Navigate to example directory**:
   ```bash
   cd examples/react-example
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

## SDK Usage

Examples use the published SDK package:

```json
{
  "dependencies": {
    "@agentarea/ui-sdk": "file:../.."
  }
}
```

In production, you would install from npm:

```bash
npm install @agentarea/ui-sdk
```

## Development Notes

- Examples are **not** part of the main workspace
- They are standalone applications for demonstration
- Each example has its own dependencies and build process
- Examples use the local SDK build via file reference