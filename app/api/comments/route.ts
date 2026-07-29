import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const dishId = body?.dish_id
    const comment = typeof body?.comment === "string" ? body.comment.trim() : ""
    const rating = Number(body?.rating ?? 5)

    if (!dishId || !comment) {
      return NextResponse.json({ error: "Missing dish_id or comment" }, { status: 400 })
    }

    const { data, error } = await supabase.from("DishComment").insert({
      dish_id: dishId,
      comment,
      rating: Number.isFinite(rating) ? rating : 5,
      is_approved: true,
      likes: 0,
      language: "en",
    }).select("id, dish_id, comment, rating, created_at, likes")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment: data?.[0] ?? null })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unable to save your comment." }, { status: 500 })
  }
}
