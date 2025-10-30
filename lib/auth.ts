export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token")
  }
  return null
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}