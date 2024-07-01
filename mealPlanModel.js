import * as tf from '@tensorflow/tfjs';

// Define meal plan templates
const mealPlanTemplates = [
  { name: "Balanced", calories: 2000, protein: 150, carbs: 200, fats: 67, fruitsVeggies: 5, grains: 6, groceryList: [] },
  { name: "High-Protein Lean Bulk", calories: 2500, protein: 200, carbs: 250, fats: 83, fruitsVeggies: 6, grains: 7, groceryList: [] },
  { name: "Low-Carb Muscle Gain", calories: 2200, protein: 180, carbs: 110, fats: 122, fruitsVeggies: 7, grains: 3, groceryList: [] },
];

// Define the model architecture
function createModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [4] }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 5, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

// Generate dummy data for training
function generateDummyData(numSamples) {
  const xs = [];
  const ys = [];

  for (let i = 0; i < numSamples; i++) {
    xs.push([
      Math.floor(Math.random() * 3),
      1500 + Math.random() * 2000,
      Math.floor(Math.random() * 3),
      50 + Math.random() * 100
    ]);

    ys.push([
      0.2 + Math.random() * 0.3,
      0.2 + Math.random() * 0.3,
      0.1 + Math.random() * 0.2,
      0.1 + Math.random() * 0.2,
      0.1 + Math.random() * 0.2
    ]);
  }

  return { xs, ys };
}

// Train the model
async function trainModel(model, xs, ys, epochs = 100) {
  const history = await model.fit(tf.tensor2d(xs), tf.tensor2d(ys), {
    epochs: epochs,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
      }
    }
  });

  return history;
}

// Generate a meal plan based on user preferences
export function generateMealPlan(model, userPreferences) {
  if (!mealPlanTemplates || mealPlanTemplates.length === 0) {
    throw new Error("Meal plan templates are not defined or empty");
  }

  const [dietType, targetCalories, goalType, currentWeight] = userPreferences;
  
  let selectedTemplate = mealPlanTemplates[0]; // Default to balanced plan
  if (dietType === 1 && mealPlanTemplates[2]) { // low-carb
    selectedTemplate = mealPlanTemplates[2]; // Low-Carb Muscle Gain
  } else if (dietType === 2 && mealPlanTemplates[1]) { // high-protein
    selectedTemplate = mealPlanTemplates[1]; // High-Protein Lean Bulk
  }

  if (!selectedTemplate) {
    throw new Error("Failed to select a meal plan template");
  }

  const calorieAdjustmentFactor = targetCalories / selectedTemplate.calories;

  // Adjust macros based on target calories
  const adjustedPlan = {
    ...selectedTemplate,
    name: selectedTemplate.name,
    calories: targetCalories,
    protein: Math.round(selectedTemplate.protein * calorieAdjustmentFactor),
    carbs: Math.round(selectedTemplate.carbs * calorieAdjustmentFactor),
    fats: Math.round(selectedTemplate.fats * calorieAdjustmentFactor),
    fruitsVeggies: Math.round(selectedTemplate.fruitsVeggies * calorieAdjustmentFactor),
    grains: Math.round(selectedTemplate.grains * calorieAdjustmentFactor),
  };

  // Ensure macros add up to total calories
  const totalCaloriesFromMacros = adjustedPlan.protein * 4 + adjustedPlan.carbs * 4 + adjustedPlan.fats * 9;
  if (totalCaloriesFromMacros !== targetCalories) {
    const diff = targetCalories - totalCaloriesFromMacros;
    adjustedPlan.carbs += Math.round(diff / 4); // Adjust carbs to make up the difference
  }

  // Generate grocery list based on the adjusted plan
  const groceryList = generateGroceryList(adjustedPlan);

  return {
    ...adjustedPlan,
    groceryList
  };
}

// Generate a grocery list based on the meal plan
function generateGroceryList(mealPlan) {
  const groceryList = [];

  const categories = [
    { name: 'Proteins', sources: ['Chicken', 'Beef', 'Fish', 'Tofu', 'Eggs'], amount: mealPlan.protein, unit: 'g' },
    { name: 'Carbs', sources: ['Rice', 'Quinoa', 'Sweet Potato', 'Oats'], amount: mealPlan.carbs, unit: 'g' },
    { name: 'Fats', sources: ['Avocado', 'Olive Oil', 'Nuts', 'Seeds'], amount: mealPlan.fats, unit: 'g' },
    { name: 'Fruits', sources: ['Apples', 'Bananas', 'Berries', 'Oranges'], amount: Math.round(mealPlan.fruitsVeggies / 2), unit: 'servings' },
    { name: 'Vegetables', sources: ['Spinach', 'Broccoli', 'Carrots', 'Bell Peppers'], amount: Math.round(mealPlan.fruitsVeggies / 2), unit: 'servings' },
    { name: 'Grains', sources: ['Bread', 'Pasta', 'Cereal'], amount: mealPlan.grains, unit: 'servings' },
  ];

  categories.forEach(category => {
    groceryList.push({
      category: category.name,
      items: [{
        item: category.sources[Math.floor(Math.random() * category.sources.length)],
        amount: category.amount,
        unit: category.unit
      }]
    });
  });

  return groceryList;
}

// Main function to create, train, and use the model
export async function setupMealPlanModel() {
  const model = createModel();
  const { xs, ys } = generateDummyData(1000);  // Generate 1000 dummy samples
  await trainModel(model, xs, ys);

  return model;
}

// Function to use the trained model
export function useMealPlanModel(model, userPreferences) {
  const input = tf.tensor2d([userPreferences]);
  const prediction = model.predict(input);
  const mealPlanRatios = prediction.dataSync();
  
  return generateMealPlan(model, userPreferences, mealPlanRatios);
}