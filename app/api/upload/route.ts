import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData(); // frontend sends FormData with file
    const res = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data); // { fileName: "test.mp3" }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
