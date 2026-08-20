---
name: api-integration-guide
description: Reference material the user provided on structuring API service layers (mocked services with simulated delays, replacing mocks with real HTTP calls via axios/React Query, error handling, testing, best practices for keeping services pure and typed). Load when wiring a feature's data/ module to a real backend, adding an HTTP client, or deciding how service/error-handling code should be organized in this repo.
---

# API Integration Guide (reference material)

This is reference material the user supplied from the `react-vertical-slice` repo's API guide.
It describes a `services/` layer; **in this repo the equivalent layer is `features/<slice>/data/*.ts`**
(marked `import "server-only"`, called directly from Server Component pages via `await getX()`)
per [[nextjs-vertical-slice-conventions]] and `AGENTS.md`. When this project's mock data modules
get replaced with real fetches, apply the principles below (pure services, consistent error
handling, typed requests/responses) inside those `data/*.ts` files rather than introducing a
separate client-side `services/` layer, unless the user asks for client-side data fetching
specifically.

---

## Source: API Integration Guide

This document explains the mocked API services in the project and how to replace them with real
API calls.

### Overview

Each feature has its own `services/` directory containing API service modules. These services
currently use mocked data with simulated delays, but are structured to be easily replaced with
real HTTP calls.

### Feature Services

**1. Authentication API (`features/auth/services/authApi.ts`)**

Methods:

`authApi.login(credentials)` — Authenticates a user with email and password.

```ts
const user = await authApi.login({
  email: 'john@example.com',
  password: 'password123'
})
```

Mock Users: `john@example.com` / `password123`, `jane@example.com` / `password123`.
Returns: `AuthUser` object. Throws: Error if credentials are invalid.

`authApi.register(data)` — Registers a new user.

```ts
const user = await authApi.register({
  name: 'New User',
  email: 'newuser@example.com',
  password: 'password123',
  confirmPassword: 'password123'
})
```

Returns: `AuthUser` object. Throws: Error if email already exists.

`authApi.logout()` — Logs out the current user. `await authApi.logout()`

`authApi.verifyToken(token)` — Verifies an authentication token.
`const user = await authApi.verifyToken('valid-token')`

**2. Dashboard API (`features/dashboard/services/dashboardApi.ts`)**

`dashboardApi.getDashboardData()` — Fetches complete dashboard data including stats and
activities. Returns `{ stats, activities, lastUpdated }` (`DashboardData`).

`dashboardApi.getStats()` — Fetches dashboard statistics only. Returns
`{ totalUsers, activeSessions, revenue, conversionRate }` (`DashboardStats`).

`dashboardApi.getActivities(limit)` — Fetches recent activities. Parameters: `limit` (optional,
default 10). Returns array of `Activity` objects.

`dashboardApi.refreshDashboard()` — Refreshes dashboard with updated data. Returns
`DashboardData` object with updated stats.

**3. Profile API (`features/user-profile/services/profileApi.ts`)**

`profileApi.getProfile(userId)` — Fetches user profile by ID. Returns `UserProfile` object.

`profileApi.updateProfile(userId, data)` — Updates user profile.

```ts
const updatedProfile = await profileApi.updateProfile('1', {
  name: 'Updated Name',
  bio: 'New bio text'
})
```

Parameters: `userId`, `data` (partial `UpdateProfileData`). Returns updated `UserProfile`.
Throws: Error if validation fails.

`profileApi.uploadAvatar(userId, file)` — Uploads a profile avatar image. Returns Avatar URL
string.

`profileApi.deleteProfile(userId)` — Deletes a user profile. `await profileApi.deleteProfile('1')`

### Using the Services

**In Components** — Services are typically used through custom hooks:

```tsx
// Dashboard example
import { useDashboardStats } from '../hooks/useDashboard'

function DashboardStats() {
  const { stats, isLoading, error, refresh } = useDashboardStats()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <div>{/* Render stats */}</div>
}
```

**In Hooks** — Hooks call the service methods:

```ts
import { dashboardApi } from '../services/dashboardApi'

export function useDashboardStats() {
  const [stats, setStats] = useState(null)

  const fetchStats = async () => {
    const data = await dashboardApi.getStats()
    setStats(data)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, refresh: fetchStats }
}
```

### Replacing with Real API Calls

**Step 1: Install HTTP Client**

```
npm install axios
# or
npm install @tanstack/react-query axios
```

**Step 2: Create API Client**

```ts
// src/shared/api/client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Step 3: Update Service Methods** — Replace mock implementation with real HTTP calls:

```ts
// Before (Mock)
export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    await delay(800)
    const user = mockUsers.find(u => u.email === credentials.email)
    if (!user) throw new Error('Invalid credentials')
    return user
  }
}

// After (Real API)
import { apiClient } from '@shared/api/client'

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  }
}
```

**Step 4: Add Environment Variables**

```
VITE_API_BASE_URL=https://api.yourapp.com
```

### Error Handling

All services throw errors that should be caught and handled:

```ts
try {
  const user = await authApi.login(credentials)
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    console.error('Login failed:', error.message)
  }
  // Handle error
}
```

### Testing Services

```ts
import { authApi } from './authApi'

describe('authApi', () => {
  it('should login with valid credentials', async () => {
    const user = await authApi.login({
      email: 'john@example.com',
      password: 'password123'
    })

    expect(user).toBeDefined()
    expect(user.email).toBe('john@example.com')
  })

  it('should throw error with invalid credentials', async () => {
    await expect(
      authApi.login({ email: 'wrong@example.com', password: 'wrong' })
    ).rejects.toThrow()
  })
})
```

### Best Practices

**1. Keep Services Pure** — Services should only handle API communication, no business logic:

```ts
// ❌ Bad - Business logic in service
async login(credentials) {
  const user = await apiClient.post('/login', credentials)
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

// ✅ Good - Service only handles API
async login(credentials) {
  const response = await apiClient.post('/login', credentials)
  return response.data
}
```

**2. Handle Errors Consistently** — Return meaningful error messages:

```ts
async login(credentials) {
  try {
    const response = await apiClient.post('/login', credentials)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
    throw error
  }
}
```

**3. Type Everything** — Use TypeScript for request and response types:

```ts
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: AuthUser
  token: string
}

async login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/login', credentials)
  return response.data
}
```

**4. Use React Query (Optional)** — For better data fetching and caching:

```ts
import { useQuery, useMutation } from '@tanstack/react-query'

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (user) => {
      // Handle success
    }
  })
}
```

### Migration Checklist

- [ ] Install HTTP client (axios, fetch wrapper)
- [ ] Create API client configuration
- [ ] Set up environment variables
- [ ] Update auth service
- [ ] Update dashboard service
- [ ] Update profile service
- [ ] Add error handling
- [ ] Add request/response interceptors
- [ ] Test all endpoints
- [ ] Update documentation

### Summary

The current implementation uses mocked APIs with:
- ✅ Realistic delays
- ✅ Proper error handling
- ✅ TypeScript types
- ✅ Easy migration path

To switch to real APIs: install HTTP client, update service methods, configure API endpoints,
test thoroughly.

The architecture keeps API logic separate from UI, making it easy to swap implementations
without changing components or hooks.
