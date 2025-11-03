# Testing the Backend Microservice

## Architecture Overview

The backend runs as a **hybrid application**:
- **HTTP/GraphQL Server**: Port 3000
- **TCP Microservice**: Port 4001

Both run in the same process - no Docker Compose needed!

## How to Start

### Option 1: Development Mode (with hot reload)
```bash
npx nx serve backend
```

### Option 2: Production Build and Run
```bash
# Build
npx nx build backend

# Run
node apps/backend/dist/main.js
```

## How to Test

### Option 1: GraphQL Playground
1. Start the server: `npx nx serve backend`
2. Open browser: http://localhost:3000/graphql
3. Run queries/mutations in the playground

### Option 2: Using the test script
```bash
./test-graphql.sh
```

### Option 3: Manual curl commands

**Test Hello Query:**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { hello }"}'
```

**Test Login Mutation (with microservice call):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(email: \"test@example.com\") }"}'
```

## How It Works

### Login Flow:
1. GraphQL mutation `login(email: "test@example.com")` hits UserResolver
2. UserResolver calls UsersService.login(email)
3. UsersService sends TCP message `'generateToken'` to microservice on port 4001
4. AuthController receives the message pattern
5. AuthController calls AuthService.generateToken(email)
6. AuthService generates mock token: `mock_token_<base64_payload>`
7. Token returns through the microservice back to client

### Example Response:
```json
{
  "data": {
    "login": "mock_token_eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VySWQiOjEyMzQsImlhdCI6MTY5ODc4OTEyMzQ1Nn0="
  }
}
```

## Microservice Communication

The microservice communication uses **TCP transport** via `@nestjs/microservices`:

- **Client**: UsersService (sends messages)
- **Server**: AuthController (receives messages via @MessagePattern)
- **Transport**: TCP on localhost:4001
- **Pattern**: `'generateToken'`

No separate microservice process needed - everything runs in one NestJS application!

