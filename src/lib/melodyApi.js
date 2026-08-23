const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function searchMelody(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "hum.wav");
  const response = await fetch(`${API_BASE_URL}/api/match-melody`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`Server status: ${response.status}`);
  return response.json();
}

export function getMockMelodyAnalysis() {
  return { duration: "18.4 sec", pitchRange: "184–392 Hz", notes: "17", tempo: "94 BPM" };
}
