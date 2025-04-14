const { AuthenticationError } = require('apollo-server-express');
const videoService = require('../../services/videoService');

module.exports = { // Xuất đối tượng module chứa các resolver
    Mutation: { // Khai báo các mutation GraphQL
        uploadVideo: async (_, { file, title, description }, context) => { // Mutation để tải video lên, nhận file, tiêu đề, mô tả
            if (!context.user) { // Kiểm tra xem người dùng đã đăng nhập chưa
                throw new AuthenticationError('Bạn phải đăng nhập để tải video lên'); // Ném lỗi nếu chưa đăng nhập
            }

            try { // Bắt đầu khối thử để xử lý tải video
                const { createReadStream, filename, mimetype } = await file; // Trích xuất stream, tên file, loại MIME từ đối tượng file
                const stream = createReadStream(); // Tạo luồng đọc từ file

                const video = await videoService.uploadVideo({ // Gọi hàm uploadVideo từ videoService
                    stream, // Luồng dữ liệu của file video
                    filename, // Tên của file video
                    mimetype, // Loại MIME của file (ví dụ: video/mp4)
                    title, // Tiêu đề của video
                    description, // Mô tả của video
                    userId: context.user.id // ID của người dùng tải video
                });

                return video; // Trả về thông tin video sau khi tải lên thành công
            } catch (error) { // Bắt lỗi nếu có vấn đề trong quá trình tải lên
                console.error('Lỗi khi tải video lên:', error); // Ghi log lỗi ra console bằng tiếng Việt
                throw new Error('Không thể tải video lên'); // Ném lỗi chung cho client
            }
        },
    },
};
