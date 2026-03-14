import { useState, useEffect, useRef, useCallback } from 'react'

/* ─────────────────────────────────────────────────────────────────
   API KEY  (set VITE_ANTHROPIC_API_KEY in .env)
───────────────────────────────────────────────────────────────── */
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

/* ─────────────────────────────────────────────────────────────────
   SCENARIO DATA  — 4 sectors × 3 levels = 12 scenarios
───────────────────────────────────────────────────────────────── */
const SECTORS = [
  {
    id: 'pack',
    emoji: '📦',
    label: 'Packaging',
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    color: '#3B82F6',
    levels: [
      {
        name: 'First Day',
        character: { name: 'Dan', role: 'Supervisor', emoji: '👷', rate: 0.82, pitch: 0.95 },
        opening: 'Good morning. Today you will pack boxes on line three. Watch me first.',
        targetPhrase: 'Yes. I will watch you.',
        hint: '✅  👀',
        description: 'Supervisor gives first-day instructions',
      },
      {
        name: 'Go Faster',
        character: { name: 'Maria', role: 'Line Lead', emoji: '👩‍🏭', rate: 0.88, pitch: 1.08 },
        opening: 'The line is slow today. We need to go faster. Can you keep up?',
        targetPhrase: 'Yes. I will try to go faster.',
        hint: '🏃  ⬆️',
        description: 'Line lead asks for more speed',
      },
      {
        name: 'End of Shift',
        character: { name: 'Dan', role: 'Supervisor', emoji: '👷', rate: 0.82, pitch: 0.95 },
        opening: 'Good work today. You did a great job. See you tomorrow.',
        targetPhrase: 'Thank you. See you tomorrow.',
        hint: '🙏  👋',
        description: 'Wrapping up the first shift',
      },
    ],
  },
  {
    id: 'clean',
    emoji: '🧹',
    label: 'Cleaning',
    bg: 'bg-green-100',
    border: 'border-green-400',
    color: '#22C55E',
    levels: [
      {
        name: 'Morning Rounds',
        character: { name: 'Rita', role: 'Supervisor', emoji: '👩‍💼', rate: 0.82, pitch: 1.0 },
        opening: 'Good morning. Please clean rooms 101 to 110 first. Start with the bathrooms.',
        targetPhrase: 'OK. I will start with the bathrooms.',
        hint: '🚿  1️⃣',
        description: 'Supervisor assigns rooms for the morning',
      },
      {
        name: 'Out of Supplies',
        character: { name: 'Tom', role: 'Coworker', emoji: '🧑', rate: 0.85, pitch: 1.0 },
        opening: 'Hey, do you have extra garbage bags? I ran out.',
        targetPhrase: 'Yes. Here you go. No problem.',
        hint: '🛍️  🤝',
        description: 'Coworker asks you for supplies',
      },
      {
        name: 'Guest Complaint',
        character: { name: 'Rita', role: 'Supervisor', emoji: '👩‍💼', rate: 0.82, pitch: 1.0 },
        opening: 'A guest said room 204 was not clean. Can you go back and check it please?',
        targetPhrase: 'Sorry. I will go back and fix it now.',
        hint: '😔  🔁',
        description: 'Supervisor asks you to re-clean a room',
      },
    ],
  },
  {
    id: 'green',
    emoji: '🌿',
    label: 'Greenhouse',
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
    color: '#F59E0B',
    levels: [
      {
        name: 'Watering Rules',
        character: { name: 'Carlos', role: 'Trainer', emoji: '🧑‍🌾', rate: 0.82, pitch: 1.0 },
        opening: 'Today you will water section B. Use the green hose only. Do not water the red tags.',
        targetPhrase: 'OK. Section B, green hose, no red tags.',
        hint: '💚  🚫🔴',
        description: 'Trainer explains watering rules',
      },
      {
        name: 'Damaged Plants',
        character: { name: 'Sarah', role: 'Supervisor', emoji: '👩‍🔬', rate: 0.84, pitch: 1.05 },
        opening: 'Some of these plants look damaged. Did you notice this before?',
        targetPhrase: 'No. I am sorry. I will tell you next time.',
        hint: '😔  📢',
        description: 'Supervisor asks about damaged plants',
      },
      {
        name: 'Break Bell',
        character: { name: 'Carlos', role: 'Trainer', emoji: '🧑‍🌾', rate: 0.85, pitch: 1.0 },
        opening: 'The bell rang. It is break time. Come on, let us go eat.',
        targetPhrase: 'OK. Thank you. I am coming.',
        hint: '🔔  🍽️',
        description: 'Break time — following the team',
      },
    ],
  },
  {
    id: 'assembly',
    emoji: '🏗️',
    label: 'Assembly',
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    color: '#A855F7',
    levels: [
      {
        name: 'Station Setup',
        character: { name: 'Mike', role: 'Trainer', emoji: '🧑‍🔧', rate: 0.82, pitch: 0.95 },
        opening: 'This is your station. Put the small parts in the left bin, big parts in the right bin.',
        targetPhrase: 'Small parts left, big parts right. OK.',
        hint: '⬅️  ➡️',
        description: 'Learning your sorting station',
      },
      {
        name: 'Slow Down',
        character: { name: 'Mike', role: 'Trainer', emoji: '🧑‍🔧', rate: 0.82, pitch: 0.95 },
        opening: 'Stop. You are mixing the parts. Please slow down and check each one.',
        targetPhrase: 'Sorry. I will slow down and check.',
        hint: '🐢  🔍',
        description: 'Trainer asks you to be more careful',
      },
      {
        name: 'Ask for Help',
        character: { name: 'Lisa', role: 'Coworker', emoji: '👩', rate: 0.84, pitch: 1.05 },
        opening: 'You look confused. Do you need help? It is OK to ask.',
        targetPhrase: 'Yes please. I do not understand this part.',
        hint: '🙋  ❓',
        description: 'Coworker offers help — practice asking',
      },
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

const fbIdx = (sectorIdx, levelIdx) => sectorIdx * 3 + levelIdx

/* ─────────────────────────────────────────────────────────────────
   CONFETTI
───────────────────────────────────────────────────────────────── */
const COLORS = ['#FF6B6B','#FCD34D','#22C55E','#3B82F6','#A855F7','#F97316','#EC4899']
const PIECES = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  left: (i * 7.4) % 100,
  delay: (i * 0.068) % 2.4,
  duration: 2.2 + (i % 5) * 0.4,
  size: 8 + (i % 3) * 4,
  round: i % 3 === 0,
}))

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[300]">
      {PIECES.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 1 — SECTOR SELECT
───────────────────────────────────────────────────────────────── */
function SectorSelectScreen({ unlockedSectors, completedLevels, onSelect }) {
  useEffect(() => {
    speak('Hello. Tap a job to begin.', { rate: 0.8 })
    return () => stopSpeech()
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="bg-blue-800 px-5 py-4 flex items-center gap-3">
        <span className="text-3xl">👷</span>
        <span className="text-white text-2xl font-black tracking-tight">First Shift</span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="text-center text-5xl py-2">🏭</div>

        <div className="grid grid-cols-2 gap-4">
          {SECTORS.map((sector, i) => {
            const locked = !unlockedSectors[i]
            const done = completedLevels[i]?.size ?? 0
            const total = sector.levels.length

            return (
              <button
                key={sector.id}
                onClick={() => !locked && onSelect(i)}
                className={[
                  'border-[3px] rounded-3xl p-5',
                  'flex flex-col items-center gap-2 min-h-[148px]',
                  'transition-transform active:scale-95',
                  locked
                    ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                    : `${sector.bg} ${sector.border} cursor-pointer`,
                ].join(' ')}
              >
                <span className="text-5xl">{locked ? '🔒' : sector.emoji}</span>
                <span className={`text-lg font-black ${locked ? 'text-gray-400' : 'text-gray-800'}`}>
                  {sector.label}
                </span>
                {!locked && (
                  <div className="w-full">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ background: sector.color, width: `${(done / total) * 100}%` }}
                      />
                    </div>
                    <div className="text-center text-sm mt-1">
                      {'⭐'.repeat(done)}{'☆'.repeat(total - done)}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 2 — LEVEL SELECT
───────────────────────────────────────────────────────────────── */
function LevelSelectScreen({ sectorIdx, completedLevels, onSelect, onBack }) {
  const sector = SECTORS[sectorIdx]

  useEffect(() => {
    speak(`${sector.label} jobs. Choose a shift.`, { rate: 0.8 })
    return () => stopSpeech()
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <div className="bg-blue-800 px-5 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="bg-white/20 text-white rounded-xl px-4 py-2 text-xl min-h-0 min-w-0"
        >←</button>
        <span className="text-3xl">{sector.emoji}</span>
        <span className="text-white text-2xl font-black">{sector.label}</span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4">
        {sector.levels.map((level, i) => {
          const done = completedLevels[sectorIdx]?.has(i)
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={[
                'border-[3px] rounded-3xl px-5 py-5',
                'flex items-center gap-4 min-h-[96px] text-left',
                'shadow-sm transition-transform active:scale-[0.98]',
                done ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200',
              ].join(' ')}
            >
              <span className="text-5xl min-w-[52px]">{done ? '⭐' : `${i + 1}️⃣`}</span>
              <div className="flex-1">
                <div className="text-lg font-black text-gray-800">{level.name}</div>
                <div className="text-sm text-gray-500 mt-0.5 leading-snug">{level.description}</div>
              </div>
              <span className="text-3xl text-gray-300">{level.character.emoji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 3 — CONVERSATION
   Phase machine:
     char_speaking → ready_to_speak → recording
     → processing → coaching → coaching_replay → (done)
───────────────────────────────────────────────────────────────── */
const WAVE_H = [22, 34, 46, 36, 24]
const WAVE_D = ['0s', '0.12s', '0.24s', '0.36s', '0.48s']

function ConversationScreen({ sectorIdx, levelIdx, onComplete, onBack }) {
  const sector   = SECTORS[sectorIdx]
  const level    = sector.levels[levelIdx]
  const fallback = FALLBACKS[fbIdx(sectorIdx, levelIdx)]

  const [phase,        setPhase]        = useState('char_speaking')
  const [playerSpeech, setPlayerSpeech] = useState('')
  const [charResponse, setCharResponse] = useState('')
  const [coaching,     setCoaching]     = useState(null)
  const [stars,        setStars]        = useState(0)
  const [showText,     setShowText]     = useState(false)
  const [textInput,    setTextInput]    = useState('')

  const recRef = useRef(null)

  useEffect(() => {
    speak(level.opening, {
      rate:  level.character.rate,
      pitch: level.character.pitch,
      onEnd: () => setPhase('ready_to_speak'),
    })
    return () => {
      stopSpeech()
      try { recRef.current?.stop() } catch (_) {}
    }
  }, [])

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setShowText(true); return }
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-US'
    r.onresult = e => handlePlayerSpeech(e.results[0][0].transcript)
    r.onerror  = () => setShowText(true)
    recRef.current = r
    r.start()
    setPhase('recording')
  }, [])

  const stopRecording = useCallback(() => {
    try { recRef.current?.stop() } catch (_) {}
  }, [])

  const handlePlayerSpeech = async (speech) => {
    setPlayerSpeech(speech)
    setPhase('processing')

    const coachSystem = `You are a warm English coach for Rohingya refugee women learning Canadian workplace English.
Scenario: ${level.description}
${level.character.name} (${level.character.role}) said: "${level.opening}"
Target response: "${level.targetPhrase}"
Learner said: "${speech}"

Reply ONLY with valid JSON — no markdown:
{"encouragement":"One warm sentence max 9 words","better_phrase":"Ideal simple English phrase max 12 words","bengali_translation":"Bengali script translation of better_phrase","star_count":1}
star_count: 3=great, 2=understandable, 1=tried but wrong`

    const charSystem = `You are ${level.character.name}, a ${level.character.role} at a Canadian ${sector.label.toLowerCase()} workplace. You are talking to a new worker still learning English.
Your previous line: "${level.opening}"
They replied: "${speech}"
Reply with ONE warm encouraging sentence, max 12 words. Very simple English.`

    try {
      const [coachRes, charRes] = await Promise.all([
        callClaude({ system: coachSystem, userMsg: 'Give JSON feedback.', maxTokens: 300 }),
        callClaude({ system: charSystem,  userMsg: speech,               maxTokens: 80  }),
      ])

      let coachObj
      try {
        const raw = coachRes.content[0].text.trim()
          .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()
        coachObj = JSON.parse(raw)
      } catch (_) { coachObj = fallback }

      setCharResponse(charRes.content?.[0]?.text?.trim() || 'Good. Keep going.')
      setCoaching(coachObj)
      setStars(Math.min(3, Math.max(1, coachObj.star_count ?? 2)))
      setPhase('coaching')
    } catch (_) {
      setCharResponse('Good. Keep going.')
      setCoaching(fallback)
      setStars(fallback.star_count)
      setPhase('coaching')
    }
  }

  const handleSayItWithMe = () => {
    speak(coaching.better_phrase, { rate: 0.68, onEnd: () => setPhase('coaching_replay') })
  }

  const isCharSpeaking = phase === 'char_speaking'
  const isReadyToSpeak = phase === 'ready_to_speak'
  const isRecording    = phase === 'recording'
  const isProcessing   = phase === 'processing'
  const isCoaching     = phase === 'coaching'
  const isReplay       = phase === 'coaching_replay'
  const showCoach      = isCoaching || isReplay
  const showMicArea    = (isReadyToSpeak || isRecording) && !showText

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      {/* Header */}
      <div className="bg-blue-800 px-5 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="bg-white/20 text-white rounded-xl px-4 py-2 text-xl min-h-0 min-w-0"
        >←</button>
        <span className="text-2xl">{sector.emoji}</span>
        <div>
          <div className="text-white font-black text-base leading-tight">{level.name}</div>
          <div className="text-blue-200 text-xs">
            {level.character.emoji} {level.character.name} · {level.character.role}
          </div>
        </div>
      </div>

      {/* Character zone */}
      <div className="px-5 pt-7 pb-4 flex flex-col items-center gap-4">
        {/* Avatar with pulse rings */}
        <div className="relative w-[90px] h-[90px] flex items-center justify-center">
          {isCharSpeaking && (
            <>
              <div
                className="animate-pulse-ring absolute w-[90px] h-[90px] rounded-full border-[3px]"
                style={{ borderColor: sector.color }}
              />
              <div
                className="animate-pulse-ring absolute w-[90px] h-[90px] rounded-full border-[3px]"
                style={{ borderColor: sector.color, animationDelay: '0.6s', opacity: 0.4 }}
              />
            </>
          )}
          <div
            className="w-[78px] h-[78px] rounded-full flex items-center justify-center text-4xl z-10 border-[3px]"
            style={{ background: sector.color + '22', borderColor: sector.color }}
          >
            {level.character.emoji}
          </div>
        </div>

        {/* Wave bars while TTS plays */}
        {isCharSpeaking && (
          <div className="flex items-center gap-1.5 h-12">
            {WAVE_H.map((h, i) => (
              <div key={i} className="wave-bar" style={{ height: h, animationDelay: WAVE_D[i] }} />
            ))}
          </div>
        )}

        {/* Character speech bubble */}
        <div className="bg-white rounded-2xl p-4 w-full max-w-sm border-2 border-gray-200 shadow-sm">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1.5">
            {level.character.name} says:
          </div>
          <div className="text-lg text-gray-800 leading-relaxed">
            {charResponse || level.opening}
          </div>
        </div>
      </div>

      {/* Player reply bubble */}
      {playerSpeech && !isProcessing && !isReadyToSpeak && !isCharSpeaking && (
        <div className="px-5 pb-3 flex justify-end">
          <div className="bg-blue-100 rounded-2xl p-3 max-w-[280px] border-2 border-blue-300">
            <div className="text-xs text-blue-700 font-bold uppercase tracking-wide mb-1">You said:</div>
            <div className="text-base text-blue-900 leading-snug">{playerSpeech}</div>
          </div>
        </div>
      )}

      {/* Processing dots */}
      {isProcessing && (
        <div className="text-center py-4 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            {[0,1,2].map(i => (
              <div key={i} className="wave-bar w-2.5 h-4" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <span className="text-gray-400 text-sm">Thinking…</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Coach panel — slides up from bottom */}
      {showCoach && coaching && (
        <div className="animate-slide-up bg-white border-t-4 border-yellow-300 rounded-t-3xl px-5 pt-5 pb-9 shadow-[0_-6px_24px_rgba(0,0,0,0.12)]">
          {/* Stars */}
          <div className="flex justify-center gap-3 mb-4">
            {[1,2,3].map(s => (
              <span
                key={s}
                className={s <= stars ? `star-${s}` : ''}
                style={{ fontSize: 42, filter: s <= stars ? 'none' : 'grayscale(1)', opacity: s <= stars ? 1 : 0.22 }}
              >⭐</span>
            ))}
          </div>

          <div className="text-center text-lg font-black text-gray-800 mb-3">
            {coaching.encouragement}
          </div>

          {/* Better phrase */}
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-3 mb-2.5">
            <div className="text-xs text-green-700 font-bold uppercase tracking-wide mb-1">Better phrase:</div>
            <div className="text-xl font-black text-green-900 leading-snug">{coaching.better_phrase}</div>
          </div>

          {/* Bengali */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-3 mb-4">
            <div className="text-xs text-yellow-800 font-bold uppercase tracking-wide mb-1">বাংলা:</div>
            <div className="text-base text-yellow-900 leading-relaxed">{coaching.bengali_translation}</div>
          </div>

          {isCoaching && (
            <button
              onClick={handleSayItWithMe}
              className="w-full bg-blue-500 text-white text-xl font-black rounded-2xl py-5 min-h-0"
            >
              🔊  Say it with me
            </button>
          )}
          {isReplay && (
            <button
              onClick={() => onComplete(stars)}
              className="animate-bounce-in w-full bg-orange-500 text-white text-xl font-black rounded-2xl py-5 min-h-0"
            >
              ✓  Continue
            </button>
          )}
        </div>
      )}

      {/* Mic area */}
      {(showMicArea || (isReadyToSpeak && showText)) && (
        <div className="px-5 pb-10 flex flex-col items-center gap-4">
          {!showText ? (
            <>
              <div className="text-sm text-gray-500 font-bold">
                {isRecording ? '🔴  Listening…' : 'Tap to speak'}
              </div>
              <div className="text-4xl tracking-widest">{level.hint}</div>

              <button
                className={[
                  'w-[104px] h-[104px] rounded-full text-5xl',
                  'flex items-center justify-center text-white',
                  'shadow-xl min-h-0 min-w-0 transition-colors',
                  isRecording ? 'bg-red-500 animate-mic-glow' : 'bg-green-500',
                ].join(' ')}
                onMouseDown={startRecording}
                onTouchStart={startRecording}
                onMouseUp={stopRecording}
                onTouchEnd={stopRecording}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>

              <button
                onClick={() => setShowText(true)}
                className="text-gray-400 text-sm underline bg-transparent min-h-0 min-w-0 px-2 py-1"
              >
                ⌨️ type instead
              </button>
            </>
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-3">
              <div className="text-sm text-gray-500 text-center">⌨️ Type your answer</div>
              <div className="text-4xl text-center">{level.hint}</div>
              <input
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && textInput.trim() && handlePlayerSpeech(textInput.trim())}
                placeholder="Type here…"
                className="text-lg p-4 rounded-2xl border-2 border-gray-300 outline-none focus:border-blue-400"
              />
              <button
                onClick={() => textInput.trim() && handlePlayerSpeech(textInput.trim())}
                className="bg-green-500 text-white text-lg font-black rounded-2xl py-4 min-h-0"
              >
                ✓ Submit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SCREEN 4 — LEVEL COMPLETE
───────────────────────────────────────────────────────────────── */
function LevelCompleteScreen({ sectorIdx, levelIdx, stars, unlockedNew, onContinue, onReplay }) {
  const sector = SECTORS[sectorIdx]
  const level  = sector.levels[levelIdx]
  const [showUnlock, setShowUnlock] = useState(false)

  useEffect(() => {
    const msg = stars === 3
      ? `Amazing! Three stars! ${level.name} complete!`
      : stars === 2
      ? `Great job! ${level.name} complete!`
      : `Good try! You finished ${level.name}. Keep practicing!`

    speak(msg, {
      rate: 0.8,
      onEnd: () => {
        if (unlockedNew) {
          setShowUnlock(true)
          speak('You unlocked a new sector!', { rate: 0.8 })
        }
      },
    })
    return () => stopSpeech()
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center px-6 gap-5">
      <Confetti />

      <div className="animate-bounce-in text-8xl">🎉</div>

      <div className="text-center">
        <h2 className="text-3xl font-black text-gray-800">Level Complete!</h2>
        <p className="text-gray-500 mt-1">{level.name}</p>
      </div>

      <div className="flex gap-3">
        {[1,2,3].map(s => (
          <span
            key={s}
            className={s <= stars ? `star-${s}` : ''}
            style={{ fontSize: 56, filter: s <= stars ? 'none' : 'grayscale(1)', opacity: s <= stars ? 1 : 0.2 }}
          >⭐</span>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-5 w-full max-w-sm border-2 border-gray-200 shadow-md">
        <div className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2">Today's phrase:</div>
        <div className="text-xl font-black text-gray-800 leading-snug">{level.targetPhrase}</div>
      </div>

      {showUnlock && (
        <div className="animate-bounce-in animate-unlock bg-yellow-300 rounded-2xl px-5 py-3 w-full max-w-sm text-center">
          <div className="text-3xl">🔓</div>
          <div className="text-lg font-black text-yellow-900">New Sector Unlocked!</div>
        </div>
      )}

      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={onReplay}
          className="flex-1 bg-gray-100 text-gray-700 text-base font-bold rounded-2xl py-4 min-h-0"
        >🔁 Again</button>
        <button
          onClick={onContinue}
          className="flex-[2] bg-orange-500 text-white text-lg font-black rounded-2xl py-4 min-h-0"
        >→ Continue</button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────────── */
export default function App() {
  const [screen,          setScreen]          = useState('sector')
  const [selectedSector,  setSelectedSector]  = useState(null)
  const [selectedLevel,   setSelectedLevel]   = useState(null)
  const [unlockedSectors, setUnlockedSectors] = useState([true, false, false, false])
  const [completedLevels, setCompletedLevels] = useState({
    0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(),
  })
  const [lastStars,    setLastStars]    = useState(0)
  const [unlockedNew,  setUnlockedNew]  = useState(false)
  const [convKey,      setConvKey]      = useState(0)

  const handleSectorSelect = i => { setSelectedSector(i); setScreen('level') }
  const handleLevelSelect  = i => { setSelectedLevel(i);  setScreen('conversation') }

  const handleComplete = stars => {
    setLastStars(stars)
    const updated = { ...completedLevels, [selectedSector]: new Set(completedLevels[selectedSector]) }
    updated[selectedSector].add(selectedLevel)
    setCompletedLevels(updated)

    let didUnlock = false
    if (updated[selectedSector].size === 3 && selectedSector < 3) {
      const next = [...unlockedSectors]
      if (!next[selectedSector + 1]) {
        next[selectedSector + 1] = true
        setUnlockedSectors(next)
        didUnlock = true
      }
    }
    setUnlockedNew(didUnlock)
    setScreen('complete')
  }

  if (screen === 'sector')       return <SectorSelectScreen unlockedSectors={unlockedSectors} completedLevels={completedLevels} onSelect={handleSectorSelect} />
  if (screen === 'level')        return <LevelSelectScreen sectorIdx={selectedSector} completedLevels={completedLevels} onSelect={handleLevelSelect} onBack={() => setScreen('sector')} />
  if (screen === 'conversation') return <ConversationScreen key={convKey} sectorIdx={selectedSector} levelIdx={selectedLevel} onComplete={handleComplete} onBack={() => setScreen('level')} />
  if (screen === 'complete')     return <LevelCompleteScreen sectorIdx={selectedSector} levelIdx={selectedLevel} stars={lastStars} unlockedNew={unlockedNew} onContinue={() => setScreen('level')} onReplay={() => { setConvKey(k => k + 1); setScreen('conversation') }} />
  return null
}
