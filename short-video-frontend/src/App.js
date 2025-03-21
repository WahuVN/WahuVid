import React, { useEffect, useReducer, useState } from 'react';
import { ApolloProvider, useMutation, useQuery } from '@apollo/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import client from './configs/apolloClient';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import VideoUpload from './pages/VideoUpload';
import VideoPlayer from './components/VideoDetails';
import { LoginPage, RegisterPage } from './pages/Auth';
import { ToggleColorMode } from './contexts/themeProvider';
import UserProfile from './components/UserProfile';
import UserContext from './contexts/userContext';
import UserReducer from './reducers/UserReducer';
import VideoDetailPage from './pages/VideoDetail';
import HomeLayout from './layouts/HomeLayout';
import { LOGIN_USER, VERIFY_TOKEN } from './GraphQLQueries/userQueries'
import { CircularProgress } from '@mui/material';
import Messenger from './pages/Messenger';
import SearchPage from './pages/SearchPage';
import ExplorePage from './pages/ExplorePage';
import BulkUploadVideo from './pages/BulkUploadVideo';
import { saveToken } from './utils/tokenUtils';

function useAuth() {
  const a = useSearchParams();
  const [user, userDispatcher] = useReducer(UserReducer, JSON.parse(localStorage.getItem("user")) || null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const handleLoginSuccess = (data) => {
    saveToken(data.token);
    console.log('Login successful:', data.user);
    userDispatcher({
      type: "login",
      payload: data.user
    });
    navigate('/');
  };

  const { loading, error, data } = useQuery(VERIFY_TOKEN);
  const [loginUser] = useMutation(LOGIN_USER);

  const logout = () => {
    navigate('/login');
    userDispatcher({
      type: "logout"
    });
  }

  const login = async () => {
    //implement login with google logic
    const { data } = await loginUser({
      variables: {
        email: "locne",
        password: "123456",
      },
    });
    handleLoginSuccess(data.loginUser);
  }
  useEffect(() => {
    if (!loading) {
      if (error) {
        if (a) {
          login();
        } else {
          logout();
        }
      } else if (data?.verifyToken) {
        userDispatcher({
          type: "login",
          payload: data.verifyToken
        });
      }
      setIsLoading(false);
    }
  }, [data, error, loading]);

  return { user, userDispatcher, logout, isLoading };
}

function AuthenticatedApp() {
  const { user, userDispatcher, logout, isLoading } = useAuth();

  if (isLoading) return <CircularProgress />;

  return (
    <UserContext.Provider value={{ user, userDispatcher, logout }}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomeLayout />}>
            <Route index element={<HomePage />} />
            <Route path="following" element={<HomePage />} />
            <Route path="friends" element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="upload" element={<VideoUpload />} />
            <Route path="messages/:username" element={<Messenger />} />
            <Route path="messages" element={<Messenger />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="/:userId" element={<UserProfile />} />
            <Route path="/bulk" element={<BulkUploadVideo />} />
          </Route>
          <Route path="/:userId/video/:id" element={<VideoDetailPage />} />
        </Routes>
      </MainLayout>
    </UserContext.Provider>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <ToggleColorMode>
        <Router>
          <AuthenticatedApp />
        </Router>
      </ToggleColorMode>
    </ApolloProvider>
  )
}

export default App;
