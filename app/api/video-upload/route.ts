import { v2 as cloudinary } from "cloudinary"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface CloudinaryUploadResult {
    public_id: string
    bytes: number
    duration?: number
    [key: string]: string | number | boolean | object | null | undefined
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
    
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }


        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) 
        {
            return NextResponse.json({ error: "Cloudinary credentials are not set" }, { status: 500 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const originalSize = formData.get("originalSize") as string

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "video-upload",
                transformation: [
                    {
                       quality: "auto",
                       fetch_format: "mp4",
                    },
                ],
                resource_type: "video",
            }, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result as CloudinaryUploadResult)
                }
            })
            uploadStream.end(buffer)
        })

        const video = await prisma.video.create({
            data: {
                title,
                description,
                originalSize,
                publicId: result.public_id, 
                compressedSize: result.bytes.toString(),
                duration: result.duration || 0,
            }
        })

        return NextResponse.json(video, { status: 200 })

    } catch (error) {
        console.error("Error uploading video:", error)
        return NextResponse.json({ error: "Failed to upload video" }, { status: 500 })
    }
    finally {
        await prisma.$disconnect()
    }
    
}
