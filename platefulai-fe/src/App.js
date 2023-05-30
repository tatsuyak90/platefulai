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
    return <div>{JSON.stringify(plan.data, null, 2)}</div>
  }
}

const MealPlanForm = ({ setOutput }) => {
  const [persons, setPersons] = useState(1)
  const [days, setDays] = useState(4)
  const [meals, setMeals] = useState(3)
  const [calories, setCalories] = useState(2000)
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')
  const [ingredients, setIngredients] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setOutput({ output: 'loading' })

    const formData = {
      persons,
      restrictions: dietaryRestrictions,
      ingredients,
      days,
      mealsPerDay: meals,
      calsPerDay: calories,
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
        <select value={meals} onChange={(e) => setMeals(parseInt(e.target.value))}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </label>
      <br />

      <label>
        Calories per day:
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(parseInt(e.target.value))}
          min={800}
          max={4000}
        />
      </label>
      <br />

      <label>
        Dietary restrictions:
        <input
          type="text"
          value={dietaryRestrictions}
          onChange={(e) => setDietaryRestrictions(e.target.value)}
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
