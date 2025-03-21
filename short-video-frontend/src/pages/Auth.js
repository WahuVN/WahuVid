import React, { useContext, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Link, useTheme } from '@mui/material';
import LoginForm from '../components/forms/LoginForm';
import RegisterForm from '../components/forms/RegisterForm';
import { saveToken } from '../utils/tokenUtils';
import UserContext from '../contexts/userContext';

export const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userDispatcher: dispatchUser, user } = useContext(UserContext);

  const handleLoginSuccess = (data) => {
    saveToken(data.token);
    console.log('Login successful:', data.user);
    dispatchUser({
      type: "login",
      payload: data.user
    });
    navigate('/');
  };

  useEffect(() => {
    if(user){
      navigate('/');
    }
  }, [user, navigate])

  if(user) {
    return null;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <LoginForm onSuccess={handleLoginSuccess} />
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Chưa có tài khoản?{' '}
          <Link component={RouterLink} to="/register" color="primary">
            Đăng Ký
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleRegisterSuccess = (data) => {
    // Handle registration success (e.g., save token to localStorage, update global state)
    console.log('Registration successful:', data);
    navigate('/'); // Redirect to home page
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <RegisterForm onSuccess={handleRegisterSuccess} />
        <Typography variant="body2" align="center" sx={{ mt: 2, mb: 3 }}>
          Đã có tài khoản?{' '}
          <Link component={RouterLink} to="/login" color="primary">
            Đăng Nhập
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};
