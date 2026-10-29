import Chart from "react-apexcharts";
import "../styles/css/GaugeCard.css";
import { useEffect, useState } from "react";

export default function GaugeCard({ value = 0 }) {
  const maxValue = 2;
  const [safeValue, setSafeValue] = useState(0);
  const percentage = (safeValue / maxValue) * 100;

  useEffect(() => {
    const clamped = Math.max(0, Math.min(maxValue, Number(value) || 0));
    setSafeValue(clamped);
  }, [value]);
  
  const options = {
    chart: { type: "radialBar", sparkline: { enabled: true } },

    plotOptions: {
      radialBar: {
        startAngle: -120,
        endAngle: 120,
        max: 100,

        hollow: { margin: 0, size: "55%", background: "transparent" },

        track: {
          background: "rgba(255,255,255,0.05)",
          margin: 0,
          strokeWidth: "100%"
        },

        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 12,
            fontSize: "26px",
            fontWeight: 700,
            color: "#00f2fe",

            formatter: () => `${((safeValue / maxValue) * 100).toFixed(0)}%`
          }
        }
      }
    },

    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        gradientToColors: ["var(--energy-green)"],
        stops: [0, 100]
      },
      colors: ["var(--energy-blue)"]
    },

    stroke: {
      lineCap: "round"
    }
  };

  return (
    <div className="gauge-card">
      <h3 className="gauge-title">Performance</h3>
      <Chart options={options} series={[percentage]} type="radialBar" height={240} />
      <div className="gauge-sub">Performance Compared To MAX Output</div>
    </div>
  );
}