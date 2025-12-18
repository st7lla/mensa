"use client"

import type React from "react"

import type { Recipe } from "@/lib/types"
import { useEffect } from "react"
import { X, ChefHat, List, Youtube } from "lucide-react"

interface RecipeModalProps {
  recipe: Recipe & { youtubeId?: string; channelTitle?: string; spoonacularImage?: string }
  onClose: () => void
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  useEffect(() => {
    
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <ChefHat className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">{recipe.name}</h2>
              {recipe.channelTitle && (
                <p className="text-sm text-muted-foreground mt-1">by {recipe.channelTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto max-h-[calc(90vh-88px)]">
          {/* YouTube Video Embed */}
          {recipe.youtubeId && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Youtube className="text-red-500" size={16} />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">video tutorial</h3>
              </div>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-2xl"
                  src={`https://www.youtube.com/embed/${recipe.youtubeId}`}
                  title={recipe.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Ingredients Section */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <List className="text-accent" size={16} />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">ingredients</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-4 py-3 bg-secondary/50 rounded-xl border border-border animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                    <span className="text-foreground text-sm font-medium">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions Section */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ChefHat className="text-primary" size={16} />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">instructions</h3>
              </div>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="flex gap-4 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${(recipe.ingredients?.length || 0) + index * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-muted-foreground text-base leading-relaxed pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border px-8 py-5">
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 hover:shadow-lg transition-all"
          >
            Close Recipe
          </button>
        </div>
      </div>
    </div>
  )
}