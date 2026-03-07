import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
        }

        const cloudinaryForm = new FormData();
        cloudinaryForm.append('file', file);
        cloudinaryForm.append('upload_preset', uploadPreset);
        cloudinaryForm.append('folder', 'nexprint/user-uploads');

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            { method: 'POST', body: cloudinaryForm }
        );

        if (!res.ok) {
            const errData = await res.json();
            console.error('Cloudinary error:', errData);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        const data = await res.json();

        return NextResponse.json({
            url: data.secure_url,
            publicId: data.public_id,
            pages: data.pages || 1,
            format: data.format,
            bytes: data.bytes,
        });
    } catch (error: any) {
        console.error('Upload route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
