import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    const res = await fetch("http://127.0.0.1:8000/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
