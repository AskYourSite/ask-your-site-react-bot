# 🔗 Backend Integration Guide# 🔗 Backend Integration Guide



Complete guide for implementing the AskMySite React Widget backend API with session-based architecture.Complete guide for backend developers to implement the API endpoints required by the AskMySite React Widget.



------



## 📋 System Overview## 📋 Table of Contents



**Ultra-simple chat system with only 2 endpoints:**1. [API Endpoints Overview](#api-endpoints-overview)

1. **GET /api/chatbot/config** - Get chatbot configuration (cache 24h)2. [Authentication](#authentication)

2. **POST /api/chatbot/chat** - Send messages (auto-creates session)3. [Endpoint 1: Get Chatbot Config](#endpoint-1-get-chatbot-config)

4. [Endpoint 2: Send Chat Message](#endpoint-2-send-chat-message)

**Key Design Principles:**5. [Error Handling](#error-handling)

- ✅ Config is static → Fetch once, cache 24h in localStorage6. [Security Implementation](#security-implementation)

- ✅ Sessions auto-created → No separate init call needed7. [Testing](#testing)

- ✅ Messages in localStorage → Instant display on page load

- ✅ Zero unnecessary API calls → Fast, efficient widget---



---## 🎯 API Endpoints Overview



## 🎯 API EndpointsThe widget requires **2 endpoints** to function:



### 1. Get Configuration (Cached 24h)| Endpoint | Method | Purpose | Auth |

|----------|--------|---------|------|

**GET `/api/chatbot/config`**| `/api/chatbot/config` | GET | Fetch chatbot configuration | API Key |

| `/api/chatbot/chat` | POST | Send/receive messages | API Key |

Fetches chatbot configuration. **Widget caches this for 24 hours in localStorage.**

**Base URL**: `https://api.askmysite.com` (configurable)

#### Request

```http---

GET /api/chatbot/config

Authorization: Bearer cb_your_api_key## 🔑 Authentication

```

### API Key Format

#### Response (200 OK)```

```jsonsk_live_1234567890abcdef  (production)

{sk_test_1234567890abcdef  (testing)

  "success": true,```

  "config": {

    "chatbotName": "Support Assistant",### Request Headers

    "welcomeMessage": "Hello! How can I help you today?",```http

    "businessProfile": "ecommerce",Authorization: Bearer sk_live_1234567890abcdef

    "assistantProfile": "friendly and helpful",Content-Type: application/json

    "primaryColor": "#4F46E5",```

    "position": "bottom-right",

    "siteName": "My Store",### Validation Steps

    "siteUrl": "https://example.com",1. Extract API key from `Authorization` header

    "avatarUrl": "https://cdn.example.com/avatar.png"2. Verify key exists in database

  }3. Check key is active (not revoked)

}4. Validate domain origin (from request headers)

```5. Check rate limits

6. Return 401 if validation fails

#### Config Fields

---

| Field | Type | Required | Description |

|-------|------|----------|-------------|## 📡 Endpoint 1: Get Chatbot Config

| `chatbotName` | string | ✅ | Display name (e.g., "Support Bot") |

| `welcomeMessage` | string | ✅ | Initial greeting message |### Request

| `businessProfile` | string | ✅ | Business type (e.g., "ecommerce", "saas") |

| `assistantProfile` | string | ❌ | Personality description (optional) |```http

| `primaryColor` | string | ✅ | Hex color code (e.g., "#4F46E5") |GET /api/chatbot/config

| `position` | string | ✅ | "bottom-right", "bottom-left", "top-right", "top-left" |Host: api.askmysite.com

| `siteName` | string | ✅ | Website name |Authorization: Bearer sk_live_1234567890abcdef

| `siteUrl` | string | ✅ | Website URL |Origin: https://example.com

| `avatarUrl` | string | ❌ | Avatar image URL (optional) |```



#### Widget Caching Strategy### Response (Success - 200 OK)

```typescript

// Widget automatically caches config for 24h```json

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours{

  "success": true,

// First visit: Fetches from API  "data": {

// Return visits within 24h: Loads from localStorage    "chatbotName": "Support Assistant",

// After 24h: Re-fetches from API    "welcomeMessage": "Hi! I'm here to help you with any questions about our products and services. How can I assist you today?",

```    "businessProfile": "ecommerce",

    "primaryLanguage": "en",

---    "primaryColor": "#007bff",

    "avatarUrl": "https://cdn.askmysite.com/avatars/bot-123.png",

### 2. Send Message (Auto-Session Creation)    "position": "bottom-right"

  }

**POST `/api/chatbot/chat`**}

```

Sends message and receives response. **Automatically creates session if X-Session-Token is missing.**

### Response Fields

#### Request (First Message - No Session)

```http| Field | Type | Required | Description |

POST /api/chatbot/chat|-------|------|----------|-------------|

Authorization: Bearer cb_your_api_key| `chatbotName` | string | ✅ | Display name (e.g., "Support Bot") |

Content-Type: application/json| `welcomeMessage` | string | ✅ | Initial greeting message |

| `businessProfile` | enum | ✅ | 'ecommerce' \| 'saas' \| 'professional' \| 'content' |

{| `primaryLanguage` | string | ✅ | ISO language code (e.g., 'en', 'fr', 'es') |

  "message": "What are your pricing options?"| `primaryColor` | string | ✅ | Hex color code (e.g., '#007bff') |

}| `avatarUrl` | string | ❌ | CDN URL to avatar image (optional) |

```| `position` | enum | ✅ | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' |



#### Request (Existing Session)### Backend Logic

```http

POST /api/chatbot/chat```typescript

Authorization: Bearer cb_your_api_key// Example implementation (Node.js/Express)

X-Session-Token: abc123def456ghi789app.get('/api/chatbot/config', async (req, res) => {

Content-Type: application/json  try {

    // 1. Extract and validate API key

{    const apiKey = req.headers.authorization?.replace('Bearer ', '');

  "message": "Tell me more about the premium plan"    if (!apiKey) {

}      return res.status(401).json({

```        success: false,

        error: 'API key required'

#### Response (New Session - includes sessionToken)      });

```json    }

{

  "success": true,    // 2. Fetch chatbot from database

  "message": {    const chatbot = await db.chatbots.findOne({ apiKey });

    "id": "msg_abc123",    if (!chatbot) {

    "role": "assistant",      return res.status(401).json({

    "content": "Our pricing starts at $9/month...",        success: false,

    "createdAt": "2025-11-09T10:05:00Z"        error: 'Invalid API key'

  },      });

  "sessionToken": "new_session_token_here"    }

}

```    // 3. Validate domain origin

    const origin = req.headers.origin;

#### Response (Existing Session - no sessionToken)    if (!chatbot.allowedDomains.includes(origin)) {

```json      return res.status(403).json({

{        success: false,

  "success": true,        error: 'Domain not authorized'

  "message": {      });

    "id": "msg_def456",    }

    "role": "assistant",

    "content": "The premium plan includes...",    // 4. Return configuration

    "createdAt": "2025-11-09T10:06:00Z"    res.json({

  }      success: true,

}      data: {

```        chatbotName: chatbot.name,

        welcomeMessage: chatbot.welcomeMessage,

#### Message Object        businessProfile: chatbot.businessProfile,

        primaryLanguage: chatbot.primaryLanguage,

| Field | Type | Description |        primaryColor: chatbot.primaryColor,

|-------|------|-------------|        avatarUrl: chatbot.avatarUrl,

| `id` | string | Unique message ID |        position: chatbot.position

| `role` | string | "user" or "assistant" |      }

| `content` | string | Message text content |    });

| `createdAt` | string | ISO 8601 timestamp |  } catch (error) {

    res.status(500).json({

---      success: false,

      error: 'Internal server error'

## 🔐 Authentication    });

  }

### API Key Format});

``````

cb_live_1234567890abcdef  (production)

cb_test_1234567890abcdef  (testing)### Error Responses

```

```json

### Headers// 401 Unauthorized

```http{

Authorization: Bearer cb_live_1234567890abcdef  "success": false,

X-Session-Token: session_token_here  (optional, auto-created if missing)  "error": "Invalid API key"

Content-Type: application/json}

```

// 403 Forbidden

### Validation Flow{

```typescript  "success": false,

1. Extract API key from Authorization header  "error": "Domain not authorized"

2. Verify key exists and is active}

3. Validate origin domain matches chatbot's allowed domains

4. Check X-Session-Token if present// 500 Internal Server Error

5. Auto-create session if token missing or invalid{

6. Rate limit check  "success": false,

```  "error": "Internal server error"

}

---```



## 💻 Implementation Example---



### Complete Backend Logic (Node.js/Express)## 💬 Endpoint 2: Send Chat Message



```typescript### Request

import express from 'express';

import { prisma } from './db';```http

import { generateSessionToken, callOpenAI } from './utils';POST /api/chatbot/chat

Host: api.askmysite.com

const app = express();Authorization: Bearer sk_live_1234567890abcdef

app.use(express.json());Content-Type: application/json

Origin: https://example.com

// ============================================================================

// 1. GET CONFIG (Cached by widget for 24h){

// ============================================================================  "message": "What are your business hours?",

  "conversationId": "conv_abc123xyz"

app.get('/api/chatbot/config', async (req, res) => {}

  try {```

    // 1. Extract and validate API key

    const apiKey = req.headers.authorization?.replace('Bearer ', '');### Request Body

    if (!apiKey) {

      return res.status(401).json({| Field | Type | Required | Description |

        success: false,|-------|------|----------|-------------|

        error: 'API key required'| `message` | string | ✅ | User's message (max 2000 chars) |

      });| `conversationId` | string | ❌ | Optional conversation context ID |

    }

### Response (Success - 200 OK)

    // 2. Find chatbot by API key

    const chatbot = await prisma.chatbot.findUnique({```json

      where: { apiKey }{

    });  "success": true,

  "data": {

    if (!chatbot || !chatbot.isActive) {    "message": "We're open Monday to Friday, 9 AM to 6 PM EST. We're also available via email 24/7 at support@example.com.",

      return res.status(401).json({    "conversationId": "conv_abc123xyz"

        success: false,  }

        error: 'Invalid API key'}

      });```

    }

### Response Fields

    // 3. Validate origin domain

    const origin = req.headers.origin;| Field | Type | Description |

    if (origin && !isAllowedOrigin(origin, chatbot.allowedDomains)) {|-------|------|-------------|

      return res.status(403).json({| `message` | string | AI-generated response |

        success: false,| `conversationId` | string | Conversation ID for context tracking |

        error: 'Domain not authorized'

      });### Backend Logic

    }

```typescript

    // 4. Return configuration// Example implementation

    res.json({app.post('/api/chatbot/chat', async (req, res) => {

      success: true,  try {

      config: {    // 1. Validate API key (same as above)

        chatbotName: chatbot.name,    const apiKey = req.headers.authorization?.replace('Bearer ', '');

        welcomeMessage: chatbot.welcomeMessage,    const chatbot = await validateApiKey(apiKey);

        businessProfile: chatbot.businessProfile,    if (!chatbot) {

        assistantProfile: chatbot.assistantProfile,      return res.status(401).json({

        primaryColor: chatbot.primaryColor,        success: false,

        position: chatbot.position,        error: 'Invalid API key'

        siteName: chatbot.siteName,      });

        siteUrl: chatbot.siteUrl,    }

        avatarUrl: chatbot.avatarUrl

      }    // 2. Validate domain

    });    const origin = req.headers.origin;

    if (!chatbot.allowedDomains.includes(origin)) {

  } catch (error) {      return res.status(403).json({

    console.error('Config error:', error);        success: false,

    res.status(500).json({        error: 'Domain not authorized'

      success: false,      });

      error: 'Internal server error'    }

    });

  }    // 3. Rate limiting check

});    const rateLimitOk = await checkRateLimit(apiKey);

    if (!rateLimitOk) {

// ============================================================================      return res.status(429).json({

// 2. POST CHAT (Auto-creates session)        success: false,

// ============================================================================        error: 'Rate limit exceeded'

      });

app.post('/api/chatbot/chat', async (req, res) => {    }

  try {

    // 1. Validate API key    // 4. Extract message and conversation ID

    const apiKey = req.headers.authorization?.replace('Bearer ', '');    const { message, conversationId } = req.body;

    const chatbot = await validateApiKey(apiKey);

        if (!message || message.length === 0) {

    if (!chatbot) {      return res.status(400).json({

      return res.status(401).json({        success: false,

        success: false,        error: 'Message is required'

        error: 'Invalid API key'      });

      });    }

    }

    if (message.length > 2000) {

    // 2. Validate domain      return res.status(400).json({

    const origin = req.headers.origin;        success: false,

    if (origin && !isAllowedOrigin(origin, chatbot.allowedDomains)) {        error: 'Message too long (max 2000 characters)'

      return res.status(403).json({      });

        success: false,    }

        error: 'Domain not authorized'

      });    // 5. Retrieve or create conversation

    }    let conversation;

    if (conversationId) {

    // 3. Get or create session      conversation = await db.conversations.findOne({ id: conversationId });

    let sessionToken = req.headers['x-session-token'] as string;    }

    let session;    

    let isNewSession = false;    if (!conversation) {

      conversation = await db.conversations.create({

    if (sessionToken) {        id: generateConversationId(),

      // Try to find existing session        chatbotId: chatbot.id,

      session = await prisma.chatSession.findUnique({        messages: []

        where: { sessionToken },      });

        include: { messages: { orderBy: { createdAt: 'asc' } } }    }

      });

    }    // 6. Get chatbot context from crawled content

    const context = await db.chatbotContent.findOne({ chatbotId: chatbot.id });

    if (!session) {

      // Create new session    // 7. Build ChatGPT prompt

      sessionToken = generateSessionToken();    const systemPrompt = buildSystemPrompt(chatbot, context);

      session = await prisma.chatSession.create({    const conversationHistory = conversation.messages.map(m => ({

        data: {      role: m.role,

          chatbotId: chatbot.id,      content: m.content

          sessionToken,    }));

          isActive: true

        },    // 8. Call ChatGPT API

        include: { messages: true }    const completion = await openai.chat.completions.create({

      });      model: "gpt-4",

      isNewSession = true;      messages: [

    }        { role: "system", content: systemPrompt },

        ...conversationHistory,

    // 4. Validate message        { role: "user", content: message }

    const { message } = req.body;      ],

    if (!message || typeof message !== 'string' || message.length === 0) {      max_tokens: 500,

      return res.status(400).json({      temperature: 0.7,

        success: false,    });

        error: 'Message is required'

      });    const aiResponse = completion.choices[0].message.content;

    }

    // 9. Save messages to conversation

    if (message.length > 2000) {    await db.conversations.update(conversation.id, {

      return res.status(400).json({      $push: {

        success: false,        messages: [

        error: 'Message too long (max 2000 characters)'          { role: 'user', content: message, timestamp: new Date() },

      });          { role: 'assistant', content: aiResponse, timestamp: new Date() }

    }        ]

      }

    // 5. Rate limiting    });

    const recentMessages = session.messages.filter(

      m => Date.now() - new Date(m.createdAt).getTime() < 60000    // 10. Log usage for billing

    );    await logUsage(chatbot.id, {

    if (recentMessages.length >= 10) {      type: 'message',

      return res.status(429).json({      tokens: completion.usage.total_tokens,

        success: false,      timestamp: new Date()

        error: 'Rate limit exceeded'    });

      });

    }    // 11. Return response

    res.json({

    // 6. Save user message      success: true,

    const userMessage = await prisma.chatMessage.create({      data: {

      data: {        message: aiResponse,

        chatSessionId: session.id,        conversationId: conversation.id

        role: 'user',      }

        content: message    });

      }

    });  } catch (error) {

    console.error('Chat error:', error);

    // 7. Get chatbot content/context    res.status(500).json({

    const context = await prisma.chatbotContent.findUnique({      success: false,

      where: { chatbotId: chatbot.id }      error: 'Failed to process message'

    });    });

  }

    // 8. Build conversation history});

    const conversationHistory = session.messages.map(m => ({```

      role: m.role,

      content: m.content### System Prompt Builder

    }));

```typescript

    // 9. Call OpenAI/ChatGPTfunction buildSystemPrompt(chatbot, context) {

    const aiResponse = await callOpenAI({  const profilePrompts = {

      chatbot,    ecommerce: "You are a helpful e-commerce assistant focused on helping customers find products and complete purchases.",

      context: context?.content || '',    saas: "You are a technical support assistant helping users understand features and troubleshoot issues.",

      history: conversationHistory,    professional: "You are a professional consultant providing expert advice and information.",

      userMessage: message    content: "You are a knowledgeable assistant helping users find and understand content."

    });  };



    // 10. Save assistant message  return `${profilePrompts[chatbot.businessProfile]}

    const assistantMessage = await prisma.chatMessage.create({

      data: {Your name is ${chatbot.chatbotName}.

        chatSessionId: session.id,You represent a company/website with the following information:

        role: 'assistant',

        content: aiResponse${context.summary}

      }

    });Important guidelines:

- Respond in ${chatbot.primaryLanguage} language

    // 11. Update session- Keep responses short, clear, and precise (aim for 2-3 sentences)

    await prisma.chatSession.update({- Only answer based on the provided context

      where: { id: session.id },- If you don't know something, politely say so and suggest contacting support

      data: {- Be friendly, professional, and helpful

        lastMessageAt: new Date(),- Never make up information not in the context`;

        messageCount: { increment: 2 }}

      }```

    });

### Error Responses

    // 12. Return response

    const response: any = {```json

      success: true,// 400 Bad Request

      message: {{

        id: assistantMessage.id,  "success": false,

        role: 'assistant',  "error": "Message is required"

        content: assistantMessage.content,}

        createdAt: assistantMessage.createdAt.toISOString()

      }// 401 Unauthorized

    };{

  "success": false,

    // Include session token only for new sessions  "error": "Invalid API key"

    if (isNewSession) {}

      response.sessionToken = sessionToken;

    }// 403 Forbidden

{

    res.json(response);  "success": false,

  "error": "Domain not authorized"

  } catch (error) {}

    console.error('Chat error:', error);

    res.status(500).json({// 429 Too Many Requests

      success: false,{

      error: 'Failed to process message'  "success": false,

    });  "error": "Rate limit exceeded. Please try again later."

  }}

});

// 500 Internal Server Error

// ============================================================================{

// UTILITY FUNCTIONS  "success": false,

// ============================================================================  "error": "Failed to process message"

}

function generateSessionToken(): string {```

  return 'session_' + crypto.randomBytes(32).toString('hex');

}---



function isAllowedOrigin(origin: string, allowedDomains: string[]): boolean {## 🛡️ Security Implementation

  const originDomain = new URL(origin).hostname;

  ### 1. API Key Management

  // Allow localhost for development

  if (originDomain === 'localhost' || originDomain === '127.0.0.1') {```typescript

    return true;// Generate API key

  }function generateApiKey(type: 'live' | 'test') {

    const prefix = type === 'live' ? 'sk_live_' : 'sk_test_';

  return allowedDomains.some(domain =>   const random = crypto.randomBytes(24).toString('hex');

    originDomain === domain || originDomain.endsWith(`.${domain}`)  return prefix + random;

  );}

}

// Hash API key for storage

async function validateApiKey(apiKey: string | undefined) {function hashApiKey(apiKey: string) {

  if (!apiKey) return null;  return crypto.createHash('sha256').update(apiKey).digest('hex');

  }

  return await prisma.chatbot.findUnique({```

    where: { apiKey, isActive: true }

  });### 2. Domain Validation

}

```typescript

async function callOpenAI({ chatbot, context, history, userMessage }) {function validateDomain(chatbot, requestOrigin) {

  const systemPrompt = buildSystemPrompt(chatbot, context);  // Allow localhost for development

    if (chatbot.environment === 'test' && 

  const response = await openai.chat.completions.create({      requestOrigin.includes('localhost')) {

    model: 'gpt-4',    return true;

    messages: [  }

      { role: 'system', content: systemPrompt },

      ...history,  // Check against whitelist

      { role: 'user', content: userMessage }  return chatbot.allowedDomains.some(domain => {

    ],    const originDomain = new URL(requestOrigin).hostname;

    max_tokens: 500,    return originDomain === domain || originDomain.endsWith(`.${domain}`);

    temperature: 0.7  });

  });}

  ```

  return response.choices[0].message.content;

}### 3. Rate Limiting



function buildSystemPrompt(chatbot, context) {```typescript

  return `You are ${chatbot.name}, a ${chatbot.assistantProfile} assistant for ${chatbot.siteName}.// Example using Redis

async function checkRateLimit(apiKey: string) {

Website: ${chatbot.siteUrl}  const key = `ratelimit:${apiKey}`;

Business Type: ${chatbot.businessProfile}  const limit = 60; // 60 requests per minute

  const window = 60; // 1 minute in seconds

Context about the website:

${context}  const count = await redis.incr(key);

  if (count === 1) {

Guidelines:    await redis.expire(key, window);

- Keep responses short and precise (2-3 sentences)  }

- Only answer based on the provided context

- If you don't know, suggest contacting support  return count <= limit;

- Be friendly and helpful`;}

}```

```

### 4. Input Sanitization

---

```typescript

## 🗄️ Database Schemafunction sanitizeMessage(message: string) {

  // Remove potentially harmful content

### Prisma Schema  return message

    .trim()

```prisma    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

model Chatbot {    .substring(0, 2000); // Max length

  id               String        @id @default(cuid())}

  userId           String```

  apiKey           String        @unique

  name             String---

  welcomeMessage   String        @db.Text

  businessProfile  String## 🧪 Testing

  assistantProfile String?

  primaryColor     String### Test API Key

  position         StringCreate test keys for development:

  siteName         String```

  siteUrl          Stringsk_test_development123456789

  avatarUrl        String?```

  allowedDomains   String[]

  isActive         Boolean       @default(true)### Postman Collection

  sessions         ChatSession[]

  createdAt        DateTime      @default(now())```json

  updatedAt        DateTime      @updatedAt{

    "info": { "name": "AskMySite Widget API" },

  @@index([apiKey])  "item": [

}    {

      "name": "Get Config",

model ChatSession {      "request": {

  id            String        @id @default(cuid())        "method": "GET",

  chatbotId     String        "header": [

  chatbot       Chatbot       @relation(fields: [chatbotId], references: [id])          {

  sessionToken  String        @unique            "key": "Authorization",

  startedAt     DateTime      @default(now())            "value": "Bearer sk_test_development123456789"

  lastMessageAt DateTime      @default(now())          }

  isActive      Boolean       @default(true)        ],

  messageCount  Int           @default(0)        "url": "https://api.askmysite.com/api/chatbot/config"

  messages      ChatMessage[]      }

      },

  @@index([chatbotId])    {

  @@index([sessionToken])      "name": "Send Message",

}      "request": {

        "method": "POST",

model ChatMessage {        "header": [

  id            String       @id @default(cuid())          {

  chatSessionId String            "key": "Authorization",

  chatSession   ChatSession  @relation(fields: [chatSessionId], references: [id])            "value": "Bearer sk_test_development123456789"

  role          String       // "user" or "assistant"          },

  content       String       @db.Text          {

  createdAt     DateTime     @default(now())            "key": "Content-Type",

              "value": "application/json"

  @@index([chatSessionId])          }

  @@index([createdAt])        ],

}        "body": {

          "mode": "raw",

model ChatbotContent {          "raw": "{\n  \"message\": \"Hello, can you help me?\"\n}"

  id         String   @id @default(cuid())        },

  chatbotId  String   @unique        "url": "https://api.askmysite.com/api/chatbot/chat"

  content    String   @db.Text      }

  updatedAt  DateTime @updatedAt    }

}  ]

```}

```

---

### cURL Examples

## 🔒 Security Checklist

```bash

- ✅ API key validation on every request# Get configuration

- ✅ Domain origin verificationcurl -X GET https://api.askmysite.com/api/chatbot/config \

- ✅ Session token validation  -H "Authorization: Bearer sk_test_development123456789"

- ✅ Rate limiting (10 messages/minute per session)

- ✅ Message length limits (2000 chars)# Send message

- ✅ HTTPS onlycurl -X POST https://api.askmysite.com/api/chatbot/chat \

- ✅ CORS configuration  -H "Authorization: Bearer sk_test_development123456789" \

- ✅ SQL injection protection (Prisma)  -H "Content-Type: application/json" \

- ✅ Input sanitization  -d '{"message": "What are your hours?"}'



---# With conversation ID

curl -X POST https://api.askmysite.com/api/chatbot/chat \

## 🧪 Testing with cURL  -H "Authorization: Bearer sk_test_development123456789" \

  -H "Content-Type: application/json" \

### Get Config  -d '{

```bash    "message": "Thank you!",

curl -X GET https://api.askmysite.com/api/chatbot/config \    "conversationId": "conv_abc123xyz"

  -H "Authorization: Bearer cb_test_123"  }'

``````



### Send First Message (No Session)---

```bash

curl -X POST https://api.askmysite.com/api/chatbot/chat \## 📊 Database Schema

  -H "Authorization: Bearer cb_test_123" \

  -H "Content-Type: application/json" \### Chatbots Table

  -d '{"message": "Hello!"}'

``````sql

CREATE TABLE chatbots (

### Send Follow-up Message (With Session)  id UUID PRIMARY KEY,

```bash  user_id UUID REFERENCES users(id),

curl -X POST https://api.askmysite.com/api/chatbot/chat \  api_key_hash VARCHAR(64) UNIQUE NOT NULL,

  -H "Authorization: Bearer cb_test_123" \  name VARCHAR(255) NOT NULL,

  -H "X-Session-Token: session_abc123" \  welcome_message TEXT NOT NULL,

  -H "Content-Type: application/json" \  business_profile VARCHAR(50) NOT NULL,

  -d '{"message": "Tell me more"}'  primary_language VARCHAR(10) NOT NULL,

```  primary_color VARCHAR(7) NOT NULL,

  avatar_url TEXT,

---  position VARCHAR(20) NOT NULL,

  allowed_domains TEXT[] NOT NULL,

## 📊 Analytics Tracking  environment VARCHAR(10) NOT NULL, -- 'test' or 'live'

  is_active BOOLEAN DEFAULT true,

Track these metrics:  created_at TIMESTAMP DEFAULT NOW(),

- Total sessions created  updated_at TIMESTAMP DEFAULT NOW()

- Messages per session);

- Common questions (word frequency)```

- Response times

- Error rates### Conversations Table

- Active sessions

- Session duration```sql

CREATE TABLE conversations (

---  id VARCHAR(50) PRIMARY KEY,

  chatbot_id UUID REFERENCES chatbots(id),

## ✅ Implementation Checklist  messages JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),

- [ ] Create database schema (Chatbot, ChatSession, ChatMessage)  updated_at TIMESTAMP DEFAULT NOW()

- [ ] Implement GET /api/chatbot/config endpoint);

- [ ] Implement POST /api/chatbot/chat endpoint```

- [ ] Add API key validation

- [ ] Add domain origin validation### Usage Logs Table (for billing)

- [ ] Add session token generation

- [ ] Add auto-session creation logic```sql

- [ ] Integrate OpenAI/ChatGPT APICREATE TABLE usage_logs (

- [ ] Add rate limiting  id UUID PRIMARY KEY,

- [ ] Add error handling  chatbot_id UUID REFERENCES chatbots(id),

- [ ] Add CORS configuration  type VARCHAR(20) NOT NULL, -- 'message', 'config'

- [ ] Add logging/monitoring  tokens INTEGER,

- [ ] Test with widget  timestamp TIMESTAMP DEFAULT NOW()

- [ ] Deploy to production);

```

---

---

## 📚 Key Differences from Previous Version

## 🚦 CORS Configuration

### Old System (Conversation ID)

- ❌ conversationId in request body```javascript

- ❌ conversationId in responseconst corsOptions = {

- ❌ No caching strategy  origin: function (origin, callback) {

- ❌ No message persistence    // Allow requests with no origin (mobile apps, Postman, etc.)

    if (!origin) return callback(null, true);

### New System (Session Token)

- ✅ X-Session-Token in header    // Check if origin is in chatbot's allowed domains

- ✅ sessionToken only on first message    // This is simplified - in production, query database

- ✅ 24h config caching in localStorage    callback(null, true);

- ✅ Messages persisted in localStorage  },

- ✅ Auto-session creation  credentials: true,

- ✅ Instant widget load  methods: ['GET', 'POST'],

  allowedHeaders: ['Authorization', 'Content-Type'],

---};



## 🎯 Benefits of New Architectureapp.use(cors(corsOptions));

```

### ⚡ Performance

- Config cached 24h → Almost zero config API calls---

- Messages in localStorage → Instant chat history

- Session auto-created → One less round trip## 📈 Monitoring & Logging



### 🎯 Simplicity### Key Metrics to Track

- Only 2 endpoints- API requests per chatbot

- No separate session init endpoint- Average response time

- Widget handles all caching logic- Error rates

- Token usage (for billing)

### 🔒 Security- Popular questions

- Session tokens in headers (not body)- Conversation lengths

- Rate limiting per session

- Domain validation### Logging Example



---```typescript

logger.info('Chat request', {

## 💬 Widget Implementation Status  chatbotId: chatbot.id,

  conversationId: conversation.id,

The widget is fully implemented with:  messageLength: message.length,

- ✅ 24h config caching in localStorage  responseTime: Date.now() - startTime,

- ✅ Message persistence in localStorage  tokens: completion.usage.total_tokens

- ✅ Auto-session management});

- ✅ X-Session-Token header support```

- ✅ Instant load with cached data

---

**Ready for backend integration!** 🚀

## ✅ Implementation Checklist

- [ ] Set up database schema
- [ ] Implement API key generation
- [ ] Create GET /api/chatbot/config endpoint
- [ ] Create POST /api/chatbot/chat endpoint
- [ ] Integrate OpenAI/ChatGPT API
- [ ] Implement domain validation
- [ ] Add rate limiting
- [ ] Set up CORS properly
- [ ] Create system prompt builder
- [ ] Implement conversation tracking
- [ ] Add usage logging for billing
- [ ] Error handling and logging
- [ ] Write integration tests
- [ ] Deploy to staging
- [ ] Test with React widget
- [ ] Deploy to production

---

## 🔗 Frontend Integration Testing

Once backend is deployed:

```jsx
// Test in React app
import { AskMySite } from '@askmysite/react-widget';

<AskMySite 
  apiKey="sk_test_development123456789"
  apiBaseUrl="https://staging-api.askmysite.com"
/>
```

---

## 📞 Support

Backend questions? Contact the frontend team with:
- API endpoint issues
- Response format questions
- Authentication problems
- Performance concerns

Frontend is ready and waiting for these endpoints! 🚀
