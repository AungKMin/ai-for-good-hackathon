import { useState, useEffect, useRef, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

/* ─────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────── */
const SECTORS = [
  {
    id: 'pack', emoji: '📦', label: 'Packaging',
    color: '#1CB0F6', dark: '#0095D9', light: '#E8F7FF',
    levels: [
      { name: 'First Day', character: { name: 'Dan', role: 'Supervisor', emoji: '👷', rate: 0.82, pitch: 0.95 }, opening: 'Good morning. Today you will pack boxes on line three. Watch me first.', targetPhrase: 'Yes. I will watch you.', hint: '✅  👀', description: 'Supervisor gives first-day instructions' },
      { name: 'Go Faster', character: { name: 'Maria', role: 'Line Lead', emoji: '👩‍🏭', rate: 0.88, pitch: 1.08 }, opening: 'The line is slow today. We need to go faster. Can you keep up?', targetPhrase: 'Yes. I will try to go faster.', hint: '🏃  ⬆️', description: 'Line lead asks for more speed' },
      { name: 'End of Shift', character: { name: 'Dan', role: 'Supervisor', emoji: '👷', rate: 0.82, pitch: 0.95 }, opening: 'Good work today. You did a great job. See you tomorrow.', targetPhrase: 'Thank you. See you tomorrow.', hint: '🙏  👋', description: 'Wrapping up the first shift' },
    ],
  },
  {
    id: 'clean', emoji: '🧹', label: 'Cleaning',
    color: '#58CC02', dark: '#46A302', light: '#EEFFD6',
    levels: [
      { name: 'Morning Rounds', character: { name: 'Rita', role: 'Supervisor', emoji: '👩‍💼', rate: 0.82, pitch: 1.0 }, opening: 'Good morning. Please clean rooms 101 to 110 first. Start with the bathrooms.', targetPhrase: 'OK. I will start with the bathrooms.', hint: '🚿  1️⃣', description: 'Supervisor assigns your rooms' },
      { name: 'Out of Supplies', character: { name: 'Tom', role: 'Coworker', emoji: '🧑', rate: 0.85, pitch: 1.0 }, opening: 'Hey, do you have extra garbage bags? I ran out.', targetPhrase: 'Yes. Here you go. No problem.', hint: '🛍️  🤝', description: 'Coworker asks you for supplies' },
      { name: 'Guest Complaint', character: { name: 'Rita', role: 'Supervisor', emoji: '👩‍💼', rate: 0.82, pitch: 1.0 }, opening: 'A guest said room 204 was not clean. Can you go back and check it please?', targetPhrase: 'Sorry. I will go back and fix it now.', hint: '😔  🔁', description: 'Supervisor asks you to redo a room' },
    ],
  },
  {
    id: 'green', emoji: '🌿', label: 'Greenhouse',
    color: '#FF9600', dark: '#E07800', light: '#FFF4E0',
    levels: [
      { name: 'Watering Rules', character: { name: 'Carlos', role: 'Trainer', emoji: '🧑‍🌾', rate: 0.82, pitch: 1.0 }, opening: 'Today you will water section B. Use the green hose only. Do not water the red tags.', targetPhrase: 'OK. Section B, green hose, no red tags.', hint: '💚  🚫', description: 'Trainer explains watering rules' },
      { name: 'Damaged Plants', character: { name: 'Sarah', role: 'Supervisor', emoji: '👩‍🔬', rate: 0.84, pitch: 1.05 }, opening: 'Some of these plants look damaged. Did you notice this before?', targetPhrase: 'No. I am sorry. I will tell you next time.', hint: '😔  📢', description: 'Supervisor asks about damaged plants' },
      { name: 'Break Bell', character: { name: 'Carlos', role: 'Trainer', emoji: '🧑‍🌾', rate: 0.85, pitch: 1.0 }, opening: 'The bell rang. It is break time. Come on, let us go eat.', targetPhrase: 'OK. Thank you. I am coming.', hint: '🔔  🍽️', description: 'Break time — follow the team' },
    ],
  },
  {
    id: 'assembly', emoji: '🏗️', label: 'Assembly',
    color: '#A560F8', dark: '#8040E0', light: '#F3EEFF',
    levels: [
      { name: 'Station Setup', character: { name: 'Mike', role: 'Trainer', emoji: '🧑‍🔧', rate: 0.82, pitch: 0.95 }, opening: 'This is your station. Put the small parts in the left bin, big parts in the right bin.', targetPhrase: 'Small parts left, big parts right. OK.', hint: '⬅️  ➡️', description: 'Learning your sorting station' },
      { name: 'Slow Down', character: { name: 'Mike', role: 'Trainer', emoji: '🧑‍🔧', rate: 0.82, pitch: 0.95 }, opening: 'Stop. You are mixing the parts. Please slow down and check each one.', targetPhrase: 'Sorry. I will slow down and check.', hint: '🐢  🔍', description: 'Trainer asks you to be more careful' },
      { name: 'Ask for Help', character: { name: 'Lisa', role: 'Coworker', emoji: '👩', rate: 0.84, pitch: 1.05 }, opening: 'You look confused. Do you need help? It is OK to ask.', targetPhrase: 'Yes please. I do not understand this part.', hint: '🙋  ❓', description: 'Coworker offers help — practice asking' },
    ],
  },
]

const FALLBACKS = [
  { encouragement: 'Great try! You are learning fast.', better_phrase: 'Yes. I will watch you.', bengali_translation: 'হ্যাঁ। আমি আপনাকে দেখব।', star_count: 2 },
  { encouragement: 'Good effort! Keep practicing.', better_phrase: 'Yes. I will try to go faster.', bengali_translation: 'হ্যাঁ। আমি দ্রুত যাওয়ার চেষ্টা করব।', star_count: 2 },
  { encouragement: 'Well done! That was polite.', better_phrase: 'Thank you. See you tomorrow.', bengali_translation: 'ধন্যবাদ। আগামীকাল দেখা হবে।', star_count: 2 },
  { encouragement: 'Great! You understood the task.', better_phrase: 'OK. I will start with the bathrooms.', bengali_translation: 'ঠিক আছে। আমি বাথরুম দিয়ে শুরু করব।', star_count: 2 },
  { encouragement: 'Nice! You helped your coworker.', better_phrase: 'Yes. Here you go. No problem.', bengali_translation: 'হ্যাঁ। এই নিন। কোনো সমস্যা নেই।', star_count: 2 },
  { encouragement: 'Good try! Mistakes help us learn.', better_phrase: 'Sorry. I will go back and fix it now.', bengali_translation: 'দুঃখিত। আমি এখনই ফিরে ঠিক করব।', star_count: 2 },
  { encouragement: 'You remembered the rules!', better_phrase: 'OK. Section B, green hose, no red tags.', bengali_translation: 'ঠিক আছে। সেকশন বি, সবুজ পাইপ, লাল ট্যাগ নয়।', star_count: 2 },
  { encouragement: 'Honest answer! Very good.', better_phrase: 'No. I am sorry. I will tell you next time.', bengali_translation: 'না। দুঃখিত। পরের বার আমি আপনাকে জানাব।', star_count: 2 },
  { encouragement: 'Great! You joined the team.', better_phrase: 'OK. Thank you. I am coming.', bengali_translation: 'ঠিক আছে। ধন্যবাদ। আমি আসছি।', star_count: 2 },
  { encouragement: 'You repeated the instructions!', better_phrase: 'Small parts left, big parts right. OK.', bengali_translation: 'ছোট অংশ বামে, বড় অংশ ডানে। ঠিক আছে।', star_count: 2 },
  { encouragement: 'Good try! Slowing down is smart.', better_phrase: 'Sorry. I will slow down and check.', bengali_translation: 'দুঃখিত। আমি ধীরে করব এবং পরীক্ষা করব।', star_count: 2 },
  { encouragement: 'Brave! Asking for help is strong.', better_phrase: 'Yes please. I do not understand this part.', bengali_translation: 'হ্যাঁ দয়া করে। আমি এই অংশটি বুঝতে পারছি না।', star_count: 2 },
]

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
const speak = (text, { rate = 0.85, pitch = 1.0, lang = 'en-CA', onEnd } = {}) => {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate; u.pitch = pitch; u.lang = lang
  if (onEnd) u.onend = onEnd
  window.speechSynthesis.speak(u)
}
const stopSpeech = () => window.speechSynthesis.cancel()

const callClaude = async ({ system, userMsg, maxTokens = 200 }) => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-client-side-allow': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

/* ─────────────────────────────────────────────────────────────────
   CONFETTI
───────────────────────────────────────────────────────────────── */
const CONFETTI_COLORS = ['#FF6B6B','#FCD34D','#58CC02','#1CB0F6','#A560F8','#FF9600','#FF4081']
const PIECES = Array.from({ length: 60 }, (_, i) => ({
  id: i, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: (i * 7.4) % 100, delay: (i * 0.055) % 2.5,
  duration: 2.0 + (i % 6) * 0.35, size: 8 + (i % 4) * 3, round: i % 3 === 0,
}))

function Confetti() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 300 }}>
      {PIECES.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, width: p.size, height: p.size,
          background: p.color, borderRadius: p.round ? '50%' : '3px',
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }} />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   HOME SCREEN  — big sector cards, all unlocked
───────────────────────────────────────────────────────────────── */
function HomeScreen({ completedLevels, onSelect }) {
  useEffect(() => {
    speak('Hello. Tap a job to practice.', { rate: 0.8 })
    return () => stopSpeech()
  }, [])

  const totalDone = Object.values(completedLevels).reduce((s, set) => s + set.size, 0)
  const totalLevels = SECTORS.reduce((s, sec) => s + sec.levels.length, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: 'white', borderBottom: '2px solid #E5E5E5', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🏭</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#333', letterSpacing: -0.5 }}>First Shift</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF4E0', border: '2px solid #FF9600', borderRadius: 20, padding: '6px 14px' }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#FF9600' }}>{totalDone} / {totalLevels}</span>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ background: 'white', padding: '0 20px 16px', borderBottom: '2px solid #E5E5E5' }}>
        <div style={{ background: '#E5E5E5', borderRadius: 99, height: 10, overflow: 'hidden', marginTop: 10 }}>
          <div style={{
            background: 'linear-gradient(90deg, #58CC02, #89E219)',
            height: '100%', borderRadius: 99,
            width: `${(totalDone / totalLevels) * 100}%`,
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* Sector cards */}
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SECTORS.map((sector, i) => {
          const done = completedLevels[i]?.size ?? 0
          const total = sector.levels.length
          const allDone = done === total

          return (
            <button
              key={sector.id}
              onClick={() => onSelect(i)}
              style={{
                background: 'white',
                border: `3px solid ${allDone ? sector.color : '#E5E5E5'}`,
                borderRadius: 24, padding: '20px 22px',
                display: 'flex', alignItems: 'center', gap: 18,
                boxShadow: allDone ? `0 4px 20px ${sector.color}33` : '0 2px 8px rgba(0,0,0,0.06)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'transform 0.1s, box-shadow 0.2s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Big emoji in colored circle */}
              <div style={{
                width: 70, height: 70, borderRadius: '50%',
                background: sector.light, border: `3px solid ${sector.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34, flexShrink: 0,
              }}>
                {sector.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#333', marginBottom: 6 }}>
                  {sector.label}
                </div>
                {/* Mini level dots */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {sector.levels.map((_, li) => (
                    <div key={li} style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: completedLevels[i]?.has(li) ? sector.color : '#E5E5E5',
                      border: `2px solid ${completedLevels[i]?.has(li) ? sector.dark : '#CCC'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: 'white', fontWeight: 800,
                    }}>
                      {completedLevels[i]?.has(li) ? '✓' : li + 1}
                    </div>
                  ))}
                  <span style={{ fontSize: 13, color: '#999', marginLeft: 4, fontWeight: 600 }}>
                    {done}/{total}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 24, color: '#CCC' }}>›</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   LEVEL SELECT  — row of 3 level cards
───────────────────────────────────────────────────────────────── */
function LevelSelectScreen({ sectorIdx, completedLevels, onSelect, onBack }) {
  const sector = SECTORS[sectorIdx]

  useEffect(() => {
    speak(`${sector.label}. Choose a level.`, { rate: 0.8 })
    return () => stopSpeech()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '2px solid #E5E5E5', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onBack}
          style={{ background: '#F0F0F0', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset' }}
        >←</button>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: sector.light, border: `3px solid ${sector.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {sector.emoji}
        </div>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#333' }}>{sector.label}</span>
      </div>

      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sector.levels.map((level, i) => {
          const done = completedLevels[sectorIdx]?.has(i)
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              style={{
                background: done ? sector.light : 'white',
                border: `3px solid ${done ? sector.color : '#E5E5E5'}`,
                borderRadius: 22, padding: '22px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Level badge */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: done ? sector.color : '#E5E5E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 26 : 22, fontWeight: 900,
                color: done ? 'white' : '#999',
                boxShadow: done ? `0 4px 12px ${sector.color}66` : 'none',
              }}>
                {done ? '⭐' : i + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#333', marginBottom: 4 }}>{level.name}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>{level.description}</div>
              </div>

              <div style={{ fontSize: 24, color: sector.color }}>
                {level.character.emoji}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   CONVERSATION SCREEN
───────────────────────────────────────────────────────────────── */
const WAVE_H = [18, 30, 44, 32, 20]
const WAVE_D = ['0s', '0.12s', '0.24s', '0.36s', '0.48s']

function ConversationScreen({ sectorIdx, levelIdx, onComplete, onBack }) {
  const sector   = SECTORS[sectorIdx]
  const level    = sector.levels[levelIdx]
  const fallback = FALLBACKS[sectorIdx * 3 + levelIdx]

  const [phase,        setPhase]        = useState('idle')
  const [playerSpeech, setPlayerSpeech] = useState('')
  const [charResponse, setCharResponse] = useState('')
  const [coaching,     setCoaching]     = useState(null)
  const [stars,        setStars]        = useState(0)
  const [showText,     setShowText]     = useState(false)
  const [textInput,    setTextInput]    = useState('')

  const recRef     = useRef(null)
  const timeoutRef = useRef(null)
  const gotResult  = useRef(false)
  const isIOS      = /iPad|iPhone|iPod/.test(navigator.userAgent)

  useEffect(() => {
    return () => {
      stopSpeech()
      clearTimeout(timeoutRef.current)
      try { recRef.current?.stop() } catch (_) {}
    }
  }, [])

  // User taps big LISTEN button → character speaks
  const handleListenTap = () => {
    setPhase('char_speaking')
    speak(level.opening, {
      rate: level.character.rate, pitch: level.character.pitch,
      onEnd: () => setPhase('ready_to_speak'),
    })
  }

  // Tap-to-toggle mic
  const toggleRecording = useCallback(() => {
    if (phase === 'recording') {
      clearTimeout(timeoutRef.current)
      try { recRef.current?.stop() } catch (_) {}
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || isIOS) { setShowText(true); return }

    gotResult.current = false
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-US'
    r.onresult = e => {
      gotResult.current = true
      clearTimeout(timeoutRef.current)
      handlePlayerSpeech(e.results[0][0].transcript)
    }
    r.onend = () => {
      clearTimeout(timeoutRef.current)
      if (!gotResult.current) setShowText(true)
    }
    r.onerror = () => { clearTimeout(timeoutRef.current); setShowText(true) }
    recRef.current = r
    r.start()
    setPhase('recording')
    timeoutRef.current = setTimeout(() => {
      if (!gotResult.current) { try { recRef.current?.stop() } catch (_) {} setShowText(true) }
    }, 10000)
  }, [phase, isIOS])

  const handlePlayerSpeech = async (speech) => {
    setPlayerSpeech(speech); setPhase('processing')

    const coachSystem = `You are a warm English coach for Rohingya refugee women learning Canadian workplace English.
Scenario: ${level.description}
${level.character.name} (${level.character.role}) said: "${level.opening}"
Target response: "${level.targetPhrase}"
Learner said: "${speech}"
Reply ONLY with valid JSON, no markdown:
{"encouragement":"One warm sentence max 9 words","better_phrase":"Ideal simple English max 12 words","bengali_translation":"Bengali script translation","star_count":2}
star_count: 3=great, 2=understandable, 1=tried but wrong`

    const charSystem = `You are ${level.character.name}, ${level.character.role} at a Canadian ${sector.label.toLowerCase()} job. Speaking with a new worker learning English.
Your line: "${level.opening}" — They said: "${speech}"
Reply ONE warm sentence, max 12 words. Very simple English.`

    try {
      const [coachRes, charRes] = await Promise.all([
        callClaude({ system: coachSystem, userMsg: 'Give JSON.', maxTokens: 300 }),
        callClaude({ system: charSystem,  userMsg: speech,       maxTokens: 80 }),
      ])
      let coachObj
      try {
        const raw = coachRes.content[0].text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/g,'').trim()
        coachObj = JSON.parse(raw)
      } catch { coachObj = fallback }
      const charText = charRes.content?.[0]?.text?.trim() || 'Good. Keep going.'
      setCharResponse(charText)
      setCoaching(coachObj)
      setStars(Math.min(3, Math.max(1, coachObj.star_count ?? 2)))
      setPhase('coaching')
      // Auto-read the coaching aloud: encouragement → better phrase → Bengali
      speak(coachObj.encouragement || fallback.encouragement, {
        rate: 0.85,
        onEnd: () => speak(coachObj.better_phrase || fallback.better_phrase, {
          rate: 0.78,
          onEnd: () => speak(coachObj.bengali_translation || fallback.bengali_translation, { rate: 0.8, lang: 'bn-BD' })
        })
      })
    } catch {
      setCharResponse('Good. Keep going.')
      setCoaching(fallback); setStars(fallback.star_count); setPhase('coaching')
      speak(fallback.encouragement, {
        rate: 0.85,
        onEnd: () => speak(fallback.better_phrase, {
          rate: 0.78,
          onEnd: () => speak(fallback.bengali_translation, { rate: 0.8, lang: 'bn-BD' })
        })
      })
    }
  }

  const isIdle         = phase === 'idle'
  const isCharSpeaking = phase === 'char_speaking'
  const isReadyToSpeak = phase === 'ready_to_speak'
  const isRecording    = phase === 'recording'
  const isProcessing   = phase === 'processing'
  const isCoaching     = phase === 'coaching'
  const isReplay       = phase === 'coaching_replay'
  const showCoach      = isCoaching || isReplay
  const showMic        = (isReadyToSpeak || isRecording) && !showText

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '2px solid #E5E5E5', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: '#F0F0F0', border: 'none', borderRadius: 12, width: 42, height: 42, fontSize: 18, cursor: 'pointer', minHeight: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div style={{ flex: 1, background: '#E5E5E5', borderRadius: 99, height: 10, overflow: 'hidden' }}>
          <div style={{ background: `linear-gradient(90deg, ${sector.color}, ${sector.dark})`, height: '100%', width: '33%', borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 22 }}>{level.character.emoji}</div>
      </div>

      {/* ── IDLE: "meet your character" tap screen ── */}
      {isIdle && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: 22 }}>
          {/* Big avatar */}
          <div style={{
            width: 130, height: 130, borderRadius: '50%',
            background: sector.light, border: `5px solid ${sector.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 64, boxShadow: `0 8px 32px ${sector.color}44`,
          }}>
            {level.character.emoji}
          </div>

          {/* Name + role badge */}
          <div style={{ background: sector.color, color: 'white', borderRadius: 14, padding: '8px 22px', fontSize: 16, fontWeight: 800 }}>
            {level.character.name} · {level.character.role}
          </div>

          {/* Giant ear / listen button */}
          <button
            onClick={handleListenTap}
            style={{
              width: 130, height: 130, borderRadius: '50%',
              background: sector.color, border: `5px solid ${sector.dark}`,
              color: 'white', fontSize: 60,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', minHeight: 'unset', minWidth: 'unset',
              boxShadow: `0 10px 36px ${sector.color}66`,
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            👂
          </button>
          {/* Purely visual "tap" cue */}
          <div style={{ fontSize: 28 }}>👆</div>
        </div>
      )}

      {/* ── SPEAKING / POST-SPEAK: avatar + bubble ── */}
      {!isIdle && (
        <div style={{ padding: '28px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Avatar with pulse rings when speaking */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isCharSpeaking && [0, 1].map(ri => (
              <div key={ri} style={{
                position: 'absolute', width: 100, height: 100, borderRadius: '50%',
                border: `3px solid ${sector.color}`,
                animation: `pulse-ring 1.5s ease-out ${ri * 0.6}s infinite`,
                opacity: 0.6,
              }} />
            ))}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: sector.light, border: `4px solid ${sector.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42, position: 'relative', zIndex: 1,
              boxShadow: `0 6px 24px ${sector.color}44`,
            }}>
              {level.character.emoji}
            </div>
          </div>

          {/* Name tag */}
          <div style={{ background: sector.color, color: 'white', borderRadius: 12, padding: '4px 14px', fontSize: 13, fontWeight: 800 }}>
            {level.character.name} · {level.character.role}
          </div>

          {/* Wave bars while speaking */}
          {isCharSpeaking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 48 }}>
              {WAVE_H.map((h, i) => (
                <div key={i} className="wave-bar" style={{ height: h, background: sector.color, animationDelay: WAVE_D[i] }} />
              ))}
            </div>
          )}

          {/* Speech bubble (shown after TTS ends) */}
          {!isCharSpeaking && (
            <div style={{ position: 'relative', maxWidth: 320, width: '100%' }}>
              <div style={{ position: 'absolute', top: -12, left: 36, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: '14px solid white' }} />
              <div style={{ background: 'white', borderRadius: 20, padding: '16px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', border: '2px solid #E5E5E5' }}>
                <div style={{ fontSize: 17, color: '#222', lineHeight: 1.6, fontWeight: 500 }}>
                  {charResponse || level.opening}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player bubble */}
      {playerSpeech && !isCharSpeaking && !isReadyToSpeak && (
        <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: sector.color, borderRadius: 18, padding: '12px 16px', maxWidth: 260, boxShadow: `0 4px 12px ${sector.color}55` }}>
            <div style={{ fontSize: 15, color: 'white', fontWeight: 600, lineHeight: 1.4 }}>{playerSpeech}</div>
          </div>
        </div>
      )}

      {/* Thinking */}
      {isProcessing && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[0,1,2].map(i => (
              <div key={i} className="wave-bar" style={{ width: 10, height: 14, background: sector.color, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <div style={{ color: '#999', fontSize: 13, marginTop: 6 }}>Thinking…</div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Coach panel */}
      {showCoach && coaching && (
        <div className="animate-slide-up" style={{
          background: 'white', borderTop: `5px solid ${sector.color}`,
          borderRadius: '28px 28px 0 0', padding: '24px 20px 40px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        }}>
          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            {[1,2,3].map(s => (
              <span key={s} className={s <= stars ? `star-${s}` : ''} style={{ fontSize: 44, filter: s <= stars ? 'none' : 'grayscale(1)', opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#222', marginBottom: 16 }}>
            {coaching.encouragement}
          </div>

          {/* Better phrase */}
          <div style={{ background: '#F0FFF4', border: '2px solid #58CC02', borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#46A302', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Try saying:</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1A7A00', lineHeight: 1.35 }}>{coaching.better_phrase}</div>
          </div>

          {/* Bengali */}
          <div style={{ background: '#FFFBEB', border: '2px solid #FCD34D', borderRadius: 18, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#92400E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>বাংলা:</div>
            <div style={{ fontSize: 16, color: '#78350F', lineHeight: 1.6 }}>{coaching.bengali_translation}</div>
          </div>

          {isCoaching && (
            <button
              onClick={() => {
                speak(coaching.better_phrase, { rate: 0.68, onEnd: () => setPhase('coaching_replay') })
              }}
              style={{
                width: '100%', background: sector.color, color: 'white',
                fontSize: 19, fontWeight: 900, borderRadius: 20, padding: '18px 0',
                border: `3px solid ${sector.dark}`, cursor: 'pointer', minHeight: 'unset',
                boxShadow: `0 6px 16px ${sector.color}66`,
              }}
            >
              🔊  Say it with me
            </button>
          )}
          {isReplay && (
            <button
              onClick={() => onComplete(stars)}
              className="animate-bounce-in"
              style={{
                width: '100%', background: '#58CC02', color: 'white',
                fontSize: 19, fontWeight: 900, borderRadius: 20, padding: '18px 0',
                border: '3px solid #46A302', cursor: 'pointer', minHeight: 'unset',
                boxShadow: '0 6px 16px #58CC0266',
              }}
            >
              ✓  Continue
            </button>
          )}
        </div>
      )}

      {/* Mic area */}
      {(showMic || (isReadyToSpeak && showText)) && (
        <div style={{ padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {!showText ? (
            <>
              {/* Icon-only prompt — no English text */}
              <div style={{ fontSize: 36, letterSpacing: 10 }}>{level.hint}</div>
              <div style={{ fontSize: 22 }}>{isRecording ? '🔴' : '👆'}</div>

              {/* Mic — tap once to start, tap again to stop */}
              <button
                className={isRecording ? 'animate-mic-glow' : ''}
                onClick={toggleRecording}
                style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: isRecording ? '#FF4B4B' : '#58CC02',
                  border: `4px solid ${isRecording ? '#CC0000' : '#46A302'}`,
                  color: 'white', fontSize: 42,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', minHeight: 'unset', minWidth: 'unset',
                  boxShadow: isRecording ? '0 0 0 0 rgba(255,75,75,0.7)' : '0 8px 24px rgba(88,204,2,0.5)',
                  transition: 'background 0.2s',
                }}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>

              <button
                onClick={() => setShowText(true)}
                style={{ background: 'none', border: 'none', color: '#CCCCCC', fontSize: 32, cursor: 'pointer', minHeight: 'unset', minWidth: 'unset', padding: 0 }}
              >⌨️</button>
            </>
          ) : (
            <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#999' }}>⌨️ Type your answer</div>
              <div style={{ textAlign: 'center', fontSize: 36 }}>{level.hint}</div>
              <input
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && textInput.trim() && handlePlayerSpeech(textInput.trim())}
                placeholder="Type here…"
                style={{ fontSize: 18, padding: '14px 18px', borderRadius: 16, border: '2px solid #E5E5E5', outline: 'none', width: '100%' }}
              />
              <button
                onClick={() => textInput.trim() && handlePlayerSpeech(textInput.trim())}
                style={{ background: '#58CC02', color: 'white', fontSize: 18, fontWeight: 900, borderRadius: 16, padding: '16px 0', border: '3px solid #46A302', cursor: 'pointer', minHeight: 'unset' }}
              >✓ Submit</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   LEVEL COMPLETE
───────────────────────────────────────────────────────────────── */
function LevelCompleteScreen({ sectorIdx, levelIdx, stars, onContinue, onReplay }) {
  const sector = SECTORS[sectorIdx]
  const level  = sector.levels[levelIdx]

  useEffect(() => {
    const msg = stars === 3 ? `Amazing! Three stars!` : stars === 2 ? `Great job!` : `Good try! Keep practicing!`
    speak(msg, { rate: 0.85 })
    return () => stopSpeech()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 22 }}>
      <Confetti />

      <div className="animate-bounce-in" style={{ fontSize: 90 }}>
        {stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#333' }}>
          {stars === 3 ? 'Perfect!' : stars === 2 ? 'Great job!' : 'Good try!'}
        </div>
        <div style={{ color: '#888', fontSize: 15, marginTop: 4, fontWeight: 600 }}>{level.name} complete</div>
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[1,2,3].map(s => (
          <span key={s} className={s <= stars ? `star-${s}` : ''} style={{ fontSize: 60, filter: s <= stars ? 'none' : 'grayscale(1)', opacity: s <= stars ? 1 : 0.15 }}>⭐</span>
        ))}
      </div>

      {/* Phrase card */}
      <div style={{ background: 'white', borderRadius: 24, padding: '18px 22px', width: '100%', maxWidth: 340, border: `3px solid ${sector.color}`, boxShadow: `0 6px 24px ${sector.color}33` }}>
        <div style={{ fontSize: 11, color: sector.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Today's phrase</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#222', lineHeight: 1.35 }}>{level.targetPhrase}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
        <button
          onClick={onReplay}
          style={{ flex: 1, background: 'white', border: '3px solid #E5E5E5', color: '#666', fontSize: 16, fontWeight: 800, borderRadius: 18, padding: '16px 0', cursor: 'pointer', minHeight: 'unset' }}
        >🔁 Again</button>
        <button
          onClick={onContinue}
          style={{ flex: 2, background: sector.color, border: `3px solid ${sector.dark}`, color: 'white', fontSize: 18, fontWeight: 900, borderRadius: 18, padding: '16px 0', cursor: 'pointer', minHeight: 'unset', boxShadow: `0 6px 20px ${sector.color}66` }}
        >→ Continue</button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────────── */
export default function App() {
  const [screen,         setScreen]         = useState('home')
  const [selectedSector, setSelectedSector] = useState(null)
  const [selectedLevel,  setSelectedLevel]  = useState(null)
  const [completedLevels, setCompletedLevels] = useState({
    0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(),
  })
  const [lastStars, setLastStars] = useState(0)
  const [convKey,   setConvKey]   = useState(0)

  const handleComplete = stars => {
    setLastStars(stars)
    const updated = { ...completedLevels, [selectedSector]: new Set(completedLevels[selectedSector]) }
    updated[selectedSector].add(selectedLevel)
    setCompletedLevels(updated)
    setScreen('complete')
  }

  if (screen === 'home')         return <HomeScreen completedLevels={completedLevels} onSelect={i => { setSelectedSector(i); setScreen('level') }} />
  if (screen === 'level')        return <LevelSelectScreen sectorIdx={selectedSector} completedLevels={completedLevels} onSelect={i => { setSelectedLevel(i); setScreen('conversation') }} onBack={() => setScreen('home')} />
  if (screen === 'conversation') return <ConversationScreen key={convKey} sectorIdx={selectedSector} levelIdx={selectedLevel} onComplete={handleComplete} onBack={() => setScreen('level')} />
  if (screen === 'complete')     return <LevelCompleteScreen sectorIdx={selectedSector} levelIdx={selectedLevel} stars={lastStars} onContinue={() => setScreen('level')} onReplay={() => { setConvKey(k => k + 1); setScreen('conversation') }} />
  return null
}
