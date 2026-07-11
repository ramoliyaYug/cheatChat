import { signupFlow } from "../auth/signup.js";

export async function signupCommand() {
  await signupFlow();
}
