import { useRef, useEffect } from "react";
import "../styles/css/AccuarcyChart.css";
import { Chart } from "chart.js";

const colors = {
  text: "#e6f7ff",
  accent: "#00f2fe",
  accentGlow: "rgba(0,242,254,0.4)",
  success: "#00f5a0",
  warning: "#ffbd69",
  grid: "rgba(230, 247, 255, 0.1)",
};

function HistoricalChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Real (Wh)",
            data: data.real,
            borderWidth: 3,
            tension: 0.3,
            yAxisID: "y",
            fill: false,
            
            borderColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return colors.success;

              const g = c.createLinearGradient(
                chartArea.left, 0,
                chartArea.right, 0
              );
              g.addColorStop(0, "rgba(0,245,160,0.25)");
              g.addColorStop(1, colors.success);
              return g;
            },
            shadowColor: colors.success,
            shadowBlur: 15
          },

          {
            label: "Prediction (Wh)",
            data: data.predicted,
            borderWidth: 3,
            tension: 0.3,
            yAxisID: "y1",
            fill: false,
            
            borderColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return colors.accent;

              const g = c.createLinearGradient(
                chartArea.left, 0,
                chartArea.right, 0
              );
              g.addColorStop(0, "rgba(0,242,254,0.25)");
              g.addColorStop(1, colors.accent);
              return g;
            },
            shadowColor: colors.accent,
            shadowBlur: 15
          }
        ]
      },

      options: {
        responsive: true,
        animation: false,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },

        scales: {
          x: {
            ticks: { color: colors.text },
            grid: { color: colors.grid }
          },
          y: {
            position: "left",
            title: { display: true, text: "Real (W)", color: colors.text },
            ticks: { color: colors.text },
            grid: { color: colors.grid }
          },
          y1: {
            position: "right",
            title: { display: true, text: "Prediction (Wh)", color: colors.text },
            ticks: { color: colors.text },
            grid: { drawOnChartArea: false }
          }
        },

        plugins: {
          legend: {
            labels: { color: colors.text, padding: 15 }
          },
          tooltip: {
            backgroundColor: "rgba(0, 20, 40, 0.8)",
            titleColor: colors.text,
            bodyColor: colors.text,
            borderColor: colors.accentGlow,
            borderWidth: 1
          }
        }
      }
    });

    return () => chartInstance.current.destroy();
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;

    chartInstance.current.data.labels = data.labels;
    chartInstance.current.data.datasets[0].data = data.real;
    chartInstance.current.data.datasets[1].data = data.predicted;

    chartInstance.current.update("none");
  }, [data]);

  return (
    <canvas
      ref={chartRef}
      width="650"
      height="300"
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    />
  );
}

export default function AccuracyChart({ chartData }) {
  return (
    <div id="accuracyCard">
      <HistoricalChart data={chartData} />
    </div>
  );
}