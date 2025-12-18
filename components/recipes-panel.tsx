"use client"

import type { Recipe } from "@/lib/types"
import { ChefHat, Sparkles } from "lucide-react"

interface RecipesPanelProps {
  selectedIngredients: string[]
  onRemoveIngredient: (ingredient: string) => void
  recipes: (Recipe & { matchCount?: number; image?: string; missedIngredients?: number })[]
  onFindRecipes: () => void
  onSelectRecipe: (recipe: Recipe) => void
  hasSearched: boolean
  loading?: boolean
}

export default function RecipesPanel({
  selectedIngredients,
  onRemoveIngredient,
  recipes,
  onFindRecipes,
  onSelectRecipe,
  hasSearched,
  loading = false,
}: RecipesPanelProps) {
  return (
    <div className="flex-1 p-12 overflow-y-auto bg-background">
      {/* Selected Ingredients */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-sm font-medium text-foreground tracking-wide uppercase">selected</h2>
          {selectedIngredients.length > 0 && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {selectedIngredients.length}
            </span>
          )}
        </div>
        {selectedIngredients.length === 0 ? (
          <div className="text-center py-12 px-6 bg-secondary/30 rounded-2xl border-2 border-dashed border-border">
            <ChefHat className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground text-base">
              Select ingredients from the sidebar to discover amazing recipes
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {selectedIngredients.map((ingredient, index) => (
                <div
                  key={ingredient}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-card rounded-full text-sm font-medium text-card-foreground border border-border shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {ingredient}
                  <button
                    onClick={() => onRemoveIngredient(ingredient)}
                    className="text-muted-foreground hover:text-destructive transition-colors hover:scale-110"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={onFindRecipes}
              disabled={loading}
              className="w-full max-w-md bg-primary text-primary-foreground px-8 py-4 rounded-full text-base font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={20} />
              {loading ? 'searching...' : 'find recipes'}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-6 tracking-wide uppercase">results</h2>
        {!hasSearched ? (
          <div className="text-center py-16 px-6">
            <p className="text-muted-foreground text-base">Your delicious recipes will appear here</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16 px-6 bg-secondary/30 rounded-2xl border-2 border-dashed border-border">
            <p className="text-muted-foreground text-base mb-2">No recipes found</p>
            <p className="text-muted-foreground text-sm">
              Try selecting different ingredients or adjusting dietary restrictions
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {recipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {recipe.image && (
                  <img 
                    src={recipe.image} 
                    alt={recipe.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-card-foreground leading-tight text-balance flex-1">
                      {recipe.name}
                    </h3>
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ml-2">
                      <ChefHat className="text-primary" size={20} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 font-medium">
                    <span className="text-primary text-base">{recipe.matchCount || 0}</span>{" "}
                    {recipe.matchCount === 1 ? "ingredient matches" : "ingredients match"}
                    {recipe.missedIngredients ? ` • ${recipe.missedIngredients} missing` : ''}
                  </p>
                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 hover:shadow-lg transition-all"
                  >
                    view recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}