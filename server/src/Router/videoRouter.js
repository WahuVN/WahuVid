import express from 'express';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';

// Nạp các biến môi trường từ file .env
dotenv.config();

const router = express.Router();

// Khởi tạo kết nối với AWS S3 bằng cách sử dụng thông tin xác thực từ biến môi trường
const s3Client = new S3Client({
    region: process.env.AWS_REGION, // Khu vực của S3 (ví dụ: us-east-1)
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Khóa truy cập AWS
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Khóa bí mật AWS
    },
});

/**
 * API GET /video/:key
 * - Nhận key (tên file video) từ request params.
 * - Tạo URL có chữ ký (pre-signed URL) từ S3 để truy cập video an toàn.
 * - Redirect người dùng đến URL này để phát video.
 */
router.get('/video/:key', async (req, res) => {
    const key = req.params.key; // Lấy key (tên file video) từ URL

    // Tạo lệnh lấy file từ S3
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME, // Tên bucket S3 chứa video
        Key: key, // Định danh file trong bucket
    });

    try {
        // Tạo pre-signed URL có hiệu lực trong 1 giờ (3600 giây)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // Redirect người dùng đến pre-signed URL để phát video
        res.redirect(signedUrl);
    } catch (error) {
        console.error('Lỗi khi tạo pre-signed URL:', error);
        res.status(500).send('Lỗi khi truy cập video');
    }
});

export default router;
