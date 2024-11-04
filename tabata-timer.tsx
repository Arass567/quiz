"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Timer, Clock, Zap, Pause, RotateCcw, Activity, Settings, Volume2, VolumeX, Moon, Sun, Save, Share2, Music, Search, Trash2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from "framer-motion"
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { useTheme } from 'next-themes'

type Preselection = {
  travail: number;
  repos: number;
  cycles: number;
  series: number;
}

type Configuration = {
  tempsTravail: number;
  tempsRepos: number;
  cycles: number;
  series: number;
  tempsPreparation: number;
  tempsRecuperation: number;
  exercices: Exercice[];
}

type Exercice = {
  id: string;
  nom: string;
  icone: string;
}

const preselections: Record<string, Preselection> = {
  classique: { travail: 20, repos: 10, cycles: 8, series: 1 },
  tabata30: { travail: 30, repos: 15, cycles: 6, series: 1 },
  hiit: { travail: 45, repos: 15, cycles: 10, series: 2 },
}

const useAudio = (src: string, volume: number = 1, loop: boolean = false) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(src)
    audioRef.current.volume = volume
    audioRef.current.loop = loop
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src, volume, loop])

  const play = useCallback(() => audioRef.current?.play(), [])
  const pause = useCallback(() => audioRef.current?.pause(), [])

  return { play, pause }
}

export default function TabataTimer() {
  const { theme, setTheme } = useTheme()
  const [vueActuelle, setVueActuelle] = useState("minuteur")
  const [temps, setTemps] = useState(20)
  const [estActif, setEstActif] = useState(false)
  const [progres, setProgres] = useState(0)
  const [tempsTravail, setTempsTravail] = useState(20)
  const [tempsRepos, setTempsRepos] = useState(10)
  const [cycles, setCycles] = useState(8)
  const [series, setSeries] = useState(1)
  const [cycleActuel, setCycleActuel] = useState(1)
  const [serieActuelle, setSerieActuelle] = useState(1)
  const [estTravail, setEstTravail] = useState(true)
  const [sonActive, setSonActive] = useState(true)
  const [vibrationActive, setVibrationActive] = useState(true)
  const [preselectionChoisie, setPreselectionChoisie] = useState("classique")
  const [exercices, setExercices] = useState<Exercice[]>([
    { id: '1', nom: "Squats", icone: "🏋️" },
    { id: '2', nom: "Pompes", icone: "💪" },
    { id: '3', nom: "Burpees", icone: "🔥" },
    { id: '4', nom: "Mountain Climbers", icone: "🏔️" },
    { id: '5', nom: "Jumping Jacks", icone: "🤸" },
    { id: '6', nom: "Planche", icone: "🧘" },
    { id: '7', nom: "Fentes", icone: "🚶" },
    { id: '8', nom: "Crunchs", icone: "🦵" }
  ])
  const [tempsPreparation, setTempsPreparation] = useState(10)
  const [estEnPreparation, setEstEnPreparation] = useState(true)
  const [guideVocalActive, setGuideVocalActive] = useState(false)
  const [tempsRecuperation, setTempsRecuperation] = useState(60)
  const [estEnRecuperation, setEstEnRecuperation] = useState(false)
  const [musiqueActive, setMusiqueActive] = useState(false)
  const [configurationsPersonnalisees, setConfigurationsPersonnalisees] = useState<Array<{nom: string, config: Configuration}>>([])
  const [nomConfiguration, setNomConfiguration] = useState("")
  const [donneesProgramme, setDonneesProgramme] = useState<Array<{date: string, duree: number, calories: number}>>([])
  const [recherche, setRecherche] = useState("")
  const [nouvelExercice, setNouvelExercice] = useState({ nom: '', icone: '' })

  const { play: playBip } = useAudio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bip-bv3VdyNwa0LjrwGCg51wwK39HBoYvs.wav", 0.5)
  const { play: playCrach } = useAudio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crach-k0ylRfHloQIslioLetpHEujZT4SvLe.wav", 0.7)
  const { play: playMusique, pause: pauseMusique } = useAudio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/workout-music-4OVOYMHGLYLOXDXZWCBXNWNTLXNLxI.mp3", 0.3, true)

  useEffect(() => {
    let intervalle: NodeJS.Timeout | null = null
    if (estActif) {
      intervalle = setInterval(() => {
        setTemps((tempsPrec) => {
          if (tempsPrec <= 3 && tempsPrec > 0) {
            jouerSonEtVibration()
          }
          return tempsPrec - 1
        })
        setProgres((progresPrec) => progresPrec + (100 / (estTravail ? tempsTravail : tempsRepos)))
      }, 1000)
    }
    return () => {
      if (intervalle) clearInterval(intervalle)
    }
  }, [estActif, estTravail, tempsTravail, tempsRepos])

  useEffect(() => {
    if (temps === 0) {
      jouerSonFinIntervalle()
      if (estEnPreparation) {
        setEstEnPreparation(false)
        setTemps(tempsTravail)
        setEstTravail(true)
        annoncer("Commencez le travail")
      } else if (estEnRecuperation) {
        setEstEnRecuperation(false)
        setTemps(tempsTravail)
        setEstTravail(true)
        annoncer("Commencez le travail")
      } else if (estTravail) {
        if (cycleActuel < cycles) {
          setCycleActuel((prev) => prev + 1)
          setEstTravail(false)
          setTemps(tempsRepos)
          annoncer("Repos")
        } else if (serieActuelle < series) {
          setSerieActuelle((prev) => prev + 1)
          setCycleActuel(1)
          setEstEnRecuperation(true)
          setTemps(tempsRecuperation)
          annoncer("Récupération entre les séries")
        } else {
          reinitialiserMinuteur()
          annoncer("Entraînement terminé")
          enregistrerEntrainement()
        }
      } else {
        setEstTravail(true)
        setTemps(tempsTravail)
        annoncer(`Commencez ${exercices[(cycleActuel - 1) % exercices.length].nom}`)
      }
      setProgres(0)
    }
  }, [temps, estEnPreparation, estEnRecuperation, estTravail, cycleActuel, cycles, serieActuelle, series, tempsTravail, tempsRepos, tempsRecuperation, exercices])

  useEffect(() => {
    if (musiqueActive && estActif) {
      playMusique()
    } else {
      pauseMusique()
    }
  }, [musiqueActive, estActif, playMusique, pauseMusique])

  const demarrerMinuteur = useCallback(() => {
    setEstActif((prev) => !prev)
  }, [])

  const reinitialiserMinuteur = useCallback(() => {
    setEstActif(false)
    setTemps(tempsPreparation)
    setProgres(0)
    setCycleActuel(1)
    setSerieActuelle(1)
    setEstTravail(true)
    setEstEnPreparation(true)
    setEstEnRecuperation(false)
    pauseMusique()
  }, [tempsPreparation, pauseMusique])

  const appliquerPreselection = useCallback((preselection: keyof typeof preselections) => {
    const { travail, repos, cycles, series } = preselections[preselection]
    setTempsTravail(travail)
    setTempsRepos(repos)
    setCycles(cycles)
    setSeries(series)
    setPreselectionChoisie(preselection)
    reinitialiserMinuteur()
  }, [reinitialiserMinuteur])

  const jouerSonEtVibration = useCallback(() => {
    if (sonActive) playBip()
    if (vibrationActive && 'vibrate' in navigator) {
      navigator.vibrate(200)
    }
  }, [sonActive, vibrationActive, playBip])

  const jouerSonFinIntervalle = useCallback(() => {
    if (sonActive) playCrach()
    if (vibrationActive && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }, [sonActive, vibrationActive, playCrach])

  const annoncer = useCallback((message: string) => {
    if (guideVocalActive && 'speechSynthesis' in window) {
      const annonce = new SpeechSynthesisUtterance(message)
      annonce.lang = 'fr-FR'
      speechSynthesis.speak(annonce)
    }
  }, [guideVocalActive])

  const sauvegarderConfiguration = useCallback(() => {
    if (nomConfiguration) {
      const nouvelleConfig: Configuration = {
        tempsTravail,
        tempsRepos,
        cycles,
        series,
        tempsPreparation,
        tempsRecuperation,
        exercices
      }
      setConfigurationsPersonnalisees(prev => [...prev, { nom: nomConfiguration, config: nouvelleConfig }])
      setNomConfiguration("")
    }
  }, [nomConfiguration, tempsTravail, tempsRepos, cycles, series, tempsPreparation, tempsRecuperation, exercices])

  const chargerConfiguration = useCallback((config: Configuration) => {
    setTempsTravail(config.tempsTravail)
    setTempsRepos(config.tempsRepos)
    setCycles(config.cycles)
    setSeries(config.series)
    setTempsPreparation(config.tempsPreparation)
    setTempsRecuperation(config.tempsRecuperation)
    setExercices(config.exercices)
    reinitialiserMinuteur()
  }, [reinitialiserMinuteur])

  const partagerConfiguration = useCallback(() => {
    const configActuelle: Configuration = {
      tempsTravail,
      tempsRepos,
      cycles,
      series,
      tempsPreparation,
      tempsRecuperation,
      exercices
    }
    const configString = JSON.stringify(configActuelle)
    const encodedConfig = encodeURIComponent(configString)
    const shareUrl = `${window.location.origin}?config=${encodedConfig}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Ma configuration Tabata',
        text: 'Voici ma configuration Tabata personnalisée !',
        url: shareUrl
      }).catch((error) => console.log('Erreur de partage', error))
    } else {
      prompt('Copiez ce lien pour partager votre configuration:', shareUrl)
    }
  }, [tempsTravail, tempsRepos, cycles, series, tempsPreparation, tempsRecuperation, exercices])

  const ajouterExercice = useCallback(() => {
    if (nouvelExercice.nom && nouvelExercice.icone) {
      setExercices(prev => [...prev, { id: Date.now().toString(), ...nouvelExercice }])
      setNouvelExercice({ nom: '', icone: '' })
    }
  }, [nouvelExercice])

  const supprimerExercice = useCallback((id: string) => {
    setExercices(prev => prev.filter(exercice => exercice.id !== id))
  }, [])

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(exercices)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setExercices(items)
  }, [exercices])

  const enregistrerEntrainement = useCallback(() => {
    const nouvelEntrainement = {
      date: new Date().toISOString().split('T')[0],
      duree: tempsTravail * cycles * series + tempsRepos * (cycles - 1) * series + tempsRecuperation * (series - 1),
      calories: Math.round((tempsTravail * cycles * series) / 60 * 10) // Estimation grossière : 10 calories par minute de travail
    }
    setDonneesProgramme(prev => [...prev, nouvelEntrainement])
  }, [tempsTravail, cycles, series,    tempsRepos, tempsRecuperation])

  const exercicesFiltres = exercices.filter(exercice =>
    exercice.nom.toLowerCase().includes(recherche.toLowerCase())
  )

  const parametresMinuteur = [
    { icon: Clock, titre: "Travail", valeur: `${String(Math.floor(tempsTravail / 60)).padStart(2, '0')}:${String(tempsTravail % 60).padStart(2, '0')}`, couleur: "bg-[#95D6D2]" },
    { icon: Pause, titre: "Repos", valeur: `${String(Math.floor(tempsRepos / 60)).padStart(2, '0')}:${String(tempsRepos % 60).padStart(2, '0')}`, couleur: "bg-[#FFB4A2]" },
    { icon: RotateCcw, titre: "Cycles", valeur: cycles.toString(), couleur: "bg-[#F9C74F]" },
    { icon: Zap, titre: "Séries", valeur: series.toString(), couleur: "bg-[#90BE6D]" },
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-[#FDF6F0] text-gray-800'} p-6 max-w-md mx-auto relative overflow-hidden transition-colors duration-300 font-montserrat`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
      `}</style>
      <div className={`absolute top-0 right-0 w-40 h-40 ${theme === 'dark' ? 'bg-blue-500' : 'bg-[#95D6D2]'} rounded-full opacity-20 translate-x-20 -translate-y-20`} />
      <div className={`absolute bottom-0 left-0 w-60 h-60 ${theme === 'dark' ? 'bg-purple-500' : 'bg-[#FFB4A2]'} rounded-full opacity-20 -translate-x-20 translate-y-20`} />
      
      <Tabs value={vueActuelle} onValueChange={setVueActuelle} className="w-full relative">
        <TabsContent value="minuteur" className="space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Tabata Timer</h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Entraînement par intervalles</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSonActive(!sonActive)}
                className={`rounded-full h-12 w-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
                aria-label={sonActive ? "Désactiver le son" : "Activer le son"}
              >
                {sonActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`rounded-full h-12 w-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
                aria-label={theme === 'dark' ? "Activer le mode clair" : "Activer le mode sombre"}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {parametresMinuteur.map((parametre, i) => (
              <Card key={i} className={`border-none shadow-lg rounded-3xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <CardContent className={`p-6 ${parametre.couleur} ${theme === 'dark' ? 'bg-opacity-30' : 'bg-opacity-20'}`}>
                  <parametre.icon className={`w-8 h-8 mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
                  <h3 className="text-xl mb-1">{parametre.titre}</h3>
                  <p className="text-2xl font-bold">{parametre.valeur}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="relative inline-flex items-center justify-center w-64 h-64 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className={`${theme === 'dark' ? 'text-gray-700' : 'text-gray-200'}`}
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={`${theme === 'dark' ? 'text-blue-500' : 'text-[#95D6D2]'} transition-all duration-1000`}
                  strokeWidth="8"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (progres / 100) * 283}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
              </svg>
              <AnimatePresence mode="wait">
                <motion.div
                  key={temps}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute text-center"
                >
                  <span className={`text-6xl font-bold ${temps <= 3 ? 'text-red-600' : ''}`}>{temps}</span>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                    {estEnPreparation ? "Préparation" : (estEnRecuperation ? "Récupération" : (estTravail ? "Travail" : "Repos"))}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              Cycle {cycleActuel}/{cycles} - Série {serieActuelle}/{series}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={`${cycleActuel}-${estTravail}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-semibold mb-6"
              >
                {estTravail ? exercices[(cycleActuel - 1) % exercices.length].nom : "Repos"}
              </motion.p>
            </AnimatePresence>
            
            <div className="space-x-4">
              <Button 
                onClick={demarrerMinuteur} 
                className={`${estActif ? (theme === 'dark' ? "bg-red-600 hover:bg-red-700" : "bg-[#FFB4A2] hover:bg-[#FF9A84]") : (theme === 'dark' ? "bg-green-600 hover:bg-green-700" : "bg-[#95D6D2] hover:bg-[#7AC7C2]")} text-white rounded-full px-8 py-6 text-lg`}
              >
                {estActif ? "Pause" : "Démarrer"}
              </Button>
              <Button 
                onClick={reinitialiserMinuteur} 
                variant="outline" 
                className={`rounded-full px-8 py-6 text-lg border-2 ${theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300'}`}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progres" className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">Progrès</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Suivi de vos entraînements</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className={`border-none shadow-lg rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-[#95D6D2] bg-opacity-20'}`}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">{donneesProgramme.length}</div>
                <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Entraînements</div>
              </CardContent>
            </Card>
            <Card className={`border-none shadow-lg rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-[#FFB4A2] bg-opacity-20'}`}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">{donneesProgramme.reduce((acc, curr) => acc + curr.duree, 0)}</div>
                <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Minutes</div>
              </CardContent>
            </Card>
            <Card className={`border-none shadow-lg rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-[#F9C74F] bg-opacity-20'}`}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">{donneesProgramme.reduce((acc, curr) => acc + curr.calories, 0)}</div>
                <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Calories</div>
              </CardContent>
            </Card>
          </div>

          <Card className={`border-none shadow-lg rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={donneesProgramme}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="duree" stroke="#8884d8" />
                  <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametres" className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">Paramètres</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Personnalisez votre entraînement</p>
          </div>
          
          <Card className={`border-none shadow-lg rounded-3xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xl mb-4">Présélections</h3>
                <Select value={preselectionChoisie} onValueChange={appliquerPreselection}>
                  <SelectTrigger className={`w-full rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    <SelectValue placeholder="Sélectionner une présélection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classique">Tabata Classique</SelectItem>
                    <SelectItem value="tabata30">Tabata 30/15</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl">Minuteur personnalisé</h3>
                <div className="space-y-2">
                  <label className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Temps de travail (secondes)</label>
                  <Input
                    type="number"
                    value={tempsTravail}
                    onChange={(e) => setTempsTravail(Number(e.target.value))}
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Temps de repos (secondes)</label>
                  <Input
                    type="number"
                    value={tempsRepos}
                    onChange={(e) => setTempsRepos(Number(e.target.value))}
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Cycles</label>
                  <Input
                    type="number"
                    value={cycles}
                    onChange={(e) => setCycles(Number(e.target.value))}
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Séries</label>
                  <Input
                    type="number"
                    value={series}
                    onChange={(e) => setSeries(Number(e.target.value))}
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Temps de préparation (secondes)</label>
                  <Input
                    type="number"
                    value={tempsPreparation}
                    onChange={(e) => setTempsPreparation(Number(e.target.value))}
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Temps de récupération entre les séries (secondes)</label>
                  <Input
                    type="number"
                    value={tempsRecuperation}
                    onChange={(e) => setTempsRecuperation(Number(e.target.value))}
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl">Exercices</h3>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Rechercher un exercice"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className={`flex-grow rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <Search className="w-5 h-5 text-gray-400" />
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="exercices">
                    {(provided) => (
                      <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {exercicesFiltres.map((exercice, index) => (
                          <Draggable key={exercice.id} draggableId={exercice.id} index={index}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card className={`border-none shadow-lg rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                  <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center space-x-4">
                                      <span className="text-2xl">{exercice.icone}</span>
                                      <span>{exercice.nom}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => supprimerExercice(exercice.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </Button>
                                  </CardContent>
                                </Card>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>

                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Nom de l'exercice"
                    value={nouvelExercice.nom}
                    onChange={(e) => setNouvelExercice({ ...nouvelExercice, nom: e.target.value })}
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <Input
                    type="text"
                    placeholder="Icône"
                    value={nouvelExercice.icone}
                    onChange={(e) => setNouvelExercice({ ...nouvelExercice, icone: e.target.value })}
                    className={`w-20 rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <Button onClick={ajouterExercice} className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#95D6D2] hover:bg-[#7AC7C2]'} text-white`}>
                    Ajouter
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl">Options</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="son-toggle"
                    checked={sonActive}
                    onCheckedChange={setSonActive}
                  />
                  <label htmlFor="son-toggle" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Activer le son</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="vibration-toggle"
                    checked={vibrationActive}
                    onCheckedChange={setVibrationActive}
                  />
                  <label htmlFor="vibration-toggle" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Activer la vibration</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="guide-vocal-toggle"
                    checked={guideVocalActive}
                    onCheckedChange={setGuideVocalActive}
                  />
                  <label htmlFor="guide-vocal-toggle" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Activer le guide vocal</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="musique-toggle"
                    checked={musiqueActive}
                    onCheckedChange={setMusiqueActive}
                  />
                  <label htmlFor="musique-toggle" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Activer la musique d'entraînement</label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl">Sauvegarder la configuration</h3>
                <div className="flex items-center space-x-2">
                  <Input
                    value={nomConfiguration}
                    onChange={(e) => setNomConfiguration(e.target.value)}
                    placeholder="Nom de la configuration"
                    className={`rounded-xl border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <Button onClick={sauvegarderConfiguration} className={`${theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#90BE6D] hover:bg-[#7AA95D]'} text-white`}>
                    <Save className="w-5 h-5 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl">Configurations sauvegardées</h3>
                {configurationsPersonnalisees.map((config, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{config.nom}</span>
                    <Button onClick={() => chargerConfiguration(config.config)} className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#95D6D2] hover:bg-[#7AC7C2]'} text-white`}>
                      Charger
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={partagerConfiguration} className={`w-full ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#FFB4A2] hover:bg-[#FF9A84]'} text-white rounded-xl`}>
                <Share2 className="w-5 h-5 mr-2" />
                Partager la configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <div className={`fixed bottom-0 left-0 right-0 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm p-4`}>
          <TabsList className="grid grid-cols-3 gap-4 bg-transparent">
            <TabsTrigger 
              value="minuteur" 
              className={`data-[state=active]:${theme === 'dark' ? 'bg-blue-600' : 'bg-[#95D6D2]'} data-[state=active]:text-white rounded-xl p-3`}
            >
              <Timer className="w-5 h-5" />
              <span className="sr-only">Minuteur</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progres" 
              className={`data-[state=active]:${theme === 'dark' ? 'bg-blue-600' : 'bg-[#95D6D2]'} data-[state=active]:text-white rounded-xl p-3`}
            >
              <Activity className="w-5 h-5" />
              <span className="sr-only">Progrès</span>
            </TabsTrigger>
            <TabsTrigger 
              value="parametres" 
              className={`data-[state=active]:${theme === 'dark' ? 'bg-blue-600' : 'bg-[#95D6D2]'} data-[state=active]:text-white rounded-xl p-3`}
            >
              <Settings className="w-5 h-5" />
              <span className="sr-only">Paramètres</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  )
}