import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Box, Typography, IconButton, useMediaQuery, Avatar, Grid, Card, CardContent } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Volume2, VolumeX, Play, Pause, Heart, MessageSquareMore, Bookmark, Send, EllipsisVertical, Ellipsis } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { LIKE_VIDEO, UNLIKE_VIDEO } from '../GraphQLQueries/likeQueries';
import { SAVE_VIDEO, UNSAVE_VIDEO } from '../GraphQLQueries/saveQueries';
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries';
import { VIEW_VIDEO } from '../GraphQLQueries/viewQueries';
import LikeAnimation from './LikeAnimation';
import { BookmarkBorder } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CommentList from './CommentList';
import CommentContext from '../contexts/commentContext';
import HoverProfileCard from './ProfileCard';
import LargeNumberDisplay from './LargeNumberDisplay';

const StyledVideo = styled('video')({
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: 'black',
});

const ControlsOverlay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
    color: 'white',
    padding: theme.spacing(2),
    transition: 'bottom 0.3s ease-in-out',
}));

const VideoPlayer = ({ video, onClick, videoStates }) => {
    const videoRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(videoStates?.currentVolume || 0.5);
    const [currentTime, setCurrentTime] = useState(videoStates?.currentTime || 0);
    const [duration, setDuration] = useState(0);
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(16 / 9);
    const [videoHeight, setVideoHeight] = useState();
    const [localLikeCount, setLocalLikeCount] = useState(video.likeCount || 0);
    const [localSavesCount, setLocalSavesCount] = useState(video.savesCount || 0);
    const [localCommentsCount, setLocalCommentsCount] = useState(video.commentsCount || 0);
    const [localIsLiked, setLocalIsLiked] = useState(video.isLiked || false);
    const [localIsFollowed, setLocalIsFollowed] = useState(video.user.isFollowed || false);
    const [localIsSaved, setLocalIsSaved] = useState(video.isSaved || false);
    const [localViews, setLocalViews] = useState(video.views || 0);
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);

    const doubleClickTimeoutRef = useRef(null);
    const timeWatchedRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const viewCountedRef = useRef(false);

    const navigate = useNavigate();

    const [likeVideo] = useMutation(LIKE_VIDEO);
    const [unlikeVideo] = useMutation(UNLIKE_VIDEO);
    const [saveVideo] = useMutation(SAVE_VIDEO);
    const [unsaveVideo] = useMutation(UNSAVE_VIDEO);
    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);
    const [viewVideo] = useMutation(VIEW_VIDEO);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { showCommentVideoId, setShowComments } = useContext(CommentContext);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);

            },
            { threshold: 0.6 }
        );

        if (videoRef.current) {
            videoRef.current.currentTime = videoStates?.currentTime || 0;
            videoRef.current.volume = videoStates?.volume || 0.5;
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isVisible && !isVideoLoaded) {
            videoRef.current.load();
        }
    }, [isVisible, isVideoLoaded]);

    const handleVideoLoaded = () => {
        setIsVideoLoaded(true);
        setDuration(videoRef.current.duration);
        if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
            setAspectRatio(videoRef.current.videoWidth / videoRef.current.videoHeight);
            setVideoHeight(videoRef.current.videoHeight);
        }
        if (isVisible) {
            attemptAutoplay();
        }
    };


    const handleDetails = () => {
        navigate(`${video.user.username}/video/${video.id}`, {
            state: {
                prevUrl: "/"
            }
        });
    };

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
        if (isVisible && isVideoLoaded) {
            attemptAutoplay();
        } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isVisible, isVideoLoaded]);

    const togglePlay = (e) => {
        e.stopPropagation();
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChange = (e) => {
        e.stopPropagation();
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
    };

    const handleVideoDoubleClick = (event) => {
        event.preventDefault();
    };

    const handleSeek = useCallback((e) => {
        e.preventDefault();
        const seekTime = parseFloat(e.target.value);

        if (!isNaN(seekTime) && isFinite(seekTime)) {
            console.log(e.target.value)
            setCurrentTime(seekTime);
            // seekRef.current = seekTime;

            if (videoRef.current) {
                videoRef.current.currentTime = seekTime;
            }
        } else {
            console.warn('Invalid seek time:', seekTime);
        }
    }, []);

    const handleControlClick = (e) => {
        e.stopPropagation();
    };

    const toggleVolume = (e) => {
        e.stopPropagation();
        const newVolume = volume === 0 ? 1 : 0;
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
    };


    const handleUpClick = () => {
        // console.log(video?.prevVideo?.id)
        // if (video?.prevVideo?.id)
        //   navigate(`/${userId}/video/${video?.prevVideo?.id}`);
    };

    const handleDownClick = () => {
        // console.log(video?.nextVideo?.id)
        // if (video?.nextVideo?.id)
        //   navigate(`/${userId}/video/${video?.nextVideo?.id}`);
    };

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleUpClick();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDownClick();
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleFollowUser = async () => {
        try {
            await followUser({
                variables: { followingId: video.user.id },
            });
            setLocalIsFollowed(true);
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
        } catch (error) {
            console.error("Unfollow error", error);
        }
    };


    const handleLikeVideo = () => {
        if (!localIsLiked) {
            setLocalIsLiked(true);
            setLocalLikeCount(pre => pre + 1)
            likeVideo({ variables: { targetId: video.id } });
        }
    };

    const handleUnlikeVideo = () => {
        if (localIsLiked) {
            setLocalIsLiked(false);
            setLocalLikeCount(pre => pre - 1)
            unlikeVideo({ variables: { targetId: video.id } });
        }
    }

    const handleVideoClick = (e) => {
        e.preventDefault();
        if (doubleClickTimeoutRef.current === null) {
            doubleClickTimeoutRef.current = setTimeout(() => {
                doubleClickTimeoutRef.current = null;
                if (videoRef.current.paused) {
                    videoRef.current.play();
                    setIsPlaying(true);
                } else {
                    setIsPlaying(false);
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
            setCurrentTime(videoRef.current.currentTime);
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            const timeElapsed = currentTime - lastUpdateTimeRef.current;
            if (timeElapsed > 0 && timeElapsed < 1) {
                timeWatchedRef.current += timeElapsed;
            }
            lastUpdateTimeRef.current = currentTime;

            if (!viewCountedRef.current && (timeWatchedRef.current >= duration / 4 || timeWatchedRef.current >= 90)) {
                handleVideoView();
                viewCountedRef.current = true;
            }

            if (currentTime >= duration - 1) {
                resetViewState();
            }
        }
    };

    useEffect(() => {
        const viewFirstTime = async () => {
            try {
                console.log('handleVideoView 1 time called');
                await viewVideo({ variables: { videoId: video.id, viewCount: 0 } });
            } catch (error) {
                console.error("Error viewing video:", error);
            }
        };
        viewFirstTime();
    }, []);

    const handleEnded = () => {
        resetViewState();
    };

    const handleVideoView = async () => {
        try {
            console.log('handleVideoView called');
            await viewVideo({ variables: { videoId: video.id, viewCount: 1 } });
            setLocalViews(prevViews => prevViews + 1);
        } catch (error) {
            console.error("Error viewing video:", error);
        }
    };

    const handleSaveVideo = () => {
        setLocalIsSaved(true);
        setLocalSavesCount(pre => pre + 1)
        saveVideo({ variables: { videoId: video.id } });
    };

    const handleUnsaveVideo = () => {
        setLocalIsSaved(false);
        setLocalSavesCount(pre => pre - 1)
        unsaveVideo({ variables: { videoId: video.id } });
    }

    return (

        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                scrollSnapAlign: 'start',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    width: isMobile ? '100%' : 'auto',
                    height: isMobile ? 'auto' : videoHeight,
                    maxHeight: '90vh',
                    position: 'relative',
                    borderRadius: isMobile ? 0 : '12px',
                    overflow: 'hidden',
                    aspectRatio: aspectRatio,
                }}
                // onClick={handleVideoClick}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >

                {showLikeAnimation && (
                    <LikeAnimation />
                )}
                {!isVideoLoaded && (
                    <Box
                        component="img"
                        src={video.thumbnail}
                        alt={video.title}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                )}
                <StyledVideo
                    ref={videoRef}
                    src={video.videoUrl}
                    poster={video.thumbnailUrl}
                    loop
                    playsInline
                    onLoadedData={handleVideoLoaded}
                    onClick={handleVideoClick}
                    onDoubleClick={handleVideoDoubleClick}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    sx={{ display: isVideoLoaded ? 'block' : 'none' }}
                />
                <ControlsOverlay
                    sx={{ bottom: showControls ? '0' : '-100%' }}
                    onClick={handleControlClick}
                >
                    <Typography variant="body1">{video.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <IconButton onClick={togglePlay} sx={{ color: 'white', p: 0 }}>
                            {isPlaying ? (
                                <Pause fill={theme.palette.custom.playButton} color={theme.palette.custom.playButton} size={24} />
                            ) : (
                                <Play fill={theme.palette.custom.playButton} color={theme.palette.custom.playButton} size={24} />
                            )}
                        </IconButton>
                        <input
                            type="range"
                            min={0}
                            max={isFinite(duration) ? duration : 100}
                            value={isFinite(currentTime) ? currentTime : 0}
                            step={0.001}
                            onChange={handleSeek}
                            className="video-progress"
                            style={{
                                flex: 1,
                                margin: '0 10px',
                                WebkitAppearance: 'none',
                                background: `linear-gradient(90deg, rgba(255,0,0,1) ${((isFinite(currentTime) ? currentTime : 0) / (isFinite(duration) ? duration : 100)) * 100}%, rgba(255,255,255,0.3) ${((isFinite(currentTime) ? currentTime : 0) / (isFinite(duration) ? duration : 100)) * 100}%)`
                            }}
                        />
                        <Box
                            sx={{ position: 'relative' }}
                            onMouseEnter={() => setShowVolumeControl(true)}
                            onMouseLeave={() => setShowVolumeControl(false)}
                        >
                            <IconButton onClick={toggleVolume} sx={{ color: 'white', p: 0 }}>
                                {volume === 0 ? (
                                    <VolumeX fill={theme.palette.custom.playButton} color={theme.palette.custom.playButton} size={24} />
                                ) : (
                                    <Volume2 fill={theme.palette.custom.playButton} color={theme.palette.custom.playButton} size={24} />
                                )}
                            </IconButton>
                            {showVolumeControl && (
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '30px',
                                    height: '100px',
                                    background: 'rgba(0,0,0,0.5)',
                                    borderRadius: '15px',
                                    padding: '10px 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="video-progress"
                                        style={{
                                            WebkitAppearance: 'none',
                                            width: '80px',
                                            height: '3px',
                                            background: '#fff',
                                            outline: 'none',
                                            transform: 'rotate(-90deg)',
                                            transformOrigin: 'center',
                                            background: `linear-gradient(90deg, rgba(255,0,0,1) ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </ControlsOverlay>
            </Box>
            <Box
                sx={{
                    ml: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box>
                    <HoverProfileCard user={video.user} />
                </Box>
                <IconButton
                    sx={{
                        mt: 1
                    }}
                    onClick={localIsLiked ? handleUnlikeVideo : handleLikeVideo}
                >
                    <Heart size={28} style={{
                        color: theme.palette.text.secondary,
                    }} fill={localIsLiked ? 'red' : 'none'} color={localIsLiked ? 'red' : 'currentColor'} />
                </IconButton>
                <Typography variant="body2" component="strong" sx={{
                    mt: -1,
                    color: theme.palette.text.secondary,
                    fontWeight: 'bold'
                }}>
                    <LargeNumberDisplay number={localLikeCount} />
                </Typography>
                <IconButton
                    sx={{
                        mt: 1
                    }}
                >
                    <Play size={28} style={{
                        color: theme.palette.text.secondary,
                    }} />
                </IconButton>
                <Typography variant="body2" component="strong" sx={{
                    mt: -1,
                    color: theme.palette.text.secondary,
                    fontWeight: 'bold'
                }}>
                    <LargeNumberDisplay number={localViews} />
                </Typography>
                <IconButton
                    sx={{
                        mt: 1
                    }}
                    onClick={() => { showCommentVideoId(video.id); setShowComments(true); }}
                >
                    <MessageSquareMore size={28} style={{
                        color: theme.palette.text.secondary,
                    }} />
                </IconButton>
                <Typography variant="body2" component="strong" sx={{
                    mt: -1,
                    color: theme.palette.text.secondary,
                    fontWeight: 'bold'
                }}>
                    <LargeNumberDisplay number={localCommentsCount} />
                </Typography>
                <IconButton
                    sx={{
                        mt: 1
                    }}
                    onClick={localIsSaved ? handleUnsaveVideo : handleSaveVideo}
                >
                    <Bookmark size={28} fill={localIsSaved ? theme.palette.text.secondary : 'none'} style={{
                        color: theme.palette.text.secondary,
                    }} />
                </IconButton>
                <Typography variant="body2" component="strong" sx={{
                    mt: -1,
                    color: theme.palette.text.secondary,
                    fontWeight: 'bold'
                }}>
                    <LargeNumberDisplay number={localSavesCount} />
                </Typography>
                <IconButton
                    sx={{
                        mt: 1
                    }}
                >
                    <Send size={28} style={{
                        color: theme.palette.text.secondary,
                    }} />
                </IconButton>
                <Typography variant="body2" component="strong" sx={{
                    mt: -1,
                    color: theme.palette.text.secondary,
                    fontWeight: 'bold'
                }}>
                    <LargeNumberDisplay number={localSavesCount} />
                </Typography>
                <IconButton
                    sx={{
                        mt: 1
                    }}
                    onClick={handleDetails}
                >
                    <Ellipsis size={24} style={{
                        color: theme.palette.text.secondary,
                    }} />
                </IconButton>
            </Box>
            <style>
                {`
  .video-progress {
    -webkit-appearance: none;
    margin: 10px 0;
    width: 100%;
    background: transparent;
  }
  .video-progress:focus {
    outline: none;
  }
  .video-progress::-webkit-slider-runnable-track {
    width: 100%;
    height: 3px;
    cursor: pointer;
    animate: 0.1s;
    border-radius: 1.5px;
  }
  .video-progress::-webkit-slider-thumb {
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -4.5px;
    box-shadow: 0 0 3px rgba(0,0,0,0.4);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .video-progress:hover::-webkit-slider-thumb {
    opacity: 1;
  }
  .video-progress::-moz-range-track {
    width: 100%;
    height: 3px;
    cursor: pointer;
    animate: 0.1s;
    border-radius: 1.5px;
  }
  .video-progress::-moz-range-thumb {
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 3px rgba(0,0,0,0.4);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .video-progress:hover::-moz-range-thumb {
    opacity: 1;
  }
  `}
            </style>
        </Box>
    );
};

export default React.memo(VideoPlayer);
