import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    try {
        const videos = await prisma.video.findMany({
            orderBy: {
                createdAt: "desc"
            }
        })
        return NextResponse.json(videos, { status: 200 })
    } catch (error) {
        console.error("Error fetching videos:", error)
        return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
    }
    finally {
        await prisma.$disconnect()
    }
}
