import { useEffect, useState } from "react";
import "../styles/css/Dashboard.css";

import ChartBox from "./ChartBox";
import AccuracyChart from "./AccuracyChart";
import LiveCard from "./LiveCard";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import GaugeCard from "./GaugeCard";

import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase/config";

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

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const getWeather = async (lat, lon) => {
  const url = `https://api.openweathermap.org/data/2.5/weather`;
  const { data } = await axios.get(url, {
    params: { lat, lon, appid: WEATHER_API_KEY, units: "metric" }
  });

  const safeCloud =
    data.clouds && typeof data.clouds.all === "number"
      ? data.clouds.all
      : Math.floor(Math.random() * 50);

  return {
    temperature: Math.round(data.main.temp) + "°C",
    verdict: data.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`,
    humidity: data.main.humidity + "%",
    cloudCover: (safeCloud < 10 ? "0" + safeCloud : safeCloud) + "%",
    windSpeed: data.wind.speed + " m/s"
  };
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [weatherData, setWeatherData] = useState({});
  const [nominalPower, setNominalPower] = useState(0);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  const [sensorData, setSensorData] = useState({
    courant: "-- A",
    tension: "-- V",
    puissance: "-- W",
    lumiere: "-- %",
    energie: "-- Wh",
    solarIrradiance: "-- W/m²",
    solarProduction: "-- W",
    humidity: "-- %",
    windSpeed: "-- m/s"
  });

  const [chartData, setChartData] = useState({
    labels: [],
    puissance: [],
    energie: []
  });

  const [historyReal, setHistoryReal] = useState([]);
  const [historyPredicted, setHistoryPredicted] = useState([]);

  const [historyChartData, setHistoryChartData] = useState({
    labels: [],
    real: [],
    predicted: []
  });

  const [nextHourPrediction, setNextHourPrediction] = useState("--");
  const [errorMessages, setErrorMessages] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem("solar_user")) navigate("/auth/login");

    const locationRef = ref(rtdb, "location");
    onValue(locationRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const { lat, lon } = snapshot.val();
      getWeather(lat, lon).then(setWeatherData);
    });

    const sensorRef = ref(rtdb, "sensors");
    const unsubscribeSensors = onValue(sensorRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const s = snapshot.val();
      const realPower =
        s.power === 0 ? Math.abs(s.voltage * s.current) : s.power;

      setSensorData({
        courant: `${Math.abs(s.current)} A`,
        tension: `${Math.abs(s.voltage)} V`,
        puissance: `${realPower.toFixed(2)} W`,
        energie: `-- Wh`,
        lumiere: "-- %",
        solarIrradiance: "--",
        solarProduction: "--",
        humidity: `${s.humidity} %`,
        windSpeed: "-- m/s"
      });
    });

    const realHistoryRef = ref(rtdb, "realHistory");
    const unsubscribeRealHistory = onValue(realHistoryRef, (snapshot) => {
      if (!snapshot.exists()) {
        setChartData({ labels: [], puissance: [], energie: [] });
        return;
      }

      const data = snapshot.val();
      const list = Object.values(data).sort((a, b) => a.time - b.time);

      setChartData({
        labels: list.map(e => e.time),
        puissance: list.map(e => Number(e.power)),
        energie: list.map(e => Number(e.energy))
      });
    });

    const realRef = ref(rtdb, "history/real");
    const unsubscribeReal = onValue(realRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) return setHistoryReal([]);

      const list = Object.values(val).sort((a, b) => a.hour - b.hour);
      setHistoryReal(list);
    });

    const predRef = ref(rtdb, "history/predicted");
    const unsubscribePred = onValue(predRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) return setHistoryPredicted([]);

      const list = Object.values(val).sort((a, b) => a.hour - b.hour);
      setHistoryPredicted(list);
    });

    const alertsRef = ref(rtdb, "alerts");
    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setErrorMessages([]);
        return;
      }

      const data = snapshot.val();
      const list = Object.entries(data).map(([id, alert]) => ({
        id,
        title: alert.title || "",
        description: alert.content || "",
        timestamp: alert.time || ""
      }));

      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setErrorMessages(list);
    });

    return () => {
      unsubscribeSensors();
      unsubscribeRealHistory();
      unsubscribeReal();
      unsubscribePred();
      unsubscribeAlerts();
    };
  }, [navigate]);

  useEffect(() => {
    if (!historyReal.length || !historyPredicted.length) {
      setHistoryChartData({ labels: [], real: [], predicted: [] });
      return;
    }
    
    const pastPred = historyPredicted.slice(0, -1);
    if (!pastPred.length) {
      setHistoryChartData({ labels: [], real: [], predicted: [] });
      return;
    }

    const len = Math.min(historyReal.length, pastPred.length);
    const realSlice = historyReal.slice(-len);
    const predSlice = pastPred.slice(-len);

    setHistoryChartData({
      labels: realSlice.map((e) => `Hour ${e.hour}`),
      real: realSlice.map((e) => e.value),
      predicted: predSlice.map((e) => e.value)
    });

    const next = historyPredicted.at(-1);
    setNextHourPrediction(next ? next.value.toFixed(2) : "--");
  }, [historyReal, historyPredicted]);

  useEffect(() => {
    if (!historyReal.length) return;
    const lastEnergy = historyReal.at(-1).value;

    setSensorData(prev => ({
      ...prev,
      energie: `${Number(lastEnergy).toFixed(2)} Wh`
    }));
  }, [historyReal]);

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
          <Navbar
            chartData={chartData}
            weatherData={weatherData}
            sensorData={sensorData}
          />

          <section id="measure-container">
            <div className="measure-cells">
              <LiveCard type="courant" label="Current" value={sensorData.courant} />
              <LiveCard type="tension" label="Voltage" value={sensorData.tension} />
              <LiveCard type="puissance" label="Power" value={sensorData.puissance} />
              <LiveCard type="energie" label="Energy" value={sensorData.energie} />
              <LiveCard type="lumiere" label="Cloud Cover" value={weatherData.cloudCover || "-- %"} />

              <LiveCard
                type="prediction"
                id="next-hour-prediction"
                label="Next Hour (Predicted)"
                value={nextHourPrediction === "--" ? "-- W" : `${nextHourPrediction} W`}
              />
            </div>

            <div className="measure-extra">
              <GaugeCard value={
                (historyReal && historyReal.length > 0) ? historyReal.at(-1).value : 0  
              }/>
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
                  className={`chat-message ${
                    msg.sender === "user" ? "user-msg" : "bot-msg"
                  }`}
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
                onKeyDown={(e) =>
                  !isSending && e.key === "Enter" && sendMessage()
                }
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