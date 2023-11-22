import React from "react";

const Messages = ({ messages }) => {
  if (!messages || !Array.isArray(messages)) {
    // Handle the case when messages is undefined or not an array
    return null; // or render an appropriate message or fallback UI
  }

  const splitMessages = messages.map((x, index) => {
    const paymentIntentRe = /(pi_(\S*)\b)/;
    const paymentIntentMatch = x.match(paymentIntentRe);
    return {
      ...(paymentIntentMatch && { paymentIntent: paymentIntentMatch[0] }),
      content: x.replace(paymentIntentRe, "") || x,
      key: index,
    };
  });

  const addDashboardLinks = (paymentIntent) => {
    return `https://dashboard.stripe.com/test/payments/${paymentIntent}`;
  };

  return (
    <div id="messages" role="alert">
      {splitMessages.map((message) => (
        <span key={message.key}>
          &gt; {message.content}
          {message.paymentIntent && (
            <a href={addDashboardLinks(message.paymentIntent)}>
              {message.paymentIntent}
            </a>
          )}
          <br />
        </span>
      ))}
    </div>
  );
};

export default Messages;
