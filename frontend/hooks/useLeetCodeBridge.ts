import { useState, useEffect, useCallback, useRef } from "react";

export type BridgeStatus = "Idle" | "Running" | "Submitting" | "Done" | "Error";

interface BridgeState {
  status: BridgeStatus;
  result: string;
  runOnLeetCode: (slug: string, code: string) => void;
  submitOnLeetCode: (slug: string, code: string) => void;
}

let _reqCounter = 0;
function nextRequestId() {
  return `bridge_req_${++_reqCounter}_${Date.now()}`;
}

export function useLeetCodeBridge(): BridgeState {
  const [status, setStatus] = useState<BridgeStatus>("Idle");
  const [result, setResult] = useState<string>("");
  const pendingRef = useRef<Map<string, (response: any) => void>>(new Map());

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || event.data.source !== "BRIDGE_OA_RESPONSE") return;
      const { requestId, result: response } = event.data;
      const resolve = pendingRef.current.get(requestId);
      if (resolve) {
        pendingRef.current.delete(requestId);
        resolve(response);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const sendBridgeMessage = useCallback(
    (action: "RUN" | "SUBMIT", payload: Record<string, string>): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!payload.code || !payload.slug) {
          reject(new Error("Missing code or slug."));
          return;
        }

        const requestId = nextRequestId();
        pendingRef.current.set(requestId, resolve);

        window.postMessage({ source: "BRIDGE_OA", action, payload, requestId }, "*");

        setTimeout(() => {
          if (pendingRef.current.has(requestId)) {
            pendingRef.current.delete(requestId);
            reject(new Error("Bridge timeout (120s). Is the extension running?"));
          }
        }, 120_000);
      });
    },
    []
  );

  const runOnLeetCode = useCallback((slug: string, code: string) => {
      setStatus("Running");
      setResult("Opening LeetCode tab and running tests...");
      sendBridgeMessage("RUN", { slug, code })
        .then((response) => {
          setStatus("Done");
          setResult(response?.data ?? JSON.stringify(response));
        })
        .catch((err) => {
          setStatus("Error");
          setResult(`[BRIDGE ERROR]\n${err.message}`);
        });
    },
    [sendBridgeMessage]
  );

  const submitOnLeetCode = useCallback((slug: string, code: string) => {
      setStatus("Submitting");
      setResult("Opening LeetCode tab and submitting solution...");
      sendBridgeMessage("SUBMIT", { slug, code })
        .then((response) => {
          setStatus("Done");
          setResult(response?.data ?? JSON.stringify(response));
        })
        .catch((err) => {
          setStatus("Error");
          setResult(`[BRIDGE ERROR]\n${err.message}`);
        });
    },
    [sendBridgeMessage]
  );

  return { status, result, runOnLeetCode, submitOnLeetCode };
}