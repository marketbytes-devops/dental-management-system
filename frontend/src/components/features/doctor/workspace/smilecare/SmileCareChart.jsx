"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { 
  Clipboard, 
  Activity, 
  Settings, 
  ShieldAlert,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { getPatientChart, addToothFinding } from "@/services/api";

// Determine tooth classification type based on FDI tooth numbering
const getToothType = (num) => {
  const incisors = new Set([11, 12, 21, 22, 31, 32, 41, 42]);
  const canines = new Set([13, 23, 33, 43]);
  const premolars = new Set([14, 15, 24, 25, 34, 35, 44, 45]);
  const upperMolars = new Set([16, 17, 18, 26, 27, 28]);
  const lowerMolars = new Set([36, 37, 38, 46, 47, 48]);

  if (incisors.has(num)) return "incisor";
  if (canines.has(num)) return "canine";
  if (premolars.has(num)) return "premolar";
  if (upperMolars.has(num)) return "upper_molar";
  if (lowerMolars.has(num)) return "lower_molar";
  return "molar";
};

// Retrieve precise root specs (offsets, flaring angles, length, thickness) for each specific tooth
const getRootPositionsForTooth = (num) => {
  const type = getToothType(num);
  
  if (type === "incisor") {
    return [{ offset: [0, -0.9, 0], angle: [0, 0, 0.05], thickness: 0.22, length: 1.6 }];
  }
  if (type === "canine") {
    return [{ offset: [0, -1.0, 0], angle: [0, 0, 0.07], thickness: 0.27, length: 1.8 }];
  }
  if (type === "premolar") {
    if (num === 14 || num === 24) {
      return [
        { offset: [0, -0.9, 0.25], angle: [0.08, 0, 0], thickness: 0.18, length: 1.4 },
        { offset: [0, -0.9, -0.25], angle: [-0.08, 0, 0], thickness: 0.18, length: 1.4 }
      ];
    } else {
      return [{ offset: [0, -0.9, 0], angle: [0, 0, 0.05], thickness: 0.22, length: 1.5 }];
    }
  }
  if (type === "lower_molar") {
    return [
      { offset: [-0.32, -0.9, 0], angle: [0, 0, 0.08], thickness: 0.25, length: 1.5 },
      { offset: [0.32, -0.9, 0], angle: [0, 0, -0.08], thickness: 0.25, length: 1.5 }
    ];
  }
  if (type === "upper_molar") {
    return [
      { offset: [-0.3, -0.85, 0.22], angle: [0.06, 0, 0.06], thickness: 0.20, length: 1.4 },
      { offset: [0.3, -0.85, 0.22], angle: [0.06, 0, -0.06], thickness: 0.20, length: 1.4 },
      { offset: [0, -0.9, -0.32], angle: [-0.14, 0, 0], thickness: 0.25, length: 1.6 }
    ];
  }
  return [
    { offset: [-0.32, -0.9, 0], angle: [0, 0, 0.08], thickness: 0.24, length: 1.5 },
    { offset: [0.32, -0.9, 0], angle: [0, 0, -0.08], thickness: 0.24, length: 1.5 }
  ];
};

const getRootCount = (num) => {
  return getRootPositionsForTooth(num).length;
};

// Get color code representing condition
const getConditionColor = (cond) => {
  switch (cond) {
    case "caries": return 0xef4444;      // Red
    case "filled": return 0x3b82f6;      // Blue
    case "crown": return 0x6b7280;       // Gray
    case "fractured": return 0xf59e0b;   // Amber
    default: return 0xffffff;            // Polished white
  }
};

// WebGL 3D Parametric Tooth Viewer using pure Three.js
function ThreeDToothViewer({ 
  toothNumber, 
  surfaces, 
  rootOpacity = 1.0, 
  crossSectionOffset = 0.0, 
  onSurfaceClick 
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const toothGroupRef = useRef(null);
  
  // Track surface meshes for raycasting
  const surfaceMeshesRef = useRef([]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene, Camera, Renderer
    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 400;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Premium Slate-900 background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.localClippingEnabled = true; // Essential for endodontic cross-section slicing
    rendererRef.current = renderer;

    // Clear previous canvases
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // 2. Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // 3. Create Tooth Group
    const toothGroup = new THREE.Group();
    toothGroupRef.current = toothGroup;
    scene.add(toothGroup);

    // 4. Handle drag controls (Lightweight manual rotation)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !toothGroup) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      toothGroup.rotation.y += deltaX * 0.007;
      toothGroup.rotation.x += deltaY * 0.007;

      // Bound X rotation to prevent flipping upside down
      toothGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, toothGroup.rotation.x));
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e) => {
      if (!isDragging || !toothGroup || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;
      
      toothGroup.rotation.y += deltaX * 0.007;
      toothGroup.rotation.x += deltaY * 0.007;
      
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", handleMouseDown);
    domEl.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    domEl.addEventListener("touchstart", handleTouchStart);
    domEl.addEventListener("touchmove", handleTouchMove);
    domEl.addEventListener("touchend", handleMouseUp);

    // 5. Handle Click Raycasting for Surface Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e) => {
      // Don't register click if they were dragging
      if (isDragging) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(surfaceMeshesRef.current);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        if (onSurfaceClick && clickedMesh.userData.surfaceCode) {
          onSurfaceClick(clickedMesh.userData.surfaceCode);
        }
      }
    };

    domEl.addEventListener("click", handleCanvasClick);

    // 6. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener("mousedown", handleMouseDown);
      domEl.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      domEl.removeEventListener("click", handleCanvasClick);
      domEl.removeEventListener("touchstart", handleTouchStart);
      domEl.removeEventListener("touchmove", handleTouchMove);
      domEl.removeEventListener("touchend", handleMouseUp);
    };
  }, [toothNumber]);

  // Re-build 3D Tooth mesh structure when inputs or parameters change
  useEffect(() => {
    const toothGroup = toothGroupRef.current;
    if (!toothGroup) return;

    // Clear previous geometries
    while(toothGroup.children.length > 0) { 
      toothGroup.remove(toothGroup.children[0]); 
    }
    surfaceMeshesRef.current = [];

    // Define Slicing Plane for Endo (cuts along the Z axis based on slider offset)
    const clipOffset = (crossSectionOffset / 100.0) * 1.5;
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.8 + clipOffset);

    // 1. Retrieve tooth classification details
    const type = getToothType(toothNumber);
    const isMolar = type === "upper_molar" || type === "lower_molar";
    const isIncisor = type === "incisor";

    // 2. Assemble Crown Core Geometry (Cream-white sculpted cylinder block)
    const crownGeo = new THREE.CylinderGeometry(0.75, 0.62, 1.2, 32, 16);
    const posAttr = crownGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      const hf = (y + 0.6) / 1.2;

      // Squeeze cervical neck line
      if (y < -0.3) {
        const factor = 1.0 + (y + 0.3) * 0.25;
        x *= factor;
        z *= factor;
      }

      // Mold contours based on teeth groups
      if (type === "incisor") {
        z *= (1.0 - hf * 0.85);
        x *= (1.0 + hf * 0.15);
      } 
      else if (type === "canine") {
        z *= (1.0 - hf * 0.65);
        x *= (1.0 - hf * 0.45);
        const tipLobe = Math.exp(-(x**2 + z**2) / 0.12);
        if (y > 0.3) {
          y += tipLobe * 0.18;
        }
      } 
      else if (type === "premolar") {
        x *= 0.85;
        z *= 1.15;
        if (y > 0.2) {
          const g = (cx, cz, w) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / w);
          const cusps = 0.22 * (g(0, 0.35, 0.08) * 1.1 + g(0, -0.35, 0.08) * 0.85);
          y += cusps;
        }
      } 
      else {
        const bulge = 1.0 + Math.sin(hf * Math.PI) * 0.12;
        x *= bulge;
        z *= bulge;
        if (type === "lower_molar") {
          x *= 1.12;
          z *= 0.95;
        }
        if (y > 0.2) {
          const g = (cx, cz, w) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / w);
          const w = 0.12;
          const cusps = 0.28 * (g(0.35, 0.35, w) + g(-0.35, 0.35, w) + g(0.35, -0.35, w) + g(-0.35, -0.35, w));
          const centralPit = -0.12 * Math.exp(-(x**2 + z**2) / 0.14);
          y += (cusps + centralPit);
        }
      }
      posAttr.setXYZ(i, x, y, z);
    }
    crownGeo.computeVertexNormals();

    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.08, // highly polished shiny crown
      metalness: 0.02,
      clippingPlanes: [clipPlane],
      clipShadows: true
    });
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.set(0, 0.4, 0);
    toothGroup.add(crownMesh);

    // 3. Assemble 5 Clickable Surface Overlays deformed identically to wrap around the sculpted crown
    const overlaySpecs = [
      { code: "B", geo: new THREE.BoxGeometry(1.2, 1.0, 0.06, 6, 6, 2), pos: [0, 0.4, 0.71] },
      { code: "L", geo: new THREE.BoxGeometry(1.2, 1.0, 0.06, 6, 6, 2), pos: [0, 0.4, -0.71] },
      { code: "M", geo: new THREE.BoxGeometry(0.06, 1.0, 1.2, 2, 6, 6), pos: [-0.71, 0.4, 0] },
      { code: "D", geo: new THREE.BoxGeometry(0.06, 1.0, 1.2, 2, 6, 6), pos: [0.71, 0.4, 0] },
      { code: "O", geo: new THREE.BoxGeometry(1.2, 0.06, 1.2, 6, 2, 6), pos: [0, 1.01, 0] }
    ];

    overlaySpecs.forEach((spec) => {
      const cond = surfaces[spec.code]?.condition || "sound";
      const isSound = cond === "sound";
      const surfMat = new THREE.MeshStandardMaterial({
        color: getConditionColor(cond),
        roughness: 0.12,
        metalness: 0.02,
        transparent: isSound,
        opacity: isSound ? 0.0 : 1.0, // hide sounds overlays, show colored issue overlays!
        clippingPlanes: [clipPlane],
        clipShadows: true
      });

      const specGeo = spec.geo.clone();
      const posAttr = specGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let gx = posAttr.getX(i) + spec.pos[0];
        let gy = posAttr.getY(i) + spec.pos[1];
        let gz = posAttr.getZ(i) + spec.pos[2];

        // Apply identical deformation
        if (gy < -0.3) {
          const factor = 1.0 + (gy + 0.3) * 0.25;
          gx *= factor;
          gz *= factor;
        }

        if (type === "incisor") {
          gz *= (1.0 - (gy + 0.6) / 1.2 * 0.85);
          gx *= (1.0 + (gy + 0.6) / 1.2 * 0.15);
        } 
        else if (type === "canine") {
          gz *= (1.0 - (gy + 0.6) / 1.2 * 0.65);
          gx *= (1.0 - (gy + 0.6) / 1.2 * 0.45);
          const tipLobe = Math.exp(-(gx**2 + gz**2) / 0.12);
          if (gy > 0.3) {
            gy += tipLobe * 0.18;
          }
        } 
        else if (type === "premolar") {
          gx *= 0.85;
          gz *= 1.15;
          if (gy > 0.2) {
            const g = (cx, cz, w) => Math.exp(-((gx - cx) ** 2 + (gz - cz) ** 2) / w);
            const cusps = 0.22 * (g(0, 0.35, 0.08) * 1.1 + g(0, -0.35, 0.08) * 0.85);
            gy += cusps;
          }
        } 
        else {
          const bulge = 1.0 + Math.sin((gy + 0.6) / 1.2 * Math.PI) * 0.12;
          gx *= bulge;
          gz *= bulge;
          if (type === "lower_molar") {
            gx *= 1.12;
            gz *= 0.95;
          }
          if (gy > 0.2) {
            const g = (cx, cz, w) => Math.exp(-((gx - cx) ** 2 + (gz - cz) ** 2) / w);
            const w = 0.12;
            const cusps = 0.28 * (g(0.35, 0.35, w) + g(-0.35, 0.35, w) + g(0.35, -0.35, w) + g(-0.35, -0.35, w));
            const centralPit = -0.12 * Math.exp(-(gx**2 + gz**2) / 0.14);
            gy += (cusps + centralPit);
          }
        }
        posAttr.setXYZ(i, gx - spec.pos[0], gy - spec.pos[1], gz - spec.pos[2]);
      }
      specGeo.computeVertexNormals();

      const surfMesh = new THREE.Mesh(specGeo, surfMat);
      surfMesh.position.set(...spec.pos);
      surfMesh.userData = { surfaceCode: spec.code };
      
      toothGroup.add(surfMesh);
      surfaceMeshesRef.current.push(surfMesh);
    });

    // 4. Assemble Roots conforming to specific root patterns
    const rootSpecs = getRootPositionsForTooth(toothNumber);
    const rootMat = new THREE.MeshStandardMaterial({
      color: 0x8e5c2f, // Premium organic amber-brown roots!
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: rootOpacity,
      clippingPlanes: [clipPlane],
      clipShadows: true
    });

    rootSpecs.forEach((spec) => {
      // Cylinder root with multiple segments to allow realistic distal curving
      const rootGeo = new THREE.CylinderGeometry(spec.thickness, 0.04, spec.length, 16, 12);
      const rPos = rootGeo.attributes.position;
      for (let i = 0; i < rPos.count; i++) {
        let rx = rPos.getX(i);
        let ry = rPos.getY(i);
        let rz = rPos.getZ(i);

        const halfLen = spec.length / 2;
        const heightFactor = (halfLen - ry) / spec.length; // 0 at top, 1 at tip
        
        // Curve root tip distally (away from midline)
        const bendX = Math.sin(heightFactor * Math.PI) * 0.15 * (spec.offset[0] >= 0 ? 1 : -1);
        const bendZ = Math.sin(heightFactor * Math.PI) * 0.08;
        
        rx += bendX;
        rz += bendZ;
        rPos.setXYZ(i, rx, ry, rz);
      }
      rootGeo.computeVertexNormals();

      const rootMesh = new THREE.Mesh(rootGeo, rootMat);
      rootMesh.position.set(...spec.offset);
      rootMesh.rotation.set(...spec.angle);
      toothGroup.add(rootMesh);

      // 5. Render Internal Red Root Canal (curved identically to match the root)
      const canalGeo = new THREE.CylinderGeometry(0.045, 0.015, spec.length - 0.2, 8, 12);
      const cPos = canalGeo.attributes.position;
      for (let i = 0; i < cPos.count; i++) {
        let cx = cPos.getX(i);
        let cy = cPos.getY(i);
        let cz = cPos.getZ(i);

        const halfLen = (spec.length - 0.2) / 2;
        const heightFactor = (halfLen - cy) / (spec.length - 0.2);
        
        const bendX = Math.sin(heightFactor * Math.PI) * 0.15 * (spec.offset[0] >= 0 ? 1 : -1);
        const bendZ = Math.sin(heightFactor * Math.PI) * 0.08;
        
        cx += bendX;
        cz += bendZ;
        cPos.setXYZ(i, cx, cy, cz);
      }
      canalGeo.computeVertexNormals();

      const canalMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.3,
        emissive: 0x991b1b,
        emissiveIntensity: 0.6
      });
      const canalMesh = new THREE.Mesh(canalGeo, canalMat);
      canalMesh.position.set(spec.offset[0], spec.offset[1] + 0.05, spec.offset[2]);
      canalMesh.rotation.set(...spec.angle);
      toothGroup.add(canalMesh);
    });

  }, [toothNumber, surfaces, rootOpacity, crossSectionOffset]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-slate-800 shadow-inner"
    />
  );
}

export default function SmileCareChart({ patientToken, mode = "general" }) {
  const [selectedTooth, setSelectedTooth] = useState(36); // Lower left first molar
  const [rootOpacity, setRootOpacity] = useState(1.0);
  const [crossSectionOffset, setCrossSectionOffset] = useState(0.0);
  
  const [chartData, setChartData] = useState(null);

  // State representation for the selected tooth's surfaces
  const [surfaces, setSurfaces] = useState({
    M: { condition: "sound", material: "none" },
    D: { condition: "sound", material: "none" },
    B: { condition: "sound", material: "none" },
    L: { condition: "sound", material: "none" },
    O: { condition: "sound", material: "none" }
  });

  const [findingsHistory, setFindingsHistory] = useState([
    { id: 1, date: "2026-06-15", doctor: "Dr. Rachel Green", type: "perio_pocket", desc: "4mm Pocket Depth on Buccal surface of tooth 36." },
    { id: 2, date: "2026-05-10", doctor: "Dr. Rachel Green", type: "caries", desc: "Amalgam filling placed on Occlusal surface." }
  ]);

  useEffect(() => {
    if (patientToken) {
      loadChart();
    }
  }, [patientToken]);

  const loadChart = async () => {
    try {
      const data = await getPatientChart(patientToken);
      setChartData(data);
      // Pre-select tooth 36 or first available
      if (data && data.teeth && data.teeth.length > 0) {
        updateToothDisplay(data, 36);
      }
    } catch (err) {
      console.error("Failed to load chart", err);
    }
  };

  const updateToothDisplay = (data, num) => {
    const tooth = data.teeth.find(t => t.tooth_number === num);
    if (tooth) {
      const newSurfaces = {
        M: { condition: "sound", material: "none" },
        D: { condition: "sound", material: "none" },
        B: { condition: "sound", material: "none" },
        L: { condition: "sound", material: "none" },
        O: { condition: "sound", material: "none" }
      };
      
      tooth.surfaces.forEach(s => {
        newSurfaces[s.surface_code] = { condition: s.condition, material: s.material, id: s.id };
      });
      
      setSurfaces(newSurfaces);
      setFindingsHistory(tooth.findings.map(f => ({
        id: f.id,
        date: new Date(f.recorded_at).toLocaleDateString("en-IN"),
        doctor: f.recorded_by,
        type: f.finding_type,
        desc: f.payload?.condition ? `Condition updated to ${f.payload.condition}` : f.finding_type
      })));
    }
  };

  // Standard FDI tooth numbering mapping
  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const handleToothClick = (num) => {
    setSelectedTooth(num);
    if (chartData) {
      updateToothDisplay(chartData, num);
    }
  };

  const handleSurfaceAction = async (surfCode, condType) => {
    setSurfaces(prev => ({
      ...prev,
      [surfCode]: {
        ...prev[surfCode],
        condition: condType
      }
    }));
    
    // Attempt to save to DB
    const surfaceId = surfaces[surfCode]?.id;
    if (patientToken && surfaceId) {
      try {
        const payload = {
          finding_type: "surface_condition",
          specialty: mode,
          payload: { condition: condType, surface: surfCode },
          recorded_by: "Dr. Rachel Green", // Replace with real auth user later
          surface_id: surfaceId
        };
        await addToothFinding(patientToken, selectedTooth, payload);
        
        // Log new finding locally
        const newFind = {
          id: Date.now(),
          date: new Date().toLocaleDateString("en-IN"),
          doctor: "Dr. Rachel Green",
          type: condType,
          desc: `Marked surface ${surfCode} of tooth ${selectedTooth} as ${condType}.`
        };
        setFindingsHistory(prev => [newFind, ...prev]);
        
        // Re-fetch to keep state strictly synced if needed, 
        // but local update above handles visual feedback immediately.
      } catch (err) {
        console.error("Failed to save finding", err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm text-left animate-fadeIn">
      
      {/* 3D WebGL Canvas / Viewport Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">FDI 3D Anatomy Inspector</h4>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Click & drag to rotate in 3D. Click surfaces to edit.</p>
          </div>
          <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg">
            Active Mode: {mode.toUpperCase()}
          </span>
        </div>

        {/* WebGL viewport */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <ThreeDToothViewer 
            toothNumber={selectedTooth} 
            surfaces={surfaces} 
            rootOpacity={rootOpacity}
            crossSectionOffset={crossSectionOffset}
            onSurfaceClick={(surf) => handleSurfaceAction(surf, "caries")}
          />
        </div>

        {/* 2D Grid selectors as helpers */}
        <div className="p-5 border border-gray-150 rounded-2xl bg-gray-50/10 space-y-4">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-widest text-center">FDI Dental Arch Archtype Quick Selectors</span>
          </div>

          {/* Upper Arch */}
          <div className="space-y-1">
            <div className="flex justify-center gap-1 overflow-x-auto py-1">
              {upperTeeth.map((num) => {
                const isSelected = selectedTooth === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleToothClick(num)}
                    className={`w-8 h-9 rounded-lg border text-[10px] font-black transition-all flex items-center justify-center cursor-pointer outline-none shrink-0 ${
                      isSelected 
                        ? "bg-primary border-primary text-white scale-105" 
                        : "bg-white border-gray-200 text-gray-650 hover:border-primary/50"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-center gap-1 overflow-x-auto py-1">
              {lowerTeeth.map((num) => {
                const isSelected = selectedTooth === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleToothClick(num)}
                    className={`w-8 h-9 rounded-lg border text-[10px] font-black transition-all flex items-center justify-center cursor-pointer outline-none shrink-0 ${
                      isSelected 
                        ? "bg-primary border-primary text-white scale-105" 
                        : "bg-white border-gray-200 text-gray-655 hover:border-primary/50"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3D Representation Controls */}
        <div className="p-5 border border-gray-150 rounded-2xl space-y-4 bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">3D Real-Time Shader Controls</span>
            <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black uppercase">FDI Tooth {selectedTooth}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <label className="text-[10px] font-black text-gray-500 block uppercase">Translucent Root Opacity</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={rootOpacity * 100}
                  onChange={(e) => setRootOpacity(parseFloat(e.target.value) / 100)}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs font-mono font-bold text-gray-700 shrink-0 w-8 text-right">{Math.round(rootOpacity * 100)}%</span>
              </div>
            </div>

            <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <label className="text-[10px] font-black text-gray-500 block uppercase">Root Canal Slicing Depth</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="-100" 
                  max="100" 
                  value={crossSectionOffset}
                  onChange={(e) => setCrossSectionOffset(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs font-mono font-bold text-gray-700 shrink-0 w-8 text-right">{crossSectionOffset}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Action Columns */}
      <div className="space-y-6">
        {/* Selected Tooth Card */}
        <div className="bg-gray-50/50 border border-gray-150 p-5 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Anatomy Inspector</h4>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-black uppercase">Sound</span>
          </div>

          <div className="text-xs text-gray-600 space-y-2 pt-1">
            <div className="flex justify-between border-b border-gray-100 pb-1.5">
              <span className="font-semibold text-gray-400">Position:</span>
              <span className="font-bold text-gray-800">Tooth {selectedTooth}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-1.5">
              <span className="font-semibold text-gray-400">Classification:</span>
              <span className="font-bold text-gray-800">{getRootCount(selectedTooth) === 1 ? "Incisor/Canine" : getRootCount(selectedTooth) === 2 ? "Premolar/Lower Molar" : "Maxillary Upper Molar"}</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span className="font-semibold text-gray-400">Root Count:</span>
              <span className="font-bold text-gray-800">{getRootCount(selectedTooth)}</span>
            </div>
          </div>
        </div>

        {/* Interactive Surface Controller */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100">Surface Conditions</h4>
          
          <div className="space-y-2.5">
            {["B", "L", "M", "D", "O"].map((surf) => {
              const cond = surfaces[surf]?.condition || "sound";
              return (
                <div key={surf} className="flex items-center justify-between p-2 bg-gray-50/40 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded mr-2 uppercase">{surf}</span>
                    <span className="font-semibold text-gray-500">Surface</span>
                  </div>
                  
                  <select 
                    value={cond}
                    onChange={(e) => handleSurfaceAction(surf, e.target.value)}
                    className="bg-white border border-gray-250 text-[11px] font-bold text-gray-700 px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="sound">⚪ Sound</option>
                    <option value="caries">🔴 Caries</option>
                    <option value="filled">🔵 Filled</option>
                    <option value="crown">👑 Crown</option>
                    <option value="fractured">🟡 Fractured</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical findings log for this tooth */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl space-y-4 shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Findings History</h4>
            <span className="text-[9px] text-gray-400 font-semibold">{findingsHistory.length} entries</span>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {findingsHistory.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100 hover:bg-gray-100/50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">{item.date}</span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.25 rounded ${
                    item.type === "caries" ? "bg-red-100 text-red-700" : item.type === "filled" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                  }`}>
                    {item.type}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-gray-700 leading-normal">{item.desc}</p>
                <span className="text-[8px] text-gray-400 block text-right font-medium">— {item.doctor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
