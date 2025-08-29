import { brevoTransactionApi } from "@/configs/brevo.config"

interface sendEmailParams {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: sendEmailParams) => {
    try {
        const emailData = {
            sender: {
                name: "Westrance",
                email: "philip@questghana.com"
            },

            to: [{ email: to }],
            subject,
            // textContent: text || "",
            htmlContent: html || `<p>${text}</p>`
        }
        console.log("Trying to send email with data:", emailData);

        const response = await brevoTransactionApi.sendTransacEmail(emailData);
        console.log("Response from Brevo:", response.body);
        return response
    } catch (error: any) {
        console.error("Failed to send email:", error?.response?.body || error.message || error);
        throw error;
    }
}