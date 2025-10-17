// API Base URL - update this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const AUTH_API = "api/auth"

const DEMO_MODE = !process.env.NEXT_PUBLIC_API_URL

// Demo data
const DEMO_USER = {
  id: "demo-user-123",
  email: "demo@example.com",
  name: "Demo User",
  avatar_url: null,
  bio: null,
  created_at: new Date().toISOString(),
}

const DEMO_TOKEN = "demo-jwt-token-12345"

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

export interface ChatSession {
  id: string
  title: string
  timestamp: string
}

export interface Document {
  id: string
  title: string
  type: string
  uploaded_at: string
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
  if (DEMO_MODE) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      access_token: DEMO_TOKEN,
      token_type: "bearer",
      user: { ...DEMO_USER, name: data.name, email: data.email },
    }
  }

  const response = await fetch(`${API_BASE_URL}${AUTH_API}/register`, {
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
      id: "",
      email: data.email,
      name: data.name,
      avatar_url: null,
      bio: null,
      created_at: ""
    },
  }
}

export async function loginUser(data: UserLogin): Promise<AuthResponse> {
  if (DEMO_MODE) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      access_token: DEMO_TOKEN,
      token_type: "bearer",
      user: DEMO_USER,
    }
  }

  const response = await fetch(`${API_BASE_URL}${AUTH_API}/login`, {
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
      id: result.user.id,
      email: result.user.email,
      name: result.user.name, // Default name since backend doesn't return user info,
      avatar_url: result.user.avatar_url,
      bio: result.user.bio,
      created_at: result.user.created_at
    },
  }
}

export async function loginUserDemo(): Promise<AuthResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    access_token: DEMO_TOKEN,
    token_type: "bearer",
    user: DEMO_USER,
  }
}

export async function registerUserDemo(): Promise<AuthResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    access_token: DEMO_TOKEN,
    token_type: "bearer",
    user: DEMO_USER,
  }
}

// Chat APIs
export async function sendMessage(token: string, message: string): Promise<{ response: string }> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      response: `Demo response to: "${message}". This is a simulated AI response. Connect your backend to get real responses.`,
    }
  }

  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to send message")
  }

  return response.json()
}

export async function getChatHistory(token: string): Promise<ChatMessage[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return [
      {
        id: "1",
        role: "user",
        content: "Hello! How are you?",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "2",
        role: "assistant",
        content: "Hello! I'm doing well, thank you. This is demo mode. How can I help you today?",
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ]
  }

  const response = await fetch(`${API_BASE_URL}/chat/history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to load chat history")
  }

  return response.json()
}

export async function getChatSessions(token: string): Promise<ChatSession[]> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return [
      { id: "1", title: "Demo Chat 1", timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: "2", title: "Demo Chat 2", timestamp: new Date(Date.now() - 172800000).toISOString() },
    ]
  }

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
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return [
      { id: "1", title: "Demo Document.pdf", type: "pdf", uploaded_at: new Date().toISOString() },
      { id: "2", title: "Sample File.docx", type: "docx", uploaded_at: new Date().toISOString() },
    ]
  }

  const response = await fetch(`${API_BASE_URL}/documents`, {
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

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
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
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return DEMO_USER
  }

  try {
    const response = await fetch(`${API_BASE_URL}${AUTH_API}/me`, {
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
  } catch (error) {
    // Fallback to demo mode if API is not available
    console.log("[v0] API not available, using demo profile data")
    await new Promise((resolve) => setTimeout(resolve, 300))
    return DEMO_USER
  }
}

export async function updateUserProfile(token: string, data: { name: string }): Promise<UserProfile> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      id: "demo-user-123",
      email: "demo@example.com",
      name: data.name,
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${AUTH_API}/me`, {
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
  } catch (error) {
    // Fallback to demo mode if API is not available
    console.log("[v0] API not available, simulating profile update")
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      id: "demo-user-123",
      email: "demo@example.com",
      name: data.name,
      avatar_url: null,
      bio: null,
      created_at: new Date().toISOString(),
    }
  }
}

export async function changePassword(token: string, newPassword: string): Promise<{ message: string }> {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { message: "Password changed successfully (demo mode)" }
  }

  const response = await fetch(`${API_BASE_URL}${AUTH_API}/change-password`, {
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
