import { useEffect } from "react";
import Chart from "react-apexcharts";

export default function LineChart({ data }) {
  const realSeries = data.labels.map((hour, i) => ({
    x: hour.toString(),
    y: Number(data.real[i] ?? 0)
  }));

  const predictedSeries = data.labels.map((hour, i) => ({
    x: hour.toString(),
    y: Number(data.predicted[i] ?? 0)
  }));

  useEffect(() => {
    console.log(data.labels)
  }, []);

  return (
    <div className="long-line-chart">
      <Chart
        type="line"
        height={260}
        series={[
          { name: "Real Energy", data: realSeries },
          { name: "Predicted Energy", data: predictedSeries }
        ]}
        options={{
          chart: {
            toolbar: { show: false },
            zoom: { enabled: false }
          },
          stroke: {
            curve: "smooth",
            width: 3
          },
          colors: ["var(--energy-blue)", "var(--energy-green)"],
          xaxis: {
            type: "category",
            categories: data.labels.map(h => h.toString()), // match series
            labels: { rotate: -45, style: { colors: "#aaa" } }
          },
          yaxis: {
            labels: {
              formatter: (val) => val.toFixed(1)
            }
          },
          grid: {
            borderColor: "rgba(255,255,255,0.1)"
          }
        }}
      />
    </div>
  );
}