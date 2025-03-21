import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
} from '@mui/material';
import {
    Bookmark,
    BookmarkBorder,
    Close,
} from '@mui/icons-material';
import { ChevronDown, ChevronUp, Heart, MessageSquareMore, Play, Send, Volume2, VolumeX, X } from 'lucide-react';
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries';
import moment from 'moment';
import 'moment/locale/vi';
import { SAVE_VIDEO, UNSAVE_VIDEO } from '../GraphQLQueries/saveQueries';
import { VIEW_VIDEO } from '../GraphQLQueries/viewQueries';
import { GET_VIDEO_DETAILS } from '../GraphQLQueries/videoQueries';
import { LIKE_VIDEO, UNLIKE_VIDEO } from '../GraphQLQueries/likeQueries';
import LikeAnimation from '../components/LikeAnimation';
import CommentList from '../components/CommentList';
import LargeNumberDisplay from '../components/LargeNumberDisplay';
moment.locale('vi');

const DEFAULT_ASPECT_RATIO = 9 / 16;

const VideoDetailPage = ({ handleFollowUserParent = () => { }, handleUnfollowUserParent = () => { } }) => {
    const { id, userId } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [videoSize, setVideoSize] = useState({ width: 3000, height: 3000 });
    const [localLikeCount, setLocalLikeCount] = useState(0);
    const [localSavesCount, setLocalSavesCount] = useState(0);
    const [localCommentsCount, setLocalCommentsCount] = useState(0);
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const [localIsFollowed, setLocalIsFollowed] = useState(false);
    const [localIsSaved, setLocalIsSaved] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);
    const touchStartY = useRef(null);
    const lastScrollTime = useRef(0);

    const navigate = useNavigate();
    const location = useLocation();

    const { data: videoData, loading: videoLoading, error: videoError } = useQuery(GET_VIDEO_DETAILS, {
        variables: { id },
    });

    const [likeVideo] = useMutation(LIKE_VIDEO);
    const [unlikeVideo] = useMutation(UNLIKE_VIDEO);
    const [saveVideo] = useMutation(SAVE_VIDEO);
    const [unsaveVideo] = useMutation(UNSAVE_VIDEO);
    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);
    const [viewVideo] = useMutation(VIEW_VIDEO);
    const [localViews, setLocalViews] = useState(0);
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const doubleClickTimeoutRef = useRef(null);
    const timeWatchedRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const viewCountedRef = useRef(false);

    const attemptAutoplay = () => {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.warn("Autoplay was prevented:", error);
                setIsPlaying(false);
            });
        }
    };

    useEffect(() => {
        if (isVideoLoaded && isVisible) {
            attemptAutoplay();
        } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isVideoLoaded, isVisible]);

    const handleVideoLoaded = () => {
        setIsVideoLoaded(true);
        if (isVisible) {
            attemptAutoplay();
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.6 }
        );

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    const handleVideoClick = (e) => {
        e.preventDefault();
        if (doubleClickTimeoutRef.current === null) {
            doubleClickTimeoutRef.current = setTimeout(() => {
                doubleClickTimeoutRef.current = null;
                if (videoRef.current.paused) {
                    videoRef.current.play();
                } else {
                    videoRef.current.pause();
                }
            }, 300);
        } else {
            clearTimeout(doubleClickTimeoutRef.current);
            doubleClickTimeoutRef.current = null;
            handleLikeVideo();
            setShowLikeAnimation(true);
            setTimeout(() => setShowLikeAnimation(false), 1000);
        }
    };


    const resetViewState = () => {
        timeWatchedRef.current = 0;
        lastUpdateTimeRef.current = 0;
        viewCountedRef.current = false;
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            const timeElapsed = currentTime - lastUpdateTimeRef.current;
            if (timeElapsed > 0 && timeElapsed < 1) {
                timeWatchedRef.current += timeElapsed;
            }
            lastUpdateTimeRef.current = currentTime;

            if (!viewCountedRef.current && (timeWatchedRef.current >= duration / 2 || timeWatchedRef.current >= 90)) {
                handleVideoView();
                viewCountedRef.current = true;
            }

            if (currentTime >= duration - 1) {
                resetViewState();
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
                                backgroundImage: `url(${video.thumbnailUrl})`,
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
                                src={video?.videoUrl}
                                poster={video?.thumbnailUrl}
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
