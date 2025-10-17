export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    
    // Ako je "null" string, tretuj kao null
    if (token === "null" || token === "undefined" || token === "") {
      localStorage.removeItem("auth_token")
      return null
    }
    
    return token
  }
  return null
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
  }
}

export function isAuthenticated(): boolean {
  const token = getAuthToken()
  return token !== null
}