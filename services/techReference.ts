/**
 * Tech Stack Reference Data
 * Auto-generated from Context7 official documentation.
 * Used to enrich AI-generated development documents with current, verified patterns.
 */

export interface TechDoc {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'orm' | 'infra' | 'auth' | 'cache';
  latestVersion: string;
  setupPattern: string;
  codeExamples: string;
  bestPractices: string;
}

export const techDocs: Record<string, TechDoc> = {
  'next.js': {
    name: 'Next.js',
    category: 'frontend',
    latestVersion: '15.x',
    setupPattern: `npx create-next-app@latest --typescript --api
# Creates App Router project with API route example
# File structure: app/ directory with layout.tsx, page.tsx, route.ts`,
    codeExamples: `// App Router API Route (app/api/route.ts)
export async function GET(request: Request) {
  return Response.json({ data: 'hello' });
}

// Server Component with data fetching (app/page.tsx)
async function getData() {
  const res = await fetch('https://api.example.com/data');
  return res.json();
}
export default async function Page() {
  const data = await getData();
  return <main>{data.title}</main>;
}

// Client Component
'use client';
import { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// Middleware (middleware.ts)
import { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}
export const config = { matcher: '/dashboard/:path*' };`,
    bestPractices: `- Use App Router (not Pages Router) for new projects
- Server Components by default; add 'use client' only when needed
- Use Route Handlers (route.ts) for API endpoints
- Leverage async Server Components for data fetching
- Use Suspense boundaries for streaming and loading states
- Middleware for auth checks, redirects, and request modification`,
  },

  'react': {
    name: 'React',
    category: 'frontend',
    latestVersion: '19.x',
    setupPattern: `# Typically used via Next.js or Vite
npm create vite@latest my-app -- --template react-ts
# Or as part of Next.js: npx create-next-app@latest`,
    codeExamples: `// Server Component with Suspense (React 19)
import { Suspense } from 'react';
async function DataPage({ id }) {
  const data = await db.items.get(id);
  const commentsPromise = db.comments.get(id);
  return (
    <div>
      <h1>{data.title}</h1>
      <Suspense fallback={<p>Loading comments...</p>}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </div>
  );
}

// use() API for reading Promises
import { use } from 'react';
function Message({ messagePromise }) {
  const content = use(messagePromise);
  return <p>{content}</p>;
}

// Custom Hook pattern
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount(c => c + 1), []);
  return { count, increment };
}`,
    bestPractices: `- Use Server Components for data fetching, Client Components for interactivity
- Leverage Suspense for loading states and streaming
- use() API to unwrap Promises in components
- Custom hooks for reusable stateful logic
- Prefer composition over inheritance
- Keep components small and focused`,
  },

  'express': {
    name: 'Express.js',
    category: 'backend',
    latestVersion: '5.x',
    setupPattern: `npm init -y
npm install express
npm install -D typescript @types/express @types/node ts-node
npx tsc --init
# Entry: src/app.ts`,
    codeExamples: `// Basic Express setup with TypeScript
import express, { Request, Response, NextFunction } from 'express';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Router-level middleware
const router = express.Router();
router.use((req, res, next) => {
  console.log('Time:', Date.now());
  next();
});

// CRUD routes
router.route('/users/:id')
  .get((req: Request, res: Response) => {
    res.json({ id: req.params.id });
  })
  .put((req: Request, res: Response) => {
    res.json({ ...req.body, id: req.params.id });
  })
  .delete((req: Request, res: Response) => {
    res.status(204).send();
  });

app.use('/api', router);

// Error handling middleware (must have 4 params)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000);`,
    bestPractices: `- Use Router for modular route organization
- Always include error-handling middleware (4 params: err, req, res, next)
- Validate req.body as it originates from user input
- Use express.json() and express.urlencoded() for body parsing
- Separate routes, controllers, and services into distinct files
- Use helmet and cors middleware for security`,
  },

  'nestjs': {
    name: 'NestJS',
    category: 'backend',
    latestVersion: '11.x',
    setupPattern: `npm i -g @nestjs/cli
nest new my-project
# Generates: src/app.module.ts, app.controller.ts, app.service.ts, main.ts
# Uses TypeScript by default with decorators`,
    codeExamples: `// Module registration
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

// CRUD Controller with dependency injection
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

// Service with Injectable decorator
@Injectable()
export class UsersService {
  private users: User[] = [];
  create(dto: CreateUserDto) { /* ... */ }
  findAll() { return this.users; }
  findOne(id: number) { return this.users.find(u => u.id === id); }
  update(id: number, dto: UpdateUserDto) { /* ... */ }
  remove(id: number) { /* ... */ }
}`,
    bestPractices: `- Use constructor-based dependency injection (mark fields as private readonly)
- Organize code into feature modules (UsersModule, AuthModule, etc.)
- Use DTOs for request validation with class-validator
- Use Guards for authentication, Interceptors for response transformation
- Use Pipes for input validation and transformation
- Generate resources with CLI: nest g resource users`,
  },

  'prisma': {
    name: 'Prisma',
    category: 'orm',
    latestVersion: '6.x',
    setupPattern: `npm install prisma --save-dev
npm install @prisma/client
npx prisma init
# Creates: prisma/schema.prisma and .env with DATABASE_URL
# After schema changes: npx prisma migrate dev --name init
# Generate client: npx prisma generate`,
    codeExamples: `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client"
  output   = "./generated"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
}

model Post {
  id        Int        @id @default(autoincrement())
  title     String
  published Boolean    @default(false)
  author    User       @relation(fields: [authorId], references: [id])
  authorId  Int
  categories Category[]
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
}

// CRUD with Prisma Client
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create with relation
await prisma.user.create({
  data: {
    email: 'alice@example.com',
    name: 'Alice',
    posts: {
      create: [
        { title: 'First Post', published: true },
        { title: 'Draft Post' },
      ],
    },
  },
});

// Query with relations
const users = await prisma.user.findMany({
  include: { posts: true, profile: true },
});`,
    bestPractices: `- Use declarative schema with relations (@relation) and enums
- Run migrations with prisma migrate dev for development
- Use prisma migrate deploy for production
- Leverage implicit many-to-many relations for cleaner schemas
- Use @unique and @@index for query optimization
- Instantiate PrismaClient once (singleton pattern in production)`,
  },

  'postgresql': {
    name: 'PostgreSQL',
    category: 'database',
    latestVersion: '17.x',
    setupPattern: `# Docker setup (recommended for development)
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:17-alpine

# Connection string format
postgresql://user:password@localhost:5432/dbname

# Common with ORMs: Prisma, TypeORM, Sequelize handle schema via migrations`,
    codeExamples: `-- Table with constraints and indexes
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(20) DEFAULT 'user'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at);

-- One-to-many relationship
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many with junction table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE post_categories (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);`,
    bestPractices: `- Use SERIAL/BIGSERIAL or UUID for primary keys
- Add indexes on frequently queried columns (WHERE, JOIN, ORDER BY)
- Use foreign key constraints with ON DELETE CASCADE/SET NULL
- Use TIMESTAMP WITH TIME ZONE for date/time columns
- Leverage JSONB for semi-structured data
- Use connection pooling (PgBouncer) in production`,
  },

  'docker': {
    name: 'Docker',
    category: 'infra',
    latestVersion: '27.x',
    setupPattern: `# Project files needed:
# - Dockerfile (build instructions)
# - docker-compose.yml (multi-service orchestration)
# - .dockerignore (exclude node_modules, .git, etc.)`,
    codeExamples: `# Multi-stage Dockerfile for Node.js TypeScript
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

# Docker Compose for full-stack app
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:`,
    bestPractices: `- Use multi-stage builds to minimize image size
- Use Alpine-based images for smaller footprint
- Copy package*.json first to leverage Docker layer caching
- Run as non-root user (USER node) for security
- Use .dockerignore to exclude unnecessary files
- Use docker-compose for local development with multiple services
- Use named volumes for persistent data (databases)`,
  },

  'typeorm': {
    name: 'TypeORM',
    category: 'orm',
    latestVersion: '0.3.x',
    setupPattern: `npm install typeorm reflect-metadata
npm install pg  # for PostgreSQL
npm install -D typescript @types/node
# tsconfig.json needs: "emitDecoratorMetadata": true, "experimentalDecorators": true
# Import "reflect-metadata" at application entry point`,
    codeExamples: `// Entity definition with decorators
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Post, (post) => post.author, { cascade: true })
  posts: Post[];
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: "CASCADE" })
  author: User;
}

// Repository CRUD operations
const userRepo = dataSource.getRepository(User);

// Create
const user = userRepo.create({ firstName: "John", email: "john@example.com" });
await userRepo.save(user);

// Read with relations
const userWithPosts = await userRepo.findOne({
  where: { id: 1 },
  relations: { posts: true },
});

// Update
user.firstName = "Jane";
await userRepo.save(user);

// Delete / Soft delete
await userRepo.remove(user);
await userRepo.softDelete({ id: 1 });`,
    bestPractices: `- Use Data Mapper pattern (repositories) for better separation of concerns
- Enable cascade on relations for automatic saves
- Use findOne with relations option instead of separate queries
- Set onDelete: "CASCADE" for proper cleanup
- Use QueryBuilder for complex queries
- Always import "reflect-metadata" at the entry point`,
  },

  'redis': {
    name: 'Redis',
    category: 'cache',
    latestVersion: '7.x',
    setupPattern: `# Server
docker run --name redis -p 6379:6379 -d redis:7-alpine

# Node.js client
npm install redis
# Connection: redis://localhost:6379`,
    codeExamples: `// Node.js Redis client setup and basic operations
import { createClient } from 'redis';

const client = await createClient({ url: 'redis://localhost:6379' })
  .on('error', err => console.log('Redis Error', err))
  .connect();

// Basic key-value
await client.set('key', 'value');
await client.set('session:user123', JSON.stringify({ name: 'Alice' }), { EX: 3600 });
const value = await client.get('key');

// Pub/Sub pattern
const subscriber = client.duplicate();
await subscriber.connect();

await subscriber.subscribe('notifications', (message, channel) => {
  console.log(\`Received on \${channel}: \${message}\`);
});

await client.publish('notifications', 'Hello subscribers!');

// Caching pattern (RESP3 with client-side caching)
const cachedClient = createClient({
  RESP: 3,
  clientSideCache: {
    ttl: 0,
    maxEntries: 0,
    evictPolicy: "LRU"
  }
});`,
    bestPractices: `- Use as cache layer with TTL (EX option) for session/API response caching
- Use Pub/Sub for real-time messaging between services
- Use separate connections for subscriber and publisher
- Enable client-side caching (RESP3) for frequently accessed data
- Set appropriate maxmemory and eviction policies in production
- Use Redis Sentinel or Cluster for high availability`,
  },

  'fastapi': {
    name: 'FastAPI',
    category: 'backend',
    latestVersion: '0.115.x',
    setupPattern: `pip install fastapi uvicorn[standard]
# Project structure:
# app/
#   __init__.py
#   main.py
#   models.py
#   routers/
#   dependencies.py
# Run: uvicorn app.main:app --reload`,
    codeExamples: `# main.py - FastAPI application
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel

app = FastAPI()

# Pydantic models for validation
class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str | None = None

class User(UserCreate):
    id: int
    disabled: bool = False

# Dependency injection
class CommonQueryParams:
    def __init__(self, q: str | None = None, skip: int = 0, limit: int = 100):
        self.q = q
        self.skip = skip
        self.limit = limit

# CRUD endpoints
@app.get("/users/", response_model=list[User])
async def list_users(commons: CommonQueryParams = Depends()):
    return fake_db[commons.skip : commons.skip + commons.limit]

@app.post("/users/", response_model=User, status_code=201)
async def create_user(user: UserCreate):
    return {**user.dict(), "id": len(fake_db) + 1}

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    if user_id not in fake_db:
        raise HTTPException(status_code=404, detail="User not found")
    return fake_db[user_id]

# OAuth2 authentication
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user`,
    bestPractices: `- Use Pydantic models for request/response validation
- Leverage dependency injection with Depends() for shared logic
- Use async def for I/O-bound endpoints
- Automatic OpenAPI docs at /docs (Swagger) and /redoc
- Use APIRouter for route organization across files
- Use HTTPException for error responses with proper status codes
- Type hints drive automatic validation and documentation`,
  },

  'spring-boot': {
    name: 'Spring Boot',
    category: 'backend',
    latestVersion: '3.5.x',
    setupPattern: `# Use Spring Initializr: https://start.spring.io
# Dependencies: Spring Web, Spring Data JPA, PostgreSQL Driver
# Build: Gradle (Kotlin DSL) or Maven
# Java 17+ required for Spring Boot 3.x

plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.0'
}
apply plugin: 'io.spring.dependency-management'`,
    codeExamples: `// REST Controller
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // Constructor injection (recommended)
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
}

// JPA Entity
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Order> orders;
}

// Spring Data JPA Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByNameContainingIgnoreCase(String name);

    @Query("SELECT u FROM User u WHERE u.email LIKE %:domain")
    List<User> findByEmailDomain(@Param("domain") String domain);
}

// application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: user
    password: pass
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true`,
    bestPractices: `- Use constructor injection (mark dependencies as final)
- Use Spring Data JPA derived query methods for simple queries
- Use @Query for complex JPQL or native SQL
- Keep controllers thin, business logic in services
- Use application.yml for configuration
- Use profiles (dev, staging, prod) for environment-specific config
- Java 17+ required for Spring Boot 3.x`,
  },

  'vue.js': {
    name: 'Vue.js',
    category: 'frontend',
    latestVersion: '3.5.x',
    setupPattern: `npm create vue@latest
# Selects: TypeScript, Vue Router, Pinia, ESLint, Prettier
# Or with Vite: npm create vite@latest my-app -- --template vue-ts
# Uses <script setup> syntax by default`,
    codeExamples: `<!-- Composition API with <script setup> -->
<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'

// Reactive state
const count = ref(0)
const author = reactive({
  name: 'John Doe',
  books: ['Vue 3 Guide', 'Vue 4 - The Mystery']
})

// Computed property
const publishedBooks = computed(() =>
  author.books.filter(b => b.includes('Guide'))
)

// Writable computed
const firstName = ref('John')
const lastName = ref('Doe')
const fullName = computed({
  get() { return firstName.value + ' ' + lastName.value },
  set(val) { [firstName.value, lastName.value] = val.split(' ') }
})

// Methods
function increment() {
  count.value++
}

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted, count:', count.value)
})
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
  <p>{{ fullName }}</p>
  <ul>
    <li v-for="book in publishedBooks" :key="book">{{ book }}</li>
  </ul>
</template>`,
    bestPractices: `- Use Composition API with <script setup> for new projects
- ref() for primitives, reactive() for objects
- Use computed() for derived state (auto-cached)
- Prefer provide/inject for deep component communication
- Use Pinia for global state management
- Keep components small, use composables for reusable logic`,
  },

  'nextauth': {
    name: 'Auth.js (NextAuth)',
    category: 'auth',
    latestVersion: '5.x',
    setupPattern: `npm install next-auth@beta
# Create: auth.ts, app/api/auth/[...nextauth]/route.ts, middleware.ts
# Set AUTH_SECRET env var (generate with: npx auth secret)`,
    codeExamples: `// auth.ts - Main configuration
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await validateUser(credentials);
        return user ?? null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) return { ...token, ...account };
      return token;
    },
  },
})

// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers

// middleware.ts - Protect routes
export { auth as middleware } from "@/auth"
export const config = { matcher: ["/dashboard/:path*"] }

// Usage in Server Component
import { auth } from "@/auth"
export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");
  return <p>Hello {session.user?.name}</p>;
}`,
    bestPractices: `- Use JWT session strategy for serverless deployments
- Configure middleware.ts for route protection
- Use multiple providers (OAuth + Credentials) for flexibility
- HttpOnly cookies prevent client-side JS access to tokens
- JWTs are encrypted with AUTH_SECRET
- Use callbacks to customize token/session data
- Database adapter optional (for persisting accounts/sessions)`,
  },
};

const techAliases: Record<string, string> = {
  'nextjs': 'next.js',
  'next': 'next.js',
  'reactjs': 'react',
  'react.js': 'react',
  'node': 'express',
  'nodejs': 'express',
  'node.js': 'express',
  'expressjs': 'express',
  'express.js': 'express',
  'postgres': 'postgresql',
  'pg': 'postgresql',
  'nest': 'nestjs',
  'nest.js': 'nestjs',
  'spring': 'spring-boot',
  'springboot': 'spring-boot',
  'vue': 'vue.js',
  'vuejs': 'vue.js',
  'vue3': 'vue.js',
  'auth.js': 'nextauth',
  'authjs': 'nextauth',
  'next-auth': 'nextauth',
  'prismaorm': 'prisma',
  'prisma-orm': 'prisma',
  'typeorm': 'typeorm',
  'type-orm': 'typeorm',
  'dockerfile': 'docker',
  'docker-compose': 'docker',
  'compose': 'docker',
  'container': 'docker',
  'redis-cache': 'redis',
  'fastapi': 'fastapi',
  'fast-api': 'fastapi',
  // Korean aliases
  '\ub3c4\ucee4': 'docker',
  '\ub9ac\ub515\uc2a4': 'redis',
  '\ub9ac\uc561\ud2b8': 'react',
  '\ub118\uc2a4\ud2b8': 'nestjs',
  '\ud504\ub9ac\uc988\ub9c8': 'prisma',
  '\uc2a4\ud504\ub9c1': 'spring-boot',
  '\uc2a4\ud504\ub9c1\ubd80\ud2b8': 'spring-boot',
  '\ud0c0\uc785\uc624\uc54c\uc5e0': 'typeorm',
  '\ubdf0': 'vue.js',
};

/**
 * Extract relevant tech documentation from user's technology input.
 * Matches technology names mentioned in the user's text against our reference database.
 */
export function findRelevantDocs(userTechInput: string): TechDoc[] {
  const input = userTechInput.toLowerCase();
  const matched = new Set<string>();

  // Check all tech doc keys and names
  for (const [key, doc] of Object.entries(techDocs)) {
    if (input.includes(key) || input.includes(doc.name.toLowerCase())) {
      matched.add(key);
    }
  }

  // Check aliases
  for (const [alias, key] of Object.entries(techAliases)) {
    if (input.includes(alias)) {
      matched.add(key);
    }
  }

  return Array.from(matched).map(key => techDocs[key]).filter(Boolean);
}

/**
 * Format matched tech docs as prompt context for AI model injection.
 */
export function formatDocsForPrompt(docs: TechDoc[]): string {
  if (docs.length === 0) return '';

  return docs.map(doc =>
    `### ${doc.name} (v${doc.latestVersion}) — ${doc.category}
**Setup:**
${doc.setupPattern}

**Core Patterns:**
${doc.codeExamples}

**Best Practices:**
${doc.bestPractices}`
  ).join('\n\n---\n\n');
}
