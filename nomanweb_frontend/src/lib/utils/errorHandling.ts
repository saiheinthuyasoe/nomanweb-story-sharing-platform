import toast from "react-hot-toast";

export const handleApiError = (error: any, defaultMessage: string) => {
  if (error.response?.status === 429) {
    const action = getActionFromUrl() || "this action";
    toast.error(
      `Too many attempts. Please wait a moment before trying ${action} again.`
    );
  } else {
    toast.error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        defaultMessage
    );
  }
};

export const handleRateLimitError = (action: string) => {
  toast.error(
    `Too many ${action} attempts. Please wait a moment before trying again.`
  );
};

const getActionFromUrl = (): string => {
  if (typeof window === "undefined") return "";

  const pathname = window.location.pathname;
  if (pathname.includes("/login")) return "logging in";
  if (pathname.includes("/register")) return "registering";
  if (pathname.includes("/forgot-password")) return "password reset";
  if (
    pathname.includes("/resend-verification") ||
    pathname.includes("/verify-email-pending")
  )
    return "sending verification email";
  if (pathname.includes("/profile")) return "changing email or username";
  if (pathname.includes("/verify-email-change")) return "changing email";

  return "this action";
};
