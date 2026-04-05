import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/ai-manager/:path*", "/file-review/:path*", "/workspace/:path*"],
}
