const express = require('express')
const cors = require('cors')
const { YoutubeTranscript } = require('youtube-transcript')
const Groq = require('groq-sdk')

const app = express()
const PORT = 3001

// CORS configuration
app.use(cors())
app.use(express.json())

// Initialize Groq client (FREE & FAST!)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE'
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Transcript server is running' })
})

// Transcript endpoint with AI summarization
app.post('/api/transcript', async (req, res) => {
  try {
    const { videoId } = req.body

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' })
    }

    console.log(`Fetching transcript for video: ${videoId}`)

    // Fetch transcript from YouTube
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({ error: 'No transcript available for this video' })
    }

    // Combine transcript into full text
    const fullTranscript = transcript
      .map(item => item.text)
      .join(' ')
      .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc
      .trim()

    console.log(`Transcript length: ${fullTranscript.length} characters`)

    // Use Groq (Llama 3) to extract ingredients and instructions - FREE & FAST!
    console.log('Sending to Groq AI (Llama 3) for summarization...')
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: `You are analyzing a recipe video transcript. Extract the following information in a structured format:

TRANSCRIPT:
${fullTranscript.substring(0, 12000)}

Please respond ONLY with valid JSON in this exact format (no markdown, no backticks, just raw JSON):
{
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...]
}

Requirements:
- Extract ALL ingredients mentioned with quantities
- Create clear step-by-step instructions (5-10 steps)
- Use simple, concise language
- If ingredients/steps aren't clear, make reasonable assumptions based on the recipe context`
      }],
      model: 'llama-3.3-70b-versatile', // Fast and FREE!
      temperature: 0.3,
      max_tokens: 2000
    })

    // Parse Groq's response
    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || ''
    console.log('Groq response:', responseText.substring(0, 200))
    
    let recipeData
    try {
      recipeData = JSON.parse(responseText)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse Groq response as JSON')
      }
    }

    console.log(`Extracted ${recipeData.ingredients?.length || 0} ingredients and ${recipeData.instructions?.length || 0} steps`)

    res.json({
      success: true,
      transcript: fullTranscript,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      source: 'ai-generated'
    })

  } catch (error) {
    console.error('Error processing transcript:', error)
    
    if (error.message.includes('Transcript is disabled')) {
      return res.status(404).json({ 
        error: 'Transcript is disabled for this video',
        message: 'This video does not have captions/subtitles available'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to process transcript',
      message: error.message 
    })
  }
})

app.listen(PORT, () => {
  console.log(`🎥 Transcript server running on http://localhost:${PORT}`)
  console.log(`🚀 Using Groq AI (Llama 3) - FREE & FAST!`)
  console.log(`✅ Ready to process YouTube transcripts!`)
})