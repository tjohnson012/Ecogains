import React from 'react';

function SustainabilityChart({ mealPlans }) {
  if (!mealPlans || mealPlans.length === 0) {
    return <p>No sustainability data available</p>;
  }

  const maxScore = 100;
  const barHeight = 20;
  const barGap = 5;
  const width = 300;

  return (
    <div>
      <h3>Sustainability Scores</h3>
      <svg width={width} height={(barHeight + barGap) * mealPlans.length}>
        {mealPlans.map((plan, index) => (
          <g key={index} transform={`translate(0, ${index * (barHeight + barGap)})`}>
            <rect
              width={(plan.sustainabilityScore / maxScore) * width}
              height={barHeight}
              fill="#4CAF50"
            />
            <text
              x={(plan.sustainabilityScore / maxScore) * width + 5}
              y={barHeight / 2}
              dominantBaseline="middle"
              fontSize="12"
            >
              {plan.sustainabilityScore}
            </text>
            <text
              x="0"
              y={-5}
              fontSize="10"
              fill="#333"
            >
              Plan {index + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default SustainabilityChart;