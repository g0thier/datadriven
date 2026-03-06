/* Add this line to your index.html head section to load the Material Symbols font:

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />

*/

import React from "react";

export default function MaterialIcon({
  name,
  size = 24,
  weight = 400,
  fill = 0,
  grad = 0,
  className = ""
}) {
  const style = {
    fontVariationSettings: `
      'FILL' ${fill},
      'wght' ${weight},
      'GRAD' ${grad},
      'opsz' ${size}
    `,
    fontSize: size
  };

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={style}
    >
      {name}
    </span>
  );
}

/* Usage example:

import MaterialIcon from "../components/MaterialIcon";

function App() {
  return (
    <div>
      <MaterialIcon name="arrow_back" />
      <MaterialIcon name="home" size={32} />
      <MaterialIcon name="favorite" fill={1} weight={700} />
    </div>
  );
}

export default App; 

*/