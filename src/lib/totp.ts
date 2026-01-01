import { authenticator } from 'otplib';

export function generateTOTP(secret: string, digits = 6, step = 30) {
  authenticator.options = { digits, step };
  
  try {
    const token = authenticator.generate(secret);
    const timeUsed = Math.floor(Date.now() / 1000) % step;
    const secondsRemaining = step - timeUsed;
    const expiresAt = Math.floor(Date.now() / 1000) + secondsRemaining;

    return {
      token,
      seconds_remaining: secondsRemaining,
      expires_at: expiresAt,
      digits,
      step
    };
  } catch (error) {
    throw new Error('Invalid secret or TOTP generation failed');
  }
}
