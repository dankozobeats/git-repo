import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    console.log("📩 Body reçu:", body);

    if (!body || !body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "prompt manquant", received: body },
        { status: 400 }
      );
    }

    const aiRes = await fetch("http://51.83.32.24:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:3.8b",
        prompt: body.prompt,
        stream: false,
      }),
    });

    const data = await aiRes.json();

    return NextResponse.json({
      success: true,
      prompt: body.prompt,
      ia: data.response,
    });
  } catch (err) {
    console.error("API TEST ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur", message: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Méthode non autorisée" },
    { status: 405 }
  );
}

