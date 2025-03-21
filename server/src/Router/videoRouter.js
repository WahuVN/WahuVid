import express from 'express';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

router.get('/video/:key', async (req, res) => {
    const key = req.params.key;
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
    });

    try {
        // Generate a pre-signed URL
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

        // Redirect to the signed URL
        res.redirect(signedUrl);
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        res.status(500).send('Error accessing video');
    }
});

export default router;
