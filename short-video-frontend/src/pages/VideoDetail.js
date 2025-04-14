import React, { useCallback, useEffect, useRef, useState } from 'react'; // Nhập các hook từ React
import { useQuery, useMutation } from '@apollo/client'; // Nhập hook để thực hiện truy vấn và mutation từ Apollo Client
import { useLocation, useNavigate, useParams } from 'react-router-dom'; // Nhập hook để điều hướng và lấy tham số từ URL
import {
    Box,
    Typography,
    Grid,
    Avatar,
    Button,
    IconButton,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
    Divider
} from '@mui/material'; // Nhập các component từ Material-UI
import {
    Bookmark,
    BookmarkBorder,
    Close,
} from '@mui/icons-material'; // Nhập icon từ Material-UI
import { ChevronDown, ChevronUp, Heart, MessageSquareMore, Play, Send, Volume2, VolumeX, X } from 'lucide-react'; // Nhập icon từ Lucide
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries'; // Nhập truy vấn GraphQL để follow/unfollow người dùng
import moment from 'moment'; // Nhập thư viện moment để xử lý thời gian
import 'moment/locale/vi'; // Đặt ngôn ngữ moment thành tiếng Việt
import { SAVE_VIDEO, UNSAVE_VIDEO } from '../GraphQLQueries/saveQueries'; // Nhập truy vấn để lưu/hủy lưu video
import { VIEW_VIDEO } from '../GraphQLQueries/viewQueries'; // Nhập truy vấn để ghi nhận lượt xem video
import { GET_VIDEO_DETAILS } from '../GraphQLQueries/videoQueries'; // Nhập truy vấn để lấy chi tiết video
import { LIKE_VIDEO, UNLIKE_VIDEO } from '../GraphQLQueries/likeQueries'; // Nhập truy vấn để thích/bỏ thích video
import LikeAnimation from '../components/LikeAnimation'; // Nhập component animation khi thích video
import CommentList from '../components/CommentList'; // Nhập component danh sách bình luận
import LargeNumberDisplay from '../components/LargeNumberDisplay'; // Nhập component hiển thị số lớn
import { handleLinkAWS } from '../utils/commonUtils';
moment.locale('vi'); // Áp dụng ngôn ngữ tiếng Việt cho moment

const DEFAULT_ASPECT_RATIO = 9 / 16; // Tỷ lệ khung hình mặc định của video (9:16)

// Component trang chi tiết video, nhận hai hàm callback từ parent component
const VideoDetailPage = ({ handleFollowUserParent = () => { }, handleUnfollowUserParent = () => { } }) => {
    const { id, userId } = useParams(); // Lấy ID video và ID người dùng từ URL
    const theme = useTheme(); // Lấy theme từ Material-UI
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Kiểm tra xem thiết bị có phải mobile không
    const [videoSize, setVideoSize] = useState({ width: 3000, height: 3000 }); // State lưu kích thước video
    const [localLikeCount, setLocalLikeCount] = useState(0); // State lưu số lượt thích cục bộ
    const [localSavesCount, setLocalSavesCount] = useState(0); // State lưu số lượt lưu cục bộ
    const [localCommentsCount, setLocalCommentsCount] = useState(0); // State lưu số bình luận cục bộ
    const [localIsLiked, setLocalIsLiked] = useState(false); // State kiểm tra video đã được thích chưa
    const [localIsFollowed, setLocalIsFollowed] = useState(false); // State kiểm tra đã follow người dùng chưa
    const [localIsSaved, setLocalIsSaved] = useState(false); // State kiểm tra video đã được lưu chưa
    const [isMuted, setIsMuted] = useState(false); // State kiểm tra video có tắt tiếng không
    const [isVideoLoaded, setIsVideoLoaded] = useState(false); // State kiểm tra video đã tải xong chưa
    const videoRef = useRef(null); // Ref tham chiếu đến thẻ <video>
    const videoContainerRef = useRef(null); // Ref tham chiếu đến container của video
    const touchStartY = useRef(null); // Ref lưu vị trí Y khi bắt đầu chạm (dùng cho mobile)
    const lastScrollTime = useRef(0); // Ref lưu thời gian cuộn cuối cùng

    const navigate = useNavigate(); // Hook để điều hướng trang
    const location = useLocation(); // Hook để lấy thông tin vị trí URL hiện tại

    // Truy vấn chi tiết video từ server bằng GraphQL
    const { data: videoData, loading: videoLoading, error: videoError } = useQuery(GET_VIDEO_DETAILS, {
        variables: { id }, // Truyền ID video vào truy vấn
    });

    // Khai báo các mutation để thực hiện các hành động
    const [likeVideo] = useMutation(LIKE_VIDEO); // Mutation thích video
    const [unlikeVideo] = useMutation(UNLIKE_VIDEO); // Mutation bỏ thích video
    const [saveVideo] = useMutation(SAVE_VIDEO); // Mutation lưu video
    const [unsaveVideo] = useMutation(UNSAVE_VIDEO); // Mutation hủy lưu video
    const [followUser] = useMutation(FOLLOW_USER); // Mutation follow người dùng
    const [unfollowUser] = useMutation(UNFOLLOW_USER); // Mutation bỏ follow người dùng
    const [viewVideo] = useMutation(VIEW_VIDEO); // Mutation ghi nhận lượt xem video
    const [localViews, setLocalViews] = useState(0); // State lưu số lượt xem cục bộ
    const [showLikeAnimation, setShowLikeAnimation] = useState(false); // State kiểm tra hiển thị animation thích
    const [isPlaying, setIsPlaying] = useState(false); // State kiểm tra video đang phát không
    const [isVisible, setIsVisible] = useState(false); // State kiểm tra video có nằm trong tầm nhìn không
    const doubleClickTimeoutRef = useRef(null); // Ref lưu timeout để xử lý double-click
    const timeWatchedRef = useRef(0); // Ref lưu tổng thời gian đã xem video
    const lastUpdateTimeRef = useRef(0); // Ref lưu thời gian cập nhật cuối cùng
    const viewCountedRef = useRef(false); // Ref kiểm tra lượt xem đã được đếm chưa

    // Hàm thử tự động phát video
    const attemptAutoplay = () => {
        const playPromise = videoRef.current.play(); // Thử phát video
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true); // Nếu phát thành công, cập nhật trạng thái
            }).catch(error => {
                console.warn("Autoplay was prevented:", error); // Nếu thất bại, ghi log lỗi
                setIsPlaying(false); // Cập nhật trạng thái không phát
            });
        }
    };

    // Effect xử lý tự động phát hoặc tạm dừng video dựa trên trạng thái tải và tầm nhìn
    useEffect(() => {
        if (isVideoLoaded && isVisible) {
            attemptAutoplay(); // Nếu video đã tải và nằm trong tầm nhìn, thử phát
        } else if (videoRef.current) {
            videoRef.current.pause(); // Nếu không, tạm dừng video
            setIsPlaying(false); // Cập nhật trạng thái
        }
    }, [isVideoLoaded, isVisible]);

    // Hàm xử lý khi video tải xong
    const handleVideoLoaded = () => {
        setIsVideoLoaded(true); // Đánh dấu video đã tải xong
        if (isVisible) {
            attemptAutoplay(); // Nếu video trong tầm nhìn, thử phát
        }
    };

    // Effect thiết lập IntersectionObserver để kiểm tra video có trong tầm nhìn không
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting); // Cập nhật trạng thái khi video xuất hiện trong tầm nhìn
            },
            { threshold: 0.6 } // Ngưỡng 60% video phải xuất hiện để được coi là "visible"
        );

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current); // Hủy theo dõi khi component unmount
            }
        };
    }, []);

    // Hàm xử lý khi nhấp vào video (play/pause hoặc thích)
    const handleVideoClick = (e) => {
        e.preventDefault(); // Ngăn hành vi mặc định
        if (doubleClickTimeoutRef.current === null) {
            // Nếu chưa có timeout (single click), đặt timeout để kiểm tra play/pause
            doubleClickTimeoutRef.current = setTimeout(() => {
                doubleClickTimeoutRef.current = null;
                if (videoRef.current.paused) {
                    videoRef.current.play(); // Nếu đang dừng, phát video
                } else {
                    videoRef.current.pause(); // Nếu đang phát, dừng video
                }
            }, 300); // Timeout 300ms để phân biệt single/double click
        } else {
            // Nếu có timeout (double click), xử lý hành động thích video
            clearTimeout(doubleClickTimeoutRef.current); // Xóa timeout cũ
            doubleClickTimeoutRef.current = null;
            handleLikeVideo(); // Gọi hàm thích video
            setShowLikeAnimation(true); // Hiển thị animation thích
            setTimeout(() => setShowLikeAnimation(false), 1000); // Tắt animation sau 1 giây
        }
    };

    // Hàm reset trạng thái xem video
    const resetViewState = () => {
        timeWatchedRef.current = 0; // Đặt lại thời gian xem về 0
        lastUpdateTimeRef.current = 0; // Đặt lại thời gian cập nhật cuối về 0
        viewCountedRef.current = false; // Đặt lại trạng thái đếm lượt xem
    };

    const handleTimeUpdate = () => {
        // Kiểm tra xem phần tử video có tồn tại không
        if (videoRef.current) {
            // Lấy thời gian hiện tại của video (giây)
            const currentTime = videoRef.current.currentTime;
            // Lấy tổng thời lượng của video (giây)
            const duration = videoRef.current.duration;
            // Tính khoảng thời gian đã trôi qua kể từ lần cập nhật cuối
            const timeElapsed = currentTime - lastUpdateTimeRef.current;

            // Nếu thời gian trôi qua hợp lệ (lớn hơn 0 và nhỏ hơn 1 giây), cộng vào tổng thời gian xem
            if (timeElapsed > 0 && timeElapsed < 1) {
                timeWatchedRef.current += timeElapsed; // Cập nhật tổng thời gian đã xem
            }

            // Cập nhật thời điểm cuối cùng bằng thời gian hiện tại
            lastUpdateTimeRef.current = currentTime;

            // Kiểm tra nếu lượt xem chưa được đếm và đã xem đủ điều kiện (1/4 thời lượng hoặc 90 giây)
            if (!viewCountedRef.current && (timeWatchedRef.current >= duration / 4 || timeWatchedRef.current >= 90)) {
                handleVideoView(); // Gọi hàm để đánh dấu lượt xem
                viewCountedRef.current = true; // Đặt cờ để không đếm lại
            }

            // Nếu video gần kết thúc (còn dưới 1 giây), reset trạng thái
            if (currentTime >= duration - 1) {
                resetViewState(); // Gọi hàm reset trạng thái
            }
        }
    };
    const handleSeeked = () => {
        lastUpdateTimeRef.current = videoRef.current.currentTime;
    };

    const handleEnded = () => {
        resetViewState();
    };

    const handleVideoView = async () => {
        try {
            await viewVideo({ variables: { videoId: id } });
            setLocalViews(prevViews => prevViews + 1);
        } catch (error) {
            console.error("Error viewing video:", error);
        }
    };


    const updateVideoSize = () => {
        if (videoContainerRef.current) {
            const containerWidth = videoContainerRef.current.offsetWidth;
            const containerHeight = videoContainerRef.current.offsetHeight;

            let newWidth, newHeight;

            if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
                const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
                newWidth = Math.min(videoRef.current.videoWidth, containerWidth);
                newHeight = newWidth / videoAspectRatio;
            } else {
                newWidth = containerWidth;
                newHeight = containerWidth / DEFAULT_ASPECT_RATIO;
            }

            if (newHeight > containerHeight) {
                newHeight = containerHeight;
                newWidth = newHeight * (videoRef.current?.videoWidth / videoRef.current?.videoHeight || DEFAULT_ASPECT_RATIO);
            }

            setVideoSize({ width: newWidth, height: newHeight });
        }
    };

    useEffect(() => {
        updateVideoSize();
        window.addEventListener('resize', updateVideoSize);

        return () => {
            window.removeEventListener('resize', updateVideoSize);
        };
    }, []);

    let video;
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.addEventListener('loadedmetadata', updateVideoSize);

            return () => {
                if (videoRef.current) {
                    videoRef.current.removeEventListener('loadedmetadata', updateVideoSize);
                }
            };
        }
    }, [videoData, navigate]);

    useEffect(() => {
        video = videoData?.getVideo;
        if (video) {

            setLocalViews(video.views);
            setLocalIsLiked(video.isLiked);
            setLocalIsFollowed(video.user.isFollowed);
            setLocalIsSaved(video.isSaved);
            setLocalCommentsCount(video.commentsCount);
            setLocalSavesCount(video.savesCount);
            setLocalLikeCount(video.likeCount);
        }
        // if (video && localLikeCount === 0) {
        //     console.log(video)
        // }
    }, [videoData, navigate, id]);


    const toggleMute = () => {
        setIsMuted(!isMuted);
    };
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Autoplay was prevented:", error);
            });
        }
    }, [videoData]);
    const handleUpClick = () => {
        console.log(video?.prevVideo?.id)
        if (video?.prevVideo?.id)
            navigate(`/${userId}/video/${video?.prevVideo?.id}`);
    };

    const handleDownClick = () => {
        console.log(video?.nextVideo?.id)
        if (video?.nextVideo?.id)
            navigate(`/${userId}/video/${video?.nextVideo?.id}`);
    };



    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (touchStartY.current === null) return;

        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY;

        if (Math.abs(diff) > 50) { // Threshold để xác định là thao tác vuốt
            if (diff > 0) {
                handleDownClick();
            } else {
                handleUpClick();
            }
        }

        touchStartY.current = null;
    };

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleUpClick();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDownClick();
        }
    }, [videoData]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleScrollVideo = useCallback((event) => {
        event.preventDefault();
        const now = new Date().getTime();
        const timeSinceLastScroll = now - lastScrollTime.current;

        if (timeSinceLastScroll > 500) { // Prevent rapid firing
            lastScrollTime.current = now;

            if (event.deltaY < 0) {
                handleUpClick();
            } else if (event.deltaY > 0) {
                handleDownClick();
            }
        }
    }, [videoData]);

    useEffect(() => {
        const container = videoContainerRef.current;
        if (container) {
            container.addEventListener('wheel', handleScrollVideo, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleScrollVideo);
            }
        };
    }, [handleScrollVideo]);
    if (videoLoading) return <Typography>Loading...</Typography>;
    if (videoError) return <Typography>Error loading data</Typography>;

    video = videoData?.getVideo;

    const handleFollowUser = async () => {
        try {
            await followUser({
                variables: { followingId: video.user.id },
            });
            setLocalIsFollowed(true);
            handleFollowUserParent();
        } catch (error) {
            console.error("Follow error", error);
        }
    };

    const handleUnfollowUser = async () => {
        try {
            await unfollowUser({
                variables: { followingId: video.user.id },
            });
            setLocalIsFollowed(false);
            handleUnfollowUserParent();
        } catch (error) {
            console.error("Unfollow error", error);
        }
    };
    const handleLikeVideo = () => {
        if (!localIsLiked) {
            setLocalIsLiked(true);
            setLocalLikeCount(pre => pre + 1)
            likeVideo({ variables: { targetId: id } });
        }
    };

    const handleUnlikeVideo = () => {
        if (localIsLiked) {
            setLocalIsLiked(false);
            setLocalLikeCount(pre => pre - 1)
            unlikeVideo({ variables: { targetId: id } });
        }
    }


    const handleSaveVideo = () => {
        setLocalIsSaved(true);
        setLocalSavesCount(pre => pre + 1)
        saveVideo({ variables: { videoId: id } });
    };

    const handleUnsaveVideo = () => {
        setLocalIsSaved(false);
        setLocalSavesCount(pre => pre - 1)
        unsaveVideo({ variables: { videoId: id } });
    }

    const handleBackToHome = () => {
        if (location.state && location.state.prevUrl) {
            navigate(location.state.prevUrl, {
                state: location.state,
                replace: true
            });
        } else {
            navigate('/');
        }
    }

    const handleVideoDoubleClick = (event) => {
        event.preventDefault();
    };


    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={0}>
                <Grid item xs={12} md={8} sx={{
                    padding: 2
                }}>
                    <Box
                        ref={videoContainerRef}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: 9 / 16,
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            maxHeight: '90vh',
                            borderRadius: '12px',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `url(${handleLinkAWS(video.thumbnailUrl)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backdropFilter: 'blur(45px)',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        />
                        <IconButton
                            sx={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                zIndex: 10
                            }}
                            onClick={handleBackToHome}
                        >
                            <X />
                        </IconButton>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <video
                                ref={videoRef}
                                src={handleLinkAWS(video?.videoUrl)}
                                poster={handleLinkAWS(video?.thumbnailUrl)}
                                onTimeUpdate={handleTimeUpdate}
                                onSeeked={handleSeeked}
                                onEnded={handleEnded}
                                onClick={handleVideoClick}
                                onDoubleClick={handleVideoDoubleClick}
                                onLoadedData={handleVideoLoaded}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: videoSize.width,
                                    height: videoSize.height,
                                }}
                                loop
                                playsInline
                                autoPlay
                                muted={isMuted}
                            />
                            {showLikeAnimation && (
                                <LikeAnimation />
                            )}
                        </Box>
                        <Box
                            sx={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                zIndex: 10,
                            }}
                        >
                            <IconButton
                                onClick={handleUpClick}
                                disabled={!video?.prevVideo}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                                }}
                            >
                                <ChevronUp />
                            </IconButton>
                            <IconButton
                                onClick={handleDownClick}
                                disabled={!video?.nextVideo}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                                }}
                            >
                                <ChevronDown />
                            </IconButton>
                        </Box>
                        <IconButton
                            onClick={toggleMute}
                            sx={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                                zIndex: 10,
                            }}
                        >
                            {isMuted ? <VolumeX /> : <Volume2 />}
                        </IconButton>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4} sx={{
                    padding: 2,
                    display: { xs: 'none', sm: 'block' }
                }}>
                    <Card sx={{ height: '20vh', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', mb: -3, justifyContent: 'space-between' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box display="flex" alignItems="center">
                                    <Avatar src={video.user.profilePicture} sx={{ width: 40, height: 40, mr: 1 }} />
                                    <Typography variant="subtitle1">{video.user.username}</Typography>
                                </Box>
                                <Button
                                    variant={localIsFollowed ? 'outlined' : 'contained'}
                                    onClick={localIsFollowed ? handleUnfollowUser : handleFollowUser}
                                >
                                    {localIsFollowed ? 'Hủy theo dõi' : 'Theo dõi'}
                                </Button>
                            </Box>
                            <Box sx={{
                                maxHeight: '3em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mt: 0.5
                            }}>
                                <Typography variant="body1">{video.title}</Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box>
                                    <IconButton onClick={localIsLiked ? handleUnlikeVideo : handleLikeVideo}>
                                        <Heart fill={localIsLiked ? 'red' : 'none'} color={localIsLiked ? 'red' : 'currentColor'} />
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>
                                        <LargeNumberDisplay number={localLikeCount} />
                                    </Typography>
                                    <IconButton sx={{ ml: 1 }}>
                                        <Play />
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>
                                        <LargeNumberDisplay number={localViews} />
                                    </Typography>
                                    <IconButton sx={{ ml: 1 }}>
                                        <MessageSquareMore />
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>
                                        <LargeNumberDisplay number={localCommentsCount} />
                                    </Typography>
                                    <IconButton onClick={localIsSaved ? handleUnsaveVideo : handleSaveVideo} sx={{ ml: 1 }}>
                                        {localIsSaved ? <Bookmark /> : <BookmarkBorder />}
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>
                                        <LargeNumberDisplay number={localSavesCount} />
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle2">Đăng {moment(video.createdAt).fromNow()}</Typography>
                            </Box>
                        </CardContent>
                        {/* <CommentInp */}
                    </Card>
                    <CommentList videoId={id} isDetails={true} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default VideoDetailPage;
