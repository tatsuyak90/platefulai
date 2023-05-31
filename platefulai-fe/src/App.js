import React, { useState } from 'react'
import platefulAiLogo from './plateful.png'

const App = () => {
  const [output, setOutput] = useState({ output: 'notAsked' })
  return (
    <div
      style={{
        fontFamily: "'Signika', sans-serif",
        fontWeight: 400,
        width: '100%',
        maxWidth: '600px',
        margin: 'auto',
        fontSize: '18px',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '8px',
        minHeight: 'calc(100vh - 25px)',
        padding: '0 10px',
      }}
    >
      <Header />
      <div style={{ padding: '0 10px' }}>
        <div style={{ margin: '40px 0 20px' }}>
          Not sure what to cook this week? Ask our AI assistant to generate a meal plan and shopping list for you.
        </div>
        <MealPlanForm setOutput={setOutput} />
        <MealPlan plan={output} />
      </div>
    </div>
  )
}
export default App

// PAGE COMPONENTS

const Header = () => (
  <div style={{ margin: '10px auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '20px' }}>
      <img
        src={platefulAiLogo}
        alt="PlatefulAI logo"
        style={{ width: '90px', height: 'auto', display: 'block', marginRight: '20px' }}
      />
      <div style={{ fontStyle: 'italic', fontWeight: 500 }}>
        <div style={{ paddingLeft: '10px' }}>“Why do the work yourself?<br /></div>
        <div>Let him cook.”</div>
      </div>
    </div>
  </div>
)

const MealPlan = ({ plan }) => {
  return (
    <div style={{ marginTop: '30px' }}>
      {(() => {
        if (plan.output === 'notAsked') {
          return <></>
        } else if (plan.output === 'loading') {
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                Our AI is working, please wait...
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                <div style={{ margin: 'auto' }} class="lds-dual-ring"></div>
              </div>
            </div>
          )
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
      })()}
    </div>
  )
}

const ShoppingList = ({ list }) => (
  <div>
    <h2>Your shopping list</h2>
    <ul>
      {list.split('\n').map((item) => <li>{item}</li>)}
    </ul>
  </div>
)

const DayPlan = ({ dayNumber, recipes }) => (
  <div>
    <h2>Day {dayNumber + 1}</h2>
    {recipes.map((recipe) => (
      <Collapsible
        label={`${recipe.recipeName} (${recipe.calories} cals)`}
      >
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
      </Collapsible>
    ))}
  </div>
)

const Collapsible = ({ label, children }) => {
  const [folded, setFolded] = useState(true)
  return (
    <div>
      <h3 onClick={() => setFolded((old) => !old)} style={{ cursor: 'pointer' }}>
        {folded ? '+' : '-'} {label}
      </h3>
      {folded ? <></> : children}
    </div>
  )
}

const MealPlanForm = ({ setOutput }) => {
  const [persons, setPersons] = useState(1)
  const [days, setDays] = useState(2)
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
    <div style={{ margin: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <NumSelect
          label="How many people are you cooking for?"
          min={1}
          max={4}
          setVal={setPersons}
          val={persons}
        />
        <NumSelect
          label="How many days are you stocking up for?"
          min={1}
          max={5}
          setVal={setDays}
          val={days}
        />
        <NumSelect
          label="How many meals a day?"
          min={1}
          max={4}
          setVal={setMealsPerDay}
          val={mealsPerDay}
        />
      </div>
      <SliderInput label="Calories per day" val={calsPerDay} setVal={setCalsPerDay} />
      <TextInput
        label="Do you have any dietary restrictions or other requirements?"
        val={restrictions}
        setVal={setRestrictions}
        placeholder="vegan, no seafood, must use chicken, ..."
      />
      <TextInput
        label="What ingredients do you have in stock already?"
        val={ingredients}
        setVal={setIngredients}
        placeholder="5 porkchops, 1kg potatoes, ..."
      />
      <Btn label="Get my meal plan!" onClick={handleSubmit} />
    </div>
  )
}

// HELPER COMPONENTS

const Btn = ({ label, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#f2d9ab',
      display: 'inline-block',
      padding: '5px 10px',
      borderRadius: '8px',
      cursor: 'pointer',
    }}
  >
    {label}
  </div>
)

const NumSelect = ({ label, min, max, setVal, val }) => (
  <div style={{ margin: '10px 0' }}>
    <div>{label}</div>
    <div
      style={{
        marginTop: '5px',
        display: 'flex',
        cursor: 'pointer',
      }}
    >
      {range(min, max).map((n, i) => (
        <div
          onClick={() => setVal(n)}
          style={{
            color: val === n ? 'unset' : '#5A5A5A',
            padding: '0.25em 0.4em',
            background: val === n ? '#F2D9AB' : '#EAE7D8'
          }}
        >
          {n}
        </div>
      ))}
    </div>
  </div>
)

const TextInput = ({ label, placeholder, val, setVal }) => (
  <div style={{ margin: '10px 0' }}>
    <div style={{ display: 'flex', gap: '0 8px', marginBottom: '7px' }}>
      <div>{label}</div>
    </div>
    <textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
      placeholder={placeholder}
      cols={40}
      rows={3}
    />
  </div>
)

const SliderInput = ({ label, val, setVal }) => (
  <div style={{ margin: '10px 0' }}>
    <div style={{ display: 'flex', gap: '0 8px', marginBottom: '7px' }}>
      <div>{label}: {val}</div>
    </div>
    <input
      type="range"
      value={val}
      onChange={(e) => setVal(parseInt(e.target.value))}
      min={800}
      max={4000}
      step={50}
    />
  </div>
)

// HELPER FUNCTIONS

const range = (min, max) => [...Array(max + 1 - min)].map((_,i) => i + min)

const splitArrayEveryN = (n, arr) =>
  arr.length === 0
    ? []
    : arr.length < n
    ? [arr]
    : [arr.slice(0,n), ...splitArrayEveryN(n, arr.slice(n))]

