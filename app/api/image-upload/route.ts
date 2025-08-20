import { v2 as cloudinary } from "cloudinary"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface CloudinaryUploadResult {
    public_id: string
    [key: string]: string | number | boolean | object | null | undefined
}

export async function POST(req: NextRequest) {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "video-compressor",
            }, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result as CloudinaryUploadResult)
                }
            })
            uploadStream.end(buffer)
        })

        return NextResponse.json({
            public_id: result.public_id,
        }, { status: 200 })

    } catch (error) {
        console.error("Error uploading image:", error)
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }
    
}
