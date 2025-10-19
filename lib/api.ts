// API Base URL - update this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface UserRegister {
  email: string
  password: string
  name: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    name: string
    avatar_url: string | null
    bio: string | null
    created_at: string
  }
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface ChatMessageResponse {
  id: string
  user_id: string
  type: "assistant"
  content: string
  sources: string[] | null
  response_time: number
  created_at: string
}

export interface ChatSession {
  id: string
  title: string
  timestamp: string
}

export interface Document {
  id: string
  user_id: string
  filename: string
  file_type: string
  file_size: number
  file_url: string
  status: string
  chunk_count: number
  error_message: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

// Authentication APIs
export async function registerUser(data: UserRegister): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Registration failed" }))
    throw new Error(error.detail || "Registration failed")
  }

  const result = await response.json()

  // Backend returns only access_token, so we create a minimal user object
  return {
    access_token: result.access_token,
    token_type: result.token_type || "bearer",
    user: {
      id: "user-" + Date.now(),
      email: data.email,
      name: data.name,
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
    },
  }
}

export async function loginUser(data: UserLogin): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Login failed" }))
    throw new Error(error.detail || "Login failed")
  }

  const result = await response.json()

  // Backend returns only access_token, so we create a minimal user object
  return {
    access_token: result.access_token,
    token_type: result.token_type || "bearer",
    user: {
      id: "user-" + Date.now(),
      email: data.email,
      name: "User",
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
    },
  }
}

// Chat APIs
export async function sendMessage(token: string, message: string): Promise<ChatMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content: message }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to send message")
  }

  return response.json()
}

export async function getChatSessions(token: string): Promise<ChatSession[]> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to load chat sessions")
  }

  return response.json()
}

// Document APIs
export async function getDocuments(token: string): Promise<Document[]> {
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to load documents")
  }

  return response.json()
}

export async function uploadDocument(token: string, file: File): Promise<Document> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to upload document")
  }

  return response.json()
}

// User Profile APIs
export async function getUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to load user profile")
  }

  return response.json()
}

export async function updateUserProfile(token: string, data: { name: string }): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    body: JSON.stringify({ name: data.name }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to update profile")
  }

  return response.json()
}

export async function changePassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_password: newPassword }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to change password" }))
    throw new Error(error.detail || "Failed to change password")
  }

  return response.json()
}