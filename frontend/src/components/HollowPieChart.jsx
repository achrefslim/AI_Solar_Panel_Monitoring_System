import Chart from "react-apexcharts";
import { useMemo } from "react";

export default function HollowPieChart({ data }) {
  const power = data.puissance.at(-1) || 0;
  const energy = data.energie.at(-1) || 0;
  const efficiency = data.efficiency.at(-1) || 0;

  const total = useMemo(() => {
    return Math.round(power + energy + efficiency);
  }, [power, energy, efficiency]);

  return (
    <div className="hollow-pie-card">
      <Chart
        type="donut"
        height={300}
        options={{
          chart: {
            background: "transparent",
          },

          labels: ["Power", "Energy", "Efficiency"],

          legend: {
            show: true,
            position: "bottom",
            fontSize: "13px",
            labels: { colors: "var(--text)" },
            markers: { width: 10, height: 10 },
          },

          stroke: {
            width: 0,
            colors: ["transparent"]
          },

          fill: {
            type: "gradient",
            gradient: {
              shade: "dark",
              shadeIntensity: 0.6,
              type: "horizontal",
              opacityFrom: 0.9,
              opacityTo: 0.6,
              stops: [0, 100]
            }
          },

          plotOptions: {
            pie: {
              expandOnClick: true,

              donut: {
                size: "72%",

                labels: {
                  show: true,
                  total: {
                    show: true,
                    label: "Total",
                    color: "var(--muted)",
                    fontSize: "15px",
                    formatter: () => total
                  },
                  value: {
                    show: true,
                    fontSize: "22px",
                    color: "var(--energy-blue)",
                    fontWeight: 700,
                    offsetY: 6
                  },
                  name: {
                    show: true,
                    offsetY: -10,
                    color: "var(--muted)",
                    fontSize: "12px",
                    fontWeight: 500
                  }
                }
              }
            }
          },

          colors: [
            "var(--energy-blue)",
            "var(--energy-green)",
            "var(--energy-purple)"
          ],

          dataLabels: {
            enabled: false
          },

          tooltip: {
            theme: "dark",
            style: { fontSize: "12px" },
            y: {
              formatter: (val) => `${val}`
            }
          }
        }}
        series={[power, energy, efficiency]}
      />
    </div>
  );
}