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
  reference?: Array<{
    filename: string
    chunk_text: string
    similarity: number
    document_id: string
  }>
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
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
export async function uploadDocument(token: string, files: File[]): Promise<Document[]> {
  const formData = new FormData()

  // Add each file to FormData with the key 'files'
  files.forEach((file) => {
    formData.append("files", file)
  })

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      try {
        const error = await response.json()
        if (error.detail && error.detail.errors) {
          const errorMessages = error.detail.errors
            .map((err: { error: string; filename: string }) => err.error)
            .join("\n")
          throw new Error(errorMessages || error.detail.message || "Nije moguće učitati dokumente.")
        }
        const errorMessage = error.detail || "Nije moguće učitati dokumente."
        throw new Error(errorMessage)
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== "Nije moguće učitati dokumente.") {
          throw parseError
        }
        throw new Error("Nije moguće učitati dokumente.")
      }
    }
    throw new Error("Nije moguće učitati dokumente.")
  }

  return response.json()
}

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

export async function deleteDocument(token: string, documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to delete document" }))
    throw new Error(error.detail || "Failed to delete document")
  }
}

// User Profile APIs
export async function getUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    body: JSON.stringify({ name: data.name }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to update profile" }))
    throw new Error(error.detail || "Failed to update profile")
  }

  return response.json()
}

export async function changePassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
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

// Feedback API function
export async function sendFeedback(
  token: string,
  messageId: string,
  data: { feedback: string | null; comment: string },
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat/${messageId}/feedback`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to send feedback" }))
    throw new Error(error.detail || "Failed to send feedback")
  }
}

export interface ChatHistoryItem {
  id: string
  user_id: string
  type: "user" | "assistant"
  content: string
  sources: Array<{
    filename: string
    chunk_text: string
    similarity: number
    document_id: string
  }> | null
  reference: Array<{
    filename: string
    chunk_text: string
    similarity: number
    document_id: string
  }> | null
  response_time: number | null
  feedback: "like" | "dislike" | null
  feedback_comment: string | null
  created_at: string
}

export async function getChatHistory(token: string, limit = 6): Promise<ChatHistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/chat/history?limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to load chat history")
  }

  return response.json()
}