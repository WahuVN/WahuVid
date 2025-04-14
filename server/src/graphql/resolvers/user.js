import { AuthenticationError } from 'apollo-server-express'; // Nhập lỗi xác thực từ Apollo Server
import userService from '../../services/userService.js'; // Nhập dịch vụ xử lý người dùng
import authService from '../../services/authService.js'; // Nhập dịch vụ xác thực
import videoService from '../../services/videoService.js'; // Nhập dịch vụ xử lý video
import likeService from '../../services/likeService.js'; // Nhập dịch vụ xử lý lượt thích

export default {
    Query: { // Các truy vấn GraphQL
        me: (_, __, { user }) => { // Truy vấn thông tin người dùng hiện tại
            if (!user) throw new AuthenticationError('Bạn phải đăng nhập'); // Nếu không có user, ném lỗi xác thực
            return userService.getUserById(user.id); // Trả về thông tin user từ ID
        },
        user: (_, { id }) => userService.getUserById(id), // Truy vấn thông tin một người dùng theo ID
        users: (_, { limit, offset }) => userService.getUsers(limit, offset), // Truy vấn danh sách người dùng với giới hạn và offset
    },
    Mutation: { // Các thay đổi dữ liệu GraphQL
        signUp: async (_, { username, email, password }) => { // Đăng ký người dùng mới
            const user = await userService.createUser({ username, email, password }); // Tạo user mới
            const token = authService.generateToken(user); // Tạo token xác thực cho user
            return { token, user }; // Trả về token và thông tin user
        },
        signIn: async (_, { email, password }) => { // Đăng nhập người dùng
            const user = await authService.authenticateUser(email, password); // Xác thực user bằng email và mật khẩu
            const token = authService.generateToken(user); // Tạo token cho user đã xác thực
            return { token, user }; // Trả về token và thông tin user
        },
        // Other mutations... // Các mutation khác (được chú thích nhưng không hiển thị ở đây)
    },
    User: { // Các trường liên quan đến đối tượng User
        videos: (parent) => videoService.getVideosByUserId(parent.id), // Lấy danh sách video của user theo ID
        likedVideos: (parent) => likeService.getLikedVideosByUserId(parent.id), // Lấy danh sách video được user thích
        followers: (parent) => userService.getFollowers(parent.id), // Lấy danh sách người theo dõi user
        following: (parent) => userService.getFollowing(parent.id), // Lấy danh sách người mà user đang theo dõi
    },
};