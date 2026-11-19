# Optional audio recording

Playwright's `recordVideo` captures **video only**, and headless Chromium is
launched with `--mute-audio`. To get the sound of the videos playing in the
page, videolab can record a **loopback audio device** in parallel and attach
the WAV to the Remotion composition. This is opt-in; silent recordings are
unchanged.

## One-time setup (Windows)

1. Install a virtual audio cable, e.g. `winget install --id VB-Audio.Voicemeeter.Banana -e`.
   A plain VB-Cable works too. **Voicemeeter must be running** during a take.
2. Route the browser's playback into the cable's virtual input device. With
   Voicemeeter Banana's default routing, Windows' default playback device
   (`VoiceMeeter Input` or `VoiceMeeter AUX Input`) already reaches its virtual
   output bus **B1**, so no system-wide device switching is needed.
3. Find the exact recording device name (the **output** side of the cable):

   ```
   ffmpeg -f dshow -list_devices true -i dummy
   ```

   Use that string verbatim in `audioDevice` (DirectShow names are
   case-sensitive and may include parentheses). The default is
   `Voicemeeter Out B1 (VB-Audio Voicemeeter VAIO)`.

## Configuration

In the video's `video.json`:

```json
{
  "audio": true,
  "audioDevice": "Cable Output (VB-Audio Virtual Cable)",
  "audioOffset": 0
}
```

- `audio: true` launches Chromium **headed** (visible window) with
  `--autoplay-policy=no-user-gesture-required`, so unmuted programmatic
  playback works, and starts `ffmpeg` capturing the device into
  `raw/audio.wav`.
- `audioOffset` is seconds; positive shifts the sound later relative to the
  footage, negative trims audio that started before the recording. Tune it by
  watching the first card's song/video start in the preview.
- `audioDevice` can also be set as `audio_device` in `demo.yml` (app-wide).
- Omit `audio` (or set `false`) for the normal silent path.

## Flow requirements

The flow receives the video config as `config` alongside `page`, `log` and
`demo`, so it can check `config.audio` and, for example, omit `mute=1` from an
embed it rewrites. The flow still controls what is audible: start the next
card's video while the current one is framed (pre-roll), and pause/stop the
previous card when the camera moves. A short overlap is fine. Because the
browser is now headed and unmuted, make sure the machine has no other audio
playing during a take — the loopback capture records everything the system
outputs.

## Rendering

`compose` aligns `raw/audio.wav` to the footage with ffmpeg (trimming or
padding its start by the offset measured during recording) and writes the
result to `render/audio.wav`; `props.json` carries `audioSrc` with a zero
offset because the alignment is already in the file. The tracked template's
`Demo.tsx` places an `<Audio>` inside the footage sequence (after the intro). Videos forked
before this feature must copy that `<Audio>` block into their own
`studio/src/components/Demo.tsx` to hear the track — project copies are
deliberately never overwritten.

## Caveats

- Only Windows DirectShow loopback devices are wired up today; Linux/macOS
  need a different input (`pulse`/`coreaudio`) and are not supported yet.
- ffmpeg must be on `PATH` (it already is for footage normalization).
- If the device name is wrong, `record` fails immediately with the ffmpeg error
  instead of silently producing a silent take.
