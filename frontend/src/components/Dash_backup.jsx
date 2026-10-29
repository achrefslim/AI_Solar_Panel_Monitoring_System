import { useEffect, useState } from "react";
import "../styles/css/Dashboard.css";

import ChartBox from "./ChartBox";
import AccuracyChart from "./AccuracyChart";
import LiveCard from "./LiveCard";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import GaugeCard from "./GaugeCard";

const ErrorMessages = ({ messages }) => {
  return (
    <div className="error-messages-container">
      <div className="error-header">
        <h3>System Messages</h3>
        <span className="error-count">{messages.length} Alerts</span>
      </div>
      <div className="error-list">
        {messages.map(error => (
          <div key={error.id} className="error-item error-critical">
            <div className="error-icon">🔴</div>
            <div className="error-content">
              <div className="error-title">{error.title}</div>
              <div className="error-description">{error.description}</div>
              <div className="error-meta">
                <span className="error-time">{error.timestamp}</span>
              </div>
            </div>
            <div className="error-actions">
              <button className="error-action-btn">✓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const genMockSensor = () => ({
  courant: `${(Math.random() * 10).toFixed(2)} A`,
  tension: `${(Math.random() * 240).toFixed(2)} V`,
  puissance: `${(Math.random() * 500).toFixed(2)} W`,
  energie: `${(Math.random() * 50).toFixed(2)} Wh`,
  lumiere: `${Math.floor(Math.random() * 100)} %`,
  solarIrradiance: `${Math.floor(Math.random() * 1000)} W/m²`,
  solarProduction: `${(Math.random() * 500).toFixed(2)} W`,
  humidity: `${Math.floor(Math.random() * 100)} %`,
  windSpeed: `${(Math.random() * 10).toFixed(1)} m/s`
});

const genMockChart = () => {
  const length = 24;
  const labels = Array.from({ length }, (_, i) => `T${i}`);
  const puissance = labels.map(() => 100 + Math.random() * 400);
  const energie = puissance.map((p, i) => (p * i) / 120);

  return { labels, puissance, energie };
};

const genMockHistory = () => {
  const length = 12;
  const labels = Array.from({ length }, (_, i) => `Hour ${i}`);
  const real = labels.map(() => 40 + Math.random() * 80);
  const predicted = real.map(r => r + (Math.random() * 30 - 15));

  return { labels, real, predicted };
};

const genMockAlerts = () => ([
  {
    id: "1",
    title: "Inverter Overload",
    description: "Power exceeded safe limit",
    timestamp: "2025-11-25 20:10:00"
  },
  {
    id: "2",
    title: "Low Voltage",
    description: "Voltage dropped below threshold",
    timestamp: "2025-11-25 19:50:00"
  }
]);

const Dashboard = () => {
  const navigate = useNavigate();

  const [weatherData, setWeatherData] = useState({});
  const [nominalPower, setNominalPower] = useState(0);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  const [sensorData, setSensorData] = useState({});
  const [chartData, setChartData] = useState({ labels: [], puissance: [], energie: [] });
  const [historyChartData, setHistoryChartData] = useState({ labels: [], real: [], predicted: [] });

  const [nextHourPrediction, setNextHourPrediction] = useState("--");
  const [errorMessages, setErrorMessages] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem("solar_user")) navigate("/auth/login");

    setSensorData(genMockSensor());

    const chart = genMockChart();
    setChartData(chart);

    const hist = genMockHistory();
    setHistoryChartData(hist);

    setNextHourPrediction(hist.predicted.at(-1).toFixed(2));

    setErrorMessages(genMockAlerts());

    setWeatherData({
      temperature: "23°C",
      verdict: "clear sky",
      icon: "https://openweathermap.org/img/wn/01d@4x.png",
      humidity: "44%",
      cloudCover: "14%",
      windSpeed: "3.2 m/s"
    });
  }, [navigate]);

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const textToSend = input;
    setInput("");
    setIsAssistantTyping(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat", {
        message: textToSend
      });

      let botText = "";
      if (res.data.reply) botText = res.data.reply;
      else if (res.data.explanation && res.data.prediction !== undefined)
        botText = `Prediction: ${res.data.prediction} W\n${res.data.explanation}`;
      else botText = "I'm not sure how to answer that.";

      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to assistant." }
      ]);
    }

    setIsAssistantTyping(false);
    setIsSending(false);
  };

  return (
    <main id="dashboard-container">
      <section id="top-row">
        <div id="main">
          <Navbar chartData={chartData} weatherData={weatherData} sensorData={sensorData} />

          <section id="measure-container">
            <div className="measure-cells">
              <LiveCard type="courant" label="Current" value={sensorData.courant} />
              <LiveCard type="tension" label="Voltage" value={sensorData.tension} />
              <LiveCard type="puissance" label="Power" value={sensorData.puissance} />
              <LiveCard type="energie" label="Energy" value={sensorData.energie} />
              <LiveCard type="lumiere" label="Cloud Cover" value={weatherData.cloudCover} />

              <LiveCard
                type="prediction"
                id="next-hour-prediction"
                label="Next Hour (Predicted)"
                value={nextHourPrediction === "--" ? "-- W" : `${nextHourPrediction} W`}
              />
            </div>

            <div className="measure-extra">
              <GaugeCard value={nextHourPrediction} />
            </div>
          </section>

          <ChartBox chartData={chartData} />
        </div>

        <aside id="sidebar">
          <div id="thresholdCard">
            <label htmlFor="nominalPower">Nominal Power (W)</label>
            <input
              id="nominalPower"
              type="number"
              value={nominalPower}
              onChange={(e) => setNominalPower(parseFloat(e.target.value))}
            />
          </div>

          <div id="weatherCard">
            <div className="weather-left">
              <div className="weather-temp">{weatherData.temperature}</div>
              <div className="weather-verdict">{weatherData.verdict}</div>
            </div>
            <div className="weather-right">
              <div className="weather-icon">
                <img src={weatherData.icon} alt={weatherData.verdict} />
              </div>
            </div>
          </div>

          <div id="chatbox">
            <div className="chat-header">Solar Assistant</div>

            <div className="chat-container">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.sender === "user" ? "user-msg" : "bot-msg"}`}
                >
                  <div className="chat-bubble">{msg.text}</div>
                </div>
              ))}

              {isAssistantTyping && (
                <div className="chat-message bot-msg">
                  <div className="chat-bubble typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </div>

            <div id="chatInput">
              <input
                id="userMessage"
                placeholder="Ask about solar performance..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => !isSending && e.key === "Enter" && sendMessage()}
              />

              <button
                id="sendBtn"
                onClick={sendMessage}
                disabled={isSending}
                className={isSending ? "disabled-send" : ""}
                style={{ cursor: isSending ? "not-allowed" : "pointer" }}
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section id="bottom-row">
        <div className="bottom-left">
          <ErrorMessages messages={errorMessages} />
        </div>

        <div className="bottom-right">
          <AccuracyChart chartData={historyChartData} />
        </div>
      </section>
    </main>
  );
};

export default Dashboard;