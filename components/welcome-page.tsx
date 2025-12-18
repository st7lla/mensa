"use client"

import { useState } from "react"
import WelcomePage from "../components/welcome-page"
import MainApp from "../components/main-app"

export default function Home() {
  const [started, setStarted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  console.log("DEBUG: started =", started)

  const handleStart = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setStarted(true)
    }, 500)
  }

  if (!started) {
    console.log("Rendering WelcomePage")
    return <WelcomePage onStart={handleStart} isTransitioning={isTransitioning} />
  }

  console.log("Rendering MainApp")
  return <MainApp />
}