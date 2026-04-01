import { getSessionFromCookies } from './auth'

export async function validateCsrf(request: Request): Promise<boolean> {
  const csrfHeader = request.headers.get('X-CSRF-Token')
  if (!csrfHeader) return false

  const session = await getSessionFromCookies()
  if (!session) return false

  return csrfHeader === session.csrf
}
