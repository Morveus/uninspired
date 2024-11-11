type SignInCredentials = {
  username: string;
  password: string;
};

export async function signIn(type: 'credentials', credentials: SignInCredentials) {
  if (type !== 'credentials') {
    throw new Error('Only credentials auth is supported');
  }

  const { username, password } = credentials;

  // Check against environment variables
  if (
    username === process.env.AUTH_USER && 
    password === process.env.AUTH_PASSWORD
  ) {
    return { success: true };
  }

  const error = new Error('Invalid credentials') as Error & { type: string };
  error.type = 'CredentialsSignin';
  throw error;
}