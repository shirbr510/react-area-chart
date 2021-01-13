import React, { useState } from "react";
import AreaChart from "./AreaChart";
import "./styles.css";

const points = [
  { x: 0, y: 100 },
  { x: 20, y: 20 },
  { x: 40, y: 50 },
  { x: 60, y: 20 },
  { x: 80, y: 50 },
  { x: 100, y: 20 }
];

function App() {
  const [svgWidth, setSvgWidth] = useState(200);
  const onSliderChange = (event) => setSvgWidth(event.target.value);
  return (
    <>
      <div>
        <span>Current Width {svgWidth}</span>
      </div>
      <div>
        <input
          type="range"
          min="100"
          max="800"
          value={svgWidth}
          onChange={onSliderChange}
        />
      </div>
      <AreaChart width={svgWidth} points={points} />
    </>
  );
}

export default App;
