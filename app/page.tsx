"use client"

import { useState } from "react"
import axios from "axios"

const SPOONACULAR_API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

const INGREDIENTS = [
  "Chicken", "Beef", "Pork", "Salmon", "Shrimp",
  "Rice", "Pasta", "Eggs", "Potatoes", "Tomatoes",
  "Onions", "Garlic", "Broccoli", "Spinach", "Carrots",
  "Bell Peppers", "Mushrooms", "Cheese", "Butter", "Olive Oil",
  "Soy Sauce", "Lemon", "Ginger", "Basil", "Parsley"
]

const DIETARY_RESTRICTIONS = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", "Shellfish-Free"]

export default function Home() {
  const [started, setStarted] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [customIngredient, setCustomIngredient] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [recipes, setRecipes] = useState<any[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const filteredIngredients = INGREDIENTS.filter(ing =>
    ing.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient))
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient])
    }
  }

  const handleAddCustomIngredient = () => {
    if (customIngredient.trim() && !selectedIngredients.includes(customIngredient.trim())) {
      setSelectedIngredients([...selectedIngredients, customIngredient.trim()])
      setCustomIngredient("")
      setShowCustomInput(false)
    }
  }

  const handleRemoveIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient))
  }

  const handleToggleDietaryRestriction = (restriction: string) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction))
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction])
    }
  }

  const findRecipes = async () => {
  if (selectedIngredients.length === 0) return

  setLoading(true)
  setHasSearched(true)
  
  try {
    let searchQuery = `${selectedIngredients.join(' ')} recipe`
    
    if (dietaryRestrictions.includes('Vegetarian')) searchQuery += ' vegetarian'
    if (dietaryRestrictions.includes('Vegan')) searchQuery += ' vegan'
    if (dietaryRestrictions.includes('Gluten-Free')) searchQuery += ' gluten free'
    if (dietaryRestrictions.includes('Dairy-Free')) searchQuery += ' dairy free'
    
    const youtubeResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          key: YOUTUBE_API_KEY,
          q: searchQuery,
          part: 'snippet',
          type: 'video',
          maxResults: 20,
          videoDuration: 'medium',
          relevanceLanguage: 'en'
        }
      }
    )

    const seen = new Set()
    const transformedRecipes = youtubeResponse.data.items
      .filter((video: any) => {
        if (seen.has(video.id.videoId)) return false
        seen.add(video.id.videoId)
        return true
      })
      
      .map((video: any) => ({
        id: video.id.videoId,
        name: video.snippet.title,
        image: video.snippet.thumbnails.high.url,
        youtubeId: video.id.videoId,
        channelTitle: video.snippet.channelTitle,
        matchCount: selectedIngredients.length,
        missingCount: 0,
        ingredients: [],
        instructions: []
      }))

    setRecipes(transformedRecipes)
  } catch (error) {
    console.error('Error:', error)
    alert('Error fetching recipes. Please try again.')
    setRecipes([])
  } finally {
    setLoading(false)
  }
}

  const getRecipeDetails = async (recipe: any) => {
    if (!recipe.youtubeId) {
      setSelectedRecipe(recipe)
      return
    }

    setLoading(true)
    
    try {
      // Try Spoonacular first (highest quality)
      try {
        const spoonacularSearch = await axios.get(
          `https://api.spoonacular.com/recipes/complexSearch`,
          {
            params: {
              apiKey: SPOONACULAR_API_KEY,
              query: recipe.name.split('|')[0].trim(),
              number: 1
            }
          }
        )

        if (spoonacularSearch.data.results.length > 0) {
          const spoonacularRecipe = spoonacularSearch.data.results[0]
          
          const detailsResponse = await axios.get(
            `https://api.spoonacular.com/recipes/${spoonacularRecipe.id}/information`,
            {
              params: { apiKey: SPOONACULAR_API_KEY }
            }
          )

          const ingredients = detailsResponse.data.extendedIngredients?.map((ing: any) => ing.original) || []
          const instructions = detailsResponse.data.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || []

          // Calculate match percentage
          const matchedCount = ingredients.filter((ing: string) =>
            selectedIngredients.some(selected => 
              ing.toLowerCase().includes(selected.toLowerCase())
            )
          ).length
          const matchPercentage = ingredients.length > 0 
            ? Math.round((matchedCount / ingredients.length) * 100)
            : 0

          setSelectedRecipe({
            ...recipe,
            youtubeId: recipe.youtubeId,
            channelTitle: recipe.channelTitle,
            ingredients,
            instructions,
            matchPercentage,
            matchedCount,
            totalIngredients: ingredients.length,
            source: 'spoonacular'
          })
          setLoading(false)
          return
        }
      } catch (err) {
        console.log('Spoonacular search failed, trying AI transcript...')
      }

      // Fallback: Try AI-powered transcript extraction
      try {
        console.log('Fetching AI-generated recipe from transcript...')
        const transcriptResponse = await axios.post('http://localhost:3001/api/transcript', {
          videoId: recipe.youtubeId
        })

        if (transcriptResponse.data.success) {
          const { ingredients, instructions } = transcriptResponse.data

          // Calculate match percentage
          const matchedCount = ingredients.filter((ing: string) =>
            selectedIngredients.some(selected => 
              ing.toLowerCase().includes(selected.toLowerCase())
            )
          ).length
          const matchPercentage = ingredients.length > 0 
            ? Math.round((matchedCount / ingredients.length) * 100)
            : 0

          setSelectedRecipe({
            ...recipe,
            youtubeId: recipe.youtubeId,
            channelTitle: recipe.channelTitle,
            ingredients,
            instructions,
            matchPercentage,
            matchedCount,
            totalIngredients: ingredients.length,
            source: 'ai-transcript'
          })
          setLoading(false)
          return
        }
      } catch (transcriptErr) {
        console.log('Transcript extraction failed:', transcriptErr)
      }

      // Final fallback: Just show video
      setSelectedRecipe({
        ...recipe,
        ingredients: ['Watch the video for ingredients'],
        instructions: ['Watch the video for instructions'],
        source: 'video-only'
      })
    } catch (err) {
      setSelectedRecipe({
        ...recipe,
        ingredients: ['Watch the video for ingredients'],
        instructions: ['Watch the video for instructions']
      })
    } finally {
      setLoading(false)
    }
  }

 
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-[96px] font-light text-foreground mb-4 leading-none">mensa</h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-12" />
          <p className="text-2xl text-muted-foreground mb-16 font-light leading-relaxed">
            discover delicious recipes<br />from ingredients you already have
          </p>
          <button
            onClick={() => setStarted(true)}
            className="bg-primary text-primary-foreground px-16 py-5 rounded-full text-lg font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            get started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-light text-card-foreground">mensa</h1>
          <div className="w-1 h-1 rounded-full bg-primary" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-[350px] bg-sidebar border-r border-sidebar-border h-[calc(100vh-73px)] flex flex-col">
          <div className="p-8 pb-6 space-y-6">
            <div>
              <h2 className="text-sm font-medium text-sidebar-foreground mb-4 tracking-wide uppercase">ingredients</h2>
              <input
                type="text"
                placeholder="search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-input rounded-xl text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            <div>
              <h2 className="text-sm font-medium text-sidebar-foreground mb-4 tracking-wide uppercase">dietary restrictions</h2>
              <div className="flex flex-wrap gap-2">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <button
                    key={restriction}
                    onClick={() => handleToggleDietaryRestriction(restriction)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      dietaryRestrictions.includes(restriction)
                        ? "bg-accent text-accent-foreground ring-2 ring-accent/20"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {restriction}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="space-y-2">
              {filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient}
                  onClick={() => handleSelectIngredient(ingredient)}
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                    selectedIngredients.includes(ingredient)
                      ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {ingredient}
                </button>
              ))}

              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full px-4 py-3 rounded-xl text-left text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all border-2 border-dashed border-accent/30 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add custom ingredient
                </button>
              ) : (
                <div className="bg-accent/10 rounded-xl p-3 border-2 border-accent/30 space-y-2">
                  <input
                    type="text"
                    placeholder="Enter ingredient..."
                    value={customIngredient}
                    onChange={(e) => setCustomIngredient(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomIngredient()}
                    className="w-full px-3 py-2 bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddCustomIngredient} className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-medium">Add</button>
                    <button onClick={() => { setShowCustomInput(false); setCustomIngredient("") }} className="px-3 py-2 bg-secondary rounded-lg text-xs">×</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* main content */}
        <div className="flex-1 p-12 overflow-y-auto">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-sm font-medium text-foreground tracking-wide uppercase">selected</h2>
              {selectedIngredients.length > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">{selectedIngredients.length}</span>
              )}
            </div>
            {selectedIngredients.length === 0 ? (
              <div className="text-center py-12 px-6 bg-secondary/30 rounded-2xl border-2 border-dashed border-border">
                <p className="text-muted-foreground">Select ingredients from the sidebar</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {selectedIngredients.map((ingredient) => (
                    <div key={ingredient} className="inline-flex items-center gap-2 px-5 py-2.5 bg-card rounded-full text-sm font-medium border border-border shadow-sm">
                      {ingredient}
                      <button onClick={() => handleRemoveIngredient(ingredient)} className="text-muted-foreground hover:text-destructive">×</button>
                    </div>
                  ))}
                </div>
                <button onClick={findRecipes} disabled={loading} className="w-full max-w-md bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold hover:scale-105 transition-all disabled:opacity-50">
                  {loading ? 'searching...' : 'find recipes'}
                </button>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-foreground mb-6 tracking-wide uppercase">results</h2>
            {!hasSearched ? (
              <p className="text-center py-16 text-muted-foreground">Your delicious recipes will appear here</p>
            ) : recipes.length === 0 ? (
              <p className="text-center py-16 text-muted-foreground">No recipes found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all">
                    {recipe.image && <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-card-foreground mb-2">{recipe.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">by {recipe.channelTitle}</p>
                      
                      {/* Match Info */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {recipe.matchCount} of your ingredients
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Click to see full match %
                        </div>
                      </div>
                      
                      <button onClick={() => getRecipeDetails(recipe)} className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
                        view recipe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* recipe modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-8 py-6 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">{selectedRecipe.name}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  {selectedRecipe.matchPercentage !== undefined && (
                    <>
                      <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
                        {selectedRecipe.matchPercentage}% Match
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedRecipe.matchedCount} of {selectedRecipe.totalIngredients} ingredients you have
                      </p>
                    </>
                  )}
                 
                </div>
              </div>
              <button onClick={() => setSelectedRecipe(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary text-2xl">×</button>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto max-h-[calc(90vh-88px)]">
              {selectedRecipe.youtubeId && (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-2xl"
                    src={`https://www.youtube.com/embed/${selectedRecipe.youtubeId}`}
                    title={selectedRecipe.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold tracking-wide uppercase mb-5">Ingredients</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedRecipe.ingredients.map((ing: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl border border-border">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span className="text-sm font-medium">{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold tracking-wide uppercase mb-5">Instructions</h3>
                  <ol className="space-y-4">
                    {selectedRecipe.instructions.map((step: string, i: number) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}