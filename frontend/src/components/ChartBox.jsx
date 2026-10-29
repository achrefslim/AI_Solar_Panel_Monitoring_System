import "../styles/css/ChartBox.css";
import SensorChart from "./SensorChart";

export default function ChartBox({ chartData }) {
  return (
    <div id="chartCard">
      <SensorChart data={chartData} />
    </div>
  );
}