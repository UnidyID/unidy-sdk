import { useMemo, useState } from "react";
import { UnidyClient } from "@unidy.io/unidy-sdk/dist/index";

interface NewsletterConfig {
  internal_name: string;
  label: string;
  checked?: boolean;
}

interface UnidyNewsletterProps {
  title: string;
  newsletters_config: NewsletterConfig[];
  submit_button_text?: string;
  email_placeholder?: string;
  apiUrl: string;
  apiKey: string;
}

function UnidyNewsletter({ title, newsletters_config, submit_button_text, email_placeholder, apiUrl, apiKey }: UnidyNewsletterProps) {
  const [email, setEmail] = useState("");
  const [checkedNewsletters, setCheckedNewsletters] = useState(
    newsletters_config.map((n) => (n.checked ? n.internal_name : null)).filter(Boolean),
  );
  const [messages, setMessages] = useState<{ color: string; text: string }[]>([]);

  const client = useMemo(() => new UnidyClient(apiUrl, apiKey), [apiUrl, apiKey]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMessages([]);

    const payload = {
      email,
      newsletter_subscriptions: checkedNewsletters.map((newsletter) => ({
        newsletter_internal_name: newsletter as string,
      })),
    };

    const [error, response] = await client.newsletters.createSubscriptions(payload);

    if (error) {
      if (error === "newsletter_error") {
        const errors = response.data?.errors || [];

        let errorMessages = errors.map((error: { error_identifier: string; newsletter_internal_name: string }) => {
          switch (error.error_identifier) {
            case "unconfirmed":
              return { color: "red", text: `Email not confirmed for ${error.newsletter_internal_name}` };
            case "already_subscribed":
              return { color: "red", text: `Already subscribed to ${error.newsletter_internal_name}` };
            case "invalid_email":
              return { color: "red", text: "Invalid email address" };
            default:
              return { color: "red", text: "Unknown error" };
          }
        });

        errorMessages = errorMessages.filter(
          (message: { color: string; text: string }, index: number, self: { color: string; text: string }[]) =>
            index === self.findIndex((m) => m.text === message.text),
        );

        setMessages((prev) => [...prev, ...errorMessages]);
        return;
      }
      if (error === "rate_limit_exceeded") {
        alert("Rate limit exceeded. Please try again later.");
      }
    } else {
      setMessages((prev) => [...prev, { color: "green", text: "Subscriptions created!" }]);
    }

    setEmail("");
  };

  const toggleNewsletter = (value: string) => {
    setCheckedNewsletters((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">{title}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder={email_placeholder || "Enter your email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />

          {messages
            .filter((message) => message.color === "red")
            .map((message, index) => (
              <div key={index} className="text-red-500 text-sm">
                {message.text}
              </div>
            ))}
          {messages
            .filter((message) => message.color === "green")
            .map((message, index) => (
              <div key={index} className="text-green-500 text-sm">
                {message.text}
              </div>
            ))}

          {newsletters_config.map((newsletter) => (
            <label key={newsletter.internal_name} className="flex items-center">
              <input
                type="checkbox"
                value={newsletter.internal_name}
                checked={checkedNewsletters.includes(newsletter.internal_name)}
                onChange={() => toggleNewsletter(newsletter.internal_name)}
                className="mr-2"
              />
              {newsletter.label}
            </label>
          ))}

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            {submit_button_text || "Subscribe"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UnidyNewsletter;
