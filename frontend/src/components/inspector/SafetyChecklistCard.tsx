import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Volume2,
  VolumeX,
  Languages,
  CheckCircle2,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { fetchBhashiniChecklist, synthesizeBhashiniSpeech } from '../../services/api'

interface SafetyChecklistCardProps {
  compact?: boolean
}

export const SafetyChecklistCard: React.FC<SafetyChecklistCardProps> = ({ compact = false }) => {
  const [language, setLanguage] = useState<'hi' | 'ta' | 'en'>('hi')
  const [items, setItems] = useState<string[]>([])
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [isPlayingTts, setIsPlayingTts] = useState(false)
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadChecklist(language)
  }, [language])

  const loadChecklist = async (lang: string) => {
    setLoading(true)
    try {
      const data = await fetchBhashiniChecklist(lang)
      setItems(data?.items || [])
    } catch (err) {
      console.error('Failed to fetch safety checklist:', err)
      // Default fallback items
      if (lang === 'hi') {
        setItems([
          '१. कार्य स्थल से १२०० मीटर और ६०० मीटर पर लाल झंडे और डेटोनेटर लगाएं।',
          '२. सुनिश्चित करें कि २५ केवी ओएचई डिस्चार्ज रॉड अर्थिंग दोनों तरफ कसी हुई हो।',
          '३. स्टेशन मास्टर लाइन ब्लॉक मेमो और कंप्यूटर इंटरलॉकिंग टोकन प्राप्त करें।',
          '४. अल्ट्रासोनिक फ्लॉ डिटेक्टर (यूएसएफडी) कैलिब्रेशन और गेज टेम्प्लेट की पुष्टि करें।',
          '५. ट्रैक चालू करने से पहले ३० किमी/घंटा का कॉशन ऑर्डर बोर्ड लगाएं।'
        ])
      } else if (lang === 'ta') {
        setItems([
          '1. பணி எல்லையிலிருந்து 1200 மீ மற்றும் 600 மீ தொலைவில் சிகப்புக் கொடிகள் மற்றும் வெடிகளை வைக்கவும்.',
          '2. 25kV மின்சார தடம் இரண்டிலும் எர்த் டிஸ்சார்ஜ் கம்பிகள் பொருத்தப்பட்டுள்ளதை உறுதி செய்யவும்.',
          '3. நிலைய அதிகாரியிடம் இருந்து லைன் பிளாக் மெமோ மற்றும் இன்டர்லாக்கிங் டோக்கனைப் பெறவும்.',
          '4. மீயொலி குறை கண்டறியும் கருவி அளவுத்திருத்தம் மற்றும் கேஜ் டெம்ப்ளேட்டை சரிபார்க்கவும்.',
          '5. தடம் விடுவிப்பதற்கு முன் 30 கிமீ/மணி எச்சரிக்கை பலகையை வைக்கவும்.'
        ])
      } else {
        setItems([
          '1. Place red banner flags and detonators at 1200m and 600m from work boundary.',
          '2. Ensure 25kV OHE traction discharge rod earthing is clamped on both sides.',
          '3. Obtain Station Master Line Block Memo and Computerized Interlocking slot token.',
          '4. Verify Ultrasonic Flaw Detector (USFD) calibration and gauge template.',
          '5. Erect 30 km/h Caution Order speed restriction boards before releasing track.'
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const stopTts = () => {
    setIsPlayingTts(false)
    setCurrentSpeakingIndex(null)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  const playTtsReadout = async () => {
    if (isPlayingTts) {
      stopTts()
      return
    }

    if (items.length === 0) return
    setIsPlayingTts(true)

    // First notify Bhashini backend TTS synthesis service
    try {
      await synthesizeBhashiniSpeech({
        text: items.join('. '),
        language: language
      })
    } catch {
      // Continue to local browser Web Speech synthesis fallback
    }

    // Play sequential readout through browser Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()

      const speakItem = (idx: number) => {
        if (idx >= items.length) {
          setIsPlayingTts(false)
          setCurrentSpeakingIndex(null)
          return
        }

        setCurrentSpeakingIndex(idx)
        const utterance = new SpeechSynthesisUtterance(items[idx])
        utterance.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN'
        utterance.rate = 0.95

        utterance.onend = () => {
          speakItem(idx + 1)
        }
        utterance.onerror = () => {
          speakItem(idx + 1)
        }

        window.speechSynthesis.speak(utterance)
      }

      speakItem(0)
    } else {
      // If Web Speech not available in environment, simulate line highlights
      let idx = 0
      const interval = setInterval(() => {
        if (idx >= items.length) {
          clearInterval(interval)
          setIsPlayingTts(false)
          setCurrentSpeakingIndex(null)
        } else {
          setCurrentSpeakingIndex(idx)
          idx++
        }
      }, 2500)
    }
  }

  const allChecked = items.length > 0 && items.every((_, idx) => !!checkedItems[idx])

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header & TTS Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              Pre-Possession Safety Checklist
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                P-Way / TMS Protocol
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Verified prior to track possession clearance and maintenance machine deployment
            </p>
          </div>
        </div>

        {/* Language selector & TTS Toggle Button */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Language selector */}
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => {
                stopTts()
                setLanguage('hi')
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                language === 'hi' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => {
                stopTts()
                setLanguage('ta')
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                language === 'ta' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => {
                stopTts()
                setLanguage('en')
              }}
              className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* TTS Readout Button */}
          <button
            type="button"
            onClick={playTtsReadout}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-md ${
              isPlayingTts
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-600/20'
            }`}
            title="Read out safety instructions aloud via Bhashini Voice TTS"
          >
            {isPlayingTts ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isPlayingTts ? 'Stop Voice' : 'Bhashini TTS Voice'}</span>
          </button>
        </div>
      </div>

      {/* Checklist items with speaking active indicator */}
      <div className="space-y-2 text-xs">
        {loading ? (
          <div className="py-6 text-center text-slate-500">Loading safety checklist...</div>
        ) : (
          items.map((item, idx) => {
            const isChecked = !!checkedItems[idx]
            const isSpeaking = currentSpeakingIndex === idx
            return (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  isSpeaking
                    ? 'bg-orange-500/15 border-orange-500 text-orange-200 shadow-md shadow-orange-500/10'
                    : isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheck(idx)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <span className={isChecked ? 'line-through text-slate-500' : 'font-medium'}>
                    {item}
                  </span>
                </div>
                {isSpeaking && (
                  <span className="flex items-center space-x-1 text-[10px] font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <Volume2 className="w-3 h-3 animate-bounce" />
                    <span>Speaking</span>
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center space-x-1.5">
          {allChecked ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All 5 safety verifications cleared for track possession
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {Object.values(checkedItems).filter(Boolean).length} of {items.length} safety items verified
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Bhashini Voice AI &bull; Regional Safety TTS
        </span>
      </div>
    </div>
  )
}

export default SafetyChecklistCard
