import React from 'react';
import { useMutation } from '@apollo/client';
import { Button, Divider, Typography, useTheme } from '@mui/material';
import StyledForm from "../styledComponents/StyledForm.js";
import StyledTextField from "../styledComponents/StyledTextField.js";
import OAuth2 from '../OAuth2.js';
import { LOGIN_USER } from '../../GraphQLQueries/userQueries.js';

const LoginForm = ({ onSuccess }) => {
  const theme = useTheme();
  const [loginUser, { loading, error }] = useMutation(LOGIN_USER);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const { data } = await loginUser({
        variables: {
          email: formData.get('email'),
          password: formData.get('password'),
        },
      });
      onSuccess(data.loginUser);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <Typography variant="h4" align="center" gutterBottom>
        Đăng nhập
      </Typography>
      <StyledTextField
        required
        fullWidth
        id="email"
        label="Tên đăng nhập hoặc địa chỉ email"
        name="email"
        autoComplete="email"
        autoFocus
      />
      <StyledTextField
        required
        fullWidth
        name="password"
        label="Mật khẩu"
        type="password"
        id="password"
        autoComplete="current-password"
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 1, mb: 1 }}
        disabled={loading}
      >
        Đăng Nhập
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

export default LoginForm;
