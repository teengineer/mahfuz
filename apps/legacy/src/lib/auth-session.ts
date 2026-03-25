import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });
      return session;
    } catch {
      return null;
    }
  }
);
