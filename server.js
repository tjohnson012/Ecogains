const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// In-memory storage (replace with a database in a real application)
const users = [];
const mealPlans = [];

// Secret key for JWT (use a secure, environment-specific secret in production)
const JWT_SECRET = 'your_jwt_secret';

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (users.find(user => user.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: users.length + 1, username, password: hashedPassword };
    users.push(user);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (await bcrypt.compare(password, user.password)) {
      const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ accessToken });
    } else {
      res.status(400).json({ message: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ id: user.id, username: user.username });
});

// Get meal plans
app.get('/api/mealplan', authenticateToken, (req, res) => {
  const userMealPlans = mealPlans.filter(plan => plan.userId === req.user.id);
  res.json(userMealPlans);
});

// Create meal plan
app.post('/api/mealplan', authenticateToken, (req, res) => {
  const { name, calories, protein, carbs, fats, fruitsVeggies, grains, groceryList, diet, goal } = req.body;
  
  const newMealPlan = {
    id: mealPlans.length + 1,
    userId: req.user.id,
    name,
    calories,
    protein,
    carbs,
    fats,
    fruitsVeggies,
    grains,
    groceryList,
    diet,
    goal,
    sustainabilityScore: calculateSustainabilityScore(groceryList),
    sustainabilitySuggestions: generateSustainabilitySuggestions(groceryList)
  };

  mealPlans.push(newMealPlan);
  res.status(201).json(newMealPlan);
});

// Update meal plan
app.put('/api/mealplan/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mealPlans.findIndex(plan => plan.id === id && plan.userId === req.user.id);
  if (index !== -1) {
    const updatedPlan = { ...mealPlans[index], ...req.body };
    updatedPlan.sustainabilityScore = calculateSustainabilityScore(updatedPlan.groceryList);
    updatedPlan.sustainabilitySuggestions = generateSustainabilitySuggestions(updatedPlan.groceryList);
    mealPlans[index] = updatedPlan;
    res.json(updatedPlan);
  } else {
    res.status(404).json({ message: 'Meal plan not found' });
  }
});

// Delete meal plan
app.delete('/api/mealplan/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = mealPlans.findIndex(plan => plan.id === id && plan.userId === req.user.id);
  if (index !== -1) {
    mealPlans.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Meal plan not found' });
  }
});

function calculateSustainabilityScore(groceryList) {
  let score = 0;
  let totalItems = 0;

  const sustainabilityScores = {
    'organic': 10,
    'local': 8,
    'seasonal': 6,
    'plant-based': 9,
    'whole grain': 7,
    'processed': -5,
    'imported': -3
  };

  groceryList.forEach(category => {
    category.items.forEach(item => {
      let itemScore = 5; // Base score
      const lowerCaseItem = item.item.toLowerCase();

      Object.entries(sustainabilityScores).forEach(([criterion, value]) => {
        if (lowerCaseItem.includes(criterion)) {
          itemScore += value;
        }
      });

      // Adjust score based on food category
      if (category.category === "Fruits and Vegetables") itemScore += 3;
      if (category.category === "Proteins" && !lowerCaseItem.includes('meat')) itemScore += 2;

      score += itemScore;
      totalItems++;
    });
  });

  return Math.round((score / (totalItems * 10)) * 100); // Normalize to 0-100 scale
}

function generateSustainabilitySuggestions(groceryList) {
  const suggestions = {};
  const sustainableAlternatives = {
    'beef': ['chicken', 'turkey', 'tofu', 'lentils'],
    'pork': ['chicken', 'turkey', 'tempeh'],
    'chicken': ['tofu', 'tempeh', 'seitan'],
    'fish': ['algae', 'seaweed', 'plant-based fish alternatives'],
    'milk': ['almond milk', 'oat milk', 'soy milk'],
    'cheese': ['nutritional yeast', 'cashew cheese', 'vegan cheese alternatives'],
    'eggs': ['flax seeds', 'chia seeds', 'tofu'],
    'white rice': ['brown rice', 'quinoa', 'barley'],
    'white bread': ['whole grain bread', 'ezekiel bread', 'sourdough bread'],
    'pasta': ['whole grain pasta', 'zucchini noodles', 'spaghetti squash']
  };

  groceryList.forEach(category => {
    category.items.forEach(item => {
      const lowerCaseItem = item.item.toLowerCase();
      
      if (!lowerCaseItem.includes('organic')) {
        suggestions[item.item] = [`organic ${item.item}`];
      }

      Object.entries(sustainableAlternatives).forEach(([food, alternatives]) => {
        if (lowerCaseItem.includes(food)) {
          suggestions[item.item] = alternatives;
        }
      });
    });
  });

  return suggestions;
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});