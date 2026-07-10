import APIBase from './httpBase'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

class AuthAPI extends APIBase {
  async me(): Promise<AuthUser> {
    const res = await this.get<{ user: AuthUser }>('auth/me')
    return res.data.user
  }
}

export const authAPI = new AuthAPI()
