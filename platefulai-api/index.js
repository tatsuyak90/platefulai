require('dotenv').config()
const express = require("express")
const { AI_PROMPT, Client, HUMAN_PROMPT } = require("@anthropic-ai/sdk")
const cors = require('cors')

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey) {
  throw new Error("The ANTHROPIC_API_KEY environment variable must be set")
}

const claude = new Client(apiKey)
const app = express()
const port = 3001

app.use(express.json())
app.use(cors());

app.post("/mealPlan", (req, res) => {
  const input = req.body
  console.log(mkPrompt(input))
  claude
    .complete({
      prompt: `${HUMAN_PROMPT} ${mkPrompt(input)}${AI_PROMPT}`,
      stop_sequences: [HUMAN_PROMPT],
      max_tokens_to_sample: 20000,
      model: "claude-v1-100k",
    })
    .then(({ completion }) => {
      console.log(completion)
      res.json({ mealPlan: completion })
    })
    .catch((error) => {
      res.json({ error: "An error occurred. Please contact Team Helix." })
      console.error(error)
    })

})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

const mkPrompt = ({ persons, restrictions, ingredients, days, mealsPerDay, calsPerDay }) => `
Your task is to suggest a meal plan and shopping list as a JSON string in the following format.

type Output = {
  // you must include ${days * mealsPerDay} meals
  meals: Array<{
    recipeName: string
    ingredients: string[] // should include quantity
    instructions: string
    caloriesPerPerson: number
  }>,
  // List of shopping items based on the sum of all ingredients used for the suggested recipes. should include quantity and be enough to cook all suggested recipes.
  // Items must be in the form you might buy them from the store, e.g.
  // 2 avocados, NOT "1 avocado, diced"
  // Remember not to deduce ingredients the user said they already have.
  shoppingList: string[]
}

Follow these instructions:

- Each meal must feed ${persons} person(s)
- The following restrictions were provided: ${restrictions || '[none]'}
- The user already possesses the following ingredients and is looking to use them: ${ingredients || '[none]'}
- The total number of meals must be ${days * mealsPerDay}.
- The daily calorie budget is ${calsPerDay}.
- Output the valid JSON ONLY, do not write anything else. Include the full requested data.
`
