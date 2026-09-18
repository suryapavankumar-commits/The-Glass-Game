/**
 * Simple wrapper around the browser Web Speech API for TTS.
 */

// Voice preferences for different characters
const VOICE_PREFS: Record<string, string[]> = {
  narrator: ['Google UK English Male', 'Daniel', 'Samantha', 'en-GB'],
  commander_vale: ['Google UK English Female', 'Karen', 'Tessa', 'en-GB'],
  player_7: ['Google US English', 'Alex', 'Victoria', 'en-US'],
  gatekeeper: ['Google US English Male', 'Fred', 'en-US'],
  surgeon: ['Google UK English Male', 'Daniel', 'en-GB']
};

let voices: SpeechSynthesisVoice[] = [];

// Pre-load voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function getVoiceForRole(role: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  
  const prefs = VOICE_PREFS[role] || VOICE_PREFS['narrator'];
  
  // Find first matching voice by name
  for (const pref of prefs) {
    const match = voices.find(v => v.name.includes(pref) || v.lang.includes(pref));
    if (match) return match;
  }
  
  // Fallback to default
  return voices.find(v => v.default) || voices[0];
}

export function playTTS(text: string, role: string = 'narrator') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  // Cancel any currently speaking utterance
  window.speechSynthesis.cancel();
  
  // Clean up markdown/HTML tags from text
  const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[*_]/g, '');
  if (!cleanText.trim()) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voice = getVoiceForRole(role);
  if (voice) {
    utterance.voice = voice;
  }
  
  // Adjust pitch/rate based on character
  if (role === 'commander_vale') {
    utterance.pitch = 0.9;
    utterance.rate = 1.05;
  } else if (role === 'player_7') {
    utterance.pitch = 1.0;
    utterance.rate = 0.95;
  } else {
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
  }
  
  window.speechSynthesis.speak(utterance);
}

export function stopTTS() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
