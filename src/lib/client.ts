export class ApiError extends Error {
  fieldErrors?: Record<string, string[] | undefined>;
  status: number;
  needsCode?: boolean;
  needsOtp?: boolean;
  phoneMasked?: string;
  demoOtp?: string;
  catchOtpMode?: boolean;
  deliveryMethod?: "catch" | "whatsapp" | "sms" | "email" | "webhook";
  destinationMasked?: string;

  constructor(
    status: number,
    message: string,
    extras?: {
      fieldErrors?: Record<string, string[] | undefined>;
      needsCode?: boolean;
      needsOtp?: boolean;
      phoneMasked?: string;
      demoOtp?: string;
      catchOtpMode?: boolean;
  deliveryMethod?: "catch" | "whatsapp" | "sms" | "email" | "webhook";
      destinationMasked?: string;
    },
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = extras?.fieldErrors;
    this.needsCode = extras?.needsCode;
    this.needsOtp = extras?.needsOtp;
    this.phoneMasked = extras?.phoneMasked;
    this.demoOtp = extras?.demoOtp;
    this.catchOtpMode = extras?.catchOtpMode;
    this.deliveryMethod = extras?.deliveryMethod;
    this.destinationMasked = extras?.destinationMasked;
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
    needsCode?: boolean;
    needsOtp?: boolean;
    phoneMasked?: string;
    demoOtp?: string;
    catchOtpMode?: boolean;
  deliveryMethod?: "catch" | "whatsapp" | "sms" | "email" | "webhook";
    destinationMasked?: string;
  } & T;
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? "Something went wrong", {
      fieldErrors: data.fieldErrors,
      needsCode: data.needsCode,
      needsOtp: data.needsOtp,
      phoneMasked: data.phoneMasked,
      demoOtp: data.demoOtp,
      deliveryMethod: data.deliveryMethod,
      destinationMasked: data.destinationMasked,
      catchOtpMode: data.catchOtpMode,
    });
  }
  return data;
}
