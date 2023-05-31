import React, { useState } from 'react'

function App() {
  const [output, setOutput] = useState({ output: 'notAsked' })
  return (
    <div className="App">
      <MealPlanForm setOutput={setOutput} />
      <MealPlan plan={output} />
    </div>
  )
}

const MealPlan = ({ plan }) => {
  if (plan.output === 'notAsked') {
    return <></>
  } else if (plan.output === 'loading') {
    return <div>Loading, please wait...</div>
  } else if (plan.output === 'error') {
    return <div>An error occurred: {JSON.stringify(plan.error)}</div>
  } else if (plan.output === 'loaded') {
    return (
      <div>
        <ShoppingList list={plan.data.shoppingList} />
        {splitArrayEveryN(plan.data.mealsPerDay, plan.data.meals)
          .map((dayMeals, i) => <DayPlan dayNumber={i} recipes={dayMeals} />)
        }
      </div>
    )
  }
}

const splitArrayEveryN = (n, arr) =>
  arr.length === 0
    ? []
    : arr.length < n
    ? [arr]
    : [arr.slice(0,n), ...splitArrayEveryN(n, arr.slice(n))]

const DayPlan = ({ dayNumber, recipes }) => (
  <div>
    <h2>Day {dayNumber + 1}</h2>
    {recipes.map((recipe) => (
      <div>
        <h3>{recipe.recipeName} ({recipe.calories} cals)</h3>
        <div>
          <h4>Ingredients</h4>
          <ul>
            {recipe.ingredients.map((ingr) => <li>{ingr}</li>)}
          </ul>
        </div>
        <div>
          <h4>Instructions</h4>
          {recipe.instructions}
        </div>
      </div>
    ))}
  </div>
)

const ShoppingList = ({ list }) => (
  <div>
    <h2>Your shopping list</h2>
    <div>{list}</div>
  </div>
)

const MealPlanForm = ({ setOutput }) => {
  const [persons, setPersons] = useState(1)
  const [days, setDays] = useState(4)
  const [mealsPerDay, setMealsPerDay] = useState(3)
  const [calsPerDay, setCalsPerDay] = useState(2000)
  const [restrictions, setRestrictions] = useState('')
  const [ingredients, setIngredients] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setOutput({ output: 'loading' })

    const formData = {
      persons,
      restrictions,
      ingredients,
      days,
      mealsPerDay,
      calsPerDay,
    }

    fetch('http://localhost:3001/mealPlan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => setOutput({ output: 'loaded', data }))
      .catch((error) => setOutput({ output: 'error', error }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Number of persons to feed:
        <select value={persons} onChange={(e) => setPersons(parseInt(e.target.value))}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>
      <br />

      <label>
        Number of days:
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
          <option value={7}>7</option>
        </select>
      </label>
      <br />

      <label>
        Meals per day:
        <select value={mealsPerDay} onChange={(e) => setMealsPerDay(parseInt(e.target.value))}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </label>
      <br />

      <label>
        Calories per day:
        <input
          type="number"
          value={calsPerDay}
          onChange={(e) => setCalsPerDay(parseInt(e.target.value))}
          min={800}
          max={4000}
        />
      </label>
      <br />

      <label>
        Dietary restrictions:
        <input
          type="text"
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
          placeholder="e.g. vegan, seafood allergy, no pork, etc."
        />
      </label>
      <br />

      <label>
        Ingredients I already have and want to use:
        <input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="e.g. 1 whole chicken, 1kg potatoes"
        />
      </label>
      <br />

      <button type="submit">Submit</button>
    </form>
  )
}

export default App
