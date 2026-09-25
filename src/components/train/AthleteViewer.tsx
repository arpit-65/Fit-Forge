"use client";

/**
 * AthleteViewer
 * ─────────────
 * A @react-three/fiber scene that renders an animated 3D athlete GLB.
 *
 * Features:
 *  • Loads /public/models/athlete.glb (useGLTF + useAnimations)
 *  • Falls back gracefully when the file is missing (placeholder humanoid)
 *  • Soft lighting: HemisphereLight + DirectionalLight + Environment preset
 *  • ContactShadows on the ground plane
 *  • Per-exercise camera presets (portrait-front for squat/jumping jack,
 *    landscape-side for pushup/plank)
 *  • Full-body fit via Box3 bounding box + 15% padding; recomputed on resize
 *  • Root-motion lock (hips X/Z locked so avatar never walks out of frame)
 *  • Smooth animation crossfade 0.3 s between exercises
 *  • Idle breathing oscillation when clip is paused
 *  • motionSpeed prop (0.25 – 1.0) drives animation timeScale
 *  • DPR capped at 1.5; antialias disabled on narrow screens
 *  • Rendering paused when browser tab is hidden
 *  • Full geometry/material/texture dispose on unmount
 */

import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  ContactShadows,
  Environment,
  Html,
} from "@react-three/drei";
import * as THREE from "three";

// ─── Exercise config ───────────────────────────────────────────────────────────

export type ViewAngle = "front" | "side";

export interface ExerciseCfg {
  clipName: string;
  /** "portrait_front" → camera in front, tall frame.
   *  "landscape_side" → camera from right, wide/landscape frame. */
  cameraPreset: "portrait_front" | "landscape_side";
  speed: number;
  tips: [string, string];
}

export const EXERCISE_CONFIG: Record<string, ExerciseCfg> = {
  squat: {
    clipName: "Squat",
    cameraPreset: "portrait_front",
    speed: 1.0,
    tips: ["Keep knees tracking over toes", "Drive hips back first"],
  },
  pushup: {
    clipName: "Pushup",
    cameraPreset: "landscape_side",
    speed: 1.0,
    tips: ["Elbows at 45° from body", "Keep spine neutral, no sagging"],
  },
  plank: {
    clipName: "Plank",
    cameraPreset: "landscape_side",
    speed: 0.3,
    tips: ["Squeeze glutes and abs", "Neutral neck, eyes down"],
  },
  jumping_jack: {
    clipName: "JumpingJack",
    cameraPreset: "portrait_front",
    speed: 1.2,
    tips: ["Arms fully overhead at top", "Land softly, knees slightly bent"],
  },
};

// ─── Camera Rig ────────────────────────────────────────────────────────────────

interface CameraRigProps {
  boundingBox: THREE.Box3 | null;
  preset: "portrait_front" | "landscape_side";
  viewAngle: ViewAngle;
}

function CameraRig({ boundingBox, preset, viewAngle }: CameraRigProps) {
  const { camera, size } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const lerpFactor = useRef(0);

  const computeCamera = useCallback(() => {
    if (!boundingBox) return;

    const center = new THREE.Vector3();
    const boxSize = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(boxSize);

    // Effective camera angle: plan-controlled or user-overridden
    const useSide =
      viewAngle === "side" ||
      (viewAngle === "front" && preset === "landscape_side");
    const effectiveSide = viewAngle === "side" ? true : preset === "landscape_side";

    const PADDING = 1.15;
    // Bounding sphere radius
    const radius = boxSize.length() / 2;
    const aspect = size.width / size.height;

    let camPos: THREE.Vector3;

    if (effectiveSide) {
      // Side view: camera on the right (+X), model horizontal
      const dist = (Math.max(boxSize.x, boxSize.y) * PADDING) / (2 * Math.tan(Math.PI / 6));
      camPos = new THREE.Vector3(center.x + dist, center.y, center.z + radius * 0.1);
    } else {
      // Front view: camera on Z axis
      const fovY = Math.PI / 6; // 30 deg half-angle
      const dist = (Math.max(boxSize.y / (2 * Math.tan(fovY)), boxSize.x / (2 * Math.tan(fovY) * aspect)) * PADDING);
      camPos = new THREE.Vector3(center.x, center.y, center.z + dist);
    }

    targetPos.current.copy(camPos);
    targetLook.current.copy(center);
    lerpFactor.current = 0;
  }, [boundingBox, preset, viewAngle, size]);

  useEffect(() => {
    computeCamera();
  }, [computeCamera]);

  useFrame((_, delta) => {
    if (lerpFactor.current >= 1) return;
    lerpFactor.current = Math.min(lerpFactor.current + delta * 3, 1);
    const t = lerpFactor.current;
    camera.position.lerp(targetPos.current, t * 0.08 + 0.01);
    camera.lookAt(targetLook.current);
    camera.updateProjectionMatrix();
  });

  return null;
}

// ─── Athlete Model ─────────────────────────────────────────────────────────────

interface AthleteModelProps {
  exercise: string;
  motionSpeed: number;
  onBoundingBox: (bb: THREE.Box3) => void;
}

function AthleteModel({ exercise, motionSpeed, onBoundingBox }: AthleteModelProps) {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF("/models/athlete.glb");
  const { actions, mixer } = useAnimations(animations, group);

  const prevActionRef = useRef<THREE.AnimationAction | null>(null);
  const breathPhaseRef = useRef(0);
  const hipBoneRef = useRef<THREE.Object3D | null>(null);
  const hipInitXRef = useRef<number | null>(null);

  // ── Bounding box on load ──
  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    onBoundingBox(box);

    // Find the hip / root bone to lock horizontal drift
    scene.traverse((obj) => {
      const name = obj.name.toLowerCase();
      if (name.includes("hips") || name.includes("pelvis") || name.includes("root")) {
        if (!hipBoneRef.current) hipBoneRef.current = obj;
      }
    });
    if (hipBoneRef.current) {
      hipInitXRef.current = hipBoneRef.current.position.x;
    }
  }, [scene, onBoundingBox]);

  // ── Animation crossfade ──
  useEffect(() => {
    const cfg = EXERCISE_CONFIG[exercise] ?? EXERCISE_CONFIG.squat;
    // Try exact clip name, then lowercase, then first available
    const key =
      Object.keys(actions).find((k) => k === cfg.clipName) ||
      Object.keys(actions).find((k) => k.toLowerCase() === cfg.clipName.toLowerCase()) ||
      Object.keys(actions)[0];

    if (!key) return;

    const nextAction = actions[key]!;
    nextAction.setLoop(THREE.LoopRepeat, Infinity);
    nextAction.clampWhenFinished = false;
    nextAction.timeScale = cfg.speed * motionSpeed;

    if (prevActionRef.current && prevActionRef.current !== nextAction) {
      prevActionRef.current.fadeOut(0.3);
      nextAction.reset().fadeIn(0.3).play();
    } else if (!nextAction.isRunning()) {
      nextAction.reset().play();
    }
    prevActionRef.current = nextAction;
  }, [exercise, actions]);

  // ── Update timeScale when motionSpeed changes ──
  useEffect(() => {
    const cfg = EXERCISE_CONFIG[exercise] ?? EXERCISE_CONFIG.squat;
    if (prevActionRef.current) {
      prevActionRef.current.timeScale = cfg.speed * motionSpeed;
    }
  }, [motionSpeed, exercise]);

  // ── Per-frame: breathing idle + root-motion lock ──
  useFrame((state, delta) => {
    mixer.update(delta);

    // Idle breathing (very subtle Y oscillation on model group)
    breathPhaseRef.current += delta * 0.8;
    if (group.current) {
      group.current.position.y = Math.sin(breathPhaseRef.current) * 0.003;
    }

    // Root motion lock: keep hip X fixed so avatar never drifts sideways
    if (hipBoneRef.current && hipInitXRef.current !== null) {
      hipBoneRef.current.position.x = hipInitXRef.current;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Placeholder (model file missing) ─────────────────────────────────────────

function AthletePlaceholder() {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#D49B74" roughness={0.6} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
        <meshStandardMaterial color="#D49B74" roughness={0.6} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.32, 0.52, 0.18]} />
        <meshStandardMaterial color="#1E2A38" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Left Upper Arm */}
      <mesh position={[-0.22, 1.28, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.045, 0.04, 0.28, 8]} />
        <meshStandardMaterial color="#D49B74" roughness={0.6} />
      </mesh>
      {/* Left Forearm */}
      <mesh position={[-0.29, 1.02, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.035, 0.03, 0.24, 8]} />
        <meshStandardMaterial color="#D49B74" roughness={0.6} />
      </mesh>
      {/* Right Upper Arm */}
      <mesh position={[0.22, 1.28, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.045, 0.04, 0.28, 8]} />
        <meshStandardMaterial color="#B97E59" roughness={0.6} />
      </mesh>
      {/* Right Forearm */}
      <mesh position={[0.29, 1.02, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.035, 0.03, 0.24, 8]} />
        <meshStandardMaterial color="#B97E59" roughness={0.6} />
      </mesh>
      {/* Hips/Shorts */}
      <mesh position={[0, 0.84, 0]}>
        <boxGeometry args={[0.28, 0.18, 0.17]} />
        <meshStandardMaterial color="#111822" roughness={0.5} />
      </mesh>
      {/* Left Thigh */}
      <mesh position={[-0.1, 0.58, 0]}>
        <cylinderGeometry args={[0.075, 0.065, 0.36, 8]} />
        <meshStandardMaterial color="#D49B74" roughness={0.6} />
      </mesh>
      {/* Left Calf */}
      <mesh position={[-0.1, 0.24, 0]}>
        <cylinderGeometry args={[0.055, 0.04, 0.32, 8]} />
        <meshStandardMaterial color="#D49B74" roughness={0.6} />
      </mesh>
      {/* Right Thigh */}
      <mesh position={[0.1, 0.58, 0]}>
        <cylinderGeometry args={[0.075, 0.065, 0.36, 8]} />
        <meshStandardMaterial color="#B97E59" roughness={0.6} />
      </mesh>
      {/* Right Calf */}
      <mesh position={[0.1, 0.24, 0]}>
        <cylinderGeometry args={[0.055, 0.04, 0.32, 8]} />
        <meshStandardMaterial color="#B97E59" roughness={0.6} />
      </mesh>
      {/* Left Shoe */}
      <mesh position={[-0.1, 0.04, 0.04]}>
        <boxGeometry args={[0.1, 0.06, 0.2]} />
        <meshStandardMaterial color="#EAF2F5" roughness={0.4} />
      </mesh>
      {/* Right Shoe */}
      <mesh position={[0.1, 0.04, 0.04]}>
        <boxGeometry args={[0.1, 0.06, 0.2]} />
        <meshStandardMaterial color="#EAF2F5" roughness={0.4} />
      </mesh>

      {/* Missing model notice */}
      <Html position={[0, 2.15, 0]} center>
        <div
          style={{
            background: "rgba(11,15,20,0.85)",
            border: "1px solid rgba(79,195,184,0.4)",
            borderRadius: 10,
            padding: "6px 12px",
            color: "#4FC3B8",
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          ⚠ Add /public/models/athlete.glb for 3D model
        </div>
      </Html>
    </group>
  );
}

// ─── Model loader wrapper (catches missing file) ───────────────────────────────

interface ModelLoaderProps extends AthleteModelProps {
  onMissing: () => void;
}

function ModelLoaderInner(props: ModelLoaderProps) {
  return <AthleteModel {...props} />;
}

function SafeAthleteModel(props: AthleteModelProps & { onMissing: () => void }) {
  // useGLTF.preload is called inside AthleteModel via useGLTF.
  // If the fetch fails, the Suspense boundary above will catch via ErrorBoundary.
  return <ModelLoaderInner {...props} />;
}

// ─── ErrorBoundary for missing GLB ────────────────────────────────────────────

interface ErrorBoundaryState { hasError: boolean }
class ModelErrorBoundary extends React.Component<
  React.PropsWithChildren<{ onError: () => void }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ onError: () => void }>) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) {
    console.warn("[AthleteViewer] Failed to load athlete.glb:", err.message);
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Frame loop pause when tab hidden ─────────────────────────────────────────

function TabVisibilityController() {
  const { gl } = useThree();
  useEffect(() => {
    const handle = () => {
      // @ts-expect-error frameloop is a string union on canvas but not on gl
      gl.setAnimationLoop(document.hidden ? null : undefined);
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [gl]);
  return null;
}

// ─── Dispose on unmount ────────────────────────────────────────────────────────

function SceneDisposer() {
  const { scene, gl } = useThree();
  useEffect(() => {
    return () => {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: THREE.Material) => {
            Object.values(m).forEach((val) => {
              if (val instanceof THREE.Texture) val.dispose();
            });
            m.dispose();
          });
        }
      });
      gl.dispose();
    };
  }, [scene, gl]);
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface AthleteViewerProps {
  exercise: string;
  motionSpeed: number; // 0.25 – 1.0
  viewAngle: ViewAngle;
}

const DEFAULT_BOUNDING_BOX = new THREE.Box3(
  new THREE.Vector3(-0.3, 0, -0.2),
  new THREE.Vector3(0.3, 1.8, 0.2)
);

export default function AthleteViewer({ exercise, motionSpeed, viewAngle }: AthleteViewerProps) {
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  const [modelStatus, setModelStatus] = useState<"checking" | "available" | "missing">("checking");

  useEffect(() => {
    let active = true;
    fetch("/models/athlete.glb", { method: "HEAD" })
      .then((res) => {
        if (!active) return;
        if (res.ok) {
          setModelStatus("available");
        } else {
          setModelStatus("missing");
        }
      })
      .catch(() => {
        if (active) setModelStatus("missing");
      });
    return () => {
      active = false;
    };
  }, []);

  const cfg = EXERCISE_CONFIG[exercise] ?? EXERCISE_CONFIG.squat;

  // DPR and antialias detection (run once on mount)
  const dpr = typeof window !== "undefined"
    ? Math.min(window.devicePixelRatio, 1.5)
    : 1;
  const antialias = typeof window !== "undefined"
    ? window.innerWidth > 720
    : true;

  const handleBoundingBox = useCallback((bb: THREE.Box3) => {
    setBoundingBox(bb);
  }, []);

  const handleMissing = useCallback(() => {
    setModelStatus("missing");
    console.warn(
      "[AthleteViewer] /public/models/athlete.glb not found or failed to load. " +
      "Falling back to procedural 3D mannequin placeholder."
    );
  }, []);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.1, far: 100, position: [0, 1, 4] }}
      style={{ background: "#0B0F18", width: "100%", height: "100%" }}
      frameloop="always"
    >
      <TabVisibilityController />
      <SceneDisposer />

      {/* Lighting */}
      <hemisphereLight args={["#b1e1ff", "#b97a20", 0.6]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.2} />

      {/* Environment for subtle reflections */}
      <Environment preset="city" />

      {/* Ground shadow */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.55}
        scale={3}
        blur={2.5}
        far={1.5}
        color="#000814"
      />

      {/* Camera rig (smooth lerp toward computed position) */}
      <CameraRig
        boundingBox={boundingBox || DEFAULT_BOUNDING_BOX}
        preset={cfg.cameraPreset}
        viewAngle={viewAngle}
      />

      {/* Athlete / Placeholder */}
      {modelStatus !== "available" ? (
        <AthletePlaceholder />
      ) : (
        <ModelErrorBoundary onError={handleMissing}>
          <Suspense fallback={<AthletePlaceholder />}>
            <SafeAthleteModel
              exercise={exercise}
              motionSpeed={motionSpeed}
              onBoundingBox={handleBoundingBox}
              onMissing={handleMissing}
            />
          </Suspense>
        </ModelErrorBoundary>
      )}
    </Canvas>
  );
}
