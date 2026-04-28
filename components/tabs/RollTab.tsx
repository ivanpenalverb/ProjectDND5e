"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { rollDice } from '@/services/diceService';
import { Dices, Hexagon, Triangle, Square, Trash2 } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Physics, useSphere, usePlane, useBox } from '@react-three/cannon';
import { Html, Environment, ContactShadows } from '@react-three/drei';

const DICE_TYPES = [4, 6, 8, 10, 12, 20];
const QUANTITIES = [1, 2, 3, 4, 5, 10];

const DICE_COLORS = {
  4: '#8b0000', // Crimson Red
  6: '#0a0a0a', // Jet Black
  8: '#2a1a3a', // Deep Amethyst
  10: '#004a4a', // Emerald/Teal
  12: '#4a0404', // Blood Red
  20: '#b8860b', // Accent Gold
}

// Floor Physics
function Mat() {
  const [floorRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -1, 0],
    material: { friction: 1.0, restitution: 0.2 }
  }));

  // Invisible Walls to confine dice
  useBox(() => ({ position: [0, 5, -12], args: [40, 20, 1], type: 'Static' })); // Top/North
  useBox(() => ({ position: [0, 5, 12], args: [40, 20, 1], type: 'Static' })); // Bottom/South
  useBox(() => ({ position: [-12, 5, 0], args: [1, 20, 40], type: 'Static' })); // Left/West
  useBox(() => ({ position: [12, 5, 0], args: [1, 20, 40], type: 'Static' })); // Right/East

  return (
    <mesh ref={floorRef as any}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#0b0305" roughness={0.8} />
    </mesh>
  );
}

// Single Die Component
function PhysicalDie({ sides, result, delay, onRest, isHighlight, isDimmed }: any) {
  // Start high and randomized
  const startPos: [number, number, number] = [(Math.random() - 0.5) * 8, 15 + Math.random() * 5 + delay * 1.5, (Math.random() - 0.5) * 8];
  
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: startPos,
    args: [1.0], // Collision sphere
    angularDamping: 0.8, // Heavy damping prevents infinite rolling
    linearDamping: 0.2,
    material: { friction: 0.6, restitution: 0.5 } // Moderate bounce
  }));

  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    // Powerful downward force and aggressive spin
    api.velocity.set((Math.random() - 0.5) * 10, -25, (Math.random() - 0.5) * 10);
    api.angularVelocity.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50);
    
    let isCalled = false;
    // Timeout-based resting detection for highly predictable logic
    const timeout = setTimeout(() => {
      setIsResting(true);
      if (!isCalled) {
        onRest();
        isCalled = true;
      }
    }, 2800 + delay * 50); // increased time to allow rich physics collisions

    return () => clearTimeout(timeout);
  }, []);

  const color = DICE_COLORS[sides as keyof typeof DICE_COLORS] || '#1a1a24';
  const isD20Crit = sides === 20 && result === 20 && !isDimmed;

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      {sides === 4 && <tetrahedronGeometry args={[1.2]} />}
      {sides === 6 && <boxGeometry args={[1.2, 1.2, 1.2]} />}
      {sides === 8 && <octahedronGeometry args={[1.1]} />}
      {(sides === 10 || sides === 12) && <dodecahedronGeometry args={[1.0]} />}
      {sides === 20 && <icosahedronGeometry args={[1.2]} />}
      
      <meshStandardMaterial 
        color={color} 
        metalness={0.5} 
        roughness={0.2} 
        emissive={isHighlight ? '#b8860b' : isD20Crit ? '#b8860b' : '#000000'}
        emissiveIntensity={isHighlight ? 0.8 : isD20Crit ? 0.6 : 0}
        transparent={true}
        opacity={isDimmed ? 0.4 : 1}
      />
      
      <Html center zIndexRange={[100, 0]} distanceFactor={isResting ? 15 : 25} className="pointer-events-none select-none">
        <div className={`font-serif font-bold leading-none flex items-center justify-center transition-all duration-700 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]
          ${isResting ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} 
          ${isHighlight ? 'text-[5rem] text-accent-gold drop-shadow-[0_0_40px_rgba(184,134,11,1)] -mt-4' : isDimmed ? 'text-4xl text-zinc-600 opacity-50' : isD20Crit ? 'text-5xl text-accent-gold drop-shadow-[0_0_25px_rgba(184,134,11,1)]' : 'text-5xl text-zinc-50'}`
        }>
          {result}
        </div>
      </Html>
    </mesh>
  );
}

// Scene handling the group
function Scene({ diceGroup, onGroupFinish }: any) {
  const restingCount = useRef(0);

  useEffect(() => {
    restingCount.current = 0;
  }, [diceGroup]);

  const handleRest = useCallback(() => {
    if (!diceGroup) return;
    restingCount.current += 1;
    if (restingCount.current === diceGroup.dice.length) {
       onGroupFinish(diceGroup);
    }
  }, [diceGroup, onGroupFinish]);

  if (!diceGroup) return null;

  return (
    <>
      <Physics gravity={[0, -40, 0]} allowSleep={false}>
        <Mat />
        {diceGroup.dice.map((die: any, i: number) => (
          <PhysicalDie 
            key={die.id} 
            sides={die.sides} 
            result={die.value} 
            delay={i * 0.15}
            onRest={handleRest} 
            isHighlight={die.isHighlight}
            isDimmed={die.isDimmed}
          />
        ))}
      </Physics>
    </>
  );
}

export const RollTab = () => {
  const { addRoll, rollMode } = useCharacterStore();
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [diceGroup, setDiceGroup] = useState<any>(null);
  const [finishedResult, setFinishedResult] = useState<any>(null);

  const handleFireRoll = (sides: number) => {
    const isAdvDisadv = (rollMode !== 'normal') && sides === 20;
    const computeQuantity = isAdvDisadv ? 2 : quantity;
    
    const op = modifier >= 0 ? '+' : '';
    const modifierStr = modifier !== 0 ? `${op}${modifier}` : '';
    const notation = `${computeQuantity}d${sides}${modifierStr}`;
    
    let sourceText = `Table Roll`;
    if (isAdvDisadv) sourceText = rollMode === 'advantage' ? 'D20 (Advantage)' : 'D20 (Disadvantage)';
    
    const serviceResult = rollDice(notation, sourceText);
    const rawRolls = [...serviceResult.rolls];
    
    let highestIdx = -1;
    let lowestIdx = -1;
    
    if (isAdvDisadv) {
      const max = Math.max(...rawRolls);
      const min = Math.min(...rawRolls);
      highestIdx = rawRolls.indexOf(max);
      lowestIdx = rawRolls.indexOf(min);
      
      if (rollMode === 'advantage') {
        serviceResult.total = max + modifier;
        serviceResult.isCritical = max === 20;
        serviceResult.isFumble = max === 1;
      } else {
        serviceResult.total = min + modifier;
        serviceResult.isCritical = min === 20;
        serviceResult.isFumble = min === 1;
      }
    }
    
    const group = {
       id: Math.random().toString(),
       notation,
       modifier,
       serviceResult,
       dice: rawRolls.map((r, idx) => {
         let isHighlight = false;
         let isDimmed = false;
         if (isAdvDisadv) {
            if (rollMode === 'advantage') {
              isHighlight = idx === highestIdx;
              isDimmed = idx !== highestIdx;
            } else {
              isHighlight = idx === lowestIdx;
              isDimmed = idx !== lowestIdx;
            }
         }
         return { 
           id: `${idx}-${Math.random()}`, 
           value: r, 
           sides,
           isHighlight,
           isDimmed
         };
       })
    };

    setDiceGroup(null);
    setFinishedResult(null); // Clear previous result UI
    setTimeout(() => {
       setDiceGroup(group);
    }, 50);
  };

  const handleGroupFinish = useCallback((group: any) => {
     addRoll(group.serviceResult);
     setFinishedResult(group);
  }, [addRoll]);

  const renderIcon = (sides: number) => {
    switch (sides) {
      case 4: return <Triangle size={24} className="text-zinc-400 drop-shadow-md" />;
      case 6: return <Square size={22} className="text-zinc-400 drop-shadow-md" />;
      case 8: return <Hexagon size={24} className="rotate-90 text-zinc-400 drop-shadow-md" />;
      case 10: return <Hexagon size={24} className="text-zinc-400 drop-shadow-md" />;
      case 12: return <Hexagon size={26} className="text-zinc-400 drop-shadow-md" />;
      case 20: return <Hexagon size={30} className="text-accent-gold drop-shadow-[0_0_8px_rgba(184,134,11,0.5)]" />;
      default: return <Square size={24} />;
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-zinc-800 bg-zinc-950">
       
       <div className="absolute inset-0 z-0 bg-[#0f0404]">
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none z-10" />
         <Canvas camera={{ position: [0, 8, 8], fov: 50 }}>
           <ambientLight intensity={0.6} />
           <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
           <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff3333" />
           <Environment preset="night" />
           
           <Scene diceGroup={diceGroup} onGroupFinish={handleGroupFinish} />
           
           <ContactShadows position={[0, -0.9, 0]} opacity={0.6} scale={50} blur={2} far={10} />
         </Canvas>
       </div>

       <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-4 items-center w-full max-w-4xl px-4 pointer-events-none">
         
         {/* Removed Role Mode Controls since they are global */}

         <div className="bg-zinc-900/90 backdrop-blur-md p-4 px-6 rounded-xl border border-zinc-700/50 shadow-2xl flex flex-col md:flex-row gap-6 items-center pointer-events-auto mt-2">
            
            <div className={`flex flex-col gap-1 items-center transition-all ${rollMode !== 'normal' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <span className="text-[10px] text-accent-gold uppercase tracking-widest font-bold">Quantity</span>
              <div className="flex gap-2">
                {QUANTITIES.map(q => (
                   <button 
                     key={q} 
                     onClick={() => setQuantity(q)}
                     className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all focus:outline-none 
                       ${quantity === q ? 'bg-accent-gold text-zinc-950 shadow-[0_0_10px_rgba(184,134,11,0.5)]' : 'bg-zinc-950/50 text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-500'}`}
                   >
                     {q}
                   </button>
                ))}
              </div>
            </div>

            <div className="w-px h-10 bg-zinc-800 hidden md:block" />

            <div className="flex flex-col gap-1 items-center">
              <span className="text-[10px] text-accent-gold uppercase tracking-widest font-bold">Global Mod</span>
              <input 
                type="number"
                value={modifier}
                onChange={(e) => setModifier(Number(e.target.value) || 0)}
                className="w-16 h-8 bg-zinc-950/50 border border-zinc-800 rounded px-2 text-zinc-100 text-center font-bold outline-none focus:border-accent-gold/50"
              />
            </div>

            <div className="w-px h-10 bg-zinc-800 hidden md:block" />

            <div className="flex gap-3 items-end">
              {DICE_TYPES.map(sides => (
                 <button 
                   key={sides}
                   onClick={() => handleFireRoll(sides)}
                   className="w-12 h-14 bg-zinc-950/80 border border-zinc-700/50 rounded-lg hover:bg-zinc-800 hover:border-accent-gold/80 transition-all group flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 focus:outline-none"
                   title={`Roll ${rollMode !== 'normal' && sides === 20 ? 2 : quantity}d${sides}`}
                 >
                    <div className="group-hover:scale-110 transition-transform duration-200">
                      {renderIcon(sides)}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 group-hover:text-accent-gold">d{sides}</span>
                 </button>
              ))}
            </div>
         </div>
       </div>
       
       <div className="absolute bottom-4 right-4 z-10 pointer-events-auto flex items-center justify-between pointer-events-none w-full px-6">
          <div className="pointer-events-auto">
            {diceGroup && !finishedResult && (
               <div className="bg-zinc-950/80 backdrop-blur border border-zinc-800 px-4 py-2 rounded-lg pointer-events-none text-zinc-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                 <div className="w-2 h-2 bg-accent-gold rounded-full animate-ping" />
                 Physics Engine Active
               </div>
            )}
           </div>
          
          <button 
            onClick={() => { setDiceGroup(null); setFinishedResult(null); }} 
            className="px-4 py-2 bg-zinc-900/80 text-zinc-500 backdrop-blur-md rounded border border-zinc-800 hover:bg-red-950/50 hover:text-red-400 hover:border-red-900/50 transition-all font-bold tracking-widest uppercase text-xs pointer-events-auto ml-auto cursor-pointer"
          >
            Clear Mat
          </button>
       </div>

       {/* Persistent Result Dashboard */}
       {finishedResult && (
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-in zoom-in-90 fade-in duration-500">
            <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-700/50 p-8 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center min-w-[340px] relative overflow-hidden pointer-events-auto">
               
               <div className={`absolute top-0 left-0 w-full h-1 ${
                 finishedResult.serviceResult.isCritical ? 'bg-accent-gold shadow-[0_0_20px_rgba(184,134,11,1)]'
                 : finishedResult.serviceResult.isFumble ? 'bg-red-600'
                 : 'bg-zinc-700'
               }`} />

               <span className="text-zinc-400 font-bold tracking-widest uppercase text-xs mb-1">
                 {finishedResult.serviceResult.source || 'Manual Roll'}
               </span>
               <div className="text-zinc-600 text-[10px] tracking-widest uppercase mb-4">
                 DICE RESULT
               </div>

               <div className={`text-8xl font-serif leading-none mb-6 drop-shadow-2xl ${
                 finishedResult.serviceResult.isCritical ? 'text-accent-gold drop-shadow-[0_0_30px_rgba(184,134,11,0.5)]'
                 : finishedResult.serviceResult.isFumble ? 'text-red-500'
                 : 'text-zinc-100'
               }`}>
                 {finishedResult.serviceResult.total}
               </div>

               <div className="bg-zinc-900/60 w-full px-4 py-3 rounded-xl border border-zinc-800/50 text-sm text-zinc-300 flex items-center justify-between gap-4 font-mono">
                 <div className="flex flex-col items-center">
                   <span className="text-[10px] text-zinc-600 uppercase">Rolls</span>
                   <span className="text-zinc-400 font-bold">[{finishedResult.serviceResult.rolls.join(', ')}]</span>
                 </div>
                 <div className="text-zinc-700">→</div>
                 <div className="flex flex-col items-center">
                   <span className="text-[10px] text-zinc-600 uppercase">Mod</span>
                   <span className="text-zinc-400 font-bold">{finishedResult.modifier >= 0 ? `+${finishedResult.modifier}` : finishedResult.modifier}</span>
                 </div>
                 <div className="text-zinc-700">→</div>
                 <div className="flex flex-col items-center">
                   <span className="text-[10px] text-accent-gold uppercase">Total</span>
                   <strong className="text-zinc-100 text-lg">{finishedResult.serviceResult.total}</strong>
                 </div>
               </div>
               
               {finishedResult.serviceResult.isCritical && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-gold/5 font-serif text-[15rem] pointer-events-none uppercase font-bold tracking-tighter">
                   Crit
                 </div>
               )}
            </div>
          </div>
       )}
    </div>
  );
};
