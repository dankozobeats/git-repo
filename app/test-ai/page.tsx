"use client";

import { useState } from "react";

export default function TestAI() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResponse(null);

    const res = await fetch("/api/coach-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Test API IA - Ollama VPS</h1>

      <textarea
        className="w-full p-3 bg-gray-800 rounded"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Écris un prompt..."
      />

      <button
        onClick={send}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Tester l'IA"}
      </button>

      {response && (
        <pre className="mt-4 bg-gray-900 p-4 rounded text-sm whitespace-pre-wrap">
          {response}
        </pre>
      )}
    </div>
  );
}

