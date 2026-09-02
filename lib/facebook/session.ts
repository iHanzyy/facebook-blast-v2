export type FacebookSessionStatus = {
  hasSavedProfile: boolean;
  isBrowserOpen: boolean;
};

export type FacebookSessionResponse =
  | { ok: true; status: FacebookSessionStatus }
  | {
      ok: false;
      error: {
        code: "FORBIDDEN" | "LOGIN_BROWSER_OPEN_FAILED";
        message: string;
      };
    };

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
