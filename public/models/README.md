# Athlete GLB Models

Place your animated athlete GLB file here as `athlete.glb`.

## How to get a free model

1. **Mixamo (Adobe)** – https://www.mixamo.com/
   - Pick a character → Download as FBX → Convert to GLB with https://products.aspose.app/3d/conversion/fbx-to-glb
   - Or use Blender: File → Import FBX → Export → glTF 2.0 (GLB)

2. **Sketchfab CC0** – https://sketchfab.com/search?features=downloadable&licenses=cc0
   - Filter by "CC0" and "animated"

3. **ReadyPlayerMe** – https://readyplayer.me/
   - Create avatar → export GLB with animations

## Required animations (clip names)
The viewer looks for these clip names inside the GLB:
- `Squat`
- `Pushup` (or `Push-up`)
- `Plank`
- `JumpingJack` (or `Jumping Jack`)

If your clips have different names, update the `clipName` field in
`src/components/train/AthleteViewer.tsx` → `EXERCISE_CONFIG`.
