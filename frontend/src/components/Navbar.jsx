import { useMemo } from "react";

export default function Navbar({ chartData, weatherData, sensorData }) {
  const user = useMemo(() => {
    return localStorage.getItem("solar_user");
  }, []);
  
  const exportCSV = (chartData, weatherData, sensorData) => {
    const choice = prompt(
      "What do you want to export?\nOptions: power, energy, temperature, humidity"
    );

    if (!choice) return alert("Export cancelled.");

    let rows = [];

    switch (choice.toLowerCase()) {
      case "power":
        rows = chartData.labels.map((label, i) => ({
          time: label,
          power_watts: chartData.puissance[i],
        }));
        break;

      case "energy":
        rows = chartData.labels.map((label, i) => ({
          time: label,
          energy_Wh: chartData.energie[i],
        }));
        break;

      case "temperature":
        rows = [
          {
            temperature: weatherData.temperature || "--",
          },
        ];
        break;

      case "humidity":
        rows = [
          {
            humidity: sensorData.humidity || "--",
          },
        ];
        break;

      default:
        return alert("Invalid choice.");
    }

    const csvHeader = Object.keys(rows[0]).join(",") + "\n";
    const csvBody = rows.map((r) => Object.values(r).join(",")).join("\n");
    const csv = csvHeader + csvBody;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${choice}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  const handleHistoryChange = (val) => {
    console.log("History changed to:", val);
  };

  return (
    <header>
      <h1 className="aurora">Solar Panel Dashboard</h1>
      <div className="controls" style={{ marginLeft: "auto" }}>
        
        {/* {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              color: '#00eaff', 
              fontWeight: '600',
              fontSize: '16px',
              textShadow: '0 0 8px rgba(0,234,255,0.5)'
            }}>
              Welcome, {user.username}
            </span>
            <button 
              className="btn btn-primary" 
              style={{ 
                padding: '8px 16px',
                fontSize: '14px',
                background: 'rgba(255,75,92,0.2)',
                border: '1px solid rgba(255,75,92,0.5)'
              }}
            >
              Logout
            </button>
          </div>
        )} */}
        
        <div className="btn-wrapper">
          <button className="btn btn-primary" onClick={() => exportCSV(chartData, weatherData, sensorData)}>Export as CSV</button>
          <select className="btn btn-primary" onChange={e => handleHistoryChange(e.target.value)}>
            <option value="60">History 1 min</option>
            <option value="300">History 5 min</option>
            <option value="600">History 10 min</option>
            <option value="all">All</option>
          </select>
        </div>
        
      </div>
      
    </header>
    
  );
}