import { env } from "@/src/env.mjs";

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface RecaptchaResponse {
    success: boolean;
    score: number;
    action: string;
    challenge_ts: string;
    hostname: string;
    'error-codes'?: string[];
}

/**
 * Verifies a reCAPTCHA v3 token with Google's API.
 * @param token The token received from the client.
 * @returns An object indicating success and the user's score.
 */
export async function verifyRecaptcha(token: string): Promise<{ success: boolean; score: number }> {
    try {
        const response = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${env.RECAPTCHA_SECRET_KEY}&response=${token}`,
        });

        if (!response.ok) {
            throw new Error(`reCAPTCHA verify request failed with status: ${response.status}`);
        }

        const data: RecaptchaResponse = await response.json();

        // A score of 0.5 is a common threshold, but you can adjust it.
        if (data.success && data.score >= 0.5) {
            return { success: true, score: data.score };
        } else {
            console.warn('reCAPTCHA verification failed or low score:', data);
            return { success: false, score: data.score ?? 0 };
        }
    } catch (error) {
        console.error("Error verifying reCAPTCHA:", error);
        return { success: false, score: 0 };
    }
}
