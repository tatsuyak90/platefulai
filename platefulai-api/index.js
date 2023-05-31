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
app.use(cors())

app.post("/mealPlan", async (req, res) => {
  const input = req.body
  const desiredNumberOfMeals = input.mealsPerDay * input.days
  const initialPrompt = mkInitialPrompt(input)
  console.log('==========================')
  console.log('USING THIS INITIAL PROMPT:')
  console.log(initialPrompt)
  const initialCompletion = await getCompletion(initialPrompt)
  console.log('RECEIVED THIS INITIAL COMPLETION:')
  console.log(initialCompletion)
  let meals = parseMealPlanJson(initialCompletion)
  while (meals.length === 0) {
    console.log('VALID MEALS SO FAR:')
    console.log(meals)
    console.log('==========================')
    console.log('NO VALID MEALS RECEIVED IN INITIAL COMPLETION, TRYING AGAIN')
    const initialCompletionNewAttempt = await getCompletion(initialPrompt)
    console.log('NEW INITIAL COMPLETION ATTEMPT RETURNED THIS COMPLETION:')
    console.log(initialCompletionNewAttempt)
    const mealsNewAttempt = parseMealPlanJson(initialCompletionNewAttempt)
    meals.push(...mealsNewAttempt)
  }
  while (meals.length < desiredNumberOfMeals) {
    const continuationPrompt = mkContinuationPrompt({ ...input, mealsSoFar: meals })
    console.log('==========================')
    console.log('NOT ENOUGH MEALS RECEIVED IN PREVIOUS COMPLETIONS, USING THIS CONTINUATION PROMPT:')
    console.log(continuationPrompt)
    const continuationCompletion = await getCompletion(continuationPrompt)
    console.log('CONTINUATION PROMPT RETURNED THIS COMPLETION')
    console.log(continuationCompletion)
    const additionalMeals = parseMealPlanJson(continuationCompletion)
    meals.push(...additionalMeals)
    console.log("DESIRED NUMBER OF MEALS: ", desiredNumberOfMeals)
    meals = meals.slice(0, desiredNumberOfMeals)
  }
  const neededIngredients = meals.flatMap((meal) => meal.ingredients)
  const shoppingListPrompt = mkShoppingListPrompt(neededIngredients, input.ingredients)
  console.log('==========================')
  console.log('USING THIS SHOPPING LIST PROMPT:')
  console.log(shoppingListPrompt)
  const shoppingList = await getCompletion(shoppingListPrompt)
  console.log('SHOPPING LIST RECEIVED:')
  console.log(shoppingList)
  res.json({ meals, shoppingList, mealsPerDay: input.mealsPerDay })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

const getCompletion = (prompt) => claude
  .complete({
    prompt: `${HUMAN_PROMPT} ${prompt}${AI_PROMPT}`,
    stop_sequences: [HUMAN_PROMPT],
    max_tokens_to_sample: 20000,
    model: "claude-instant-v1-100k",
  })
  .then(({ completion }) => completion)

/** incorrect outputs are thrown away */
const parseMealPlanJson = (output) => {
  const parsed = (() => {
    try {
      return JSON.parse(output)
    } catch (err) {
      return []
    }
  })()
  const mealsUnvalidated = Array.isArray(parsed) ? parsed : []
  return mealsUnvalidated.filter((meal) =>
    typeof meal.recipeName === 'string' &&
    Array.isArray(meal.ingredients) &&
    meal.ingredients.every(ingr => typeof ingr === 'string') &&
    typeof meal.calories === 'number'
  )
}

const mkInitialPrompt = ({ persons, restrictions, ingredients, days, mealsPerDay, calsPerDay }) => `
EXAMPLE HYPOTHETICAL OUTPUT FORMAT:
[
  {
    "recipeName": "Cucumber salad",
    "ingredients": [
      "1 cucumber, sliced",
      "2 tbsp olive oil",
      "2 tbsp lemon juice",
      "1/4 tsp salt",
      "1/4 tsp black pepper"
    ],
    "instructions": "Slice cucumber and combine with olive oil, lemon juice, salt and pepper. Chill before serving.",
    "calories": 200
  },
  {
    "recipeName": "Chickpea curry over rice",
    "ingredients": [
      "1 (15 oz) can chickpeas, drained and rinsed",
      "1/2 onion, diced",
      "3 cloves garlic, minced",
      "1 tbsp curry powder",
      "1 tsp ground cumin",
      "1/2 tsp chili powder",
      "1 (14.5 oz) can diced tomatoes",
      "1 cup coconut milk",
      "2 cups cooked rice"
    ],
    "instructions": "Saute onion and garlic, then add spices and cook 1 minute. Add chickpeas, tomatoes and coconut milk. Simmer 10 minutes. Serve over rice.",
    "calories": 500
  },
  {
    "recipeName": " Chicken salad sandwiches",
    "Ingredients": [
      "1 whole chicken, 3 eggs, Mayonnaise, Whole wheat bread, Lettuce leaves"
    ],
    "Instructions": "Boil chicken, then shred with two forks. Hard boil eggs, peel and chop. Mix chicken, eggs, and mayonnaise. Serve on bread with lettuce.",
    "calories": 600
  },
  {
    "recipeName": "Quiche Lorraine",
    "ingredients": [
      "3 eggs, 1/2 onion, 1/2 cup shredded cheese, 1/4 tsp nutmeg, Salt and pepper"
    ],
    "instructions": "Whisk eggs, then add remaining ingredients. Pour into pie crust and bake at 350 F until set.",
    "calories": 600
  }
]
}
[End of example]

Your task is to create a list of meals. Keep the recipes varied. The daily calorie budget is ${calsPerDay} (assume ${mealsPerDay} meals per day).
Ingredients in user's possession: ${ingredients || '[none]'}
If specified, include the above ingredient(s), dividing them as appropriate. You may use less than the items provided.
Adhere to user's dietary restrictions, if any: ${restrictions || '[none]'}
Include the following:
- recipe name
- ingredients list and the quantity of each ingredient (e.g. "200 ml of milk", "1 banana")
- instructions on how to prepare the meal
- calories for the meal

Output the meal list in the supplied VALID json format.
The output must be a FULL, VALID JSON that adheres to this typing:
type Output = Array<{
  recipeName: string
  ingredients: string[]
  instructions: string
  calories: number
}>
Output the full VALID json ONLY, do NOT write anything else. Do NOT include placeholders that will make the JSON invalid. Generate as many meals as you want and keep the JSON valid.
[json]
`

const mkContinuationPrompt =
  ({ persons, restrictions, ingredients, days, mealsPerDay, calsPerDay, mealsSoFar }) => `
MEALS PLANNED SO FAR:
${JSON.stringify(mealsSoFar, null, 2)}
[End of meals planned so far]

Your task is to add meals to this meal list. The daily calorie budget is ${calsPerDay}, assuming ${mealsPerDay} meals per day.
Ingredients in user's possession: ${ingredients || '[none]'}
If specified, include the above ingredient(s), dividing them as appropriate. You may use less than the items provided.
Adhere to user's dietary restrictions, if any: ${restrictions || '[none]'}
Include the following:
- recipe name
- ingredients list and the quantity of each ingredient (e.g. "200 ml of milk", "1 banana")
- instructions on how to prepare the meal
- calories for the meal

Output the meal plan in the supplied VALID json format. Generate as many meals as you want.
Output the json ONLY, do NOT write anything else.
The output must be a VALID JSON that adheres to this typing:
type Output = Array<{
  recipeName: string
  ingredients: string[]
  instructions: string
  calories: number
}>
Output the full VALID json ONLY, do NOT write anything else. Do NOT include placeholders that will make the JSON invalid. Generate as many meals as you want and keep the JSON valid.
[json]
`
const mkShoppingListPrompt = (neededIngredients, ingredientsAlreadyOwned) => `
Your task is to write a shopping list based on the supplied ingredients list. Here's an example ingredient list, and how its corresponding shopping list might look like:

[EXAMPLE INGREDIENT LIST]
1 cucumber, sliced
2 tbsp olive oil
2 tbsp lemon juice
1/4 tsp salt
1/4 tsp black pepper
1 (15 oz) can chickpeas, drained and rinsed
1/2 onion, diced
3 cloves garlic, minced
1 tbsp curry powder
1 tsp ground cumin
1/2 tsp chili powder
1 (14.5 oz) can diced tomatoes
1 cup coconut milk
2 cups cooked rice
3 eggs
1/2 onion
1/2 cup shredded cheese
1/4 tsp nutmeg
Salt and pepper

[EXAMPLE SHOPPING LIST]
Onion (2)
Carrot (2)
Celery (2 stalks)
Chicken broth (1 carton)
Egg noodles (1 bag)
Whole wheat bread (1 loaf)
Lettuce (1 head)
Shredded cheese (1 bag)
Mayonnaise (1 jar)
Nutmeg (1
Salt (2 bags)
Pepper (1 container)
Coconut milk (1 can)
Chickpeas  (1 can)
Diced tomatoes (1 can)
Garlic (1 head)
Curry powder (1 jar)
Ground cumin (1 jar)
Chili powder (1 jar)
Olive oil (1 bottle)
Lemon juice (1 bottle)
Black pepper (1 container)
Rice (1 bag)

Follow these instructions
- The user already possesses these ingredients, subtract them from the total ingredients required: ${ingredientsAlreadyOwned || '[none]'}
- Specify quantity, e.g. "2 carrots", for each product
- Write down WHOLE, purchasable products only, you MUST NOT use in-recipe measurements such as "tablespoons", "sliced" or "diced".
Example shopping list:
10 lbs of potatoes
1 egg carton
2 cans of beans

Output shopping list ONLY, do NOT write anything else like "Here's the shopping list".

[ACTUAL INGREDIENT LIST]
${neededIngredients.join('\n')}

Output shopping list ONLY, do NOT write anything else like "Here's the shopping list.".

[ACTUAL SHOPPING LIST]
`
