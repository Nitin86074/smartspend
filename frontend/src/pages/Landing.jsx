import { Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  PerspectiveCamera,
  Sphere,
} from "@react-three/drei";
import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react";
import Button from "../components/ui/Button";

const features = [
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    desc: "Interactive visual signals that make sense of spending habits, savings patterns, and month-over-month movement.",
  },
  {
    icon: Shield,
    title: "Security",
    desc: "Protected account flows, verified access, and clear controls for keeping personal finance data private.",
  },
  {
    icon: Zap,
    title: "Insights",
    desc: "Fast, contextual suggestions that help turn everyday transactions into better money decisions.",
  },
];

const SpinningCube = ({ position, color, scale = 1 }) => {
  const meshRef = useRef(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    meshRef.current.rotation.x += delta * 0.45;
    meshRef.current.rotation.y += delta * 0.6;
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={1.2}
      floatIntensity={1}
      position={position}
    >
      <mesh ref={meshRef} scale={scale}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.2} />
      </mesh>
    </Float>
  );
};

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas dpr={[1, 1.6]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.55} />
        <spotLight position={[10, 10, 10]} angle={0.18} penumbra={1} intensity={1.2} />
        <pointLight position={[-8, -6, -6]} intensity={1.2} color="#8b5cf6" />

        <Suspense fallback={null}>
          <Float speed={1.4} rotationIntensity={1} floatIntensity={2}>
            <Sphere args={[1, 100, 200]} scale={2.35}>
              <MeshDistortMaterial
                color="#4f46e5"
                speed={3}
                distort={0.42}
                radius={1}
              />
            </Sphere>
          </Float>

          <Float
            speed={2}
            rotationIntensity={0.5}
            floatIntensity={0.6}
            position={[4, 2, -2]}
          >
            <Sphere args={[0.5, 64, 64]}>
              <meshStandardMaterial
                color="#ec4899"
                emissive="#ec4899"
                emissiveIntensity={0.55}
              />
            </Sphere>
          </Float>

          <Float
            speed={1.8}
            rotationIntensity={0.8}
            floatIntensity={0.8}
            position={[-3.6, 2.4, -1.4]}
          >
            <Sphere args={[0.34, 48, 48]}>
              <meshStandardMaterial
                color="#14b8a6"
                emissive="#14b8a6"
                emissiveIntensity={0.35}
              />
            </Sphere>
          </Float>

          <SpinningCube position={[-5, -2, -1]} color="#8b5cf6" scale={0.9} />
          <SpinningCube position={[3.3, -2.4, -1.5]} color="#f59e0b" scale={0.55} />
        </Suspense>
      </Canvas>
    </div>
  );
}

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1117] text-white selection:bg-indigo-500/30">
      <AnimatedBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(13,17,23,0.18)_0%,rgba(13,17,23,0.64)_70%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300 backdrop-blur-md">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            AI-Powered Finance Control
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-5xl font-extrabold tracking-normal text-transparent sm:text-6xl md:text-8xl"
        >
          SmartSpend
          <br />
          <span className="text-indigo-500">Redefined.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl"
        >
          Master your money with 3D visualization, real-time insights, and
          effortless expense tracking designed for the modern era.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <Link to="/register">
            <Button
              size="lg"
              className="rounded-2xl border-none bg-indigo-600 px-8 py-6 text-lg shadow-[0_0_24px_rgba(79,70,229,0.42)] hover:bg-indigo-500"
            >
              Start for Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-lg text-white backdrop-blur-xl hover:bg-white/10"
            >
              Live Demo
            </Button>
          </Link>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 pb-32 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.16 }}
              whileHover={{ y: -10 }}
              className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl transition-all hover:border-indigo-500/50 hover:bg-white/[0.07]"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-bold">{feature.title}</h3>
              <p className="leading-relaxed text-gray-400">{feature.desc}</p>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
};

export default Landing;
