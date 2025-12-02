import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

const Star = ({ paper, position, onClick, isSelected, isCentral }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const { scale } = useSpring({
    scale: isSelected ? 2 : (hovered ? 1.5 : 1),
    config: { mass: 1, tension: 280, friction: 60 }
  });

  const getColor = () => {
    const fieldColors = {
      'Computer Science': '#4285F4',
      'Artificial Intelligence': '#EA4335',
      'Machine Learning': '#FBBC05',
      'Mathematics': '#34A853',
      'Physics': '#8B5CF6',
      'Biology': '#10B981',
      'Chemistry': '#F59E0B',
      'Medicine': '#EF4444',
      'Engineering': '#6366F1'
    };

    if (paper.fields && paper.fields.length > 0) {
      for (const field of paper.fields) {
        if (fieldColors[field]) {
          return fieldColors[field];
        }
      }
    }

    const clusterColors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0',
      '#118AB2', '#EF476F', '#073B4C', '#7209B7'
    ];

    const clusterIdx = Math.abs(paper.cluster || 0) % clusterColors.length;
    return clusterColors[clusterIdx];
  };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const color = getColor();
  const size = 0.3 + Math.log10((paper.citation_count || 0) + 1) * 0.2;

  return (
    <animated.mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick(paper);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.2}
        metalness={0.8}
        transparent
        opacity={0.9}
      />

      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[size * 1.5, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {isCentral && (
        <Text
          position={[0, size + 0.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000"
        >
          {paper.title.substring(0, 20)}...
        </Text>
      )}

      {hovered && !isSelected && (
        <Text
          position={[0, size + 0.3, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000"
        >
          {paper.title.substring(0, 15)}...
        </Text>
      )}
    </animated.mesh>
  );
};

const ConnectionLine = ({ start, end, strength = 1 }) => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...start),
    new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.5,
      (start[2] + end[2]) / 2
    ),
    new THREE.Vector3(...end)
  ]);

  const points = curve.getPoints(20);

  const color = new THREE.Color(0x60A5FA);
  color.lerp(new THREE.Color(0x8B5CF6), strength);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={Math.max(0.3, strength * 2)}
      transparent
      opacity={0.2 + strength * 0.3}
    />
  );
};

const Galaxy = ({ papers, connections, onPaperSelect, selectedPaperId }) => {
  const { camera } = useThree();
  const controlsRef = useRef();

  const positionedPapers = papers.map((paper, index) => {
    const total = papers.length;

    if (total === 1) {
      return {
        ...paper,
        position: [0, 0, 0]
      };
    }

    const phi = Math.acos(2 * index / total - 1);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;
    const radius = 8 + (paper.citation_count || 0) * 0.05;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta) * 0.5;
    const z = radius * Math.cos(phi);

    return {
      ...paper,
      position: [x, y, z]
    };
  });

  const centralPaperId = papers.length > 0
    ? papers.reduce((prev, current) =>
        (prev.citation_count || 0) > (current.citation_count || 0) ? prev : current
      ).id
    : null;

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  useEffect(() => {
    if (selectedPaperId) {
      const selectedPaper = positionedPapers.find(p => p.id === selectedPaperId);
      if (selectedPaper && camera) {
        camera.lookAt(...selectedPaper.position);
      }
    }
  }, [selectedPaperId, positionedPapers, camera]);

  return (
    <>
      <Stars
        radius={50}
        depth={30}
        count={2000}
        factor={3}
        saturation={0.5}
        fade
      />

      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#8B5CF6" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#60A5FA" />
      <pointLight position={[0, 0, 20]} intensity={0.3} color="#FF6BCB" />

      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.6}
        panSpeed={0.5}
        rotateSpeed={0.5}
        maxDistance={50}
        minDistance={5}
        autoRotate={papers.length > 0}
        autoRotateSpeed={0.5}
      />

      {positionedPapers.map((paper) => (
        <Star
          key={paper.id}
          paper={paper}
          position={paper.position}
          onClick={onPaperSelect}
          isSelected={paper.id === selectedPaperId}
          isCentral={paper.id === centralPaperId}
        />
      ))}

      {connections.map((connection, index) => {
        const sourcePaper = positionedPapers.find(p => p.id === connection.source);
        const targetPaper = positionedPapers.find(p => p.id === connection.target);

        if (sourcePaper && targetPaper) {
          return (
            <ConnectionLine
              key={index}
              start={sourcePaper.position}
              end={targetPaper.position}
              strength={connection.strength || 1}
            />
          );
        }
        return null;
      })}
    </>
  );
};

const GalaxyVisualizer = ({ papers, connections, onPaperSelect, selectedPaperId }) => {
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="w-full h-[500px] sm:h-[600px] lg:h-[800px] relative">
      <Canvas
        camera={{ position: [0, 15, 25], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 20, 60]} />

        <Galaxy
          papers={papers}
          connections={connections}
          onPaperSelect={onPaperSelect}
          selectedPaperId={selectedPaperId}
        />
      </Canvas>

      {/* Overlay Controls */}
      {showControls && papers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Controls</h4>
            <button
              onClick={() => setShowControls(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              Hide
            </button>
          </div>
          <div className="text-xs space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Click stars to select papers</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Drag to rotate galaxy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span>Scroll to zoom</span>
            </div>
          </div>
        </div>
      )}

      {!showControls && papers.length > 0 && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-xs hover:bg-black/70"
        >
          Show Controls
        </button>
      )}

      {/* Stats Overlay */}
      {papers.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium">Galaxy Stats</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Papers:</span>
                <span>{papers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connections:</span>
                <span>{connections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Years:</span>
                <span>
                  {Math.min(...papers.map(p => p.year || 0))} - {Math.max(...papers.map(p => p.year || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalaxyVisualizer;