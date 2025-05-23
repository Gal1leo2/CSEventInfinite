interface TokenValidateResponse {
    'error-codes': string[];
    success: boolean;
    action: string;
    cdata: string;
}

async function validateToken(token: string, secret: string) {
    const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                response: token,
                secret: secret,
            }),
        },
    );

    const data: TokenValidateResponse = await response.json();

    return {
        // Return the status
        success: data.success,

        // Return the first error if it exists
        error: data['error-codes']?.length ? data['error-codes'][0] : null,
    };
}

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();

        const token = data.get('cf-turnstile-response'); // CAPTCHA response from form

        // Use the imported secret key from environment variables
        const SECRET_KEY = '0x4AAAAAAAkTZwT9rp20WBQs-cCAb3ZLQug'; 

        const { success, error } = await validateToken(token, SECRET_KEY);

        if (!success) {
            return {
                error: error || 'Invalid CAPTCHA',
            };
        }

        // CAPTCHA is valid, return success
        return {
            success: true,
        };
    },
};
