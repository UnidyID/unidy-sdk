import { useEffect, useState } from 'react';
import { UnidyClient } from "@unidy.io/unidy-sdk"

function UnidyNewsletter({ title, newsletters_config, submit_button_text, email_placeholder, apiUrl, apiKey, ...props }) {
  const [email, setEmail] = useState('');
  const [checkedNewsletters, setCheckedNewsletters] = useState(newsletters_config.map((n) => n.checked ? n.internal_name : null).filter(Boolean));
  const [messages, setMessages] = useState([]);


  const client = new UnidyClient(apiUrl, apiKey);

  useEffect(() => {
    client.newsletters.onSubscriptionsCreated((subs) => {
      setMessages((prev) => [
        ...prev,
        ...subs.map((s) => ({ text: `Subscribed to ${s.newsletter_internal_name}`, color: 'green' })),
      ]);
    });

    client.newsletters.onRateLimitError(() => {
      alert('Rate limit exceeded. Please try again later.');
    });

    client.newsletters.onInvalidEmailError(() => {
      setMessages((prev) => [...prev, { text: 'Invalid email', color: 'red' }]);
    });

    client.newsletters.onUnconfirmedSubscriptionError((subs) => {
      setMessages((prev) => [
        ...prev,
        ...subs.map((s) => ({ text: `Unconfirmed subscription ${s.newsletter_internal_name}. Please confirm your email`, color: 'orange' })),
      ]);
    });

    client.newsletters.onAlreadySubscribedError((subs) => {
      setMessages((prev) => [
        ...prev,
        ...subs.map((s) => ({ text: `Already subscribed to ${s.newsletter_internal_name}`, color: 'orange' })),
      ]);
    });
  }, [client.newsletters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessages([]);

    await client.newsletters.createSubscriptions({
      email,
      newsletter_subscriptions: checkedNewsletters.map((value) => ({
        newsletter_internal_name: value,
      })),
    });

    setEmail('');
  };

  const toggleNewsletter = (value) => {
    setCheckedNewsletters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">{title}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder={email_placeholder || 'Enter your email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />

          {
            messages.map((message, index) => (
              <div key={index} className={`text-${message.color}-600 text-sm !mt-1`}>
                {message.text}
              </div>
            ))
          }

          {
            newsletters_config.map((newsletter) => (
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
            ))
          }

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {submit_button_text || 'Subscribe'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UnidyNewsletter;
