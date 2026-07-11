# CheatChat - API Documentation 

> Complete documentation and guide to test every REST and WebSocket route in postman

---

## Base URLs

| Type | URL |
|------|-----|
| **REST API** | `https://bwkwmpi8ek.execute-api.ap-south-1.amazonaws.com/dev` |
| **WebSocket API** | `wss://lhyew4zkm2.execute-api.ap-south-1.amazonaws.com/dev/` |

---

## Part 1 - REST API Tests

### 1.1 Signup - Create User "alice"

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://bwkwmpi8ek.execute-api.ap-south-1.amazonaws.com/dev/auth/signup` |
| **Headers** | `Content-Type: application/json` |

**Body** (raw JSON):
```json
{
  "username": "alice",
  "password": "alice123"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Account created successfully",
  "username": "alice",
  "token": "<JWT_TOKEN>"
}
```

---

### 1.2 Signup - Create User "bob"

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://bwkwmpi8ek.execute-api.ap-south-1.amazonaws.com/dev/auth/signup` |
| **Headers** | `Content-Type: application/json` |

**Body** (raw JSON):
```json
{
  "username": "bob",
  "password": "bob12345"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Account created successfully",
  "username": "bob",
  "token": "<JWT_TOKEN>"
}
```

---

### 1.3 Login - Authenticate "alice"

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://bwkwmpi8ek.execute-api.ap-south-1.amazonaws.com/dev/auth/login` |
| **Headers** | `Content-Type: application/json` |

**Body** (raw JSON):
```json
{
  "username": "alice",
  "password": "alice123"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "username": "alice",
  "token": "<JWT_TOKEN>"
}
```

---

### 1.4 Get Current User - `/auth/me`

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **URL** | `https://bwkwmpi8ek.execute-api.ap-south-1.amazonaws.com/dev/auth/me` |
| **Headers** | `Authorization: Bearer <ALICE_JWT_TOKEN>` |


**Expected Response** (200):
```json
{
  "success": true,
  "user": {
    "username": "alice",
    "createdAt": "2026-07-10T09:30:00.000Z",
    "lastSeen": "2026-07-10T09:35:00.000Z"
  }
}
```

---

### 1.5 General AI Conversation - `/ai/chat`

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://bwkwmpi8ek.execute-api.ap-south-1.amazonaws.com/dev/ai/chat` |
| **Headers** | `Content-Type: application/json` |
| **Auth** | **None (Public Endpoint)** |

**Body** (raw JSON):
```json
{
  "prompt": "Explain binary search."
}
```

**Expected Response** (200):
```json
{
  "reply": "Binary search is an efficient algorithm for finding an item from a sorted list of items..."
}
```

---

### 1.6 Solve/Improve Source File - `/ai/file`

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://bwkwmpi8ek.execute-api.ap-south-1.amazonaws.com/dev/ai/file` |
| **Headers** | `Content-Type: application/json` |
| **Auth** | **None (Public Endpoint)** |

**Body** (raw JSON):
```json
{
  "filename": "app.js",
  "content": "console.log('Hello');"
}
```

**Expected Response** (200):
```json
{
  "content": "console.log('Hello');"
}
```

---

## Part 2 - WebSocket API Tests

### 2.1 Connect as "alice"

```
wss://lhyew4zkm2.execute-api.ap-south-1.amazonaws.com/dev/?token=<ALICE_JWT_TOKEN>
```

**Expected Result:**
- Status should show **Connected** (green indicator)
- If the token is invalid or missing, the connection will be **rejected** (you'll see an error/disconnection)

---

### 2.2 Connect as "bob" (Second Tab)

```
wss://lhyew4zkm2.execute-api.ap-south-1.amazonaws.com/dev/?token=<BOB_JWT_TOKEN>
```

---

### 2.3 Send a Global Message (from alice)

In **alice's** WebSocket tab, send this message:

```json
{
  "action": "message",
  "type": "global",
  "text": "Hello everyone! This is alice."
}
```

**Expected: Both alice AND bob receive:**
```json
{
  "event": "global_message",
  "sender": "alice",
  "text": "Hello everyone! This is alice.",
  "timestamp": 1752054000000
}
```

---

### 2.4 Send a Global Message (from bob)

In **bob's** WebSocket tab, send:

```json
{
  "action": "message",
  "type": "global",
  "text": "Hey alice! Bob here."
}
```

**Expected: Both alice AND bob receive:**
```json
{
  "event": "global_message",
  "sender": "bob",
  "text": "Hey alice! Bob here.",
  "timestamp": 1752054001000
}
```

---

### 2.5 Send a Private Message (alice → bob)

In **alice's** WebSocket tab, send:

```json
{
  "action": "message",
  "type": "private",
  "to": "bob",
  "text": "Hey Bob, this is a secret message!"
}
```

**Expected: Both alice AND bob receive:**
```json
{
  "event": "private_message",
  "sender": "alice",
  "text": "Hey Bob, this is a secret message!",
  "timestamp": 1752054002000
}
```

---

### 2.6 Send a Private Message (bob → alice)

In **bob's** WebSocket tab, send:

```json
{
  "action": "message",
  "type": "private",
  "to": "alice",
  "text": "Got it! Replying privately."
}
```

**Expected: Both alice AND bob receive:**
```json
{
  "event": "private_message",
  "sender": "bob",
  "text": "Got it! Replying privately.",
  "timestamp": 1752054003000
}
```

---

### 2.7 Request Global History

Send the following payload:

```json
{
  "action": "history",
  "type": "global",
  "limit": 50
}
```

**Expected Response:**
```json
{
  "event": "history",
  "type": "global",
  "messages": [
    {
      "sender": "alice",
      "text": "Hello everyone! This is alice.",
      "timestamp": 1752054000000
    }
  ]
}
```

**Notes:**
- Returns newest messages from the global room.
- Default limit is 50.

---

### 2.8 Request Private History

Send the following payload:

```json
{
  "action": "history",
  "type": "private",
  "with": "bob",
  "limit": 50
}
```

**Expected Response:**
```json
{
  "event": "history",
  "type": "private",
  "with": "bob",
  "messages": [
    {
      "sender": "alice",
      "text": "Hey Bob, this is a secret message!",
      "timestamp": 1752054002000
    }
  ]
}
```

**Notes:**
- Conversation history is returned in chronological order.
- Generates a deterministic key from usernames to fetch history.

---

### 2.9 Request Online Users

Send the following payload:

```json
{
  "action": "online"
}
```

**Expected Response:**
```json
{
  "event": "online",
  "users": [
    "alice",
    "bob"
  ]
}
```

**Notes:**
- Only currently connected users with active connections are returned.

---

### 2.10 Request Registered Users

Send the following payload:

```json
{
  "action": "users"
}
```

**Expected Response:**
```json
{
  "event": "users",
  "users": [
    "alice",
    "bob",
    "charlie"
  ]
}
```

**Notes:**
- Returns every registered account from the Users database table.

---

### 2.11 Disconnect

1. In alice's WebSocket tab, click **Disconnect**
2. Verify bob can still send global messages (only bob receives them now)
3. Disconnect bob