export class OtpRequiredError extends Error {
  otpToken: string;
  constructor(otpToken: string, message?: string) {
    super(message ?? "Verification code required");
    this.name = "OtpRequiredError";
    this.otpToken = otpToken;
  }
}
