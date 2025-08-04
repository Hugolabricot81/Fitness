"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Home, Calendar, List, Play, Pause, RotateCcw, Plus, Check, Target, Flame, Trophy, Timer } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface Exercise {
  id: string
  name: string
  icon: string
  coefficient: number
}

interface DayExercise {
  exerciseId: string
  reps: number
  completed: boolean
}

interface DayProgram {
  [key: string]: DayExercise[]
}

interface WeeklyData {
  day: string
  percentage: number
}

const defaultExercises: Exercise[] = [
  { id: "1", name: "Pompes", icon: "💪", coefficient: 1.2 },
  { id: "2", name: "Vélo", icon: "🚴", coefficient: 0.5 },
  { id: "3", name: "Course", icon: "🏃", coefficient: 1.0 },
  { id: "4", name: "Squats", icon: "🦵", coefficient: 1.1 },
]

const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"]
const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

export default function FitPerso() {
  const [currentPage, setCurrentPage] = useState(0)
  const [exercises, setExercises] = useState<Exercise[]>(defaultExercises)
  const [dayPrograms, setDayPrograms] = useState<DayProgram>({})
  const [selectedDay, setSelectedDay] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(100)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [newExercise, setNewExercise] = useState({ name: "", icon: "💪", coefficient: 1.0 })

  // Load data from localStorage
  useEffect(() => {
    const savedExercises = localStorage.getItem("fitperso-exercises")
    const savedPrograms = localStorage.getItem("fitperso-programs")
    const savedGoal = localStorage.getItem("fitperso-goal")
    const savedStreak = localStorage.getItem("fitperso-streak")
    const savedBestStreak = localStorage.getItem("fitperso-best-streak")
    const savedWeeklyData = localStorage.getItem("fitperso-weekly-data")

    if (savedExercises) setExercises(JSON.parse(savedExercises))
    if (savedPrograms) setDayPrograms(JSON.parse(savedPrograms))
    if (savedGoal) setDailyGoal(Number.parseInt(savedGoal))
    if (savedStreak) setCurrentStreak(Number.parseInt(savedStreak))
    if (savedBestStreak) setBestStreak(Number.parseInt(savedBestStreak))
    if (savedWeeklyData) {
      setWeeklyData(JSON.parse(savedWeeklyData))
    } else {
      // Initialize weekly data
      const initialData = daysOfWeek.map((day, index) => ({
        day,
        percentage: Math.floor(Math.random() * 100),
      }))
      setWeeklyData(initialData)
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("fitperso-exercises", JSON.stringify(exercises))
  }, [exercises])

  useEffect(() => {
    localStorage.setItem("fitperso-programs", JSON.stringify(dayPrograms))
  }, [dayPrograms])

  useEffect(() => {
    localStorage.setItem("fitperso-goal", dailyGoal.toString())
  }, [dailyGoal])

  useEffect(() => {
    localStorage.setItem("fitperso-streak", currentStreak.toString())
  }, [currentStreak])

  useEffect(() => {
    localStorage.setItem("fitperso-best-streak", bestStreak.toString())
  }, [bestStreak])

  useEffect(() => {
    localStorage.setItem("fitperso-weekly-data", JSON.stringify(weeklyData))
  }, [weeklyData])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const calculateDayProgress = (dayIndex: number) => {
    const todayProgram = dayPrograms[dayIndex.toString()] || []
    let totalScore = 0

    todayProgram.forEach((dayEx) => {
      if (dayEx.completed) {
        const exercise = exercises.find((ex) => ex.id === dayEx.exerciseId)
        if (exercise) {
          totalScore += dayEx.reps * exercise.coefficient
        }
      }
    })

    return Math.min((totalScore / dailyGoal) * 100, 100)
  }

  const getTodayTotal = () => {
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1 // Convert Sunday=0 to our format
    return calculateDayProgress(todayIndex)
  }

  const addExercise = () => {
    if (newExercise.name.trim()) {
      const exercise: Exercise = {
        id: Date.now().toString(),
        name: newExercise.name,
        icon: newExercise.icon,
        coefficient: newExercise.coefficient,
      }
      setExercises([...exercises, exercise])
      setNewExercise({ name: "", icon: "💪", coefficient: 1.0 })
    }
  }

  const addExerciseToDay = (dayIndex: number, exerciseId: string, reps: number) => {
    const dayKey = dayIndex.toString()
    const currentProgram = dayPrograms[dayKey] || []
    const newProgram = [...currentProgram, { exerciseId, reps, completed: false }]
    setDayPrograms({ ...dayPrograms, [dayKey]: newProgram })
  }

  const toggleExerciseCompletion = (dayIndex: number, exerciseIndex: number) => {
    const dayKey = dayIndex.toString()
    const currentProgram = [...(dayPrograms[dayKey] || [])]
    currentProgram[exerciseIndex].completed = !currentProgram[exerciseIndex].completed
    setDayPrograms({ ...dayPrograms, [dayKey]: currentProgram })

    // Update weekly data and streaks
    const newPercentage = calculateDayProgress(dayIndex)
    const newWeeklyData = [...weeklyData]
    newWeeklyData[dayIndex] = { ...newWeeklyData[dayIndex], percentage: newPercentage }
    setWeeklyData(newWeeklyData)

    if (newPercentage >= 100) {
      const newStreak = currentStreak + 1
      setCurrentStreak(newStreak)
      if (newStreak > bestStreak) {
        setBestStreak(newStreak)
      }
    }
  }

  // Page 1 - Accueil
  const HomePage = () => (
    <div className="space-y-4 p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">FitPerso</h1>

      {/* Graphique objectif */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Objectifs de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Objectif du jour */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Objectif du jour</h3>
              <p className="text-sm text-gray-600">{dailyGoal} unités pondérées</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">{getTodayTotal().toFixed(0)}%</div>
              <p className="text-xs text-gray-500">Complété</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak actuelle et best streak */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{currentStreak}</div>
            <p className="text-xs text-gray-600">Série actuelle</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{bestStreak}</div>
            <p className="text-xs text-gray-600">Meilleure série</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Page 2 - Configurer mes séances
  const ConfigPage = () => (
    <div className="space-y-4 p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurer mes séances</h1>

      {/* Sélection des jours */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            {daysOfWeek.map((day, index) => (
              <Button
                key={index}
                variant={selectedDay === index ? "default" : "outline"}
                size="sm"
                className="w-10 h-10 rounded-full p-0"
                onClick={() => setSelectedDay(index)}
              >
                {day}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Programme du jour sélectionné */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{dayNames[selectedDay]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(dayPrograms[selectedDay.toString()] || []).map((dayEx, index) => {
            const exercise = exercises.find((ex) => ex.id === dayEx.exerciseId)
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{exercise?.icon}</span>
                  <div>
                    <p className="font-medium">{exercise?.name}</p>
                    <p className="text-sm text-gray-600">{dayEx.reps} répétitions</p>
                  </div>
                </div>
                <Badge variant="secondary">×{exercise?.coefficient}</Badge>
              </div>
            )
          })}

          {/* Ajouter un exercice */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Ajouter un exercice</Label>
            <div className="flex gap-2">
              <select
                className="flex-1 p-2 border rounded-md"
                onChange={(e) => {
                  const exerciseId = e.target.value
                  if (exerciseId) {
                    const reps = prompt("Nombre de répétitions ?")
                    if (reps && Number.parseInt(reps) > 0) {
                      addExerciseToDay(selectedDay, exerciseId, Number.parseInt(reps))
                    }
                  }
                }}
                value=""
              >
                <option value="">Choisir un exercice</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.icon} {ex.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objectif du lendemain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Objectif quotidien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label>Unités pondérées :</Label>
            <Input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number.parseInt(e.target.value) || 100)}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Créer un exercice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Créer un exercice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nom de l'exercice</Label>
            <Input
              value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              placeholder="Ex: Burpees"
            />
          </div>
          <div>
            <Label>Icône</Label>
            <Input
              value={newExercise.icon}
              onChange={(e) => setNewExercise({ ...newExercise, icon: e.target.value })}
              placeholder="💪"
              className="w-20"
            />
          </div>
          <div>
            <Label>Coefficient de difficulté</Label>
            <Input
              type="number"
              step="0.1"
              value={newExercise.coefficient}
              onChange={(e) =>
                setNewExercise({ ...newExercise, coefficient: Number.parseFloat(e.target.value) || 1.0 })
              }
              className="w-24"
            />
          </div>
          <Button onClick={addExercise} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Créer l'exercice
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Page 3 - Vue détaillée du jour
  const DetailPage = () => {
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1
    const todayProgram = dayPrograms[todayIndex.toString()] || []
    const progress = calculateDayProgress(todayIndex)

    return (
      <div className="space-y-4 p-4 pb-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Séance du jour</h1>

        {/* Barre de progression */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progression</span>
                <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Chronomètre */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Durée de la séance</p>
                  <p className="text-2xl font-bold text-blue-600">{formatTime(timerSeconds)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTimerSeconds(0)
                    setIsTimerRunning(false)
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des exercices */}
        <div className="space-y-3">
          {todayProgram.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                <p>Aucun exercice programmé pour aujourd'hui</p>
                <p className="text-sm">Configurez vos séances dans l'onglet "Configurer"</p>
              </CardContent>
            </Card>
          ) : (
            todayProgram.map((dayEx, index) => {
              const exercise = exercises.find((ex) => ex.id === dayEx.exerciseId)
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{exercise?.icon}</span>
                        <div>
                          <p className="font-medium">{exercise?.name}</p>
                          <p className="text-sm text-gray-600">
                            {dayEx.reps} répétitions • Coeff. {exercise?.coefficient}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={dayEx.completed ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleExerciseCompletion(todayIndex, index)}
                        className={dayEx.completed ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    )
  }

  const pages = [HomePage, ConfigPage, DetailPage]
  const pageIcons = [Home, Calendar, List]
  const pageNames = ["Accueil", "Configurer", "Détails"]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="pb-16">{pages[currentPage]()}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex">
          {pageIcons.map((Icon, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 transition-colors ${
                currentPage === index ? "text-emerald-600 bg-emerald-50" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{pageNames[index]}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
