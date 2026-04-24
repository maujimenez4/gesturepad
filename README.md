# 🖐️ GesturePad — Neural Interface System

> Control your music and games with nothing but your hands. No controllers. No clicks. Just gestures.

GesturePad is a real-time hand gesture recognition platform built with React + TypeScript and powered by **Google MediaPipe**. It uses your webcam to track 21 hand landmarks and translate natural hand gestures into interactive controls — currently powering two modes: a gesture-controlled **DJ Deck** and an arcade **Space Shooter** game.

The project also includes **CrossBeat**, a companion rhythm game built in **Unity (C#)** where a character navigates a street environment synced to music beats, with full traffic logic, scoring and visual feedback.

---

## ✨ Features

### 🎛️ DJ Mode — Neon DJ Deck
Control music playback with hand gestures in real time:

| Gesture | Action |
|---|---|
| 🖐️ Open Palm | Play track |
| ✊ Fist | Pause track |
| ✌️ Peace / V Sign | Skip to next track |
| 👍 Thumbs Up | Like current track |

- Animated audio visualizer (16-bar spectrum)
- Playlist support via local `.mp3` files in `/public/music/`
- Confidence meter showing gesture detection accuracy
- Gesture history log (last 8 detected gestures)

### 🚀 Game Mode — Astro Defender Hardcore
A gesture-controlled space shooter:

| Gesture | Action |
|---|---|
| ✊ Fist | Pilot the ship (hand tracks ship position) |
| 🤏 Pinch | Fire bullets |

- Real-time hand tracking moves the ship via landmark interpolation (smooth Lerp)
- Progressive difficulty: enemy spawn rate and speed scale with score
- Screen shake effect on hit
- PiP (Picture-in-Picture) camera view inside the game canvas
- High score tracking

### 🎮 CrossBeat — Unity Rhythm Game
A companion game built in Unity with full C# game architecture:

- Character navigates a crossroad synced to a **Beat Manager**
- Swipe gesture detection (horizontal / vertical) drives player movement
- Traffic simulation: vehicles with **signal-aware braking** (raycasting + traffic light states)
- Object pooling system for vehicles and obstacles
- Score system: **Perfect / Good / Miss** timing evaluation
- Audio feedback: swipe SFX, perfect chime, crash sound
- Squash & Stretch animations on movement
- Mobile vibration support on crash

---

## 🛠️ Tech Stack

### Web App (GesturePad)
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Hand Tracking | Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) |
| Rendering | HTML5 Canvas API |

### Unity Game (CrossBeat)
| Layer | Technology |
|---|---|
| Engine | Unity (2D) |
| Language | C# |
| Architecture | MonoBehaviour, Coroutines, Object Pooling, Singleton Managers |
| Audio | Unity AudioManager (custom) |
| Physics | Unity Physics2D (Raycast, Triggers, Colliders) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A device with a webcam
- A modern browser (Chrome recommended for MediaPipe compatibility)

### Installation

```bash
# Clone the repository
git clone https://github.com/maujimenez4/gesturepad.git
cd gesturepad

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser and allow camera access when prompted.

### Adding Your Own Music (DJ Mode)

1. Place your `.mp3` files inside the `public/music/` folder.
2. Edit the `PLAYLIST` array in `src/modes/DJMode.tsx`:

```ts
const PLAYLIST = [
  { title: 'My Song', artist: 'Artist Name', duration: '3:30', url: '/music/my-song.mp3' },
  // add more tracks...
];
```

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready to deploy on any static host (Vercel, Netlify, GitHub Pages, etc.).

---

## 🤚 Gesture Reference

GesturePad detects the following gestures via `src/utils/gestureDetection.ts`:

| Gesture | ID | Description |
|---|---|---|
| Open Palm | `OPEN_PALM` | All fingers extended |
| Fist | `FIST` | All fingers closed |
| Peace / V | `PEACE` | Index + Middle extended |
| Thumbs Up | `THUMBS_UP` | Thumb up, rest closed |
| Point | `POINT` | Index finger extended only |
| Pinch | `PINCH` | Thumb and index close together |
| None | `NONE` | No gesture detected |

> **Tip:** You can simulate gestures with keys `1`–`6` if your camera is unavailable or blocked.

---

## 📁 Project Structure

```
gesturepad/
├── public/
│   └── music/              # Place your .mp3 files here
├── src/
│   ├── components/
│   │   ├── Layout.tsx       # App shell and header
│   │   ├── CameraView.tsx   # Webcam feed + hand landmark overlay
│   │   └── HUDPanel.tsx     # Control center, gesture status, mode switcher
│   ├── modes/
│   │   ├── DJMode.tsx       # Gesture-controlled music player
│   │   └── GameMode.tsx     # Astro Defender space shooter
│   ├── hooks/
│   │   └── useHandTracking.ts  # MediaPipe integration hook
│   └── utils/
│       ├── gestureDetection.ts # Landmark-to-gesture classification logic
│       └── drawingUtils.ts     # Canvas hand skeleton rendering
└── CrossBeatUnity/
    └── Assets/Scripts/
        ├── Gameplay/           # PlayerController, VehicleBehavior, BeatManager
        ├── Audio/              # AudioManager
        ├── Scoring/            # ScoreManager
        └── UI/                 # UIManager, overlays
```

---

## 🧠 How It Works

1. **Camera** — `CameraView` opens a 1280×720 webcam stream via `getUserMedia`.
2. **Tracking** — `useHandTracking` runs MediaPipe's Hand Landmarker model on each video frame, returning 21 normalized 3D landmarks.
3. **Classification** — `gestureDetection.ts` analyzes finger angles and distances between landmarks to classify the current gesture and its confidence score.
4. **Rendering** — `drawingUtils.ts` draws the hand skeleton overlay on a Canvas element synced to the video.
5. **Modes** — The detected `GestureType` is passed as a prop down to the active mode (DJ or Game), where each gesture triggers a specific action.

---

## 🗺️ Roadmap

- [ ] Two-hand gesture support
- [ ] Gesture sensitivity / calibration settings
- [ ] CrossBeat — web integration via WebSocket bridge
- [ ] More game modes (gesture-controlled puzzle, drawing)
- [ ] Deployable demo on GitHub Pages

---

## 📄 License

This project is open source. Feel free to fork, modify, and build on it.

---

*Built by [Mauricio Jiménez Ortiz](https://github.com/maujimenez4)*
