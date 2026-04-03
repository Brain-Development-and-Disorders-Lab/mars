import { EmailClient } from "@azure/communication-email";

const client = new EmailClient(process.env.AZURE_COMMUNICATION_CONNECTION_STRING!);
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS!;

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const message = {
    senderAddress: FROM_ADDRESS,
    recipients: { to: [{ address: to }] },
    content: { subject, html },
  };

  const poller = await client.beginSend(message);
  await poller.pollUntilDone();
};
