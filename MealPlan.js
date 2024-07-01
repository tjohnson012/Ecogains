import React from 'react';

function MealPlan({ mealPlan }) {
  return (
    <div className="meal-plan">
      <h2>Your Meal Plan</h2>
      {mealPlan.map((meal, index) => (
        <div key={index} className="meal">
          <h3>{meal.type}</h3>
          <p><strong>{meal.name}</strong></p>
          <p>Calories: {meal.calories}</p>
          <p>Protein: {meal.protein}g</p>
          <p>Carbs: {meal.carbs}g</p>
          <p>Fat: {meal.fat}g</p>
          <p>Sustainability Score: {meal.sustainabilityScore}/100</p>
        </div>
      ))}
    </div>
  );
}

export default MealPlan;