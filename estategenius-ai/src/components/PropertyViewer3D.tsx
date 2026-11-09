import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Property, ThreeDAction } from '../types';
import {
  Eye,
  Sun,
  Moon,
  Sunset,
  Layers,
  RotateCw,
  ZoomIn,
  Compass,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Box,
} from 'lucide-react';

interface PropertyViewer3DProps {
  property: Property;
  targetAction?: ThreeDAction | null;
  initialStagingMode?: 'furnished' | 'empty';
  initialRoom?: string;
  onClose?: () => void;
  compact?: boolean;
}

export const PropertyViewer3D: React.FC<PropertyViewer3DProps> = ({
  property,
  targetAction,
  initialStagingMode = 'furnished',
  initialRoom = 'Overview',
  onClose,
  compact = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number>(0);

  // Camera Target Interpolation State
  const camPosTarget = useRef<THREE.Vector3>(new THREE.Vector3(12, 11, 14));
  const camLookTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, 0));

  // Interactive UI State
  const [activeRoom, setActiveRoom] = useState<string>(initialRoom);
  const [lightingPreset, setLightingPreset] = useState<'day' | 'sunset' | 'night'>('sunset');
  const [cutawayHeight, setCutawayHeight] = useState<number>(0); // 0 = normal, 1 = exploded
  const [autoRotate, setAutoRotate] = useState<boolean>(!compact);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(compact);

  // AI Virtual Staging State
  const [stagingMode, setStagingMode] = useState<'furnished' | 'empty'>(
    targetAction?.staging_mode || initialStagingMode
  );
  const [stagingStyle, setStagingStyle] = useState<'modern_luxury' | 'scandinavian' | 'minimalist'>('modern_luxury');

  // Group references for procedural objects
  const ceilingGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const emptyGuideGroupRef = useRef<THREE.Group | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // Material references for live staging restyling
  const fabricMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const pillowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const metalMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const woodLegMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Room Camera Targets
  const roomCoordinates: Record<string, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
    Overview: { pos: new THREE.Vector3(12, 11, 14), look: new THREE.Vector3(0, 1.5, 0) },
    'Living Room': { pos: new THREE.Vector3(3.5, 4.2, 5.5), look: new THREE.Vector3(0.5, 1.2, 0) },
    'Master Suite': { pos: new THREE.Vector3(-4.5, 4.2, 4.5), look: new THREE.Vector3(-4.0, 1.2, 0) },
    'Chef Kitchen': { pos: new THREE.Vector3(4.5, 3.8, -3.5), look: new THREE.Vector3(3.5, 1.0, -3.0) },
    'Skyline Terrace': { pos: new THREE.Vector3(0, 3.5, 7.5), look: new THREE.Vector3(0, 1.2, 3.0) },
    'Floor Plan': { pos: new THREE.Vector3(0, 18, 0.1), look: new THREE.Vector3(0, 0, 0) },
  };

  const handleFocusRoom = useCallback((roomName: string) => {
    setActiveRoom(roomName);
    const target = roomCoordinates[roomName] || roomCoordinates['Overview'];
    camPosTarget.current.copy(target.pos);
    camLookTarget.current.copy(target.look);
    setAutoRotate(false);
  }, []);

  // Handle external AI Trigger
  useEffect(() => {
    if (targetAction && (targetAction.action === 'TRIGGER_3D_SCENE' || targetAction.action === 'TRIGGER_3D_ANIMATION')) {
      const room = targetAction.target_room || 'Overview';
      const lower = room.toLowerCase();

      let targetKey = 'Overview';
      if (lower.includes('bed') || lower.includes('master')) {
        targetKey = 'Master Suite';
      } else if (lower.includes('kitchen')) {
        targetKey = 'Chef Kitchen';
      } else if (lower.includes('terrace') || lower.includes('balcony')) {
        targetKey = 'Skyline Terrace';
      } else if (lower.includes('floor') || lower.includes('plan')) {
        targetKey = 'Floor Plan';
      } else if (lower.includes('living')) {
        targetKey = 'Living Room';
      } else {
        const found = Object.keys(roomCoordinates).find(
          (r) => r.toLowerCase().includes(lower) || lower.includes(r.toLowerCase())
        );
        if (found) targetKey = found;
      }

      handleFocusRoom(targetKey);

      if (targetAction.lighting_preset) {
        setLightingPreset(targetAction.lighting_preset);
      }
      if (targetAction.staging_mode) {
        setStagingMode(targetAction.staging_mode);
      }
    }
  }, [targetAction, handleFocusRoom]);

  // Lighting Preset Switcher
  useEffect(() => {
    if (!keyLightRef.current || !hemiLightRef.current || !sceneRef.current) return;

    if (lightingPreset === 'day') {
      keyLightRef.current.color.setHex(0xfff7ed);
      keyLightRef.current.intensity = 2.4;
      hemiLightRef.current.color.setHex(0xe0f2fe);
      hemiLightRef.current.groundColor.setHex(0x94a3b8);
      sceneRef.current.background = new THREE.Color(0xf1f5f9);
      if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0xf1f5f9);
    } else if (lightingPreset === 'sunset') {
      keyLightRef.current.color.setHex(0xfdba74);
      keyLightRef.current.intensity = 2.0;
      hemiLightRef.current.color.setHex(0xfbcfe8);
      hemiLightRef.current.groundColor.setHex(0x475569);
      sceneRef.current.background = new THREE.Color(0x1e293b);
      if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0x1e293b);
    } else if (lightingPreset === 'night') {
      keyLightRef.current.color.setHex(0x93c5fd);
      keyLightRef.current.intensity = 0.8;
      hemiLightRef.current.color.setHex(0x1e1b4b);
      hemiLightRef.current.groundColor.setHex(0x0f172a);
      sceneRef.current.background = new THREE.Color(0x090d16);
      if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0x090d16);
    }
  }, [lightingPreset]);

  // Dynamic Staging Style Colors
  useEffect(() => {
    if (!fabricMatRef.current || !pillowMatRef.current || !metalMatRef.current || !woodLegMatRef.current) return;

    if (stagingStyle === 'modern_luxury') {
      fabricMatRef.current.color.setHex(0x475569); // Charcoal slate
      pillowMatRef.current.color.setHex(0xf59e0b); // Amber gold
      metalMatRef.current.color.setHex(0xd97706); // Warm brass
      woodLegMatRef.current.color.setHex(0x1e293b); // Espresso
    } else if (stagingStyle === 'scandinavian') {
      fabricMatRef.current.color.setHex(0xd6d3d1); // Warm oatmeal
      pillowMatRef.current.color.setHex(0x84cc16); // Sage olive
      metalMatRef.current.color.setHex(0x78716c); // Brushed bronze
      woodLegMatRef.current.color.setHex(0xa8a29e); // Blonde oak
    } else if (stagingStyle === 'minimalist') {
      fabricMatRef.current.color.setHex(0x1e293b); // Deep obsidian
      pillowMatRef.current.color.setHex(0x64748b); // Cool steel
      metalMatRef.current.color.setHex(0x94a3b8); // Satin chrome
      woodLegMatRef.current.color.setHex(0x0f172a); // Matte black
    }
  }, [stagingStyle]);

  // Setup Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || (compact ? 420 : 550);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    scene.fog = new THREE.FogExp2(0x1e293b, 0.025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const startTarget = roomCoordinates[initialRoom] || roomCoordinates['Overview'];
    camera.position.copy(startTarget.pos);
    camera.lookAt(startTarget.look);
    currentLookAt.current.copy(startTarget.look);
    cameraRef.current = camera;

    // Studio Environment map via RoomEnvironment & PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting: Key, Fill & Accent
    const hemiLight = new THREE.HemisphereLight(0xfbcfe8, 0x475569, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfdba74, 2.0);
    dirLight.position.set(12, 16, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 40;
    const d = 12;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    keyLightRef.current = dirLight;

    // Procedural Texture Generator (Wood Parquet)
    const createProceduralWoodTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#c2a382';
      ctx.fillRect(0, 0, 512, 512);

      // Planks
      ctx.strokeStyle = '#a48360';
      ctx.lineWidth = 3;
      for (let i = 0; i < 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      for (let x = 0; x < 512; x += 128) {
        for (let y = 0; y < 512; y += 64) {
          ctx.beginPath();
          ctx.moveTo(x + (y % 128 === 0 ? 0 : 64), y);
          ctx.lineTo(x + (y % 128 === 0 ? 0 : 64), y + 64);
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };

    const woodTex = createProceduralWoodTexture();

    // ==========================================
    // PROCEDURAL 3D ARCHITECTURAL MODEL BUILDER
    // ==========================================
    const rootBuildingGroup = new THREE.Group();
    scene.add(rootBuildingGroup);

    // 1. Foundation Slab
    const slabGeo = new THREE.BoxGeometry(16, 0.4, 12);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.1,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -0.2;
    slabMesh.receiveShadow = true;
    rootBuildingGroup.add(slabMesh);

    // Soft Radial Contact Shadow below foundation
    const shadowGeo = new THREE.PlaneGeometry(18, 14);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.41;
    rootBuildingGroup.add(shadowPlane);

    // 2. Interior Floor with Wood Finish
    const floorGeo = new THREE.BoxGeometry(15.6, 0.05, 11.6);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.45,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = 0.02;
    floorMesh.receiveShadow = true;
    rootBuildingGroup.add(floorMesh);

    // 3. Perimeter & Partition Walls (White Minimalist Architecture)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9,
      metalness: 0.02,
    });

    const createWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      rootBuildingGroup.add(mesh);
      return mesh;
    };

    // Back wall
    createWall(15.6, 3.2, 0.25, 0, 0, -5.8);
    // Left exterior wall
    createWall(0.25, 3.2, 11.6, -7.8, 0, 0);
    // Interior dividing partition between Living Room & Master Suite
    createWall(0.2, 3.2, 7.5, -1.5, 0, -2.05);

    // Glass Balcony / Panoramic Window
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      thickness: 0.8,
    });
    const glassRailingGeo = new THREE.BoxGeometry(8, 1.2, 0.1);
    const glassRailing = new THREE.Mesh(glassRailingGeo, glassMat);
    glassRailing.position.set(2, 0.6, 5.8);
    rootBuildingGroup.add(glassRailing);

    // Balcony Frame Posts (Brushed Aluminum)
    const postMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    for (let x = -2; x <= 6; x += 4) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), postMat);
      post.position.set(x, 0.6, 5.8);
      rootBuildingGroup.add(post);
    }

    // ==========================================
    // AI VIRTUAL STAGING: FURNITURE GROUP
    // ==========================================
    const stagingFurnitureGroup = new THREE.Group();
    rootBuildingGroup.add(stagingFurnitureGroup);
    furnitureGroupRef.current = stagingFurnitureGroup;

    // Materials configured with refs for live style restyling
    const fabricMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85, metalness: 0.05 });
    fabricMatRef.current = fabricMat;

    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 });
    pillowMatRef.current = pillowMat;

    const woodLegMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.2 });
    woodLegMatRef.current = woodLegMat;

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.25 });
    metalMatRef.current = brassMat;

    // A. Living Room: Designer Sectional Sofa & Rug
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(1.5, 0, 1.5);

    // Area Rug
    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.015, 3.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 })
    );
    rug.position.set(0, 0.03, 0.8);
    rug.receiveShadow = true;
    sofaGroup.add(rug);

    // Sofa Base
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 1.4), fabricMat);
    sofaBase.position.y = 0.35;
    sofaBase.castShadow = true;
    sofaGroup.add(sofaBase);

    // Sofa Backrest
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.65, 0.35), fabricMat);
    sofaBack.position.set(0, 0.8, -0.52);
    sofaBack.castShadow = true;
    sofaGroup.add(sofaBack);

    // Chaise extension
    const chaise = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 1.8), fabricMat);
    chaise.position.set(1.2, 0.35, 1.2);
    chaise.castShadow = true;
    sofaGroup.add(chaise);

    // Accent Pillows
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.15), pillowMat);
    p1.position.set(-1.0, 0.7, -0.3);
    p1.rotation.y = 0.2;
    sofaGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.15), pillowMat);
    p2.position.set(1.1, 0.7, 0.5);
    p2.rotation.y = -0.3;
    sofaGroup.add(p2);

    // Coffee Table (Marble Top + Brass Wire Base)
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 })
    );
    tableTop.position.set(0, 0.45, 0.8);
    tableTop.castShadow = true;
    sofaGroup.add(tableTop);

    const brassLegs = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.42, 16, 1, true),
      brassMat
    );
    brassLegs.position.set(0, 0.21, 0.8);
    sofaGroup.add(brassLegs);

    stagingFurnitureGroup.add(sofaGroup);

    // B. Master Suite: Luxury Platform Bed & Nightstands
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-4.5, 0, -2.5);

    const bedRug = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.015, 3.6),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.95 })
    );
    bedRug.position.set(0, 0.03, 0.2);
    bedRug.receiveShadow = true;
    bedGroup.add(bedRug);

    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 3.0), woodLegMat);
    bedBase.position.y = 0.2;
    bedBase.castShadow = true;
    bedGroup.add(bedBase);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.4, 2.8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
    );
    mattress.position.y = 0.5;
    mattress.castShadow = true;
    bedGroup.add(mattress);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 0.2), fabricMat);
    headboard.position.set(0, 0.8, -1.45);
    headboard.castShadow = true;
    bedGroup.add(headboard);

    // Bedside tables with lamps
    const nightstandL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), woodLegMat);
    nightstandL.position.set(-1.7, 0.25, -1.2);
    bedGroup.add(nightstandL);

    const nightstandR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), woodLegMat);
    nightstandR.position.set(1.7, 0.25, -1.2);
    bedGroup.add(nightstandR);

    // Glowing warm lamps
    const lampBulbR = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xf59e0b, emissiveIntensity: 1.5 })
    );
    lampBulbR.position.set(1.7, 0.65, -1.2);
    bedGroup.add(lampBulbR);

    const lampBulbL = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xf59e0b, emissiveIntensity: 1.5 })
    );
    lampBulbL.position.set(-1.7, 0.65, -1.2);
    bedGroup.add(lampBulbL);

    stagingFurnitureGroup.add(bedGroup);

    // C. Chef Kitchen Island with Bar Stools
    const kitchenGroup = new THREE.Group();
    kitchenGroup.position.set(4.2, 0, -3.2);

    const islandBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.9, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.1 })
    );
    islandBase.position.y = 0.45;
    islandBase.castShadow = true;
    kitchenGroup.add(islandBase);

    const marbleCounter = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.08, 1.35),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.15, metalness: 0.05 })
    );
    marbleCounter.position.y = 0.94;
    marbleCounter.castShadow = true;
    kitchenGroup.add(marbleCounter);

    // 2 Barstools
    for (let x = -0.8; x <= 0.8; x += 1.6) {
      const stoolSeat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
      );
      stoolSeat.position.set(x, 0.65, 0.9);
      kitchenGroup.add(stoolSeat);

      const stoolLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      stoolLeg.position.set(x, 0.32, 0.9);
      kitchenGroup.add(stoolLeg);
    }

    stagingFurnitureGroup.add(kitchenGroup);

    // D. Decorative Accents: Fiddle Leaf Fig Plant
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-1.0, 0, 4.8);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.22, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    pot.position.y = 0.3;
    pot.castShadow = true;
    plantGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
    for (let l = 0; l < 6; l++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), leafMat);
      leaf.scale.set(0.3, 1.2, 0.7);
      leaf.rotation.set(0.4, (l * Math.PI) / 3, 0.2);
      leaf.position.set(0.1 * Math.sin(l), 0.7 + l * 0.15, 0.1 * Math.cos(l));
      plantGroup.add(leaf);
    }
    stagingFurnitureGroup.add(plantGroup);

    // ==========================================
    // EMPTY ARCHITECTURAL SHELL: SPATIAL GUIDES
    // ==========================================
    const emptyGuideGroup = new THREE.Group();
    rootBuildingGroup.add(emptyGuideGroup);
    emptyGuideGroupRef.current = emptyGuideGroup;

    // Helper to generate text label canvas sprite
    const createTextSprite = (title: string, sub: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(16, 32, 480, 192, 24) : ctx.rect(16, 32, 480, 192);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = 'bold 34px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 108);

      ctx.font = 'normal 22px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(sub, 256, 155);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(2.8, 1.4, 1);
      return sprite;
    };

    // Helper for floor dimension boundary lines
    const createFloorBoundary = (w: number, d: number, x: number, z: number) => {
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.02, d));
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5, linewidth: 2 })
      );
      line.position.set(x, 0.03, z);
      return line;
    };

    // 1. Living Room Spatial Tag & Boundary
    const livingSprite = createTextSprite('LIVING ROOM', "18' x 14' · 252 SQ FT RAW");
    livingSprite.position.set(2.5, 1.8, 2.0);
    emptyGuideGroup.add(livingSprite);
    emptyGuideGroup.add(createFloorBoundary(8.5, 6.5, 2.5, 2.0));

    // 2. Master Suite Spatial Tag & Boundary
    const masterSprite = createTextSprite('MASTER SUITE', "15' x 12' · 180 SQ FT RAW");
    masterSprite.position.set(-4.5, 1.8, -2.0);
    emptyGuideGroup.add(masterSprite);
    emptyGuideGroup.add(createFloorBoundary(6.0, 7.0, -4.5, -2.0));

    // 3. Chef Kitchen Spatial Tag & Boundary
    const kitchenSprite = createTextSprite('CHEF KITCHEN', "14' x 11' · 154 SQ FT RAW");
    kitchenSprite.position.set(4.0, 1.8, -3.5);
    emptyGuideGroup.add(kitchenSprite);
    emptyGuideGroup.add(createFloorBoundary(6.5, 4.0, 4.0, -3.5));

    // 4. Skyline Terrace Spatial Tag & Boundary
    const terraceSprite = createTextSprite('SKYLINE TERRACE', "16' x 8' · 128 SQ FT BALCONY");
    terraceSprite.position.set(2.0, 1.8, 5.2);
    emptyGuideGroup.add(terraceSprite);

    // Initial Staging Setup
    const initStaged = initialStagingMode === 'furnished';
    stagingFurnitureGroup.scale.setScalar(initStaged ? 1 : 0.001);
    stagingFurnitureGroup.position.y = initStaged ? 0 : -0.6;
    stagingFurnitureGroup.visible = initStaged;

    emptyGuideGroup.scale.setScalar(initStaged ? 0.001 : 1);
    emptyGuideGroup.visible = !initStaged;

    // E. Explodable Ceiling / Lighting Truss Group
    const ceilingGroup = new THREE.Group();
    const ceilingGeo = new THREE.BoxGeometry(15.6, 0.2, 11.6);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.75,
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.y = 3.3;
    ceilingGroup.add(ceilingMesh);

    // Recessed ceiling track lights
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const track = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.1), trackMat);
    track.position.set(0, 3.18, 0);
    ceilingGroup.add(track);

    rootBuildingGroup.add(ceilingGroup);
    ceilingGroupRef.current = ceilingGroup;

    // Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 60FPS Continuous Loop with Exponential Damping & Staging Lerp
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Auto-Rotate when idle on Overview
      if (autoRotate && activeRoom === 'Overview') {
        const radius = 18;
        const angle = time * 0.0003;
        camPosTarget.current.x = Math.sin(angle) * radius;
        camPosTarget.current.z = Math.cos(angle) * radius;
        camPosTarget.current.y = 11;
      }

      // Smooth Camera Exponential Damping
      camera.position.x += (camPosTarget.current.x - camera.position.x) * 0.06;
      camera.position.y += (camPosTarget.current.y - camera.position.y) * 0.06;
      camera.position.z += (camPosTarget.current.z - camera.position.z) * 0.06;

      currentLookAt.current.x += (camLookTarget.current.x - currentLookAt.current.x) * 0.08;
      currentLookAt.current.y += (camLookTarget.current.y - currentLookAt.current.y) * 0.08;
      currentLookAt.current.z += (camLookTarget.current.z - currentLookAt.current.z) * 0.08;
      camera.lookAt(currentLookAt.current);

      // Smooth Cutaway Ceiling Explosion
      if (ceilingGroupRef.current) {
        const targetY = 3.3 + cutawayHeight * 5.5;
        ceilingGroupRef.current.position.y += (targetY - 3.3 - ceilingGroupRef.current.position.y) * 0.1;
      }

      // Smooth Staging Transition (Furniture Deploy / Retract)
      if (furnitureGroupRef.current) {
        const targetScale = stagingMode === 'furnished' ? 1.0 : 0.001;
        const targetY = stagingMode === 'furnished' ? 0.0 : -0.8;

        furnitureGroupRef.current.scale.x += (targetScale - furnitureGroupRef.current.scale.x) * 0.12;
        furnitureGroupRef.current.scale.y += (targetScale - furnitureGroupRef.current.scale.y) * 0.12;
        furnitureGroupRef.current.scale.z += (targetScale - furnitureGroupRef.current.scale.z) * 0.12;

        furnitureGroupRef.current.position.y += (targetY - furnitureGroupRef.current.position.y) * 0.12;
        furnitureGroupRef.current.visible = furnitureGroupRef.current.scale.x > 0.02;
      }

      // Smooth Spatial Guides Transition
      if (emptyGuideGroupRef.current) {
        const targetGuideScale = stagingMode === 'empty' ? 1.0 : 0.001;
        emptyGuideGroupRef.current.scale.x += (targetGuideScale - emptyGuideGroupRef.current.scale.x) * 0.12;
        emptyGuideGroupRef.current.scale.y += (targetGuideScale - emptyGuideGroupRef.current.scale.y) * 0.12;
        emptyGuideGroupRef.current.scale.z += (targetGuideScale - emptyGuideGroupRef.current.scale.z) * 0.12;
        emptyGuideGroupRef.current.visible = emptyGuideGroupRef.current.scale.x > 0.02;
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      woodTex.dispose();
      slabGeo.dispose();
      slabMat.dispose();
      container.innerHTML = '';
    };
  }, [property, initialRoom, initialStagingMode, compact, stagingMode]);

  return (
    <div
      className={`relative w-full ${
        compact ? 'h-[400px] sm:h-[440px]' : 'h-[580px]'
      } bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Badge Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{property.title}</span>
              <span className="text-[10px] font-mono-tabular font-semibold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded">
                3D Spatial Model
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>
                Room: <strong className="text-amber-300 font-semibold">{activeRoom}</strong>
              </span>
              <span>·</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  stagingMode === 'furnished' ? 'text-blue-300' : 'text-amber-300'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {stagingMode === 'furnished' ? 'AI Staged (Furnished)' : 'Empty Shell (Unfurnished)'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 pointer-events-auto transition-colors cursor-pointer shadow-lg"
            aria-label="Close 3D View"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-20 transition-all duration-300 ease-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-2rem)]' : 'translate-y-0'
        }`}
      >
        {/* Dock Collapse / Expand Toggle Tab */}
        <div className="flex justify-center mb-1">
          <button
            type="button"
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold px-3 py-1 rounded-t-lg border-t border-x border-slate-700 shadow-md flex items-center gap-1 cursor-pointer"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Show Virtual Staging & Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Minimize Controls</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Body */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 p-3 shadow-2xl space-y-2.5">
          {/* Row 1: AI Virtual Staging Mode Switcher & Style Picker */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Virtual Staging:
              </span>

              {/* Segmented Empty vs Furnished Toggle */}
              <div className="flex items-center p-0.5 bg-slate-800/90 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setStagingMode('empty')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    stagingMode === 'empty'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🏠 Empty Shell</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStagingMode('furnished')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    stagingMode === 'furnished'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🛋️ Furnished (AI Staged)</span>
                </button>
              </div>
            </div>

            {/* Design Style Selector (Only shown when Furnished) */}
            {stagingMode === 'furnished' ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] font-semibold text-slate-400">Theme:</span>
                <select
                  value={stagingStyle}
                  onChange={(e) => setStagingStyle(e.target.value as any)}
                  className="text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="modern_luxury">Modern Luxury</option>
                  <option value="scandinavian">Scandinavian Organic</option>
                  <option value="minimalist">Minimalist Obsidian</option>
                </select>
              </div>
            ) : (
              <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                <span>📐 Showing Unfurnished Spatial Boundaries</span>
              </div>
            )}
          </div>

          {/* Row 2: Room Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Rooms:
            </span>
            {['Overview', 'Living Room', 'Master Suite', 'Chef Kitchen', 'Skyline Terrace', 'Floor Plan'].map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => handleFocusRoom(room)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeRoom === room
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {room}
              </button>
            ))}
          </div>

          {/* Row 3: Lighting, Cutaway & Auto-Rotate Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800 text-xs">
            {/* Lighting presets */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Light:</span>
              <button
                type="button"
                onClick={() => setLightingPreset('day')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  lightingPreset === 'day' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Natural Daylight"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightingPreset('sunset')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  lightingPreset === 'sunset' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Golden Sunset"
              >
                <Sunset className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightingPreset('night')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  lightingPreset === 'night' ? 'bg-blue-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Night Ambient"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ceiling Cutaway Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                Cutaway:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cutawayHeight}
                onChange={(e) => setCutawayHeight(parseFloat(e.target.value))}
                className="w-20 accent-emerald-500 cursor-pointer"
                title="Exploded ceiling cutaway height"
              />
            </div>

            {/* Auto Rotate Toggle */}
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                autoRotate ? 'bg-blue-900/80 text-blue-200 border border-blue-700' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-medium">{autoRotate ? 'Orbit On' : 'Orbit Off'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
