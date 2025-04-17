import models from "../models/index.js"; // Nhập các model từ thư mục models
import { createToken } from "../utils/jwtTokenUtils.js"; // Nhập hàm tạo token JWT
import bcrypt from 'bcryptjs'; // Nhập bcrypt để mã hóa mật khẩu
import uploadService from "./uploadService.js"; // Nhập dịch vụ upload file
import { isValidObjectId } from "mongoose"; // Nhập hàm kiểm tra ObjectId hợp lệ từ mongoose

const getUser = async (userId, viewerId) => { // Hàm lấy thông tin người dùng theo userId
    console.log(userId); // In userId ra console
    try { // Khối try để xử lý lỗi
        let user; // Biến lưu thông tin người dùng
        user = await models.User.findOne({ username: userId }); // Tìm người dùng theo username
        if (user) { // Nếu tìm thấy
            return user; // Trả về người dùng
        }
        user = await models.User.findById(userId); // Tìm người dùng theo ID
        if (!user) { // Nếu không tìm thấy
            console.log('Không tìm thấy người dùng với ID:', userId); // Ghi log thông báo
            throw new Error('Không tìm thấy người dùng'); // Ném lỗi
        }
        return user; // Trả về người dùng
    } catch (error) { // Bắt lỗi nếu có
        console.error('Lỗi trong getUser:', error); // Ghi log lỗi
        throw error; // Ném lại lỗi
    }
}

const registerUser = async (username, email, password, profilePicture) => { // Hàm đăng ký người dùng mới
    let uploadedFileLocation; // Biến lưu vị trí file đã upload
    try { // Khối try để xử lý lỗi
        if (profilePicture) { // Nếu có ảnh đại diện
            const res = await uploadService.uploadToS3(profilePicture, "avatar"); // Upload ảnh lên S3
            uploadedFileLocation = res.Location; // Lưu vị trí file
        }
        const hashedPassword = await bcrypt.hash(password, 10); // Mã hóa mật khẩu với salt 10
        const user = new models.User({ username, email, password: hashedPassword, profilePicture: uploadedFileLocation }); // Tạo người dùng mới
        await user.save(); // Lưu người dùng vào database
        const token = createToken(user); // Tạo token JWT cho người dùng
        return { token, user }; // Trả về token và thông tin người dùng
    } catch (error) { // Bắt lỗi nếu có
        if (uploadedFileLocation) { // Nếu đã upload file nhưng xảy ra lỗi
            try { // Thử xóa file đã upload
                uploadService.deleteFromS3(uploadedFileLocation); // Xóa file khỏi S3
            } catch (deleteError) { // Bắt lỗi khi xóa file
                console.error("Lỗi khi xóa file đã upload khỏi S3: ", deleteError); // Ghi log lỗi
            }
        }
        console.error("Lỗi trong registerUser:", error); // Ghi log lỗi đăng ký
        throw new Error(error.message || "Đã xảy ra lỗi trong quá trình đăng ký"); // Ném lỗi với thông báo tiếng Việt
    }
}

const loginUser = async (email, password) => { // Hàm đăng nhập người dùng
    try { // Khối try để xử lý lỗi
        const user = await models.User.findOne({ // Tìm người dùng theo email hoặc username
            $or: [{ email: email }, { username: email }]
        });

        if (!user) { // Nếu không tìm thấy người dùng
            throw new Error('Không tìm thấy người dùng'); // Ném lỗi
        }

        const validPassword = await bcrypt.compare(password, user.password); // So sánh mật khẩu nhập vào với mật khẩu đã mã hóa
        if (!validPassword) { // Nếu mật khẩu không khớp
            throw new Error('Mật khẩu không đúng'); // Ném lỗi
        }

        const token = createToken(user); // Tạo token JWT cho người dùng
        return { token, user }; // Trả về token và thông tin người dùng
    } catch (error) { // Bắt lỗi nếu có
        console.error("Lỗi trong loginUser:", error); // Ghi log lỗi đăng nhập
        throw new Error(error.message || "Đã xảy ra lỗi trong quá trình đăng nhập"); // Ném lỗi với thông báo tiếng Việt
    }
}

const getUsersByIds = async (userIds) => { // Hàm lấy danh sách người dùng theo danh sách ID
    try { // Khối try để xử lý lỗi
        const users = await models.User.find( // Tìm người dùng trong danh sách ID
            { _id: { $in: userIds } });

        return users; // Trả về danh sách người dùng
    } catch (error) { // Bắt lỗi nếu có
        console.error('Lỗi trong getUsersByIds:', error); // Ghi log lỗi
        throw new Error('Không thể lấy danh sách người dùng'); // Ném lỗi với thông báo tiếng Việt
    }
};

const getUserById = async (userIdInput) => { // Hàm lấy người dùng theo ID
    let userId; // Biến lưu ID người dùng

    if (typeof userIdInput === 'object' && userIdInput.id) { // Nếu đầu vào là object và có thuộc tính id
        userId = userIdInput.id; // Lấy ID từ thuộc tính id
    } else { // Nếu không
        userId = userIdInput; // Dùng trực tiếp đầu vào
    }

    if (!isValidObjectId(userId)) { // Kiểm tra ID có hợp lệ không
        throw new Error('Định dạng userId không hợp lệ'); // Ném lỗi nếu không hợp lệ
    }

    try { // Khối try để xử lý lỗi
        const user = await models.User.findById(userId); // Tìm người dùng theo ID
        if (!user) { // Nếu không tìm thấy
            throw new Error('Không tìm thấy người dùng'); // Ném lỗi
        }
        return user; // Trả về người dùng
    } catch (error) { // Bắt lỗi nếu có
        console.error('Lỗi khi lấy người dùng:', error); // Ghi log lỗi
        throw error; // Ném lại lỗi
    }
};

const getFollowers = async (userId) => { // Hàm lấy danh sách người theo dõi
    const user = await models.User.findOne({
        username: userId
    }); // Tìm người dùng theo ID
    const follows = await models.Follow.find({ // Tìm tất cả bản ghi Follow với following là userId
        following: user._id
    });
    const followers = await models.User.find({ // Tìm tất cả người dùng theo ID trong danh sách follows
        _id: { $in: follows.map(follow => follow.follower) } // Lấy ID của người dùng theo dõi
    });
    return followers; // Trả về danh sách người theo dõi
};

const getFollowersByUserId = async (userId) => { // Hàm lấy danh sách người theo dõi
    const user = await models.User.findOne({
        _id: userId
    }); // Tìm người dùng theo ID
    const follows = await models.Follow.find({ // Tìm tất cả bản ghi Follow với following là userId
        following: user._id
    });
    const followers = await models.User.find({ // Tìm tất cả người dùng theo ID trong danh sách follows
        _id: { $in: follows.map(follow => follow.follower) } // Lấy ID của người dùng theo dõi
    });
    return followers; // Trả về danh sách người theo dõi
};

const getFollowings = async (username) => { // Hàm lấy danh sách người theo dõi
    const user = await models.User.findOne({
        username: username
    }); // Tìm người dùng theo ID
    const follows = await models.Follow.find({ // Tìm tất cả bản ghi Follow với following là userId
        follower: user._id
    });
    const following = await models.User.find({ // Tìm tất cả người dùng theo ID trong danh sách follows
        _id: { $in: follows.map(follow => follow.following) } // Lấy ID của người dùng theo dõi
    });
    return following; // Trả về danh sách người theo dõi

};


export default { // Xuất các hàm dưới dạng object
    getUser,
    registerUser,
    loginUser,
    getUsersByIds,
    getUserById,
    getFollowers,
    getFollowings,
    getFollowersByUserId
}