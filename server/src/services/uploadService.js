import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config(); // Load các biến môi trường từ file .env

// Khởi tạo client S3 với thông tin xác thực từ biến môi trường
const s3Client = new S3Client({
    region: process.env.AWS_REGION, // Khu vực AWS
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Mã truy cập AWS
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Khóa bí mật AWS
    },
});

/**
 * Hàm tải tệp lên S3
 * @param {Object} file - Tệp tin cần tải lên (dữ liệu từ form upload)
 * @param {string} folder - Thư mục trên S3 để lưu trữ (mặc định là "upload")
 * @returns {Object} - Kết quả tải lên từ AWS S3
 */
const uploadToS3 = async (file, folder = 'upload') => {
    try {
        console.log(`Bắt đầu tải lên S3, thư mục: ${folder}`);

        // Lấy thông tin tệp từ đối tượng file
        const { createReadStream, filename, mimetype } = await file;

        // Tạo tên file duy nhất bằng UUID
        const key = `${folder}/${uuidv4()}-${filename}`;
        const stream = createReadStream();

        console.log(`Đang tải lên tệp: ${filename}, Loại MIME: ${mimetype}`);

        // Tiến hành tải tệp lên S3 bằng thư viện @aws-sdk/lib-storage
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.AWS_S3_BUCKET_NAME, // Tên bucket S3
                Key: key, // Đường dẫn trong S3
                Body: stream, // Nội dung tệp
                ContentType: mimetype, // Loại tệp
                // ACL: 'public-read' // Cấp quyền công khai nếu cần
            }
        });

        // Chờ quá trình tải lên hoàn tất
        const result = await upload.done();
        console.log(`Tải lên thành công. URL S3: ${result.Location}`);

        return result;
    } catch (error) {
        console.error("Lỗi khi tải tệp lên S3:", error);
        throw new Error(`Tải lên thất bại: ${error.message}`);
    }
};

/**
 * Hàm xóa tệp khỏi S3
 * @param {string} fileKey - Đường dẫn (Key) của tệp trong S3
 */
const deleteFromS3 = async (fileKey) => {
    try {
        console.log(`Đang xóa tệp trên S3: ${fileKey}`);

        // Gửi yêu cầu xóa file đến S3
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME, // Tên bucket S3
            Key: fileKey // Đường dẫn file trên S3
        }));

        console.log("Xóa tệp thành công");
    } catch (error) {
        console.error("Lỗi khi xóa tệp trên S3:", error);
        throw new Error(`Xóa tệp thất bại: ${error.message}`);
    }
};

// Xuất module để sử dụng ở nơi khác
export default {
    uploadToS3,
    deleteFromS3,
};
