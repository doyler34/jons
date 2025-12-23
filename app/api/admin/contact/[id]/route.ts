import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { cookies } from "next/headers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { read, archived } = body

    if (read !== undefined) {
      await sql`
        UPDATE contact_messages
        SET read = ${read}
        WHERE id = ${id}
      `
    }

    if (archived !== undefined) {
      await sql`
        UPDATE contact_messages
        SET archived = ${archived}
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating contact message:", error)
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    await sql`DELETE FROM contact_messages WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact message:", error)
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    )
  }
}

