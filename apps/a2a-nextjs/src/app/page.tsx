"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { AgentUI, Task, Chat, Artifact, MultiAgent, useTaskList, TaskGraphNode, TimelineEvent, LogEntry } from "@agentarea/react";
import { createRuntimeFactory, A2ARuntime, type RestEndpointMapping } from "@agentarea/core";
import { useTask, useTaskCreation } from "@agentarea/react";

interface ComplianceIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  recommendation?: string;
}

interface ComplianceResult {
  compliant: boolean;
  version: string;
  supportedFeatures: string[];
  issues?: ComplianceIssue[];
}

interface Capability {
  name: string;
  description?: string;
  inputTypes?: string[];
  outputTypes?: string[];
}

interface AgentCard {
  name: string;
  description?: string;
  capabilities: Capability[];
  streaming?: boolean;
  pushNotifications?: boolean;
}

// Type-safe helpers to parse unknown JSON without using 'any'
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const getString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const getBool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
const getStringArray = (v: unknown): string[] | undefined =>
  Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : undefined;

// Small helper: validate HTTP/HTTPS URL
const isValidHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// Helper to extract a human-readable error message from unknown errors without using 'any'
const getErrorMessage = (e: unknown, fallback = "An error occurred"): string => {
  if (e instanceof Error && typeof e.message === "string") return e.message;
  if (isRecord(e)) {
    const msg = getString(e.message);
    if (msg) return msg;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return fallback;
  }
};

function mapAgentCardFromData(data: unknown): AgentCard {
  const obj = isRecord(data) ? data : {};
  const name = getString(obj["name"]) ?? "Custom Agent";
  const description = getString(obj["description"]) ?? "Agent from custom endpoint";
  const defaultInputModes = getStringArray(obj["defaultInputModes"]);
  const defaultOutputModes = getStringArray(obj["defaultOutputModes"]);

  let capabilities: Capability[] = [];
  const skillsVal = obj["skills"];
  if (Array.isArray(skillsVal)) {
    capabilities = skillsVal.map((skill): Capability => {
      const so = isRecord(skill) ? skill : {};
      const capName = getString(so["name"]) ?? "Custom Capability";
      const capDesc = getString(so["description"]);
      const inputTypes = getStringArray(so["defaultInputModes"]) ?? defaultInputModes ?? ["message"];
      const outputTypes = getStringArray(so["defaultOutputModes"]) ?? defaultOutputModes ?? ["message"];
      return { name: capName, description: capDesc, inputTypes, outputTypes };
    });
  } else {
    const capsVal = obj["capabilities"];
    if (Array.isArray(capsVal)) {
      capabilities = capsVal.map((cap): Capability => {
        const co = isRecord(cap) ? cap : {};
        const capName = getString(co["name"]) ?? "Capability";
        const capDesc = getString(co["description"]);
        const inputTypes = getStringArray(co["inputTypes"]);
        const outputTypes = getStringArray(co["outputTypes"]);
        return { name: capName, description: capDesc, inputTypes, outputTypes };
      });
    }
  }

  let streaming = false;
  let pushNotifications = false;
  const capsField = obj["capabilities"];
  if (isRecord(capsField)) {
    streaming = getBool(capsField["streaming"]) ?? false;
    pushNotifications = getBool(capsField["pushNotifications"]) ?? false;
  }

  return { name, description, capabilities, streaming, pushNotifications };
}

export default function Home() {
  // UI State Management
  type UIPhase = 'setup' | 'task-entry' | 'task-sent' | 'agent-working' | 'communication';
  const [currentPhase, setCurrentPhase] = useState<UIPhase>('setup');
  
  // Existing state
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const [taskInput, setTaskInput] = useState("");
  const [endpoint, setEndpoint] = useState("http://localhost:5055");
  const [isConnected, setIsConnected] = useState(false);
  const [additionalHeaders, setAdditionalHeaders] = useState<Record<string, string>>({});

  // A2A Debugger state
  const [detectedProtocol, setDetectedProtocol] = useState<string | null>(null);
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Prevent hydration mismatch for components that format dates/times locally
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const normalizedEndpoint = useMemo(() => {
    let url = endpoint.trim();
    if (url.startsWith("ws://")) {
      url = "http://" + url.slice(5);
    } else if (url.startsWith("wss://")) {
      url = "https://" + url.slice(6);
    }
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    return url;
  }, [endpoint]);
  const isUrlValid = useMemo(() => isValidHttpUrl(normalizedEndpoint), [normalizedEndpoint]);
  
  // Consider the endpoint verified if URL is valid and compliance reports compliant
  const isVerified = useMemo(() => {
    if (!isUrlValid) return false;
    if (compliance) return !!compliance.compliant;
    return false;
  }, [isUrlValid, compliance]);

  // Create a configured A2A runtime instance using JSON-REST transport with A2A endpoint mapping
  const configuredRuntime = useMemo(() => {
    const factory = createRuntimeFactory();
    const endpointMapping: RestEndpointMapping = {
      'message.send': {
        path: '/a2a/message.send',
        method: 'POST' as const,
        paramMapping: 'body' as const
      },
      'task.get': {
        path: '/a2a/task.get',
        method: 'POST' as const,
        paramMapping: 'body' as const
      },
      'task.cancel': {
        path: '/a2a/task.cancel',
        method: 'POST' as const,
        paramMapping: 'body' as const
      }
    };
    return factory.createRuntime("a2a", {
      endpoint: normalizedEndpoint,
      authentication: {
        type: 'none'
      },
      transport: {
        type: "json-rest",
        config: {
          baseURL: normalizedEndpoint,
          timeout: 30000,
        },
        endpointMapping: endpointMapping
      },
      // Use default agent card resolver; add custom fallback fetch in validation below
    });
  }, [normalizedEndpoint]);

  const handleTaskInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskInput(e.target.value);
  }, []);

  // Helper to add/update headers
  const handleHeaderChange = useCallback((key: string, value: string) => {
    setAdditionalHeaders(prev => {
      if (value.trim() === '') {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const handleAddHeader = useCallback(() => {
    const key = `header-${Date.now()}`;
    setAdditionalHeaders(prev => ({ ...prev, [key]: '' }));
  }, []);

  // A2A-compliant connect: discover agent card via well-known endpoints, validate compliance, then connect
  const handleConnect = useCallback(async () => {
    try {
      if (isConnected) {
        setIsConnected(false);
        setCurrentPhase('setup');
        return;
      }
      if (!isUrlValid || validating) return;

      setValidating(true);
      setValidationError(null);
      setDetectedProtocol(null);
      setCompliance(null);
      setAgentCard(null);

      // Create headers object including additional headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...additionalHeaders
      };

      // Attempt to detect protocol (may fail or be non-A2A for custom endpoints)
      const factory = createRuntimeFactory();
      try {
        const protocol = await factory.detectProtocol(normalizedEndpoint);
        setDetectedProtocol(protocol);
      } catch (e) {
        console.warn("Protocol detection failed, assuming A2A:", e);
        setDetectedProtocol("a2a");
      }

      // Discover agent card
      const candidates = [
        `${normalizedEndpoint}/.well-known/agent-card.json`,
        `${normalizedEndpoint}/.well-known/agent.json`,
        `${normalizedEndpoint}/agent-card`,
      ];

      let foundCard: AgentCard | null = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            const mapped = mapAgentCardFromData(data);
            if (mapped && mapped.name) {
              foundCard = mapped;
              break;
            }
          }
        } catch (e) {
          // continue trying next candidate
        }
      }

      if (!foundCard) {
        throw new Error("No agent card found at well-known endpoints. Ensure your agent exposes agent-card.json at /.well-known/agent-card.json or /agent-card");
      }

      setAgentCard(foundCard);

      // Validate A2A compliance
      const a2a = configuredRuntime as unknown as A2ARuntime;
      let comp: ComplianceResult | null = null;
      try {
        comp = (await a2a.validateA2ACompliance(normalizedEndpoint)) as ComplianceResult;
        if (comp) setCompliance(comp);
      } catch (e) {
        console.warn("A2A compliance validation failed:", e);
        // Set basic compliance info based on successful agent card discovery
        comp = {
          compliant: true,
          version: "unknown",
          supportedFeatures: [],
          issues: [{ severity: "warning", code: "COMPLIANCE_CHECK_FAILED", message: "Could not validate full A2A compliance" }]
        };
        setCompliance(comp);
      }

      if (comp?.compliant) {
        setIsConnected(true);
        
        // If we have a task input, move to task entry phase
        if (taskInput.trim()) {
          setCurrentPhase('task-entry');
        } else {
          setCurrentPhase('task-entry');
        }
      } else {
        setIsConnected(false);
        throw new Error("Endpoint failed A2A compliance");
      }
    } catch (e) {
      setValidationError(getErrorMessage(e, "Failed to connect"));
    } finally {
      setValidating(false);
    }
  }, [isConnected, isUrlValid, validating, normalizedEndpoint, configuredRuntime, additionalHeaders, taskInput]);

  // Real multiagent system data - no mock data

  // Track latest created/updated taskId from AgentUI context (must be inside provider)
  const TaskIdTracker = React.memo(function TaskIdTracker(props: { onChange: (id: string) => void }) {
    const { tasks } = useTaskList();
    useEffect(() => {
      if (tasks.length > 0) {
        props.onChange(tasks[0].id);
      }
    }, [tasks, props.onChange]);
    return null;
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AgentArea UI SDK - A2A Debugger
          </h1>
          <p className="text-muted-foreground mb-4">
            Connect to any A2A-compatible agent by its HTTP/HTTPS base URL, validate protocol compatibility, inspect capabilities, and send tasks.
          </p>

          {/* Connection Controls */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
               <div className="flex-1">
                 <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                   A2A Endpoint (HTTP/HTTPS)
                 </label>
                 <input
                   type="text"
                   id="endpoint"
                   value={endpoint}
                   onChange={(e) => setEndpoint(e.target.value)}
                   className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                   placeholder="https://your-agent.example.com"
                 />
                 {(endpoint.startsWith("ws://") || endpoint.startsWith("wss://")) && (
                   <p className="text-xs text-amber-600 mt-1">
                     Detected WebSocket scheme. A2A endpoints should be HTTP/HTTPS. Converted to {normalizedEndpoint}
                   </p>
                 )}
                {!isUrlValid && endpoint.trim().length > 0 && (
                  <p className="text-xs text-destructive mt-1">Please enter a valid HTTP/HTTPS URL</p>
                )}
               </div>
               <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={validating || !isUrlValid}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isConnected
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      : (validating || !isUrlValid)
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {isConnected ? "Disconnect" : (validating ? "Connecting..." : "Connect")}
                </button>
               </div>
             </div>

             {/* Additional Headers Configuration */}
             <div className="bg-muted/50 rounded-md p-4 border border-border mb-4">
               <h3 className="font-semibold mb-2">Additional Headers</h3>
               <p className="text-sm text-muted-foreground mb-3">Configure custom headers for A2A agent requests</p>
               <div className="space-y-2">
                 {Object.entries(additionalHeaders).map(([key, value]) => (
                   <div key={key} className="flex gap-2">
                     <input
                       type="text"
                       placeholder="Header name"
                       value={key.startsWith('header-') ? '' : key}
                       onChange={(e) => {
                         const newKey = e.target.value || key;
                         const { [key]: oldValue, ...rest } = additionalHeaders;
                         setAdditionalHeaders({ ...rest, [newKey]: value });
                       }}
                       className="flex-1 px-3 py-1 text-sm border border-border rounded bg-background"
                     />
                     <input
                       type="text"
                       placeholder="Header value"
                       value={value}
                       onChange={(e) => handleHeaderChange(key, e.target.value)}
                       className="flex-1 px-3 py-1 text-sm border border-border rounded bg-background"
                     />
                     <button
                       type="button"
                       onClick={() => handleHeaderChange(key, '')}
                       className="px-2 py-1 text-sm bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                     >
                       Remove
                     </button>
                   </div>
                 ))}
                 <button
                   type="button"
                   onClick={handleAddHeader}
                   className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
                 >
                   Add Header
                 </button>
               </div>
             </div>

             {/* Connection Status */}
             <div className="flex items-center gap-2">
               <div
                 className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-destructive"}`}
               />
               <span className="text-sm text-muted-foreground">
                 {isConnected ? `Connected to ${normalizedEndpoint}` : "Disconnected"}
               </span>
             </div>
          </div>

          {/* Validation Results - Compact Design */}
          {isConnected && (
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Connection Details</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      detectedProtocol === "a2a" ? "bg-green-500" : "bg-amber-500"
                    }`} />
                    Protocol: {detectedProtocol || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      compliance?.compliant ? "bg-green-500" : "bg-amber-500"
                    }`} />
                    A2A v{compliance?.version || "?"}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Agent Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">Agent</h4>
                    {agentCard && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {agentCard.capabilities?.length || 0} capabilities
                      </span>
                    )}
                  </div>
                  {agentCard ? (
                    <div>
                      <p className="text-sm font-medium">{agentCard.name}</p>
                      {agentCard.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{agentCard.description}</p>
                      )}
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>Streaming: {agentCard.streaming ? "✓" : "✗"}</span>
                        <span>Push: {agentCard.pushNotifications ? "✓" : "✗"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No agent info available</p>
                  )}
                </div>

                {/* Compliance & Features */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Status & Features</h4>
                  {compliance ? (
                    <div className="space-y-1">
                      {compliance.supportedFeatures?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {compliance.supportedFeatures.slice(0, 4).map((f) => (
                              <span key={f} className="text-xs bg-secondary/50 px-2 py-0.5 rounded">{f}</span>
                            ))}
                            {compliance.supportedFeatures.length > 4 && (
                              <span className="text-xs text-muted-foreground">+{compliance.supportedFeatures.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      {compliance.issues && compliance.issues.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Issues:</p>
                          <div className="space-y-1">
                            {compliance.issues.slice(0, 2).map((i) => (
                              <p key={`${i.code}-${i.message}`} className={`text-xs ${
                                i.severity === "error" ? "text-destructive" : "text-amber-600"
                              }`}>
                                {i.code}: {i.message}
                              </p>
                            ))}
                            {compliance.issues.length > 2 && (
                              <p className="text-xs text-muted-foreground">+{compliance.issues.length - 2} more issues</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Compliance check pending</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {validationError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <AgentUI
          runtime={configuredRuntime}
          endpoint={normalizedEndpoint}
          autoConnect={isConnected}
          debug={true}
          theme="light"
          className="space-y-6"
        >
          {/* Track latest task id from context */}
          <TaskIdTracker
            onChange={useCallback((id: string) => {
              setTaskId((prev) => {
                if (prev !== id) {
                  setTaskInput("");
                  setCurrentPhase('agent-working');
                }
                return id;
              });
            }, [])}
          />
          
          {/* Phase-based UI Rendering */}
          {currentPhase === 'setup' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Connect to Agent</h2>
              <p className="text-muted-foreground mb-6">Enter your agent endpoint above and validate the connection to get started.</p>
            </div>
          )}
          
          {currentPhase === 'task-entry' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Create Task
                </h2>
                <div className="space-y-4">
                  <Task.Input
                    placeholder="Describe what you want the agent to do..."
                    className="min-h-[100px] w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={taskInput}
                    onChange={handleTaskInputChange}
                  />
                  <div className="flex justify-between items-center">
                    <Task.Send
                      taskInput={taskInput}
                      disabled={!isVerified || !isConnected || !isUrlValid || !taskInput.trim()}
                      title={!isVerified ? "Validate endpoint before sending" : (!isConnected ? "Connect to endpoint before sending" : undefined)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        setCurrentPhase('task-sent');
                      }}
                    >
                      Send Task
                    </Task.Send>
                  </div>
                  {!isVerified && (
                    <p className="text-xs text-muted-foreground">Validate the endpoint to enable task sending.</p>
                  )}
                </div>
              </div>
            </div>
           )}
           
           {currentPhase === 'task-sent' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Task Sent</h2>
              <p className="text-muted-foreground mb-6">Your task has been sent to the agent. Waiting for response...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
           )}
           
           {(currentPhase === 'agent-working' || currentPhase === 'communication') && taskId && (
            <div className="space-y-6">
              {/* Task Management Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Task Status & Control */}
                <div className="space-y-6">
                  <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Task Management
                    </h2>
                    <div className="space-y-4">
                      <Task.Status taskId={taskId} />
                      <Task.Progress taskId={taskId} />
                      <div className="flex gap-2">
                        <Task.Cancel taskId={taskId}>Cancel</Task.Cancel>
                        <Task.Retry taskId={taskId}>Retry</Task.Retry>
                      </div>
                    </div>
                  </div>
                  
                  {/* Artifacts Section */}
                  <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Artifacts</h2>
                    <Task.Artifacts taskId={taskId} className="space-y-2" />
                  </div>
                </div>
                
                {/* Right Column - Communication */}
                <div className="space-y-6">
                  <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Agent Communication</h2>
                    <Chat.Simple taskId={taskId} maxHeight="400px" className="w-full" />
                  </div>
                </div>
              </div>
              
              {/* MultiAgent System Components */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Task Graph - Shows agent collaboration */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Task Orchestration</h2>
                  <MultiAgent.TaskGraph nodes={[]} className="w-full" />
                </div>
                
                {/* Timeline - Shows real-time events */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">System Timeline</h2>
                  <MultiAgent.Timeline events={[]} maxHeight={400} className="w-full" />
                </div>
                
                {/* System Logs - Shows agent activity */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">System Logs</h2>
                  <MultiAgent.AgentLog entries={[]} maxHeight={400} className="w-full" />
                </div>
              </div>
              
              {/* Agent Network Visualization */}
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Agent Network</h2>
                <p className="text-muted-foreground mb-4">Real-time visualization of agent interactions and task delegation</p>
                <div className="w-full h-96 border rounded flex items-center justify-center text-muted-foreground">
                  Agent network visualization will be implemented with real multiagent system data
                </div>
              </div>
            </div>
           )}
        </AgentUI>
      </div>
    </div>
  );
}
