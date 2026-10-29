import "../styles/css/LiveCard.css";

export default function LiveCard({ type, label, value }) {
  return (
    <div className={`measure ${type}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}