"use client"

import { useState } from "react"
import axios from "axios"
import Header from "@/components/header"
import IngredientsSidebar from "@/components/ingredients-sidebar"
import RecipesPanel from "@/components/recipes-panel"
import RecipeModal from "@/components/recipe-modal"

const SPOONACULAR_API_KEY = "5908632853b5443c8d01afb917cad442"
const YOUTUBE_API_KEY = "AIzaSyA5tp_3cjeVZtiKyGtzuFjPxd99crtcnOo"

export default function MainApp() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [recipes, setRecipes] = useState<any[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelectIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== ingredient))
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient])
    }
  }

  const handleAddCustomIngredient = (ingredient: string) => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient])
    }
  }

  const handleRemoveIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i !== ingredient))
  }

  const handleToggleDietaryRestriction = (restriction: string) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restriction))
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction])
    }
  }

  const handleFindRecipes = async () => {
    if (selectedIngredients.length === 0) return

    setLoading(true)
    setHasSearched(true)
    
    try {
      let searchQuery = `${selectedIngredients.join(' ')} recipe`
      
      if (dietaryRestrictions.includes('Vegetarian')) {
        searchQuery += ' vegetarian'
      }
      if (dietaryRestrictions.includes('Vegan')) {
        searchQuery += ' vegan'
      }
      if (dietaryRestrictions.includes('Gluten-Free')) {
        searchQuery += ' gluten free'
      }
      if (dietaryRestrictions.includes('Dairy-Free')) {
        searchQuery += ' dairy free'
      }
      
      console.log('🎥 YouTube search:', searchQuery)
      
      const youtubeResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            key: YOUTUBE_API_KEY,
            q: searchQuery,
            part: 'snippet',
            type: 'video',
            maxResults: 12,
            videoDuration: 'medium',
            relevanceLanguage: 'en'
          }
        }
      )

      const transformedRecipes = youtubeResponse.data.items.map((video: any) => ({
        id: video.id.videoId,
        name: video.snippet.title,
        image: video.snippet.thumbnails.high.url,
        youtubeId: video.id.videoId,
        channelTitle: video.snippet.channelTitle,
        description: video.snippet.description,
        matchCount: selectedIngredients.length,
        ingredients: [],
        instructions: []
      }))

      console.log('✅ Found', transformedRecipes.length, 'recipes')
      setRecipes(transformedRecipes)
    } catch (error) {
      console.error('❌ ERROR!', error)
      alert('Error fetching recipes. Please try again.')
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRecipe = async (recipe: any) => {
    console.log('🎬 Recipe clicked:', recipe)
    console.log('🆔 YouTube ID:', recipe.youtubeId)
    
    try {
      if (recipe.youtubeId) {
        console.log('✅ Has YouTube ID, fetching Spoonacular...')
        setLoading(true)
        
        try {
          const spoonacularSearch = await axios.get(
            `https://api.spoonacular.com/recipes/complexSearch`,
            {
              params: {
                apiKey: SPOONACULAR_API_KEY,
                query: recipe.name.split('|')[0].trim(),
                number: 1,
                addRecipeInformation: true,
                fillIngredients: true
              }
            }
          )

          if (spoonacularSearch.data.results.length > 0) {
            const spoonacularRecipe = spoonacularSearch.data.results[0]
            
            const detailsResponse = await axios.get(
              `https://api.spoonacular.com/recipes/${spoonacularRecipe.id}/information`,
              {
                params: {
                  apiKey: SPOONACULAR_API_KEY
                }
              }
            )

            const combinedRecipe = {
              ...recipe,
              youtubeId: recipe.youtubeId,
              channelTitle: recipe.channelTitle,
              ingredients: detailsResponse.data.extendedIngredients?.map((ing: any) => ing.original) || [],
              instructions: detailsResponse.data.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || 
                            (detailsResponse.data.instructions ? [detailsResponse.data.instructions] : []),
              spoonacularImage: detailsResponse.data.image
            }
            
            console.log('📦 Combined recipe with YouTube ID:', combinedRecipe.youtubeId)
            setSelectedRecipe(combinedRecipe)
          } else {
            console.log('❌ No Spoonacular match')
            setSelectedRecipe({
              ...recipe,
              ingredients: ['Watch the video for ingredients'],
              instructions: ['Watch the video for instructions']
            })
          }
        } catch (err) {
          console.error('Spoonacular error:', err)
          setSelectedRecipe({
            ...recipe,
            ingredients: ['Watch the video for ingredients'],
            instructions: ['Watch the video for instructions']
          })
        } finally {
          setLoading(false)
        }
      } else {
        console.log('⚠️ NO YouTube ID!')
        setSelectedRecipe(recipe)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      <Header />
      <div className="flex">
        <IngredientsSidebar
          selectedIngredients={selectedIngredients}
          onSelectIngredient={handleSelectIngredient}
          onAddCustomIngredient={handleAddCustomIngredient}
          dietaryRestrictions={dietaryRestrictions}
          onToggleDietaryRestriction={handleToggleDietaryRestriction}
        />
        <RecipesPanel
          selectedIngredients={selectedIngredients}
          onRemoveIngredient={handleRemoveIngredient}
          recipes={recipes}
          onFindRecipes={handleFindRecipes}
          onSelectRecipe={handleSelectRecipe}
          hasSearched={hasSearched}
          loading={loading}
        />
      </div>
      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </div>
  )
}