export type Dish = {
  id: string
  name: string
  tagline: string
  category: string
  categoryValue: string
  price: number
  calories: number
  prepTime: string
  spicy: number
  rating: number
  image: string
  description: string
  ingredients: string[]
  allergens: string[]
  likes: number
}

export type DishComment = {
  id: string | number
  dish_id: string | number
  comment: string
  rating: number
  created_at: string
  likes: number
}
