"use client"

import Image from "next/image"
import { ArrowRight, Leaf, Sprout, WheatOff } from "lucide-react"

type ExploreCategory = {
  id: string
  label: string
  description: string
  image: string
  count: number
}

type ExploreDiet = {
  id: string
  label: string
  description: string
  count: number
}

type ExploreLandingProps = {
  categories: ExploreCategory[]
  diets: ExploreDiet[]
  onSelectCategory: (category: string) => void
  onSelectDiet: (diet: string) => void
}

const dietIcons: Record<string, typeof Leaf> = {
  vegan: Sprout,
  vegetarian: Leaf,
  "gluten-free": WheatOff,
}

export function ExploreLanding({
  categories,
  diets,
  onSelectCategory,
  onSelectDiet,
}: ExploreLandingProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <section className="pb-8 pt-10 sm:pt-12">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Fresh · Fast · Flame-grilled
        </p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-[1.05] text-balance sm:text-6xl">
          What are you craving today?
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
          Pick a category to explore the menu.
        </p>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="sr-only">
          Browse by category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-border text-left transition-colors duration-300 hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Image
                src={cat.image || "/placeholder.svg"}
                alt={cat.label}
                fill
                sizes="(max-width: 640px) 50vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
              <div className="relative z-10 flex h-full items-end p-4 sm:p-5">
                <h3 className="font-serif text-xl leading-tight text-white sm:text-2xl">{cat.label}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="diets-heading" className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="diets-heading" className="font-serif text-2xl leading-tight sm:text-3xl">
              Eating a certain way?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Filter the whole menu by diet — allergens are listed on every dish.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {diets.map((diet) => {
            const Icon = dietIcons[diet.id] ?? Leaf
            return (
              <button
                key={diet.id}
                type="button"
                onClick={() => onSelectDiet(diet.id)}
                className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="block font-serif text-lg leading-tight">{diet.label}</span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {diet.count} dishes
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                      {diet.description}
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
