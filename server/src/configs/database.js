import mongoose from 'mongoose'; // Nhập thư viện mongoose để làm việc với MongoDB
require('dotenv').config() // Nhập và cấu hình dotenv để đọc biến môi trường từ file .env

const connectDB = async () => { // Định nghĩa hàm bất đồng bộ để kết nối với MongoDB
    try { // Khối try để thử thực hiện kết nối và xử lý lỗi nếu có
        const options = { // Định nghĩa các tùy chọn cho kết nối mongoose
            useNewUrlParser: true, // Dùng trình phân tích URL mới
            useUnifiedTopology: true, // Dùng engine quản lý kết nối mới
            useCreateIndex: true, // Tự động tạo index cho các trường
            useFindAndModify: false // Tắt phương thức findAndModify cũ
        }
        await mongoose.connect(process.env.MONGODB_URI); // Kết nối tới MongoDB bằng URI từ biến môi trường
        console.log('MongoDB đã kết nối thành công'); // In thông báo nếu kết nối thành công
    } catch (error) { // Khối catch để bắt lỗi nếu kết nối thất bại
        console.error('Lỗi kết nối MongoDB:', error); // In thông báo lỗi chi tiết
        process.exit(1); // Thoát chương trình với mã lỗi 1 nếu thất bại
    }
};

export default connectDB; // Xuất hàm connectDB để dùng ở nơi khác