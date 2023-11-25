import React, { useState, useEffect } from "react";
import Messages from "./Messages";

const StripeTerminal = () => {
  // State variables
  const [readersList, setReadersList] = useState(null);
  const [readerId, setReaderId] = useState(null);
  const [reader, setReader] = useState(null);
  const [amount, setAmount] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [messages, setMessages] = useState([]);

  // Fetch readers on component mount
  useEffect(() => {
    const fetchReaders = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/readers");
        const result = await response.json();

        // Assuming result.readersList.data is an array
        setReadersList(result.readersList.data);
      } catch (error) {
        console.error("Error fetching readers:", error.message);
      }
    };

    fetchReaders();
  }, []);

  // Handlers
  const addMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const reset = () => {
    setPaymentIntent(null);
    setAmount(null);
    setReader(null);
  };

  const processPayment = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/readers/process-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount, readerId }),
        }
      );

      const result = await response.json();

      const { error } = result;

      if (error) {
        addMessage(error.message);
        return;
      }

      setReader(result.reader);
      setPaymentIntent(result.paymentIntent);

      addMessage(
        `Processing payment for ${amount} on reader ${result.reader.label}`
      );
    } catch (error) {
      console.error("Error processing payment:", error.message);
    }
  };

  const simulatePayment = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/readers/simulate-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ readerId: reader.id }),
        }
      );

      const result = await response.json();
      const { error } = result;

      if (error) {
        addMessage(error.message);
        return;
      }

      addMessage(
        `Simulating a customer tapping their card on simulated reader ${reader.id} for payment ${paymentIntent.id}`
      );
    } catch (error) {
      console.error("Error simulating payment:", error.message);
    }
  };

  const capturePayment = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/payments/capture",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        }
      );

      const result = await response.json();
      const { error } = result;

      if (error) {
        addMessage(error.message);
        return;
      }

      setPaymentIntent(result.paymentIntent);
      addMessage(`Captured payment for ${result.paymentIntent.id}`);
      reset();
    } catch (error) {
      console.error("Error capturing payment:", error.message);
    }
  };

  const cancelAction = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/payments/cancel-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ readerId }),
        }
      );

      const result = await response.json();
      const { error } = result;

      if (error) {
        // Handle error
        console.error("Error:", error.message);
        return;
      }

      setReaderId(result.reader.id);
      // Handle success
      console.log(
        `Canceled reader action on ${result.reader.label} (${result.reader.id})`
      );
      // Reset logic
      reset();
    } catch (error) {
      console.error("Error cancelling action:", error.message);
    }
  };

  // Computed properties
  const isSimulateable =
    reader &&
    reader.device_type &&
    reader.device_type.includes("simulated") &&
    paymentIntent &&
    paymentIntent.id;

  const isCapturable = paymentIntent && paymentIntent.id;
  const isProcessable = amount > 0 && readerId;

  return (
    <div className="sr-root" style={{ textAlign: "start" }}>
      <main className="sr-main">
        <h2>Collecting Payments with Stripe Terminal</h2>
        <p>Select a reader and input an amount for the transaction.</p>
        <p>
          You can use amounts ending in the certain values to produce specific
          responses. See{" "}
          <a href="https://stripe.com/docs/terminal/references/testing#physical-test-cards">
            the documentation
          </a>{" "}
          for more details.
        </p>
        <section>
          <div>
            <p>
              <strong>Payment Intent ID:</strong> {paymentIntent?.id}
            </p>
            <p>
              <strong>Payment Intent status:</strong> {paymentIntent?.status}
            </p>
          </div>
          <p>
            <strong>Reader Status:</strong> {reader?.action?.status}
          </p>
        </section>

        {/* Select Reader */}
        <form id="confirm-form">
          <label>Select Reader: </label>
          <select
            value={readerId || ""}
            onChange={(e) => setReaderId(e.target.value)}
            name="reader"
            id="reader-select"
            className="sr-select"
          >
            <option value="" disabled>
              Select a reader
            </option>
            {readersList &&
              readersList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.id})
                </option>
              ))}
          </select>

          <section className="sr-form-row">
            <label htmlFor="amount">Amount:</label>
            <input
              value={amount || ""}
              onChange={(e) => setAmount(e.target.value)}
              id="amount"
              className="sr-input"
            />
          </section>

          <section className="button-row">
            <button
              type="button"
              id="capture-button"
              onClick={processPayment}
              disabled={!isProcessable}
            >
              Process
            </button>
            <button
              type="button"
              id="capture-button"
              onClick={capturePayment}
              disabled={!isCapturable}
            >
              Capture
            </button>
          </section>

          <section className="button-row">
            <button
              id="simulate-payment-button"
              onClick={simulatePayment}
              type="button"
              disabled={!isSimulateable}
            >
              Simulate Payment
            </button>
            <button onClick={cancelAction} id="cancel-button" type="button">
              Cancel
            </button>
          </section>

          {/* Include SrMessages component here if needed */}
          <Messages />
        </form>
      </main>
    </div>
  );
};

export default StripeTerminal;
