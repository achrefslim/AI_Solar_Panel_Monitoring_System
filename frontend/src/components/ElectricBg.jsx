import { useEffect } from "react";

export default function ElectricBg() {

  useEffect(() => {
    const container = document.getElementById("electric-global-bg");
    if (!container) return;
    
    const lineCount = 7;
    for (let i = 0; i < lineCount; i++) {
      const line = document.createElement("div");
      line.className = "pulse-line";
      container.appendChild(line);
    }
    
    const numFlows = 25;
    const flows = [];

    for (let i = 0; i < numFlows; i++) {
      const el = document.createElement("div");
      el.className = "electric-flow";
      el.style.left = Math.random() * window.innerWidth + "px";
      el.style.top = Math.random() * window.innerHeight + "px";
      container.appendChild(el);
      flows.push(el);
    }
    
    function animateFlow() {
      flows.forEach(el => {
        let y = parseFloat(el.style.top);
        y += 1 + Math.random() * 2;
        if (y > window.innerHeight) y = -10;
        el.style.top = y + "px";
      });
      requestAnimationFrame(animateFlow);
    }
    animateFlow();

    return () => container.innerHTML = "";
  }, []);

  return <div id="electric-global-bg"></div>;
}