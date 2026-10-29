import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function SensorChart({ data }) {
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
            label: "Power (W)",
            data: data.puissance,
            borderWidth: 3,
            tension: 0.35,
            yAxisID: "y",
            fill: false,
            
            borderColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return "#2ecc71";

              const gradient = c.createLinearGradient(
                chartArea.left, 0,
                chartArea.right, 0
              );
              gradient.addColorStop(0, "rgba(46,204,113,0.2)");
              gradient.addColorStop(1, "rgba(46,204,113,1)");
              return gradient;
            }
          },

          {
            label: "Energy (Wh)",
            data: data.energie,
            borderWidth: 3,
            tension: 0.35,
            yAxisID: "y1",
            fill: false,
            
            borderColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return "#f39c12";

              const gradient = c.createLinearGradient(
                chartArea.left, 0,
                chartArea.right, 0
              );
              gradient.addColorStop(0, "rgba(243,156,18,0.2)");
              gradient.addColorStop(1, "rgba(243,156,18,1)");
              return gradient;
            }
          }
        ]
      },

      options: {
        responsive: true,
        animation: false,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },

        scales: {
          y: {
            position: "left",
            title: { display: true, text: "Power (W)" },
            ticks: { color: "#ffffff" }
          },
          y1: {
            position: "right",
            title: { display: true, text: "Energy (Wh)" },
            grid: { drawOnChartArea: false },
            ticks: { color: "#ffffff" }
          }
        },

        plugins: {
          legend: {
            labels: { color: "#ffffff" }
          }
        }
      }
    });

    return () => chartInstance.current.destroy();
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;

    chartInstance.current.data.labels = data.labels;
    chartInstance.current.data.datasets[0].data = data.puissance;
    chartInstance.current.data.datasets[1].data = data.energie;

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