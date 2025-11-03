import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";


// Create the auth client
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    expoClient({
      scheme: "capstone-exploration",
      storagePrefix: "capstone",
      storage: SecureStore,
    }),
    emailOTPClient(),
  ],
});

// Export the auth methods following Better Auth docs
export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession,
  getSession
} = authClient;

// Export email OTP methods
export const { emailOtp } = authClient;