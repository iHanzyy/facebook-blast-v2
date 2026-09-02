import {
  getFacebookSessionStatus,
  openFacebookLogin,
} from "@/lib/facebook/browser";
import {
  isSameOriginRequest,
  type FacebookSessionResponse,
} from "@/lib/facebook/session";

function statusResponse(): Response {
  const body: FacebookSessionResponse = {
    ok: true,
    status: getFacebookSessionStatus(),
  };

  return Response.json(body);
}

export function GET() {
  return statusResponse();
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    const body: FacebookSessionResponse = {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Request origin is not allowed.",
      },
    };

    return Response.json(body, { status: 403 });
  }

  try {
    await openFacebookLogin();
    return statusResponse();
  } catch {
    console.error("[Facebook session] Unable to open the login browser.");

    const body: FacebookSessionResponse = {
      ok: false,
      error: {
        code: "LOGIN_BROWSER_OPEN_FAILED",
        message: "Chrome login window could not be opened.",
      },
    };

    return Response.json(body, { status: 500 });
  }
}
