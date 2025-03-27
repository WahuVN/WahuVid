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
import CreatorStats from './pages/CreatorStats';

function useAuth() {
    const [searchParams] = useSearchParams();
    const [user, userDispatcher] = useReducer(UserReducer, JSON.parse(localStorage.getItem("user")) || null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const handleLoginSuccess = (data) => {
        saveToken(data.token);
        userDispatcher({
            type: "login",
            payload: data.user
        });
        navigate('/');
    };

    const { loading, error, data } = useQuery(VERIFY_TOKEN, {
        onError: (error) => {
            console.error('Token verification error:', error);
            // Xử lý lỗi và chuyển hướng đến trang đăng nhập
            logout();
        },
        fetchPolicy: 'network-only',
        // Thêm errorPolicy để không throw lỗi
        errorPolicy: 'all'
    });

    const [loginUser] = useMutation(LOGIN_USER, {
        onError: (error) => {
            console.error('Login error:', error);
            logout();
        }
    });

    const logout = () => {
        localStorage.clear();
        userDispatcher({
            type: "logout"
        });
        navigate('/login', { replace: true });
    }

    const login = async () => {
        //implement login with google logic bịp
        const { data } = await loginUser({
            variables: {
                email: "Wahu",
                password: "123456", 
            },
        });
        handleLoginSuccess(data.loginUser);
    }
    useEffect(() => {
        if (!loading) {
            try {
                if (error) {
                    console.log("Error in token verification:", error.message);
                    if (searchParams.get('code')) {
                        login();
                    } else {
                        logout();
                    }
                } else if (data?.verifyToken) {
                    userDispatcher({
                        type: "login",
                        payload: data.verifyToken
                    });
                } else {
                    // Nếu không có lỗi nhưng cũng không có data, logout
                    logout();
                }
            } catch (e) {
                console.error("Error in auth effect:", e);
                logout();
            } finally {
                setIsLoading(false);
            }
        }
    }, [data, error, loading]);

    return { user, userDispatcher, logout, isLoading };
}

// Thêm component ProtectedRoute để bảo vệ các route cần xác thực
function ProtectedRoute({ children }) {
    const { user } = React.useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    return user ? children : null;
}

function AuthenticatedApp() {
    const { user, userDispatcher, logout, isLoading } = useAuth();

    if (isLoading) return <CircularProgress />;

    return (
        <UserContext.Provider value={{ user, userDispatcher, logout }}>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<HomeLayout />}>
                        <Route index element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        } />
                        <Route path="following" element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        } />
                        <Route path="friends" element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        } />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                        <Route path="upload" element={
                            <ProtectedRoute>
                                <VideoUpload />
                            </ProtectedRoute>
                        } />
                        <Route path="messages/:username" element={
                            <ProtectedRoute>
                                <Messenger />
                            </ProtectedRoute>
                        } />
                        <Route path="messages" element={
                            <ProtectedRoute>
                                <Messenger />
                            </ProtectedRoute>
                        } />
                        <Route path="search" element={<SearchPage />} />
                        <Route path="explore" element={
                            <ProtectedRoute>
                                <ExplorePage />
                            </ProtectedRoute>
                        } />
                        <Route path="/:userId" element={
                            <ProtectedRoute>
                                <UserProfile />
                            </ProtectedRoute>
                        } />
                        <Route path="/bulk" element={
                            <ProtectedRoute>
                                <BulkUploadVideo />
                            </ProtectedRoute>
                        } />
                        <Route path="creator-tools" element={
                            <ProtectedRoute>
                                <CreatorStats />
                            </ProtectedRoute>
                        } />
                    </Route>
                    <Route path="/:userId/video/:id" element={
                        <ProtectedRoute>
                            <VideoDetailPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </MainLayout>
        </UserContext.Provider>
    );
}

// Cải thiện ErrorBoundary để xử lý lỗi Apollo tốt hơn
function ErrorBoundary({ children }) {
    const navigate = useNavigate();

    useEffect(() => {
        // Xử lý lỗi không bắt được
        const handleError = (error) => {
            console.error('Lỗi không xử lý được:', error);

            // Kiểm tra nếu là lỗi Apollo
            const errorMessage = error?.message || error?.reason?.message || '';
            if (errorMessage.includes('User not found') ||
                errorMessage.includes('Token expired') ||
                errorMessage.includes('Invalid token')) {
                // Xóa dữ liệu đăng nhập
                localStorage.clear();
                // Chuyển hướng đến trang đăng nhập
                navigate('/login', { replace: true });
            } else {
                // Các lỗi khác cũng chuyển hướng đến trang đăng nhập
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', (event) => handleError(event));

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', (event) => handleError(event));
        };
    }, [navigate]);

    return <>{children}</>;
}

function App() {
    return (
        <ApolloProvider client={client}>
            <ToggleColorMode>
                <Router>
                    <ErrorBoundary>
                        <AuthenticatedApp />
                    </ErrorBoundary>
                </Router>
            </ToggleColorMode>
        </ApolloProvider>
    )
}

export default App;
