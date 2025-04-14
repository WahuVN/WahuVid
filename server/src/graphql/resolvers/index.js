import { mergeResolvers } from '@graphql-tools/merge'; // Nhập hàm mergeResolvers để gộp các resolver
import { loadFilesSync } from '@graphql-tools/load-files'; // Nhập hàm loadFilesSync để tải file đồng bộ
import path from 'path'; // Nhập module path để xử lý đường dẫn file
import { fileURLToPath } from 'url'; // Nhập hàm fileURLToPath để chuyển URL thành đường dẫn file

const __filename = fileURLToPath(import.meta.url); // Lấy tên file hiện tại từ URL của module
const __dirname = path.dirname(__filename); // Lấy thư mục chứa file hiện tại từ đường dẫn file

const resolversArray = loadFilesSync(path.join(__dirname, '.'), {
    extensions: ['js'], // Chỉ tải các file có đuôi .js
    ignoreIndex: true // Bỏ qua file index trong quá trình tải
}); // Tải tất cả file resolver trong thư mục hiện tại

export default mergeResolvers(resolversArray); // Gộp tất cả resolver thành một và xuất ra