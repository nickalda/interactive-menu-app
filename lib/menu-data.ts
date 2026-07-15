export type Dish = {
  id: string
  name: string
  tagline: string
  category: string
  price: number
  calories: number
  prepTime: string
  spicy: number // 0-3
  rating: number
  image: string
  description: string
  ingredients: string[]
  allergens: string[]
  likes: number
}

export const menu: Dish[] = [
  {
    id: "smash-burger",
    name: "Double Smash",
    tagline: "Twice the beef. Zero regrets.",
    category: "Burgers",
    price: 9.5,
    calories: 780,
    prepTime: "8 min",
    spicy: 0,
    rating: 4.9,
    image: "/dishes/smash-burger.png",
    description:
      "Two smashed beef patties with crispy lacy edges, double American cheese, pickles, and our house smash sauce on a toasted brioche bun.",
    ingredients: ["Beef patties", "American cheese", "Brioche bun", "Pickles", "Smash sauce", "Lettuce", "Tomato"],
    allergens: ["Gluten", "Dairy", "Egg"],
    likes: 2431,
  },
  {
    id: "loaded-fries",
    name: "Loaded Fries",
    tagline: "Fully loaded, fully unhinged.",
    category: "Sides",
    price: 6.0,
    calories: 620,
    prepTime: "6 min",
    spicy: 1,
    rating: 4.8,
    image: "/dishes/loaded-fries.png",
    description:
      "Golden fries buried under molten cheddar, smoky bacon bits, fresh green onions and a drizzle of our signature sauce.",
    ingredients: ["Potatoes", "Cheddar", "Bacon", "Green onion", "Signature sauce"],
    allergens: ["Dairy"],
    likes: 1877,
  },
  {
    id: "crispy-chicken",
    name: "Spicy Crunch",
    tagline: "Loud, crispy, dangerously good.",
    category: "Chicken",
    price: 8.75,
    calories: 710,
    prepTime: "9 min",
    spicy: 2,
    rating: 4.9,
    image: "/dishes/crispy-chicken.png",
    description:
      "Buttermilk-brined chicken thigh fried to a shattering crunch, layered with pickles and spicy sauce on a toasted bun.",
    ingredients: ["Chicken thigh", "Buttermilk", "Pickles", "Spicy sauce", "Brioche bun"],
    allergens: ["Gluten", "Dairy", "Egg"],
    likes: 2109,
  },
  {
    id: "pepperoni-pizza",
    name: "Pepperoni Slice",
    tagline: "The cheese pull heard round the block.",
    category: "Pizza",
    price: 4.5,
    calories: 430,
    prepTime: "5 min",
    spicy: 1,
    rating: 4.7,
    image: "/dishes/pepperoni-pizza.png",
    description:
      "A wide New York-style slice stacked with crispy-cup pepperoni and stretchy mozzarella on a hand-tossed base.",
    ingredients: ["Pizza dough", "Mozzarella", "Pepperoni", "Tomato sauce", "Oregano"],
    allergens: ["Gluten", "Dairy"],
    likes: 1542,
  },
  {
    id: "street-tacos",
    name: "Street Tacos",
    tagline: "Three little handfuls of joy.",
    category: "Tacos",
    price: 7.25,
    calories: 540,
    prepTime: "7 min",
    spicy: 2,
    rating: 4.8,
    image: "/dishes/street-tacos.png",
    description:
      "Trio of soft corn tortillas piled with grilled marinated meat, fresh cilantro, diced onion and a squeeze of lime.",
    ingredients: ["Corn tortilla", "Grilled meat", "Cilantro", "Onion", "Lime", "Salsa"],
    allergens: [],
    likes: 1320,
  },
  {
    id: "milkshake",
    name: "Choc Thick Shake",
    tagline: "So thick the straw stands up.",
    category: "Drinks",
    price: 5.5,
    calories: 590,
    prepTime: "4 min",
    spicy: 0,
    rating: 4.9,
    image: "/dishes/milkshake.png",
    description:
      "Hand-spun chocolate shake crowned with whipped cream, a cherry and a heavy chocolate drizzle.",
    ingredients: ["Ice cream", "Whole milk", "Chocolate", "Whipped cream", "Cherry"],
    allergens: ["Dairy"],
    likes: 1988,
  },
]

export const categories = ["All", ...Array.from(new Set(menu.map((d) => d.category)))]
