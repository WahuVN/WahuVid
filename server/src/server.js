import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import typeDefs from './schema/index.js';
import resolvers from './resolvers/index.js';
import morgan from 'morgan';
import cors from 'cors';
import http from 'http';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { verifyToken } from './utils/jwtTokenUtils.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import models from './models/index.js';

dotenv.config();

// Danh sách domain được phép
const allowedOrigins = [
    'http://localhost:3000',
    'https://wahu-vid-j6u4-git-main-wahuvns-projects.vercel.app',
    'https://wahu-vid.vercel.app',
    'https://studio.apollographql.com' // Nếu dùng Apollo Studio
];

async function startServer() {
    const app = express();
    const httpServer = http.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // Cấu hình WebSocket Server với CORS
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
        verifyClient: (info, done) => {
            const origin = info.origin || '';
            const isAllowed = allowedOrigins.some(allowedOrigin =>
                origin.toLowerCase().includes(allowedOrigin.toLowerCase())
            );

            if (isAllowed) {
                console.log(`Allowed WebSocket connection from: ${origin}`);
                return done(true);
            }

            console.warn(`Blocked WebSocket connection from: ${origin}`);
            return done(false, 403, 'Forbidden');
        }
    });

    const serverCleanup = useServer({
        schema,
        context: async (ctx) => {
            const token = ctx.connectionParams?.authorization || '';
            let user = null;
            let tokenError = null;

            if (token) {
                const { valid, error, decoded } = verifyToken(token);
                if (valid) {
                    user = { id: decoded.userId };
                } else {
                    tokenError = error;
                }
            }

            return { user, tokenError };
        },
    }, wsServer);

    // Middleware configuration
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(morgan('dev'));
    app.use(graphqlUploadExpress());

    // Cấu hình CORS chi tiết
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true); // Cho phép requests không có origin
            if (allowedOrigins.some(allowedOrigin =>
                origin.toLowerCase().includes(allowedOrigin.toLowerCase())
            )) {
                return callback(null, true);
            }
            console.warn(`Blocked request from origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Apollo-Require-Preflight'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        exposedHeaders: ['Content-Length', 'X-Request-ID']
    }));

    // Thêm security headers
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        next();
    });

    // Xử lý lỗi
    app.use((err, req, res, next) => {
        console.error('Express error:', err);
        if (err.name === 'CorsError') {
            return res.status(403).json({
                error: 'CORS Policy Violation',
                message: err.message
            });
        }
        res.status(500).send('Internal Server Error');
    });

    // Apollo Server configuration
    const server = new ApolloServer({
        schema,
        context: ({ req, connection }) => {
            if (connection) {
                return connection.context;
            }

            const token = req.headers.authorization || '';
            let user = null;
            let tokenError = null;

            if (token) {
                const { valid, error, decoded } = verifyToken(token);
                if (valid) {
                    user = { id: decoded.userId };
                } else {
                    tokenError = error;
                }
            }

            return {
                user,
                tokenError,
                models
            };
        },
        csrfPrevention: true,
        cache: 'bounded',
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
        introspection: process.env.NODE_ENV !== 'production',
    });

    await server.start();

    // Áp dụng middleware Apollo với CORS
    server.applyMiddleware({
        app,
        cors: {
            origin: allowedOrigins,
            credentials: true,
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With'
            ]
        },
        bodyParserConfig: {
            limit: '50mb'
        }
    });

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
    });

    console.log('Connected to MongoDB');

    // Khởi động server
    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer().catch(error => {
    console.error('Server startup error:', error);
    process.exit(1);
});