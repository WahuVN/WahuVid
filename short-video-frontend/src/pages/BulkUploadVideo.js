import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
    Button,
    Box,
    Typography,
    CircularProgress,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { UPLOAD_VIDEO } from '../GraphQLQueries/videoQueries';
import { GET_CATEGORIES } from '../GraphQLQueries/categoryQueries';

const BulkUploadVideo = () => {
    const [videoFiles, setVideoFiles] = useState([]);
    const [thumbnails, setThumbnails] = useState({});
    const [category, setCategory] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadVideo] = useMutation(UPLOAD_VIDEO);
    const { loading: loadingCate, error: cateError, data: cateData } = useQuery(GET_CATEGORIES);

    const fileInputRef = useRef();
    const canvasRef = useRef(document.createElement('canvas'));

    const handleFileChange = useCallback((event) => {
        const files = Array.from(event.target.files);
        setVideoFiles(files);
        files.forEach(generateThumbnail);
    }, []);

    const generateThumbnail = useCallback((file) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.addEventListener('loadeddata', () => {
            video.currentTime = 1; // Seek to 1 second
        });
        video.addEventListener('seeked', () => {
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                setThumbnails(prev => ({
                    ...prev,
                    [file.name]: blob
                }));
            }, 'image/jpeg', 0.7);
        });
    }, []);

    const parseFileName = (fileName) => {
        const parts = fileName.split('_');
        const lastPart = parts[parts.length - 1];
        const [titlePart, ...hashtagsPart] = lastPart.split('#');
        const title = titlePart.replace('.mp4', '').trim();
        const hashtags = hashtagsPart.join('#').split('#').filter(tag => tag.trim() !== '');
        return {
            title: title || null, // Return null if title is empty
            tags: hashtags.map(tag => tag.trim())
        };
    };

    const handleUpload = async () => {
        setUploading(true);
        const selectedCategory = categories.find(c => c.id === category);
        for (let i = 0; i < videoFiles.length; i++) {
            const file = videoFiles[i];
            const { title: parsedTitle, tags } = parseFileName(file.name);
            const title = parsedTitle || (selectedCategory ? selectedCategory.name : 'Untitled');
            const thumbnailFile = new File([thumbnails[file.name]], `${title}_thumbnail.jpg`, { type: 'image/jpeg' });
            try {
                await uploadVideo({
                    variables: {
                        title,
                        videoFile: file,
                        thumbnailFile,
                        category,
                        tags
                    }
                });
                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                setUploadProgress(prev => ({ ...prev, [file.name]: 'Error' }));
            }
        }
        setUploading(false);
    };

    const categories = useMemo(() => {
        return cateData ? cateData.getCategories : [];
    }, [cateData]);

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', padding: 3 }}>
            <Typography variant="h4" gutterBottom>
                Bulk Upload Videos
            </Typography>
            <Box sx={{ my: 2 }}>
                <input
                    accept="video/*"
                    style={{ display: 'none' }}
                    id="video-files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />
                <label htmlFor="video-files">
                    <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                    >
                        Chọn Videos
                    </Button>
                </label>
                {videoFiles.length > 0 && (
                    <Typography sx={{ mt: 1 }}>
                        {videoFiles.length} video(s) selected
                    </Typography>
                )}
            </Box>
            <Select
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
            <Button
                onClick={handleUpload}
                variant="contained"
                color="primary"
                disabled={uploading || videoFiles.length === 0 || !category}
                sx={{ mt: 2 }}
            >
                {uploading ? <CircularProgress size={24} /> : 'Upload All'}
            </Button>
            {videoFiles.length > 0 && (
                <List>
                    {videoFiles.map((file, index) => (
                        <ListItem key={index}>
                            <ListItemText
                                primary={file.name}
                                secondary={
                                    uploadProgress[file.name]
                                        ? `Progress: ${uploadProgress[file.name]}%`
                                        : 'Pending'
                                }
                            />
                            {thumbnails[file.name] && (
                                <img
                                    src={URL.createObjectURL(thumbnails[file.name])}
                                    alt={`Thumbnail for ${file.name}`}
                                    style={{ width: 50, height: 50, objectFit: 'cover' }}
                                />
                            )}
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default BulkUploadVideo;
