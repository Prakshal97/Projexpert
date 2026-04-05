import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
    }
  }
  interface User {
    id: string
    firstName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    firstName: string
  }
}
