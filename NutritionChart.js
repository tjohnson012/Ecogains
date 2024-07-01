import React from 'react';

function NutritionChart({ mealPlan }) {
  if (!mealPlan || !mealPlan.protein || !mealPlan.carbs || !mealPlan.fats) {
    return <p>No nutritional data available</p>;
  }

  const total = mealPlan.protein + mealPlan.carbs + mealPlan.fats;
  const radius = 50;
  const centerX = 60;
  const centerY = 60;

  const proteinAngle = (mealPlan.protein / total) * 360;
  const carbsAngle = (mealPlan.carbs / total) * 360;
  const fatsAngle = (mealPlan.fats / total) * 360;

  const getCoordinatesForAngle = (angle) => {
    const x = centerX + radius * Math.cos(angle * Math.PI / 180);
    const y = centerY + radius * Math.sin(angle * Math.PI / 180);
    return [x, y];
  };

  const proteinPath = `M${centerX},${centerY} L${centerX},${centerY - radius} A${radius},${radius} 0 ${proteinAngle > 180 ? 1 : 0},1 ${getCoordinatesForAngle(proteinAngle)} Z`;
  const carbsPath = `M${centerX},${centerY} L${getCoordinatesForAngle(proteinAngle)} A${radius},${radius} 0 ${carbsAngle > 180 ? 1 : 0},1 ${getCoordinatesForAngle(proteinAngle + carbsAngle)} Z`;
  const fatsPath = `M${centerX},${centerY} L${getCoordinatesForAngle(proteinAngle + carbsAngle)} A${radius},${radius} 0 ${fatsAngle > 180 ? 1 : 0},1 ${centerX},${centerY - radius} Z`;

  return (
    <svg width="120" height="140">
      <path d={proteinPath} fill="#FF6384" />
      <path d={carbsPath} fill="#36A2EB" />
      <path d={fatsPath} fill="#FFCE56" />
      <text x="60" y="130" textAnchor="middle" fontSize="12">Protein: {mealPlan.protein}g</text>
      <text x="60" y="145" textAnchor="middle" fontSize="12">Carbs: {mealPlan.carbs}g</text>
      <text x="60" y="160" textAnchor="middle" fontSize="12">Fats: {mealPlan.fats}g</text>
    </svg>
  );
}

export default NutritionChart;