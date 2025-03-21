import { useMutation } from "@apollo/client";
import { Avatar, Box, Button, Divider, Typography, useTheme } from "@mui/material";
import StyledForm from "../styledComponents/StyledForm";
import StyledTextField from "../styledComponents/StyledTextField";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import OAuth2 from "../OAuth2";
import { REGISTER_USER } from "../../GraphQLQueries/userQueries";



const RegisterForm = ({ onSuccess }) => {
    const theme = useTheme();
    const [registerUser, { loading, error }] = useMutation(REGISTER_USER);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            const { data } = await registerUser({
                variables: {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    avatarFile: avatarFile,
                },
            });
            onSuccess(data.registerUser);
        } catch (err) {
            console.error('Registration error:', err);
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: 'video/*',
        multiple: false
    });

    return (
        <StyledForm onSubmit={handleSubmit}>
            <Typography variant="h4" align="center" gutterBottom>
                Đăng Ký
            </Typography>
            <Box display="flex" justifyContent="center" mb={2}>
                <Avatar
                    src={avatarPreview}
                    sx={{ width: 100, height: 100 }}
                />
            </Box>
            <StyledTextField
                required
                fullWidth
                id="username"
                label="Tên đăng nhập"
                name="username"
                autoComplete="username"
                autoFocus
            />
            <StyledTextField
                required
                fullWidth
                id="email"
                label="Địa chỉ email"
                name="email"
                autoComplete="email"
            />
            <StyledTextField
                required
                fullWidth
                name="password"
                label="Mật khẩu"
                type="password"
                id="password"
                autoComplete="new-password"
            />
            <StyledTextField
                fullWidth
                required
                label="Nhập lại mật khẩu"
                type="password"
                autoComplete="new-password"
            />
            <Box
                {...getRootProps()}
                sx={{
                    border: '1px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    p: 2,
                    mt: 2,
                    mb: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                }}
            >
                <input {...getInputProps()} name="avatarFile" />
                {isDragActive ? (
                    <Typography>Thả ảnh đại diện ở đây...</Typography>
                ) : (
                    <Typography>
                        Kéo và thả ảnh đại diện vào đây, hoặc click để chọn ảnh
                    </Typography>
                )}
            </Box>
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 1, mb: 1 }}
                disabled={loading}
            >
                Đăng Ký
            </Button>
            {error && (
                <Typography color="error" align="center">
                    {error.message}
                </Typography>
            )}

            <Divider sx={{ my: 1 }}>Hoặc</Divider>

            <OAuth2 handleLoginWithOAuth2Succes={onSuccess}/>
        </StyledForm>
    );
};

export default RegisterForm;
