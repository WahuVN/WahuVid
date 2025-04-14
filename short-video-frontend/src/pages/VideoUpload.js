import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    TextField,
    Box,
    Typography,
    CircularProgress,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import VideoPreview from '../components/VideoPreview';
import { UPLOAD_VIDEO } from '../GraphQLQueries/videoQueries';
import { GET_CATEGORIES } from '../GraphQLQueries/categoryQueries';

const TagInput = React.memo(({ initialTags, onTagsChange }) => {
    const [localTags, setLocalTags] = useState(initialTags);
    const [currentTag, setCurrentTag] = useState('');

    const handleAddTag = useCallback((event) => {
        if (event.key === 'Enter' && currentTag.trim() !== '') {
            const newTags = [...localTags, currentTag.trim()];
            setLocalTags(newTags);
            onTagsChange(newTags);
            setCurrentTag('');
            event.preventDefault();
        }
    }, [currentTag, localTags, onTagsChange]);

    const handleRemoveTag = useCallback((tagToRemove) => {
        const newTags = localTags.filter(tag => tag !== tagToRemove);
        setLocalTags(newTags);
        onTagsChange(newTags);
    }, [localTags, onTagsChange]);

    return (
        <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                Tags:
            </Typography>
            <TextField
                fullWidth
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Nhập tag và nhấn Enter"
                margin="normal"
            />
            <Box sx={{ mt: 1 }}>
                {localTags.map((tag, index) => (
                    <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        sx={{ mr: 0.5, mb: 0.5 }}
                    />
                ))}
            </Box>
        </Box>
    );
});
const TitleInput = React.memo(({ initialTitle, onTitleChange }) => {
    const [localTitle, setLocalTitle] = useState(initialTitle);

    const handleChange = useCallback((e) => {
        setLocalTitle(e.target.value);
    }, []);

    const handleBlur = useCallback(() => {
        onTitleChange(localTitle);
    }, [localTitle, onTitleChange]);

    return (
        <TextField
            fullWidth
            label="Tiêu đề Video"
            value={localTitle}
            onChange={handleChange}
            onBlur={handleBlur}
            margin="normal"
            required
        />
    );
});

const FileInput = React.memo(({ id, label, onChange, fileName }) => (
    <Box sx={{ my: 2 }}>
        <input
            accept={id === "video-file" ? "video/*" : "image/*"}
            style={{ display: 'none' }}
            id={id}
            type="file"
            onChange={onChange}
        />
        <label htmlFor={id}>
            <Button
                variant={id === "video-file" ? "contained" : "outlined"}
                component="span"
                startIcon={<CloudUploadIcon />}
            >
                {label}
            </Button>
        </label>
        {fileName && <Typography sx={{ mt: 1 }}>{fileName}</Typography>}
    </Box>
));
const CategorySelect = React.memo(({ category, onChange, categories }) => (
    <Select
        fullWidth
        value={category}
        onChange={onChange}
        displayEmpty
        margin="normal"
    >
        <MenuItem value="" disabled>
            Chọn danh mục
        </MenuItem>
        {categories.map((c) => (
            <MenuItem value={c.id} key={c.id}>
                {c.name}
            </MenuItem>
        ))}
    </Select>
));

const UploadVideo = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState([]);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
    const [uploadVideo, { loading, error }] = useMutation(UPLOAD_VIDEO);
    const { data: cateData } = useQuery(GET_CATEGORIES);

    const handleTitleChange = useCallback((newTitle) => {
        setTitle(newTitle);
    }, []);

    const handleCategoryChange = useCallback((e) => setCategory(e.target.value), []);
    const handleAddTag = useCallback((newTag) => setTags(prev => [...prev, newTag]), []);
    const handleRemoveTag = useCallback((tagToRemove) => setTags(prev => prev.filter(tag => tag !== tagToRemove)), []);

    // Hàm xử lý khi người dùng chọn file video
    const handleVideoChange = useCallback((event) => {
        const file = event.target.files[0]; // Lấy file video đầu tiên từ sự kiện
        setVideoFile(file); // Cập nhật state để lưu file video
        setVideoPreviewUrl(URL.createObjectURL(file)); // Tạo URL tạm thời để xem trước video
    }, []); // Mảng rỗng để đảm bảo hàm chỉ được tạo một lần, không thay đổi

    // Hàm xử lý khi người dùng chọn file ảnh thumbnail
    const handleThumbnailChange = useCallback((event) => {
        setThumbnailFile(event.target.files[0]); // Cập nhật state để lưu file ảnh thumbnail
    }, []); // Mảng rỗng để đảm bảo hàm chỉ được tạo một lần, không thay đổi

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        try {
            const result = await uploadVideo({
                variables: { title, videoFile, thumbnailFile, category, tags }
            });
            const uploadedVideoId = result.data.uploadVideo.id;
            const uname = result.data.uploadVideo.user.username;
            navigate(`/${uname}/video/${uploadedVideoId}`);
        } catch (err) {
            console.error('Error uploading video:', err);
        }
    }, [title, videoFile, thumbnailFile, category, tags, uploadVideo, navigate]);

    const categories = useMemo(() => cateData ? cateData.getCategories : [], [cateData]);

    const handleTagsChange = useCallback((newTags) => {
        setTags(newTags);
    }, []);

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', padding: 3 }}>
            <Typography variant="h4" gutterBottom>
                Tải lên Video
            </Typography>
            <form onSubmit={handleSubmit}>
                <TitleInput initialTitle={title} onTitleChange={handleTitleChange} />
                <FileInput
                    id="video-file"
                    label="Chọn Video"
                    onChange={handleVideoChange}
                    fileName={videoFile?.name}
                />
                {videoFile && (
                    <Box sx={{ my: 2, width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                        <VideoPreview
                            videoUrl={videoPreviewUrl}
                            thumbnailUrl={thumbnailFile ? URL.createObjectURL(thumbnailFile) : ''}
                            onThumbnailGenerated={setThumbnailFile}
                            isMuted={false}
                        />
                    </Box>
                )}
                <FileInput
                    id="thumbnail-file"
                    label="Chọn Ảnh thumbnail"
                    onChange={handleThumbnailChange}
                    fileName={thumbnailFile?.name}
                />
                <CategorySelect
                    category={category}
                    onChange={handleCategoryChange}
                    categories={categories}
                />
                <TagInput
                    initialTags={tags}
                    onTagsChange={handleTagsChange}
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !videoFile}
                    sx={{ mt: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Tải lên'}
                </Button>
            </form>
            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    Lỗi: {error.message}
                </Typography>
            )}
        </Box>
    );
};

export default UploadVideo;
