import { loginFlow } from "../auth/login.js";

export async function loginCommand() {
  await loginFlow();
}
