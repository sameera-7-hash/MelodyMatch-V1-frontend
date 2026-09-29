const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function searchMelody(audioBlob) {
  const formData = new FormData();
  const extension = audioBlob.type?.split("/")[1]?.split(";")[0] || "wav";
  formData.append("file", audioBlob, audioBlob.name || `hum.${extension}`);
  const response = await fetch(`${API_BASE_URL}/api/match-melody`, { method: "POST", body: formData });
  if (!response.ok) {
    const error = new Error(`Server status: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function fetchMelodyAnswer(userQuery, matches) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: userQuery, ...(matches ? { matches } : {}) }),
  });
  if (!response.ok) {
    const error = new Error(`Server status: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return data.answer;
}

export function getMockMelodyAnalysis() {
  return { duration: "18.4 sec", pitchRange: "184–392 Hz", notes: "17", tempo: "94 BPM" };
}
