import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { setupMealPlanModel, generateMealPlan } from './mealPlanModel';
import ErrorBoundary from './ErrorBoundary';
import NutritionChart from './NutritionChart';
import SustainabilityChart from './SustainabilityChart';

const mealPlanTemplates = [
  {
    name: "Balanced Clean Bulk",
    protein: 180,
    carbs: 375,
    fats: 83,
    fruitsVeggies: 5,
    grains: 4,
    calories: 3000,
    groceryList: [
      { category: "Proteins", items: [
        { item: "Chicken Breast", amount: 500, unit: "g" },
        { item: "Salmon", amount: 300, unit: "g" },
        { item: "Greek Yogurt", amount: 500, unit: "g" },
        { item: "Eggs", amount: 12, unit: "pieces" }
      ]},
      { category: "Carbs", items: [
        { item: "Brown Rice", amount: 500, unit: "g" },
        { item: "Sweet Potato", amount: 500, unit: "g" },
        { item: "Oats", amount: 300, unit: "g" }
      ]},
      { category: "Fruits and Vegetables", items: [
        { item: "Broccoli", amount: 500, unit: "g" },
        { item: "Spinach", amount: 300, unit: "g" },
        { item: "Bananas", amount: 5, unit: "pieces" },
        { item: "Blueberries", amount: 200, unit: "g" }
      ]},
      { category: "Healthy Fats", items: [
        { item: "Avocado", amount: 2, unit: "pieces" },
        { item: "Almonds", amount: 100, unit: "g" },
        { item: "Olive Oil", amount: 100, unit: "ml" }
      ]}
    ]
  },
  {
    name: "High-Protein Lean Bulk",
    protein: 225,
    carbs: 300,
    fats: 83,
    fruitsVeggies: 4,
    grains: 3,
    calories: 2900,
    groceryList: [
      { category: "Proteins", items: [
        { item: "Lean Beef", amount: 500, unit: "g" },
        { item: "Turkey Breast", amount: 400, unit: "g" },
        { item: "Cottage Cheese", amount: 500, unit: "g" },
        { item: "Whey Protein", amount: 200, unit: "g" }
      ]},
      { category: "Carbs", items: [
        { item: "Quinoa", amount: 400, unit: "g" },
        { item: "Whole Grain Bread", amount: 1, unit: "loaf" },
        { item: "Lentils", amount: 300, unit: "g" }
      ]},
      { category: "Fruits and Vegetables", items: [
        { item: "Kale", amount: 300, unit: "g" },
        { item: "Bell Peppers", amount: 3, unit: "pieces" },
        { item: "Apples", amount: 4, unit: "pieces" },
        { item: "Strawberries", amount: 300, unit: "g" }
      ]},
      { category: "Healthy Fats", items: [
        { item: "Chia Seeds", amount: 100, unit: "g" },
        { item: "Walnuts", amount: 100, unit: "g" },
        { item: "Coconut Oil", amount: 100, unit: "ml" }
      ]}
    ]
  },
  {
    name: "Low-Carb Muscle Gain",
    protein: 200,
    carbs: 150,
    fats: 144,
    fruitsVeggies: 6,
    grains: 1,
    calories: 2700,
    groceryList: [
      { category: "Proteins", items: [
        { item: "Chicken Thighs", amount: 600, unit: "g" },
        { item: "Tuna", amount: 300, unit: "g" },
        { item: "Tofu", amount: 400, unit: "g" },
        { item: "Protein Powder", amount: 200, unit: "g" }
      ]},
      { category: "Low-Carb Veggies", items: [
        { item: "Cauliflower", amount: 500, unit: "g" },
        { item: "Zucchini", amount: 400, unit: "g" },
        { item: "Asparagus", amount: 300, unit: "g" },
        { item: "Mushrooms", amount: 300, unit: "g" }
      ]},
      { category: "Fruits", items: [
        { item: "Raspberries", amount: 200, unit: "g" },
        { item: "Blackberries", amount: 200, unit: "g" }
      ]},
      { category: "Healthy Fats", items: [
        { item: "Macadamia Nuts", amount: 100, unit: "g" },
        { item: "Peanut Butter", amount: 200, unit: "g" },
        { item: "Avocado Oil", amount: 100, unit: "ml" },
        { item: "Flax Seeds", amount: 50, unit: "g" }
      ]}
    ]
  }
];

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [preferences, setPreferences] = useState({
    diet: 'balanced',
    calories: 2500,
    goal: 'maintain'
  });
  const [mealPlans, setMealPlans] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [sustainabilityScore, setSustainabilityScore] = useState(0);
  const [sustainabilitySuggestions, setSustainabilitySuggestions] = useState({});
  const [loading, setLoading] = useState(false);
  const [aiModel, setAiModel] = useState(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const model = await setupMealPlanModel();
        setAiModel(model);
        console.log('AI model loaded successfully');
      } catch (err) {
        console.error('Failed to load AI model:', err);
        setError('Failed to load AI model. Using predefined meal plans instead.');
      }
    }
    loadModel();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchMealPlans();
    }
  }, [token]);

  const authAxios = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const fetchUserProfile = async () => {
    try {
      const response = await authAxios.get('/api/profile');
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      handleLogout();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post('http://localhost:5000/api/register', { username, password });
      setSuccess('Registration successful. Please log in.');
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password });
      setToken(response.data.accessToken);
      localStorage.setItem('token', response.data.accessToken);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setMealPlans([]);
    setGroceryList([]);
    setSuccess('You have been logged out successfully.');
  };

  const fetchMealPlans = async () => {
    setLoading(true);
    try {
      const response = await authAxios.get('/api/mealplan');
      setMealPlans(response.data);
    } catch (err) {
      setError('Failed to fetch meal plans. Please try again later.');
    }
    setLoading(false);
  };

  const createMealPlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let adjustedPlan;

      if (aiModel) {
        // Use AI model if available
        const dietMap = { 'balanced': 0, 'low-carb': 1, 'high-protein': 2 };
        const goalMap = { 'lose': 0, 'maintain': 1, 'gain': 2 };
        
        const userPreferences = [
          dietMap[preferences.diet],
          parseInt(preferences.calories),
          goalMap[preferences.goal],
          70  // Assuming a default weight of 70kg
        ];

        console.log('Generating meal plan with preferences:', userPreferences);
        const aiGeneratedPlan = generateMealPlan(aiModel, userPreferences);
        console.log('AI generated plan:', aiGeneratedPlan);

        adjustedPlan = {
          ...preferences,
          ...aiGeneratedPlan
        };
      } else {
        // Use predefined templates if AI model is not available
        const template = mealPlanTemplates[Math.floor(Math.random() * mealPlanTemplates.length)];
        
        const calorieAdjustmentFactor = preferences.calories / template.calories;
        
        adjustedPlan = {
          ...template,
          calories: preferences.calories,
          protein: Math.round(template.protein * calorieAdjustmentFactor),
          carbs: Math.round(template.carbs * calorieAdjustmentFactor),
          fats: Math.round(template.fats * calorieAdjustmentFactor),
          fruitsVeggies: Math.round(template.fruitsVeggies * calorieAdjustmentFactor),
          grains: Math.round(template.grains * calorieAdjustmentFactor),
          diet: preferences.diet,
          goal: preferences.goal
        };
      }

      const response = await authAxios.post('/api/mealplan', adjustedPlan);

      console.log('Server response:', response.data);

      setMealPlans(prevPlans => [...prevPlans, response.data]);
      setGroceryList(response.data.groceryList || []);
      setSustainabilityScore(response.data.sustainabilityScore);
      setSustainabilitySuggestions(response.data.sustainabilitySuggestions || {});
      setSuccess('New meal plan created successfully!');
    } catch (err) {
      console.error('Error creating meal plan:', err);
      setError('Failed to create meal plan: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const updateMealPlan = async (id, updatedPlan) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAxios.put(`/api/mealplan/${id}`, updatedPlan);
      setMealPlans(mealPlans.map(plan => plan.id === id ? response.data : plan));
      setSuccess('Meal plan updated successfully!');
    } catch (err) {
      setError('Failed to update meal plan. Please try again.');
    }
    setLoading(false);
  };

  const deleteMealPlan = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await authAxios.delete(`/api/mealplan/${id}`);
      setMealPlans(mealPlans.filter(plan => plan.id !== id));
      setSuccess('Meal plan deleted successfully!');
    } catch (err) {
      setError('Failed to delete meal plan. Please try again.');
    }
    setLoading(false);
  };

  const handlePreferenceChange = (e) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>EcoGains</h1>
        <p className="subtitle">Sustainable Clean Bulk Planner</p>
      </header>
      
      {loading && <div className="loader">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!user ? (
        <div className="auth-container">
          <div className="auth-form">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Username" 
                required
              />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <button onClick={handleRegister} className="btn btn-secondary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </div>
      ) : (
        <div className="user-area">
          <div className="user-header">
            <p>Welcome, {user.username}!</p>
            <button onClick={handleLogout} className="btn btn-small">Logout</button>
          </div>

          <div className="content-area">
            {aiModel ? (
              <div className="preferences-section">
                <h2>Create New Meal Plan</h2>
                <form onSubmit={createMealPlan} className="preferences-form">
                  <label htmlFor="diet">Diet Type:</label>
                  <select id="diet" name="diet" value={preferences.diet} onChange={handlePreferenceChange}>
                    <option value="balanced">Balanced</option>
                    <option value="low-carb">Low Carb</option>
                    <option value="high-protein">High Protein</option>
                  </select>
                  
                  <label htmlFor="calories">Daily Calories:</label>
                  <input 
                    id="calories"
                    type="number" 
                    name="calories" 
                    value={preferences.calories} 
                    onChange={handlePreferenceChange}
                    placeholder="Daily Calories"
                    min="1200"
                    max="5000"
                    required
                  />
                  
                  <label htmlFor="goal">Goal:</label>
                  <select id="goal" name="goal" value={preferences.goal} onChange={handlePreferenceChange}>
                    <option value="lose">Lose Weight</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Gain Weight</option>
                  </select>
                  
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Meal Plan'}
                  </button>
                </form>
              </div>
            ) : (
              <p>Loading AI model... Please wait.</p>
            )}

            <div className="meal-plans-section">
              <h2>Your Meal Plans</h2>
              {mealPlans.length === 0 ? (
                <p>You haven't created any meal plans yet. Use the form above to create one!</p>
              ) : (
                <div className="meal-plans-grid">
                  {mealPlans.map(plan => (
                    <div key={plan.id} className="meal-plan-card">
                      <h3>Meal Plan {plan.id}</h3>
                      <p><strong>Diet:</strong> {plan.diet}</p>
                      <p><strong>Calories:</strong> {plan.calories}</p>
                      <p><strong>Goal:</strong> {plan.goal}</p>
                      <h4>Macronutrients:</h4>
                      <ul>
                        <li>Protein: {plan.protein}g</li>
                        <li>Carbs: {plan.carbs}g</li>
                        <li>Fats: {plan.fats}g</li>
                        <li>Fruits/Veggies: {plan.fruitsVeggies} servings</li>
                        <li>Grains: {plan.grains} servings</li>
                      </ul>
                      <div className="nutrition-chart">
                        <h4>Nutritional Breakdown</h4>
                        <ErrorBoundary fallback={<p>Failed to load nutrition chart</p>}>
                          <NutritionChart mealPlan={plan} />
                        </ErrorBoundary>
                      </div>
                      <p><strong>Sustainability Score:</strong> {plan.sustainabilityScore}/100</p>
                      {plan.sustainabilitySuggestions && Object.keys(plan.sustainabilitySuggestions).length > 0 && (
                        <div className="sustainability-suggestions">
                          <h4>Sustainability Suggestions:</h4>
                          <ul>
                            {Object.entries(plan.sustainabilitySuggestions).map(([ingredient, alternatives]) => (
                              <li key={ingredient}>
                                Consider replacing {ingredient} with: {alternatives.join(', ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="meal-plan-actions">
                        <button onClick={() => updateMealPlan(plan.id, {...plan, calories: plan.calories + 100})} className="btn btn-small" disabled={loading}>
                          Increase Calories
                        </button>
                        <button onClick={() => deleteMealPlan(plan.id)} className="btn btn-small btn-danger" disabled={loading}>
                          Delete Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {groceryList && groceryList.length > 0 && (
              <div className="grocery-list-section">
                <h2>AI-Generated Grocery List</h2>
                {Array.isArray(groceryList) ? (
                  groceryList.map((category, index) => (
                    <div key={index}>
                      <h3>{category.category}</h3>
                      <ul>
                        {category.items && category.items.map((item, itemIndex) => (
                          <li key={itemIndex}>
                            {item.item}: {item.amount} {item.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p>No grocery list available</p>
                )}
              </div>
            )}

            {mealPlans.length > 0 && (
              <div className="sustainability-chart-section">
                <h2>Sustainability Progress</h2>
                <ErrorBoundary fallback={<p>Failed to load sustainability chart</p>}>
                  <SustainabilityChart mealPlans={mealPlans} />
                </ErrorBoundary>
              </div>
            )}

            {sustainabilityScore > 0 && (
              <div className="sustainability-section">
                <h2>Overall Sustainability Score</h2>
                <div className="sustainability-score">
                  <div className="score-bar" style={{width: `${sustainabilityScore}%`}}></div>
                  <p>{sustainabilityScore}/100</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;