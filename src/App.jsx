import { useState, useEffect, useRef, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

/* ── Image assets ── */
import imgCleanRoom  from './assets/clean_room.jpg.webp'
import imgGarbage   from './assets/take_garbage_out.webp'
import imgComplaint from './assets/hotel_user_complaint.jpg'
import imgPackBoxes from './assets/pack_boxes.jpg'
import imgPackLine  from './assets/packaging_line.jpeg'
import imgThumbsUp  from './assets/thumbs_up.jpg'
import imgWatering  from './assets/someone_watering.jpg'
import imgDamaged   from './assets/damaged_plants.jpeg'
import imgBreak     from './assets/break_time.jpg'

/* ─────────────────────────────────────────────────────────────────
   DATA — 6 sectors × 3 levels = 18 scenarios
───────────────────────────────────────────────────────────────── */
const SECTORS = [
  {
    id: 'pack', emoji: '📦', label: 'Packaging',
    color: '#1CB0F6', dark: '#0095D9', light: '#E8F7FF',
    gradient: 'linear-gradient(135deg, #1CB0F6 0%, #0070BA 100%)',
    levels: [
      { name: 'First Day',    image: imgPackBoxes, character: { name: 'Dan',   role: 'Supervisor', emoji: '👷',   rate: 0.82, pitch: 0.95 }, opening: 'Good morning. Today you will pack boxes on line three. Watch me first.',          targetPhrase: 'Yes. I will watch you.',           hint: '✅  👀', description: 'Supervisor gives first-day instructions' },
      { name: 'Go Faster',   image: imgPackLine,  character: { name: 'Maria', role: 'Line Lead',   emoji: '👩‍🏭', rate: 0.88, pitch: 1.08 }, opening: 'The line is slow today. We need to go faster. Can you keep up?',              targetPhrase: 'Yes. I will try to go faster.',    hint: '🏃  ⬆️', description: 'Line lead asks for more speed' },
      { name: 'End of Shift', image: imgThumbsUp, character: { name: 'Dan',   role: 'Supervisor', emoji: '👷',   rate: 0.82, pitch: 0.95 }, opening: 'Good work today. You did a great job. See you tomorrow.',                        targetPhrase: 'Thank you. See you tomorrow.',     hint: '🙏  👋', description: 'Great first shift wrap-up' },
    ],
  },
  {
    id: 'clean', emoji: '🧹', label: 'Cleaning',
    color: '#58CC02', dark: '#46A302', light: '#EEFFD6',
    gradient: 'linear-gradient(135deg, #58CC02 0%, #2E8B00 100%)',
    levels: [
      { name: 'Morning Rounds',  image: imgCleanRoom,  character: { name: 'Rita', role: 'Supervisor', emoji: '👩‍💼', rate: 0.82, pitch: 1.0  }, opening: 'Good morning. Please clean rooms 101 to 110 first. Start with the bathrooms.', targetPhrase: 'OK. I will start with the bathrooms.',      hint: '🚿  1️⃣', description: 'Supervisor assigns your rooms' },
      { name: 'Out of Supplies', image: imgGarbage,    character: { name: 'Tom',  role: 'Coworker',   emoji: '🧑',   rate: 0.85, pitch: 1.0  }, opening: 'Hey, do you have extra garbage bags? I ran out.',                               targetPhrase: 'Yes. Here you go. No problem.',            hint: '🛍️  🤝', description: 'Coworker asks you for supplies' },
      { name: 'Guest Complaint', image: imgComplaint,  character: { name: 'Rita', role: 'Supervisor', emoji: '👩‍💼', rate: 0.82, pitch: 1.0  }, opening: 'A guest said room 204 was not clean. Can you go back and check it please?',    targetPhrase: 'Sorry. I will go back and fix it now.',    hint: '😔  🔁', description: 'Supervisor asks you to redo a room' },
    ],
  },
  {
    id: 'green', emoji: '🌿', label: 'Greenhouse',
    color: '#FF9600', dark: '#E07800', light: '#FFF4E0',
    gradient: 'linear-gradient(135deg, #FF9600 0%, #C85A00 100%)',
    levels: [
      { name: 'Watering Rules',  image: imgWatering, character: { name: 'Carlos', role: 'Trainer',    emoji: '🧑‍🌾', rate: 0.82, pitch: 1.0  }, opening: 'Today you will water section B. Use the green hose only. Do not water the red tags.', targetPhrase: 'OK. Section B, green hose, no red tags.',     hint: '💚  🚫', description: 'Trainer explains watering rules' },
      { name: 'Damaged Plants',  image: imgDamaged,  character: { name: 'Sarah',  role: 'Supervisor', emoji: '👩‍🔬', rate: 0.84, pitch: 1.05 }, opening: 'Some of these plants look damaged. Did you notice this before?',                     targetPhrase: 'No. I am sorry. I will tell you next time.', hint: '😔  📢', description: 'Supervisor asks about damaged plants' },
      { name: 'Break Bell',      image: imgBreak,    character: { name: 'Carlos', role: 'Trainer',    emoji: '🧑‍🌾', rate: 0.85, pitch: 1.0  }, opening: 'The bell rang. It is break time. Come on, let us go eat.',                          targetPhrase: 'OK. Thank you. I am coming.',                hint: '🔔  🍽️', description: 'Break time — follow the team' },
    ],
  },
  {
    id: 'assembly', emoji: '🏗️', label: 'Assembly',
    color: '#A560F8', dark: '#8040E0', light: '#F3EEFF',
    gradient: 'linear-gradient(135deg, #A560F8 0%, #6020C0 100%)',
    levels: [
      { name: 'Station Setup', character: { name: 'Mike', role: 'Trainer',  emoji: '🧑‍🔧', rate: 0.82, pitch: 0.95 }, opening: 'This is your station. Put the small parts in the left bin, big parts in the right bin.', targetPhrase: 'Small parts left, big parts right. OK.', hint: '⬅️  ➡️', description: 'Learning your sorting station' },
      { name: 'Slow Down',     character: { name: 'Mike', role: 'Trainer',  emoji: '🧑‍🔧', rate: 0.82, pitch: 0.95 }, opening: 'Stop. You are mixing the parts. Please slow down and check each one.',                  targetPhrase: 'Sorry. I will slow down and check.',    hint: '🐢  🔍', description: 'Trainer asks you to be more careful' },
      { name: 'Ask for Help',  character: { name: 'Lisa', role: 'Coworker', emoji: '👩',   rate: 0.84, pitch: 1.05 }, opening: 'You look confused. Do you need help? It is OK to ask.',                                  targetPhrase: 'Yes please. I do not understand this.', hint: '🙋  ❓', description: 'Coworker offers help — practice asking' },
    ],
  },
  {
    id: 'food', emoji: '🍽️', label: 'Food Service',
    color: '#FF4757', dark: '#CC2233', light: '#FFE8EA',
    gradient: 'linear-gradient(135deg, #FF4757 0%, #C0001A 100%)',
    levels: [
      { name: 'Taking Orders',  character: { name: 'Ben',   role: 'Supervisor', emoji: '👨‍🍳', rate: 0.84, pitch: 1.0  }, opening: 'Hi! What would you like today? We have soup or a sandwich.',              targetPhrase: 'I would like soup please. Thank you.',        hint: '🍜  🙏', description: 'Serving food at the cafeteria counter' },
      { name: 'Kitchen Help',   character: { name: 'Chef',  role: 'Head Chef',  emoji: '🧑‍🍳', rate: 0.82, pitch: 0.95 }, opening: 'We need more tomatoes from the fridge. Can you get them please?',         targetPhrase: 'Yes. I will get the tomatoes now.',           hint: '🍅  🏃', description: 'Chef asks you to fetch ingredients' },
      { name: 'Closing Time',   character: { name: 'Ben',   role: 'Supervisor', emoji: '👨‍🍳', rate: 0.84, pitch: 1.0  }, opening: 'Good job today. Please wipe down all the tables before you leave.',      targetPhrase: 'OK. I will wipe the tables right now.',       hint: '🧽  ✅', description: 'End-of-shift cleaning duties' },
    ],
  },
  {
    id: 'care', emoji: '🏥', label: 'Care & Support',
    color: '#FF6B9D', dark: '#CC4070', light: '#FFE8F2',
    gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C0004A 100%)',
    levels: [
      { name: 'Morning Greeting', character: { name: 'Mary', role: 'Resident',   emoji: '👵', rate: 0.78, pitch: 1.1  }, opening: 'Good morning dear. Can you help me get dressed please? I am a bit slow today.', targetPhrase: 'Good morning. Yes, I will help you.',         hint: '☀️  🤝', description: 'Helping a resident start their day' },
      { name: 'Not Feeling Well', character: { name: 'Mary', role: 'Resident',   emoji: '👵', rate: 0.76, pitch: 1.0  }, opening: 'I do not feel well today. My head hurts a lot.',                              targetPhrase: 'I am sorry. I will get the nurse for you.',   hint: '😔  🏃', description: 'Resident is unwell — get help fast' },
      { name: 'Great Feedback',   character: { name: 'Pat',  role: 'Supervisor', emoji: '👩‍⚕️', rate: 0.82, pitch: 1.05 }, opening: 'You are so patient and kind. All the residents really love you.',           targetPhrase: 'Thank you. I love helping them every day.',   hint: '🙏  💛', description: 'Supervisor gives you a compliment' },
    ],
  },
]

/* Fallbacks — one per level (6 sectors × 3) */
const FALLBACKS = [
  { encouragement: 'Great try!', better_phrase: 'Yes. I will watch you.', bengali_translation: 'হ্যাঁ। আমি আপনাকে দেখব।', star_count: 2 },
  { encouragement: 'Good effort!', better_phrase: 'Yes. I will try to go faster.', bengali_translation: 'হ্যাঁ। আমি দ্রুত যাওয়ার চেষ্টা করব।', star_count: 2 },
  { encouragement: 'Well done!', better_phrase: 'Thank you. See you tomorrow.', bengali_translation: 'ধন্যবাদ। আগামীকাল দেখা হবে।', star_count: 2 },
  { encouragement: 'You got it!', better_phrase: 'OK. I will start with the bathrooms.', bengali_translation: 'ঠিক আছে। আমি বাথরুম দিয়ে শুরু করব।', star_count: 2 },
  { encouragement: 'So helpful!', better_phrase: 'Yes. Here you go. No problem.', bengali_translation: 'হ্যাঁ। এই নিন। কোনো সমস্যা নেই।', star_count: 2 },
  { encouragement: 'Good try!', better_phrase: 'Sorry. I will go back and fix it now.', bengali_translation: 'দুঃখিত। আমি এখনই ফিরে ঠিক করব।', star_count: 2 },
  { encouragement: 'Sharp memory!', better_phrase: 'OK. Section B, green hose, no red tags.', bengali_translation: 'ঠিক আছে। সেকশন বি, সবুজ পাইপ, লাল ট্যাগ নয়।', star_count: 2 },
  { encouragement: 'Honest answer!', better_phrase: 'No. I am sorry. I will tell you next time.', bengali_translation: 'না। দুঃখিত। পরের বার জানাব।', star_count: 2 },
  { encouragement: 'Great energy!', better_phrase: 'OK. Thank you. I am coming.', bengali_translation: 'ঠিক আছে। ধন্যবাদ। আমি আসছি।', star_count: 2 },
  { encouragement: 'Excellent!', better_phrase: 'Small parts left, big parts right. OK.', bengali_translation: 'ছোট অংশ বামে, বড় অংশ ডানে।', star_count: 2 },
  { encouragement: 'Stay careful!', better_phrase: 'Sorry. I will slow down and check.', bengali_translation: 'দুঃখিত। আমি ধীরে করব।', star_count: 2 },
  { encouragement: 'Brave!', better_phrase: 'Yes please. I do not understand this.', bengali_translation: 'হ্যাঁ দয়া করে। আমি বুঝতে পারছি না।', star_count: 2 },
  { encouragement: 'So polite!', better_phrase: 'I would like soup please. Thank you.', bengali_translation: 'আমি স্যুপ চাই দয়া করে। ধন্যবাদ।', star_count: 2 },
  { encouragement: 'Quick worker!', better_phrase: 'Yes. I will get the tomatoes now.', bengali_translation: 'হ্যাঁ। আমি এখনই টমেটো আনব।', star_count: 2 },
  { encouragement: 'Good job!', better_phrase: 'OK. I will wipe the tables right now.', bengali_translation: 'ঠিক আছে। আমি এখনই টেবিল মুছব।', star_count: 2 },
  { encouragement: 'So kind!', better_phrase: 'Good morning. Yes, I will help you.', bengali_translation: 'শুভ সকাল। হ্যাঁ, আমি আপনাকে সাহায্য করব।', star_count: 2 },
  { encouragement: 'Fast thinking!', better_phrase: 'I am sorry. I will get the nurse for you.', bengali_translation: 'দুঃখিত। আমি নার্সকে ডাকব।', star_count: 2 },
  { encouragement: 'Wonderful!', better_phrase: 'Thank you. I love helping them every day.', bengali_translation: 'ধন্যবাদ। আমি প্রতিদিন সাহায্য করতে ভালোবাসি।', star_count: 2 },
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
const CONFETTI_COLORS = ['#FF6B6B','#FCD34D','#58CC02','#1CB0F6','#A560F8','#FF9600','#FF4081','#FF6B9D']
const PIECES = Array.from({ length: 70 }, (_, i) => ({
  id: i, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: (i * 5.3) % 100, delay: (i * 0.045) % 2.5,
  duration: 2.0 + (i % 6) * 0.3, size: 7 + (i % 4) * 3,
  round: i % 3 === 0, skew: (i % 5) * 10,
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
   HOME SCREEN
───────────────────────────────────────────────────────────────── */
function HomeScreen({ completedLevels, onSelect }) {
  useEffect(() => {
    speak('Hello. Tap a job to practice.', { rate: 0.8 })
    return () => stopSpeech()
  }, [])

  const totalDone   = Object.values(completedLevels).reduce((s, set) => s + set.size, 0)
  const totalLevels = SECTORS.reduce((s, sec) => s + sec.levels.length, 0)
  const pct = Math.round((totalDone / totalLevels) * 100)

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', display: 'flex', flexDirection: 'column' }}>

      {/* ── Hero header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #2563EB 100%)',
        padding: '28px 22px 36px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ color: '#93C5FD', fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Welcome back</div>
            <div style={{ color: 'white', fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>First Shift 🏭</div>
          </div>
          {/* Stars badge */}
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 18, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>{totalDone}</span>
            <span style={{ color: '#93C5FD', fontSize: 13, fontWeight: 600 }}>/ {totalLevels}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #34D399, #10B981)',
            width: `${pct}%`, transition: 'width 1s ease',
            boxShadow: '0 0 10px rgba(52,211,153,0.7)',
          }} />
        </div>
        <div style={{ color: '#93C5FD', fontSize: 12, fontWeight: 600, marginTop: 6 }}>{pct}% complete</div>
      </div>

      {/* ── Sector cards ── */}
      <div style={{ flex: 1, padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14, marginTop: -12 }}>
        {SECTORS.map((sector, i) => {
          const done  = completedLevels[i]?.size ?? 0
          const total = sector.levels.length
          const allDone = done === total

          return (
            <button
              key={sector.id}
              onClick={() => onSelect(i)}
              style={{
                background: 'white',
                borderRadius: 22,
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                border: 'none',
                cursor: 'pointer',
                boxShadow: allDone
                  ? `0 4px 20px ${sector.color}40`
                  : '0 2px 12px rgba(0,0,0,0.08)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                textAlign: 'left',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = allDone ? `0 4px 20px ${sector.color}40` : '0 2px 12px rgba(0,0,0,0.08)' }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {/* Left color bar */}
              <div style={{ width: 6, background: sector.gradient, flexShrink: 0 }} />

              {/* Content */}
              <div style={{ flex: 1, padding: '18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {/* Icon circle */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: sector.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, flexShrink: 0,
                    border: `2px solid ${sector.color}33`,
                  }}>
                    {sector.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#1A1A2E', letterSpacing: -0.3 }}>{sector.label}</div>
                    <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginTop: 2 }}>{total} lessons</div>
                  </div>
                  {allDone && <span style={{ fontSize: 22 }}>✅</span>}
                </div>

                {/* Level dots */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {sector.levels.map((lv, li) => {
                    const lvDone = completedLevels[i]?.has(li)
                    return (
                      <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: lvDone ? sector.gradient : '#F0F0F0',
                          border: `2px solid ${lvDone ? sector.dark : '#E0E0E0'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: lvDone ? 14 : 12, fontWeight: 900,
                          color: lvDone ? 'white' : '#BBB',
                          boxShadow: lvDone ? `0 2px 8px ${sector.color}55` : 'none',
                        }}>
                          {lvDone ? '✓' : li + 1}
                        </div>
                        {li < total - 1 && <div style={{ width: 14, height: 2, background: lvDone && completedLevels[i]?.has(li + 1) ? sector.color : '#E5E5E5', borderRadius: 2 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right arrow */}
              <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16, color: '#CCC', fontSize: 22, fontWeight: 300 }}>›</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   LEVEL SELECT
───────────────────────────────────────────────────────────────── */
function LevelSelectScreen({ sectorIdx, completedLevels, onSelect, onBack }) {
  const sector = SECTORS[sectorIdx]

  useEffect(() => {
    speak(`${sector.label}. Choose a level.`, { rate: 0.8 })
    return () => stopSpeech()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: sector.gradient,
        padding: '22px 20px 28px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, width: 42, height: 42, fontSize: 20, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset' }}
        >←</button>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {sector.emoji}
        </div>
        <span style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{sector.label}</span>
      </div>

      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14, marginTop: -8 }}>
        {sector.levels.map((level, i) => {
          const done = completedLevels[sectorIdx]?.has(i)
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              style={{
                background: 'white',
                border: `2px solid ${done ? sector.color : 'transparent'}`,
                borderRadius: 22, padding: 0,
                overflow: 'hidden',
                display: 'flex', alignItems: 'stretch',
                cursor: 'pointer', textAlign: 'left',
                boxShadow: done ? `0 4px 16px ${sector.color}33` : '0 2px 10px rgba(0,0,0,0.07)',
                transition: 'transform 0.12s',
                minHeight: 'unset',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Thumbnail */}
              <div style={{ width: 90, height: 90, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                {level.image
                  ? <img src={level.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: done ? 'none' : 'brightness(0.85)' }} />
                  : <div style={{ width: '100%', height: '100%', background: sector.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{sector.emoji}</div>
                }
                {done && (
                  <div style={{ position: 'absolute', inset: 0, background: `${sector.color}99`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>⭐</div>
                )}
                {!done && (
                  <div style={{ position: 'absolute', bottom: 6, left: 6, background: sector.color, color: 'white', borderRadius: 8, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                    {i + 1}
                  </div>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, padding: '14px 14px 14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#1A1A2E', marginBottom: 4, letterSpacing: -0.2 }}>{level.name}</div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>{level.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <div style={{ fontSize: 18 }}>{level.character.emoji}</div>
                  <div style={{ fontSize: 12, color: '#AAA', fontWeight: 600 }}>{level.character.name} · {level.character.role}</div>
                </div>
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
─────────────────────────────────────────────────────────────────── */
const WAVE_H = [18, 30, 44, 32, 20]
const WAVE_D = ['0s', '0.12s', '0.24s', '0.36s', '0.48s']

function SceneHeader({ level, sector, isIdle, onBack }) {
  return (
    <div style={{ position: 'relative', height: isIdle ? 200 : 150, flexShrink: 0, overflow: 'hidden' }}>
      {level.image
        ? <img src={level.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (
          <div style={{
            width: '100%', height: '100%',
            background: sector.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 90, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3))' }}>{sector.emoji}</span>
          </div>
        )
      }
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' }} />
      <button
        onClick={onBack}
        style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: 12, width: 40, height: 40, color: 'white', fontSize: 18, cursor: 'pointer', minHeight: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >←</button>
      <div style={{ position: 'absolute', bottom: 14, left: 18, right: 18 }}>
        <div style={{ color: 'white', fontSize: 19, fontWeight: 900, letterSpacing: -0.3 }}>{level.name}</div>
        <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 2 }}>{sector.emoji} {sector.label}</div>
      </div>
    </div>
  )
}

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
  const [retryMsg,     setRetryMsg]     = useState('')

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

  const handleListenTap = () => {
    setPhase('char_speaking')
    speak(level.opening, {
      rate: level.character.rate, pitch: level.character.pitch,
      onEnd: () => setPhase('ready_to_speak'),
    })
  }

  const resetToSpeak = () => {
    setPhase('ready_to_speak')
    setPlayerSpeech('')
    setRetryMsg('')
    setTextInput('')
    setShowText(false)
  }

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
    r.onresult = e => { gotResult.current = true; clearTimeout(timeoutRef.current); handlePlayerSpeech(e.results[0][0].transcript) }
    r.onend    = () => { clearTimeout(timeoutRef.current); if (!gotResult.current) setShowText(true) }
    r.onerror  = () => { clearTimeout(timeoutRef.current); setShowText(true) }
    recRef.current = r; r.start(); setPhase('recording')
    timeoutRef.current = setTimeout(() => { if (!gotResult.current) { try { recRef.current?.stop() } catch (_) {} setShowText(true) } }, 10000)
  }, [phase, isIOS])

  const handlePlayerSpeech = async (speech) => {
    setPlayerSpeech(speech); setPhase('processing')

    const coachSystem = `You are a warm English coach for Rohingya refugee women learning Canadian workplace English.
Scenario: ${level.description}
${level.character.name} (${level.character.role}) said: "${level.opening}"
Target response: "${level.targetPhrase}"
Learner said: "${speech}"

IMPORTANT RULES:
- If the learner said something completely unrelated, nonsensical, offensive, or not an attempt at the scenario (e.g. random words, rude words, off-topic phrases): set star_count to 0 and set encouragement to a VERY SHORT gentle nudge in simple words like "Let's try again! Listen first." or "Almost! Try to answer ${level.character.name}."
- If they genuinely tried but wrong: star_count 1
- If understandable: star_count 2
- If great: star_count 3

Reply ONLY with valid JSON, no markdown:
{"encouragement":"One warm sentence max 10 words","better_phrase":"Ideal simple English max 12 words","bengali_translation":"Bengali script translation","star_count":2}`

    const charSystem = `You are ${level.character.name}, ${level.character.role} at a Canadian ${sector.label.toLowerCase()} workplace. Talking to a new worker learning English.
Your line: "${level.opening}" — They said: "${speech}"
Reply ONE warm sentence, max 12 words. Very simple English. If their reply was off-topic, gently redirect them.`

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

      const sc = Number(coachObj.star_count ?? 2)

      if (sc === 0) {
        const msg = coachObj.encouragement || "Let's try again! Listen carefully."
        setRetryMsg(msg)
        setPhase('retry')
        speak(msg, { rate: 0.82 })
        return
      }

      const charText = charRes.content?.[0]?.text?.trim() || 'Good. Keep going.'
      setCharResponse(charText)
      setCoaching(coachObj)
      setStars(Math.min(3, Math.max(1, sc)))
      setPhase('coaching')
      speak(coachObj.encouragement || '', { rate: 0.88, onEnd: () =>
        speak(coachObj.better_phrase || '', { rate: 0.75, onEnd: () =>
          speak(coachObj.bengali_translation || '', { rate: 0.8, lang: 'bn-BD' })
        })
      })
    } catch {
      setCharResponse('Good. Keep going.'); setCoaching(fallback); setStars(fallback.star_count); setPhase('coaching')
      speak(fallback.encouragement, { rate: 0.88, onEnd: () =>
        speak(fallback.better_phrase, { rate: 0.75, onEnd: () =>
          speak(fallback.bengali_translation, { rate: 0.8, lang: 'bn-BD' })
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
  const isRetry        = phase === 'retry'
  const showMic        = (isReadyToSpeak || isRecording) && !showText

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      <SceneHeader level={level} sector={sector} isIdle={isIdle} onBack={onBack} />

      {/* ── Character avatar — overlaps scene image ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -38, zIndex: 10, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          {isCharSpeaking && [0, 1].map(ri => (
            <div key={ri} style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: `3px solid ${sector.color}`,
              animation: `pulse-ring 1.5s ease-out ${ri * 0.65}s infinite`,
            }} />
          ))}
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: `linear-gradient(135deg, ${sector.light}, white)`,
            border: `4px solid white`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 38, boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          }}>
            {level.character.emoji}
          </div>
          <div style={{ position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: '#22C55E', border: '3px solid white' }} />
        </div>
      </div>

      {/* Name tag */}
      <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 4, flexShrink: 0 }}>
        <span style={{ background: sector.color, color: 'white', borderRadius: 12, padding: '4px 14px', fontSize: 12, fontWeight: 800, display: 'inline-block', letterSpacing: 0.3 }}>
          {level.character.name} · {level.character.role}
        </span>
      </div>

      {/* ── IDLE: tap to listen ── */}
      {isIdle && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px 32px', gap: 18 }}>
          <div style={{
            background: 'white', borderRadius: 22, padding: '18px 24px',
            maxWidth: 320, width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            textAlign: 'center',
            border: `1.5px solid ${sector.color}22`,
          }}>
            <div style={{ fontSize: 13, color: '#BBB', fontWeight: 700, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>Ready?</div>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🎙️</div>
            <div style={{ fontSize: 16, color: '#555', fontWeight: 600 }}>{level.character.name} will speak</div>
          </div>
          <button
            onClick={handleListenTap}
            style={{
              width: 110, height: 110, borderRadius: '50%',
              background: sector.gradient,
              border: `4px solid ${sector.dark}`,
              color: 'white', fontSize: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', minHeight: 'unset', minWidth: 'unset',
              boxShadow: `0 8px 32px ${sector.color}55`,
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >👂</button>
          <div style={{ fontSize: 24 }}>👆</div>
        </div>
      )}

      {/* ── Speaking: wave animation ── */}
      {isCharSpeaking && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 8px', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 52 }}>
            {WAVE_H.map((h, i) => (
              <div key={i} className="wave-bar" style={{ height: h, background: sector.color, animationDelay: WAVE_D[i] }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Post-speak: speech bubbles ── */}
      {!isIdle && !isCharSpeaking && (
        <div style={{ padding: '8px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative', maxWidth: 300 }}>
            <div style={{ position: 'absolute', top: -9, left: 26, width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '11px solid white' }} />
            <div style={{ background: 'white', borderRadius: 18, padding: '12px 16px', boxShadow: '0 3px 14px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 15, color: '#1A1A2E', lineHeight: 1.6 }}>{charResponse || level.opening}</div>
            </div>
          </div>
          {playerSpeech && !isProcessing && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: sector.gradient, borderRadius: 18, padding: '10px 16px', maxWidth: 240, boxShadow: `0 4px 14px ${sector.color}44` }}>
                <div style={{ fontSize: 14, color: 'white', fontWeight: 600, lineHeight: 1.4 }}>{playerSpeech}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing */}
      {isProcessing && (
        <div style={{ textAlign: 'center', padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0,1,2].map(i => <div key={i} className="wave-bar" style={{ width: 10, height: 14, background: sector.color, animationDelay: `${i*0.2}s` }} />)}
          </div>
        </div>
      )}

      {/* ── Retry screen (off-topic / bad input) ── */}
      {isRetry && (
        <div className="animate-slide-up" style={{
          margin: '16px 18px 0',
          background: 'white',
          borderRadius: 24,
          padding: '24px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '2px solid #FDE68A',
        }}>
          <div style={{ fontSize: 50, marginBottom: 14 }}>🙂</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#92400E', marginBottom: 20, lineHeight: 1.4 }}>
            {retryMsg || "Let's try again! Listen carefully."}
          </div>
          <div style={{ fontSize: 30, letterSpacing: 6, marginBottom: 18 }}>{level.hint}</div>
          <button
            onClick={resetToSpeak}
            style={{
              width: '100%',
              background: sector.gradient,
              color: 'white', fontSize: 20, fontWeight: 900,
              borderRadius: 18, padding: '18px 0',
              border: `3px solid ${sector.dark}`, cursor: 'pointer', minHeight: 'unset',
              boxShadow: `0 6px 20px ${sector.color}55`,
            }}
          >🎤 Try Again</button>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 8 }} />

      {/* ── Coach panel ── */}
      {isCoaching && coaching && (
        <div className="animate-slide-up" style={{
          background: 'white',
          borderRadius: '28px 28px 0 0',
          padding: '6px 18px 36px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.13)',
          flexShrink: 0,
        }}>
          <div style={{ width: 40, height: 4, background: '#E5E5E5', borderRadius: 2, margin: '10px auto 14px' }} />

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
            {[1,2,3].map(s => (
              <span key={s} className={s <= stars ? `star-${s}` : ''} style={{ fontSize: 38, filter: s <= stars ? 'none' : 'grayscale(1)', opacity: s <= stars ? 1 : 0.15 }}>⭐</span>
            ))}
          </div>

          {/* Encouragement */}
          <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, color: '#1A1A2E', marginBottom: 12, lineHeight: 1.35 }}>
            {coaching.encouragement}
          </div>

          {/* Better phrase */}
          <div style={{ background: 'linear-gradient(135deg, #F0FFF4, #DCFCE7)', border: '2px solid #86EFAC', borderRadius: 16, padding: '12px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(88,204,2,0.1)' }}>
            <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Try saying</div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#14532D', lineHeight: 1.3 }}>{coaching.better_phrase}</div>
          </div>

          {/* Bengali */}
          <div style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '2px solid #FDE68A', borderRadius: 16, padding: '10px 16px', marginBottom: 14, boxShadow: '0 2px 8px rgba(251,191,36,0.1)' }}>
            <div style={{ fontSize: 10, color: '#92400E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5 }}>বাংলা</div>
            <div style={{ fontSize: 15, color: '#78350F', lineHeight: 1.65 }}>{coaching.bengali_translation}</div>
          </div>

          {/* Buttons: listen + continue side by side */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => speak(coaching.better_phrase, { rate: 0.68 })}
              style={{
                flex: 1,
                background: 'white',
                border: `2.5px solid ${sector.color}`,
                color: sector.color, fontSize: 22,
                borderRadius: 16, padding: '16px 0',
                cursor: 'pointer', minHeight: 'unset',
                fontWeight: 900,
              }}
            >🔊</button>
            <button
              onClick={() => onComplete(stars)}
              style={{
                flex: 3,
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: 'white', fontSize: 18, fontWeight: 900,
                borderRadius: 16, padding: '16px 0',
                border: '3px solid #15803D', cursor: 'pointer', minHeight: 'unset',
                boxShadow: '0 6px 20px rgba(34,197,94,0.45)',
              }}
            >✓ Continue</button>
          </div>

          {/* Retry option for 1-star */}
          {stars === 1 && (
            <button
              onClick={resetToSpeak}
              style={{ width: '100%', marginTop: 10, background: 'none', border: '2px solid #E5E5E5', color: '#888', fontSize: 15, fontWeight: 700, borderRadius: 14, padding: '12px 0', cursor: 'pointer', minHeight: 'unset' }}
            >🔁 Try again</button>
          )}
        </div>
      )}

      {/* ── Mic area ── */}
      {(showMic || (isReadyToSpeak && showText)) && (
        <div style={{ padding: '14px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {!showText ? (
            <>
              <div style={{ fontSize: 32, letterSpacing: 8 }}>{level.hint}</div>
              <div style={{ fontSize: 18 }}>{isRecording ? '🔴' : '👆'}</div>
              <button
                className={isRecording ? 'animate-mic-glow' : ''}
                onClick={toggleRecording}
                style={{
                  width: 96, height: 96, borderRadius: '50%',
                  background: isRecording ? 'linear-gradient(135deg, #FF4B4B, #CC0000)' : 'linear-gradient(135deg, #22C55E, #16A34A)',
                  border: `4px solid ${isRecording ? '#990000' : '#15803D'}`,
                  color: 'white', fontSize: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', minHeight: 'unset', minWidth: 'unset',
                  boxShadow: isRecording ? '0 6px 24px rgba(255,75,75,0.55)' : '0 6px 24px rgba(34,197,94,0.55)',
                  transition: 'all 0.2s',
                }}
              >{isRecording ? '⏹' : '🎤'}</button>
              <button onClick={() => setShowText(true)} style={{ background: 'none', border: 'none', color: '#CCC', fontSize: 28, cursor: 'pointer', minHeight: 'unset', minWidth: 'unset' }}>⌨️</button>
            </>
          ) : (
            <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ textAlign: 'center', fontSize: 32 }}>{level.hint}</div>
              <input
                autoFocus value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && textInput.trim() && handlePlayerSpeech(textInput.trim())}
                placeholder="Type here…"
                style={{ fontSize: 18, padding: '14px 18px', borderRadius: 16, border: '2px solid #E0E0E0', outline: 'none', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              />
              <button
                onClick={() => textInput.trim() && handlePlayerSpeech(textInput.trim())}
                style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: 'white', fontSize: 18, fontWeight: 900, borderRadius: 16, padding: '16px 0', border: '3px solid #15803D', cursor: 'pointer', minHeight: 'unset', boxShadow: '0 4px 16px rgba(34,197,94,0.45)' }}
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
    const msg = stars === 3 ? 'Amazing! Perfect score!' : stars === 2 ? 'Great job!' : 'Good try! Keep practicing!'
    speak(msg, { rate: 0.85 })
    return () => stopSpeech()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', display: 'flex', flexDirection: 'column' }}>
      <Confetti />

      {/* Scene image header */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        {level.image
          ? <img src={level.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} />
          : <div style={{ width: '100%', height: '100%', background: sector.gradient }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: `${sector.dark}BB`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <div className="animate-bounce-in" style={{ fontSize: 70 }}>
            {stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}
          </div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 900 }}>
            {stars === 3 ? 'Perfect!' : stars === 2 ? 'Great job!' : 'Good try!'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', gap: 20 }}>
        {/* Stars */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[1,2,3].map(s => (
            <span key={s} className={s <= stars ? `star-${s}` : ''} style={{ fontSize: 56, filter: s <= stars ? 'none' : 'grayscale(1)', opacity: s <= stars ? 1 : 0.15 }}>⭐</span>
          ))}
        </div>

        {/* Phrase card */}
        <div style={{
          background: 'white', borderRadius: 24,
          padding: '20px 24px', width: '100%', maxWidth: 340,
          borderLeft: `5px solid ${sector.color}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.08)`,
        }}>
          <div style={{ fontSize: 11, color: sector.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Today's phrase</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A2E', lineHeight: 1.35 }}>{level.targetPhrase}</div>
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
          <button
            onClick={onReplay}
            style={{ flex: 1, background: 'white', border: '2px solid #E5E5E5', color: '#666', fontSize: 16, fontWeight: 800, borderRadius: 18, padding: '16px 0', cursor: 'pointer', minHeight: 'unset', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >🔁</button>
          <button
            onClick={onContinue}
            style={{ flex: 3, background: sector.gradient, border: `3px solid ${sector.dark}`, color: 'white', fontSize: 18, fontWeight: 900, borderRadius: 18, padding: '16px 0', cursor: 'pointer', minHeight: 'unset', boxShadow: `0 6px 20px ${sector.color}55` }}
          >→ Continue</button>
        </div>
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
  const [completedLevels, setCompletedLevels] = useState(
    Object.fromEntries(SECTORS.map((_, i) => [i, new Set()]))
  )
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
