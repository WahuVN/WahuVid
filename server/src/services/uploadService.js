import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình S3 Client với path-style
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Bắt buộc sử dụng path-style
});

/**
 * Tạo URL path-style thủ công
 * @param {string} bucket - Tên bucket
 * @param {string} key - Đường dẫn file
 * @returns {string} - URL path-style
 */
const generatePathStyleUrl = (bucket, key) => {
    return `https://s3.${process.env.AWS_REGION}.amazonaws.com/${bucket}/${key}`;
};

const uploadToS3 = async (file, folder = 'upload') => {
    try {
        console.log(`Bắt đầu tải lên S3, thư mục: ${folder}`);

        const { createReadStream, filename, mimetype } = await file;
        const key = `${folder}/${uuidv4()}-${filename}`;
        const stream = createReadStream();

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key,
                Body: stream,
                ContentType: mimetype,
                ACL: 'public-read'
            }
        });

        const result = await upload.done();

        // Tạo URL thủ công theo path-style
        const location = generatePathStyleUrl(
            process.env.AWS_S3_BUCKET_NAME,
            key
        );

        console.log(`Tải lên thành công. URL S3: ${location}`);

        return {
            ...result,
            Location: location // Ghi đè URL trả về
        };

    } catch (error) {
        console.error("Lỗi khi tải tệp lên S3:", error);
        throw new Error(`Tải lên thất bại: ${error.message}`);
    }
};

const deleteFromS3 = async (fileKey) => {
    try {
        console.log(`Đang xóa tệp trên S3: ${fileKey}`);

        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey
        }));

        console.log("Xóa tệp thành công");
    } catch (error) {
        console.error("Lỗi khi xóa tệp trên S3:", error);
        throw new Error(`Xóa tệp thất bại: ${error.message}`);
    }
};

export default {
    uploadToS3,
    deleteFromS3,
};