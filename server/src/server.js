import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import typeDefs from './schema/index.js';
import resolvers from './resolvers/index.js';
import morgan from 'morgan';
import cors from 'cors'
import http from 'http';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import { verifyToken } from './utils/jwtTokenUtils.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import models from './models/index.js';

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({
    schema,
    context: async (ctx, msg, args) => {
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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(morgan('combined'));
  app.use(graphqlUploadExpress());
  app.use(cors({
    origin: '*',
    credentials: true
  }));

  app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).send('Something went wrong');
  });

  const server = new ApolloServer({
    schema,
    context: ({ req, connection }) => {
      if (connection) {
        return connection.context;
      } else {
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
        return { user, tokenError };
      }
    },
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }),
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
  });

  await server.start();

  server.applyMiddleware({
    app,
    cors: false,
  });

  await mongoose.connect(process.env.MONGODB_URI);

//   const categories = [
//     { name: "All", description: "All categories" },
//     { name: "Singing & Dancing", description: "Content related to singing and dancing" },
//     { name: "Comedy", description: "Humorous and comedic content" },
//     { name: "Relationship", description: "Content about relationships" },
//     { name: "Sports", description: "Sports-related content" },
//     { name: "Technology", description: "Technology-related content" },
//     { name: "Anime & Comics", description: "Content related to anime and comics" },
//     { name: "Daily Life", description: "Content about everyday life" },
//     { name: "Games", description: "Gaming-related content" },
//     { name: "Beauty Care", description: "Content about beauty and personal care" },
//     { name: "Shows", description: "Various shows and performances" },
//     { name: "Lipsync", description: "Lip-syncing content" },
//     { name: "Outfit", description: "Fashion and outfit-related content" },
//     { name: "Society", description: "Content related to social issues" },
//     { name: "Fitness & Health", description: "Content about fitness and health" },
//     { name: "Cars", description: "Automotive-related content" },
//     { name: "Food", description: "Food-related content" },
//     { name: "Education", description: "Educational content" },
//     { name: "Drama", description: "Dramatic content and performances" },
//     { name: "Animals", description: "Content featuring animals" },
//     { name: "Family", description: "Family-related content" }
// ];

// // Hàm để thêm các danh mục vào cơ sở dữ liệu
// async function insertCategories() {
//     try {
//         for (const category of categories) {
//             const newCategory = new models.Category(category);
//             await newCategory.save();
//             console.log(`Added category: ${category.name}`);
//         }
//         console.log('All categories have been added successfully');
//     } catch (error) {
//         console.error('Error inserting categories:', error);
//     } finally {
//         mongoose.disconnect();
//     }
// }

// // Chạy hàm để thêm danh mục
// insertCategories();

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();


