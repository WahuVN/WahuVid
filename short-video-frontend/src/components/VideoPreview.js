import React, { useState, useRef, useEffect, useCallback } from 'react'; // Nhập các hook từ React
import { Box, debounce, Typography } from '@mui/material'; // Nhập Box, debounce, Typography từ MUI
import { Heart, Play } from 'lucide-react'; // Nhập biểu tượng Heart và Play từ lucide-react
import LargeNumberDisplay from './LargeNumberDisplay'; // Nhập component hiển thị số lớn

const VideoPreview = ({ videoUrl, thumbnailUrl, userAva, views, likes, isViewed, onThumbnailGenerated, onClick = () => { }, isMuted = true, aspectRatio = '12/16' }) => { // Định nghĩa component VideoPreview với các props
    const [isHovered, setIsHovered] = useState(false); // Trạng thái hover, mặc định là false
    const [autoThumbnail, setAutoThumbnail] = useState(''); // Trạng thái lưu thumbnail tự động sinh ra
    const videoRef = useRef(null); // Tham chiếu đến thẻ video
    const canvasRef = useRef(null); // Tham chiếu đến thẻ canvas

    const playVideo = useCallback(() => { // Hàm phát video, dùng useCallback để tối ưu
        if (videoRef.current) { // Kiểm tra videoRef có tồn tại không
            videoRef.current.currentTime = 0; // Đặt thời gian video về 0
            videoRef.current.play().catch(error => { // Phát video và xử lý lỗi
                if (error.name !== 'AbortError') { // Nếu không phải lỗi hủy bỏ
                    console.warn('Lỗi khi phát video:', error); // Ghi log lỗi bằng tiếng Việt
                }
            });
        }
    }, []);
    console.log(userAva); // In avatar người dùng ra console

    const pauseVideo = useCallback(() => { // Hàm dừng video, dùng useCallback để tối ưu
        if (videoRef.current) { // Kiểm tra videoRef có tồn tại không
            videoRef.current.pause(); // Dừng video
        }
    }, []);

    const debouncedPlay = useCallback(debounce(playVideo, 500), [playVideo]); // Tạo hàm phát video trì hoãn 500ms
    const debouncedPause = useCallback(debounce(pauseVideo, 500), [pauseVideo]); // Tạo hàm dừng video trì hoãn 500ms

    useEffect(() => { // Hook chạy khi videoUrl hoặc thumbnailUrl thay đổi
        if (videoUrl && !thumbnailUrl) { // Nếu có videoUrl nhưng không có thumbnailUrl
            generateThumbnail(); // Gọi hàm tạo thumbnail
        }
    }, [videoUrl, thumbnailUrl]);

    useEffect(() => { // Hook chạy khi trạng thái hover thay đổi
        if (isHovered) { // Nếu đang hover
            debouncedPlay(); // Phát video với độ trễ
        } else { // Nếu không hover
            debouncedPause(); // Dừng video với độ trễ
        }

        return () => { // Hàm cleanup khi component unmount
            debouncedPlay.clear(); // Xóa hàm phát trì hoãn
            debouncedPause.clear(); // Xóa hàm dừng trì hoãn
        };
    }, [isHovered, debouncedPlay, debouncedPause]);

    const generateThumbnail = () => { // Hàm tạo thumbnail từ video
        console.log(canvasRef.current, videoRef.current);
        if (canvasRef.current == null || videoRef.current == null) {
            return;
        }
        const video = document.createElement('video'); // Tạo thẻ video mới
        video.src = videoUrl; // Gán URL video
        video.crossOrigin = 'anonymous'; // Cho phép truy cập cross-origin
        video.muted = true; // Tắt tiếng video
        video.onloadeddata = () => { // Khi dữ liệu video tải xong
            video.currentTime = 0; // Đặt thời gian về 0
        };
        video.onseeked = () => { // Khi video đã seek đến thời điểm mong muốn
            const canvas = canvasRef.current; // Lấy tham chiếu canvas
            canvas.width = video.videoWidth; // Đặt chiều rộng canvas bằng video
            canvas.height = video.videoHeight; // Đặt chiều cao canvas bằng video
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); // Vẽ frame video lên canvas
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg'); // Chuyển canvas thành URL ảnh JPEG
            setAutoThumbnail(thumbnailDataUrl); // Lưu URL ảnh vào state
            if (onThumbnailGenerated) { // Nếu có callback onThumbnailGenerated
                fetch(thumbnailDataUrl) // Lấy dữ liệu ảnh từ URL
                    .then(res => res.blob()) // Chuyển thành blob
                    .then(blob => { // Xử lý blob
                        const file = new File([blob], "auto-thumbnail.jpg", { type: "image/jpeg" }); // Tạo file từ blob
                        onThumbnailGenerated(file); // Gọi callback với file
                    });
            }
        };
    };

    return (
        <Box // Container chính cho preview video
            sx={{
                position: 'relative',
                width: '100%',
                // maxWidth: 300,
                aspectRatio: aspectRatio, // Tỷ lệ khung hình từ props
                cursor: 'pointer', // Con trỏ chuột thành tay khi hover
                margin: 'auto',
                overflow: 'hidden', // Ẩn nội dung tràn ra ngoài
                borderRadius: '8px', // Bo góc 8px
            }}
            onMouseEnter={() => setIsHovered(true)} // Khi chuột vào, đặt isHovered thành true
            onMouseLeave={() => setIsHovered(false)} // Khi chuột rời, đặt isHovered thành false
            onClick={onClick} // Sự kiện click từ props
        >
            <Box // Lớp nền mờ làm background
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${thumbnailUrl || userAva || autoThumbnail})`, // Dùng thumbnailUrl, userAva hoặc autoThumbnail làm nền
                    backgroundSize: 'cover', // Phủ kín nền
                    backgroundPosition: 'center', // Canh giữa
                    filter: 'blur(20px)', // Làm mờ 20px
                    transform: 'scale(1.1)', // Phóng to nhẹ
                    zIndex: 1, // Đặt lớp nền dưới cùng
                }}
            />
            <img // Hình ảnh thumbnail
                src={thumbnailUrl || userAva || autoThumbnail} // Nguồn ảnh từ thumbnailUrl, userAva hoặc autoThumbnail
                alt={"thumbnail"} // Văn bản thay thế
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Giữ tỷ lệ ảnh
                    position: 'relative',
                    zIndex: 2, // Đặt trên lớp nền
                    opacity: isHovered ? 0 : 1, // Ẩn khi hover, hiện khi không hover
                    transition: 'opacity 0.3s ease', // Hiệu ứng chuyển đổi độ mờ
                }}
            />
            <video // Thẻ video chính
                ref={videoRef} // Gán tham chiếu video
                src={videoUrl} // Nguồn video từ props
                muted={isMuted} // Tắt tiếng theo props
                loop // Lặp lại video
                playsInline // Phát inline trên mobile
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Giữ tỷ lệ video
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 2, // Đặt trên lớp nền
                    opacity: isHovered ? 1 : 0, // Hiện khi hover, ẩn khi không hover
                    transition: 'opacity 0.3s ease', // Hiệu ứng chuyển đổi độ mờ
                }}
            />
            {!isHovered && // Hiển thị nhãn "Đã Xem" khi không hover
                <Box sx={
                    {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        top: 0,
                        zIndex: 2, // Đặt trên video/thumbnail
                        display: isViewed ? 'flex' : 'none', // Chỉ hiện nếu video đã xem
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Nền mờ đen
                        alignItems: 'center',
                    }
                }>
                    <Typography color={"#fff"}>
                        Đã Xem
                    </Typography>
                </Box>
            }
            <Box sx={{ // Container cho số lượt xem và lượt thích
                display: 'flex',
                position: 'absolute',
                justifyContent: 'space-between', // Canh hai bên
                bottom: 0,
                left: 0,
                right: 0,
            }}>
                <Typography // Hiển thị số lượt xem
                    variant="subtitle1"
                    sx={{
                        color: 'white',
                        padding: '8px',
                        textOverflow: 'ellipsis',
                        fontWeight: '600',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        zIndex: 3, // Đặt trên các lớp khác
                    }}
                >
                    <Play size={12} strokeWidth={4} /> {" "}
                    <LargeNumberDisplay number={views * 19 || 0} />
                </Typography>
                <Typography // Hiển thị số lượt thích
                    variant="subtitle1"
                    sx={{
                        color: 'white',
                        padding: '8px',
                        textOverflow: 'ellipsis',
                        fontWeight: '600',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        zIndex: 3, // Đặt trên các lớp khác
                    }}
                >
                    <Heart size={12} strokeWidth={4} /> {" "}
                    <LargeNumberDisplay number={likes * 19 || 0} />
                </Typography>
            </Box>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>
    );
};

export default React.memo(VideoPreview); // Xuất component với React.memo để tối ưu render