/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, setDoc, updateDoc, onSnapshot, getDoc, deleteField } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

const WIRE_COLORS = [
  { name: 'Rojo', class: 'bg-red-600 shadow-[0_4px_0_#991b1b]' },
  { name: 'Azul', class: 'bg-blue-600 shadow-[0_4px_0_#1e40af]' },
  { name: 'Amarillo', class: 'bg-yellow-400 shadow-[0_4px_0_#a16207]' },
  { name: 'Verde', class: 'bg-green-600 shadow-[0_4px_0_#166534]' },
  { name: 'Blanco', class: 'bg-zinc-100 shadow-[0_4px_0_#a1a1aa]' },
];

const KEYPAD_HIERARCHY = ['⚓', '⚛', '⌘', '✦', '⬙', '◎', '★', '⬗', '⬘', '⬙', '⬚', '⬛'];

const SIMON_COLORS = [
  { name: 'Rojo', class: 'bg-red-600', activeClass: 'bg-red-400 shadow-[0_0_20px_#f87171]' },
  { name: 'Azul', class: 'bg-blue-600', activeClass: 'bg-blue-400 shadow-[0_0_20px_#60a5fa]' },
  { name: 'Verde', class: 'bg-green-600', activeClass: 'bg-green-400 shadow-[0_0_20px_#4ade80]' },
  { name: 'Amarillo', class: 'bg-yellow-500', activeClass: 'bg-yellow-300 shadow-[0_0_20px_#fde047]' },
];

const MORSE_WORDS = [
  { word: 'BOMB', freq: '3.505', code: '-... --- -- -...' },
  { word: 'FIRE', freq: '3.515', code: '..-. .. .-. .' },
  { word: 'WIRE', freq: '3.522', code: '.-- .. .-. .' },
  { word: 'CODE', freq: '3.532', code: '-.-. --- -.. .' },
  { word: 'TIME', freq: '3.535', code: '- .. -- .' },
  { word: 'FAST', freq: '3.542', code: '..-. .- ... -' },
  { word: 'BOOM', freq: '3.545', code: '-... --- --- --' },
  { word: 'HELP', freq: '3.552', code: '.... . .-.. .--.' },
  { word: 'SAFE', freq: '3.555', code: '... .- ..-. .' },
  { word: 'STOP', freq: '3.565', code: '... - --- .--.' },
];

export default function App() {
  const [gameMode, setGameMode] = useState<'menu' | 'single' | 'coop' | 'squad' | 'squad_online' | 'coop_online'>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [coopRole, setCoopRole] = useState<'technician' | 'expert' | 'expert_alpha' | 'expert_beta' | 'expert_gamma'>('technician');
  const [serialNumber, setSerialNumber] = useState('');
  const [wires, setWires] = useState<{ id: number; color: string; class: string; cut: boolean }[]>([]);
  const [keypad, setKeypad] = useState<{ symbol: string; pressed: boolean; priority: number }[]>([]);
  const [keypadOrder, setKeypadOrder] = useState<number>(0);
  const [simonSequence, setSimonSequence] = useState<number[]>([]);
  const [simonInput, setSimonInput] = useState<number[]>([]);
  const [simonActiveIdx, setSimonActiveIdx] = useState<number | null>(null);
  const [morseWord, setMorseWord] = useState(MORSE_WORDS[0]);
  const [morseLightOn, setMorseLightOn] = useState(false);
  const [currentMorseFreqIdx, setCurrentMorseFreqIdx] = useState(0);
  const [freqTarget, setFreqTarget] = useState(100.0);
  const [freqCurrent, setFreqCurrent] = useState(90.0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'exploded' | 'defused'>('playing');
  const [modulesSolved, setModulesSolved] = useState({ wires: false, keypad: false, simon: false, frequency: false, morse: false });
  const [moduleOrder, setModuleOrder] = useState<string[]>(['wires', 'keypad', 'simon', 'frequency', 'morse']);
  
  // Online State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState<Record<string, { uid: string, name: string }>>({});
  const [onlineEndTime, setOnlineEndTime] = useState<number | null>(null);
  const [myUid] = useState(() => {
    let uid = localStorage.getItem('bomb_uid');
    if (!uid) { uid = Math.random().toString(36).substring(2, 10); localStorage.setItem('bomb_uid', uid); }
    return uid;
  });
  const [myName, setMyName] = useState(() => {
    return localStorage.getItem('bomb_name') || '';
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setMyName(newName);
    localStorage.setItem('bomb_name', newName);
  };

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.gameState) setGameState(data.gameState);
        if (data.difficulty) setDifficulty(data.difficulty);
        if (data.serialNumber) setSerialNumber(data.serialNumber);
        if (data.wires) setWires(data.wires);
        if (data.keypad) setKeypad(data.keypad);
        if (data.keypadOrder !== undefined) setKeypadOrder(data.keypadOrder);
        if (data.simonSequence) setSimonSequence(data.simonSequence);
        if (data.simonInput) setSimonInput(data.simonInput);
        if (data.freqTarget) setFreqTarget(data.freqTarget);
        if (data.freqCurrent) setFreqCurrent(data.freqCurrent);
        if (data.morseWord) setMorseWord(data.morseWord);
        if (data.modulesSolved) setModulesSolved(data.modulesSolved);
        if (data.moduleOrder) setModuleOrder(data.moduleOrder);
        if (data.players) setPlayers(data.players);
        if (data.endTime) setOnlineEndTime(data.endTime);
      }
    }, (error) => {
      console.error("Error en onSnapshot:", error);
      alert("Error de conexión con Firebase: " + error.message);
    });
    return unsub;
  }, [roomId]);

  const createRoom = async () => {
    if (!myName.trim()) {
      alert("Por favor, introduce tu nombre primero.");
      return;
    }
    try {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      await setDoc(doc(db, 'rooms', code), {
        gameState: 'waiting',
        difficulty: difficulty,
        mode: gameMode, // Store the mode in the room
        players: {},
        createdAt: Date.now()
      });
      setRoomId(code);
      // gameMode is already set when clicking the menu button
      setGameState('waiting');
    } catch (error: any) {
      console.error("Error al crear sala:", error);
      alert("Error al crear la sala. Revisa las reglas de Firestore. Detalle: " + error.message);
    }
  };

  const joinRoom = async (code: string) => {
    if (!myName.trim()) {
      alert("Por favor, introduce tu nombre primero.");
      return;
    }
    try {
      const d = await getDoc(doc(db, 'rooms', code.toUpperCase()));
      if (d.exists()) {
        setRoomId(code.toUpperCase());
        const roomData = d.data();
        if (roomData.mode) {
          setGameMode(roomData.mode);
        } else {
          setGameMode('squad_online'); // Fallback for old rooms
        }
      } else {
        alert('Sala no encontrada');
      }
    } catch (error: any) {
      console.error("Error al unirse:", error);
      alert("Error al unirse a la sala. Detalle: " + error.message);
    }
  };

  const claimRole = async (role: string) => {
    if (!roomId || !myName.trim()) return;
    try {
      const updates: Record<string, any> = {
        [`players.${role}`]: { uid: myUid, name: myName }
      };

      // Find if the player already has a role and remove it
      Object.entries(players).forEach(([existingRole, playerData]) => {
        if (playerData.uid === myUid && existingRole !== role) {
          updates[`players.${existingRole}`] = deleteField();
        }
      });

      await updateDoc(doc(db, 'rooms', roomId), updates);
      setCoopRole(role as any);
    } catch (error: any) {
      console.error("Error al reclamar rol:", error);
      alert("Error al seleccionar rol: " + error.message);
    }
  };

  const initGame = async (mode: 'single' | 'coop' | 'squad' | 'squad_online' | 'coop_online', diff: 'easy' | 'medium' | 'hard' = 'easy') => {
    let time = 300;
    let wireCount = 3;
    let simonLen = 3;
    if (diff === 'medium') { time = 240; wireCount = 4; simonLen = 4; }
    if (diff === 'hard') { time = 180; wireCount = 5; simonLen = 5; }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Wires
    const randomWires = [];
    const pool = [...WIRE_COLORS];
    if (diff === 'easy') {
      randomWires.push({ id: 0, color: 'Rojo', class: WIRE_COLORS.find(c => c.name === 'Rojo')!.class, cut: false });
      randomWires.push({ id: 1, color: 'Azul', class: WIRE_COLORS.find(c => c.name === 'Azul')!.class, cut: false });
      for (let i = 2; i < wireCount; i++) {
        const colorObj = pool[Math.floor(Math.random() * pool.length)];
        randomWires.push({ id: i, color: colorObj.name, class: colorObj.class, cut: false });
      }
    } else if (diff === 'medium') {
      randomWires.push({ id: 0, color: 'Amarillo', class: WIRE_COLORS.find(c => c.name === 'Amarillo')!.class, cut: false });
      randomWires.push({ id: 1, color: 'Verde', class: WIRE_COLORS.find(c => c.name === 'Verde')!.class, cut: false });
      for (let i = 2; i < wireCount; i++) {
        const colorObj = pool[Math.floor(Math.random() * pool.length)];
        randomWires.push({ id: i, color: colorObj.name, class: colorObj.class, cut: false });
      }
    } else {
      randomWires.push({ id: 0, color: 'Blanco', class: WIRE_COLORS.find(c => c.name === 'Blanco')!.class, cut: false });
      randomWires.push({ id: 1, color: 'Amarillo', class: WIRE_COLORS.find(c => c.name === 'Amarillo')!.class, cut: false });
      for (let i = 2; i < wireCount; i++) {
        const colorObj = pool[Math.floor(Math.random() * pool.length)];
        randomWires.push({ id: i, color: colorObj.name, class: colorObj.class, cut: false });
      }
    }
    const finalWires = randomWires.sort(() => Math.random() - 0.5);

    // Ultra Logic Keypad (6 symbols)
    const shuffledHierarchy = [...KEYPAD_HIERARCHY].sort(() => Math.random() - 0.5);
    const selectedSymbols = shuffledHierarchy.slice(0, 6);
    const finalKeypad = selectedSymbols.map(s => ({
      symbol: s,
      pressed: false,
      priority: KEYPAD_HIERARCHY.indexOf(s)
    }));

    // Simon Says
    const seq = [];
    for (let i = 0; i < simonLen; i++) {
      seq.push(Math.floor(Math.random() * 4));
    }

    // Frequency Tuner Target Calculation
    const firstChar = result[0];
    const isLetter = /[A-Z]/.test(firstChar);
    const base = isLetter ? 10.5 : 15.0;
    const vowels = (result.match(/[AEIOU]/g) || []).length;
    const numCount = (result.match(/\d/g) || []).length;
    const mod = (vowels * 1.2) + (numCount > 3 ? -2.5 : 3.0);
    const targetFreq = parseFloat((80.0 + base + mod).toFixed(1));

    // Morse Code
    const randomMorse = MORSE_WORDS[Math.floor(Math.random() * MORSE_WORDS.length)];

    const finalOrder = ['wires', 'keypad', 'simon', 'frequency', 'morse'].sort(() => Math.random() - 0.5);

    if ((mode === 'squad_online' || mode === 'coop_online') && roomId) {
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          gameState: 'playing',
          difficulty: diff,
          serialNumber: result,
          wires: finalWires,
          keypad: finalKeypad,
          keypadOrder: 0,
          simonSequence: seq,
          simonInput: [],
          freqTarget: targetFreq,
          freqCurrent: 90.0,
          morseWord: randomMorse,
          modulesSolved: { wires: false, keypad: false, simon: false, frequency: false, morse: false },
          moduleOrder: finalOrder,
          endTime: Date.now() + time * 1000
        });
      } catch (error: any) {
        console.error("Error al iniciar partida online:", error);
        alert("Error al iniciar partida: " + error.message);
      }
    } else {
      setGameMode(mode);
      setDifficulty(diff);
      setGameState('playing');
      setCoopRole('technician');
      setModulesSolved({ wires: false, keypad: false, simon: false, frequency: false, morse: false });
      setKeypadOrder(0);
      setSimonInput([]);
      setFreqCurrent(90.0);
      setCurrentMorseFreqIdx(0);
      setTimeLeft(time);
      setSerialNumber(result);
      setWires(finalWires);
      setKeypad(finalKeypad);
      setSimonSequence(seq);
      setFreqTarget(targetFreq);
      setMorseWord(randomMorse);
      setModuleOrder(finalOrder);
    }
  };

  useEffect(() => {
    if (gameMode === 'menu' || gameState !== 'playing') return;

    const timer = setInterval(() => {
      if (roomId && onlineEndTime) {
        const remaining = Math.max(0, Math.floor((onlineEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          updateDoc(doc(db, 'rooms', roomId), { gameState: 'exploded' });
        }
      } else if (!roomId) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('exploded');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameMode, roomId, onlineEndTime]);

  // Simon sequence display logic
  useEffect(() => {
    if (gameState !== 'playing' || modulesSolved.simon || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;

    let currentIdx = 0;
    const interval = setInterval(() => {
      setSimonActiveIdx(simonSequence[currentIdx]);
      setTimeout(() => setSimonActiveIdx(null), 600);
      currentIdx = (currentIdx + 1) % simonSequence.length;
    }, 1200);

    return () => clearInterval(interval);
  }, [simonSequence, gameState, modulesSolved.simon, gameMode, coopRole]);

  // Morse flashing logic
  useEffect(() => {
    if (gameState !== 'playing' || modulesSolved.morse || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;

    const code = morseWord.code;
    const units: boolean[] = [];
    
    code.split(' ').forEach((letter, i) => {
      if (i > 0) units.push(...Array(3).fill(false)); 
      [...letter].forEach((char, j) => {
        if (j > 0) units.push(false); 
        if (char === '.') units.push(true);
        if (char === '-') units.push(...Array(3).fill(true));
      });
    });
    units.push(...Array(7).fill(false)); 

    let unitIdx = 0;
    const unitTime = 250; 

    const interval = setInterval(() => {
      setMorseLightOn(units[unitIdx]);
      unitIdx = (unitIdx + 1) % units.length;
    }, unitTime);

    return () => {
      clearInterval(interval);
      setMorseLightOn(false);
    };
  }, [morseWord, gameState, modulesSolved.morse, gameMode, coopRole]);

  useEffect(() => {
    if (modulesSolved.wires && modulesSolved.keypad && modulesSolved.simon && modulesSolved.frequency && modulesSolved.morse && gameState === 'playing') {
      if (roomId) {
        updateDoc(doc(db, 'rooms', roomId), { gameState: 'defused' });
      } else {
        setGameState('defused');
      }
    }
  }, [modulesSolved, gameState, roomId]);

  const handlePanicClick = () => {
    if (gameState !== 'playing' || modulesSolved.wires || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;

    const newWires = wires.map(w => ({ ...w, cut: true }));
    const isExploded = Math.random() < 0.4;

    if (roomId) {
      const newEndTime = onlineEndTime ? onlineEndTime - 120000 : Date.now();
      if (isExploded) {
        updateDoc(doc(db, 'rooms', roomId), { wires: newWires, endTime: newEndTime, gameState: 'exploded' });
      } else {
        updateDoc(doc(db, 'rooms', roomId), { wires: newWires, endTime: newEndTime, 'modulesSolved.wires': true });
      }
    } else {
      setWires(newWires);
      setTimeLeft(prev => Math.max(10, prev - 120));
      if (isExploded) {
        setGameState('exploded');
      } else {
        setModulesSolved(prev => ({ ...prev, wires: true }));
      }
    }
  };

  const handleWireClick = (id: number) => {
    if (gameState !== 'playing' || modulesSolved.wires || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;

    const wire = wires.find(w => w.id === id);
    if (!wire || wire.cut) return;

    let targetColor = '';
    if (difficulty === 'easy') {
      const lastChar = serialNumber.slice(-1);
      const isEven = !isNaN(parseInt(lastChar)) && parseInt(lastChar) % 2 === 0;
      targetColor = isEven ? 'Rojo' : 'Azul';
    } else if (difficulty === 'medium') {
      const hasLetter = /[A-Z]/.test(serialNumber);
      targetColor = hasLetter ? 'Amarillo' : 'Verde';
    } else {
      const numberCount = (serialNumber.match(/\d/g) || []).length;
      targetColor = numberCount > 3 ? 'Blanco' : 'Amarillo';
    }

    const newWires = wires.map(w => w.id === id ? { ...w, cut: true } : w);
    
    if (roomId) {
      if (wire.color === targetColor) {
        updateDoc(doc(db, 'rooms', roomId), { wires: newWires, 'modulesSolved.wires': true });
      } else {
        updateDoc(doc(db, 'rooms', roomId), { wires: newWires, gameState: 'exploded' });
      }
    } else {
      setWires(newWires);
      if (wire.color === targetColor) {
        setModulesSolved(prev => ({ ...prev, wires: true }));
      } else {
        setGameState('exploded');
      }
    }
  };

  const handleKeypadClick = (symbol: string) => {
    if (gameState !== 'playing' || modulesSolved.keypad || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;

    const button = keypad.find(b => b.symbol === symbol);
    if (!button || button.pressed) return;

    // --- ULTRA LOGIC CALCULATION ---
    // 1. Base Order: Even digit check
    const hasEvenDigit = /[02468]/.test(serialNumber);
    let sortedSymbols = [...keypad].sort((a, b) => hasEvenDigit ? a.priority - b.priority : b.priority - a.priority);

    // 2. Modifier: Vowel Shift (Shift right if S/N has vowel)
    const hasVowel = /[AEIOU]/.test(serialNumber);
    if (hasVowel) {
      const last = sortedSymbols.pop()!;
      sortedSymbols.unshift(last);
    }

    // 3. Modifier: Letter Paradox (Swap 1st and 6th if S/N has > 2 letters)
    const letterCount = (serialNumber.match(/[A-Z]/g) || []).length;
    if (letterCount > 2) {
      [sortedSymbols[0], sortedSymbols[5]] = [sortedSymbols[5], sortedSymbols[0]];
    }

    const nextCorrectSymbol = sortedSymbols[keypadOrder].symbol;

    if (roomId) {
      if (symbol === nextCorrectSymbol) {
        const newKeypad = keypad.map(b => b.symbol === symbol ? { ...b, pressed: true } : b);
        const nextOrder = keypadOrder + 1;
        const updates: any = { keypad: newKeypad, keypadOrder: nextOrder };
        if (nextOrder === keypad.length) updates['modulesSolved.keypad'] = true;
        updateDoc(doc(db, 'rooms', roomId), updates);
      } else {
        updateDoc(doc(db, 'rooms', roomId), { gameState: 'exploded' });
      }
    } else {
      if (symbol === nextCorrectSymbol) {
        const newKeypad = keypad.map(b => b.symbol === symbol ? { ...b, pressed: true } : b);
        setKeypad(newKeypad);
        const nextOrder = keypadOrder + 1;
        setKeypadOrder(nextOrder);
        if (nextOrder === keypad.length) {
          setModulesSolved(prev => ({ ...prev, keypad: true }));
        }
      } else {
        setGameState('exploded');
      }
    }
  };

  const handleSimonClick = (idx: number) => {
    if (gameState !== 'playing' || modulesSolved.simon || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;

    const hasVowel = /[AEIOU]/.test(serialNumber);
    const flashIdx = simonSequence[simonInput.length];
    
    // Translation logic
    let correctIdx = flashIdx;
    if (hasVowel) {
      // Red(0)->Blue(1), Blue(1)->Red(0), Green(2)->Yellow(3), Yellow(3)->Green(2)
      if (flashIdx === 0) correctIdx = 1;
      else if (flashIdx === 1) correctIdx = 0;
      else if (flashIdx === 2) correctIdx = 3;
      else if (flashIdx === 3) correctIdx = 2;
    } else {
      // Red(0)->Yellow(3), Blue(1)->Green(2), Green(2)->Blue(1), Yellow(3)->Red(0)
      if (flashIdx === 0) correctIdx = 3;
      else if (flashIdx === 1) correctIdx = 2;
      else if (flashIdx === 2) correctIdx = 1;
      else if (flashIdx === 3) correctIdx = 0;
    }

    if (roomId) {
      if (idx === correctIdx) {
        const newInput = [...simonInput, idx];
        const updates: any = { simonInput: newInput };
        if (newInput.length === simonSequence.length) updates['modulesSolved.simon'] = true;
        updateDoc(doc(db, 'rooms', roomId), updates);
      } else {
        updateDoc(doc(db, 'rooms', roomId), { gameState: 'exploded' });
      }
    } else {
      if (idx === correctIdx) {
        const newInput = [...simonInput, idx];
        if (newInput.length === simonSequence.length) {
          setModulesSolved(prev => ({ ...prev, simon: true }));
        } else {
          setSimonInput(newInput);
        }
      } else {
        setGameState('exploded');
      }
    }
  };

  const handleFreqChange = (amount: number) => {
    if (gameState !== 'playing' || modulesSolved.frequency || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;
    const next = Math.min(120, Math.max(70, parseFloat((freqCurrent + amount).toFixed(1))));
    if (roomId) {
      updateDoc(doc(db, 'rooms', roomId), { freqCurrent: next });
    } else {
      setFreqCurrent(next);
    }
  };

  const handleFreqSubmit = () => {
    if (gameState !== 'playing' || modulesSolved.frequency || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;
    const isCorrect = Math.abs(freqCurrent - freqTarget) < 0.05;
    if (roomId) {
      if (isCorrect) {
        updateDoc(doc(db, 'rooms', roomId), { 'modulesSolved.frequency': true });
      } else {
        updateDoc(doc(db, 'rooms', roomId), { gameState: 'exploded' });
      }
    } else {
      if (isCorrect) {
        setModulesSolved(prev => ({ ...prev, frequency: true }));
      } else {
        setGameState('exploded');
      }
    }
  };

  const handleMorseSubmit = () => {
    if (gameState !== 'playing' || modulesSolved.morse || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'expert')) return;

    const selectedFreq = MORSE_WORDS[currentMorseFreqIdx].freq;
    const isCorrect = selectedFreq === morseWord.freq;
    
    if (roomId) {
      if (isCorrect) {
        updateDoc(doc(db, 'rooms', roomId), { 'modulesSolved.morse': true });
      } else {
        updateDoc(doc(db, 'rooms', roomId), { gameState: 'exploded' });
      }
    } else {
      if (isCorrect) {
        setModulesSolved(prev => ({ ...prev, morse: true }));
      } else {
        setGameState('exploded');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameMode === 'menu') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center gap-8 p-8 bg-zinc-950 min-h-screen w-full overflow-y-auto"
      >
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-pixel text-4xl text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse"
          >
            BOMB DEFUSAL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-pixel text-[8px] text-zinc-500 tracking-widest uppercase"
          >
            Sistema de Entrenamiento de Desactivación
          </motion.p>
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="space-y-4">
            <p className="font-pixel text-[10px] text-zinc-400 text-center">SELECCIONAR DIFICULTAD:</p>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`font-pixel text-[8px] py-3 border-2 transition-all ${difficulty === d ? 'bg-red-600 border-red-600 text-white' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                >
                  {d === 'easy' ? 'NOVATO' : d === 'medium' ? 'ELITE' : 'SUICIDA'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => initGame('single', difficulty)}
              className="font-pixel bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 border-b-4 border-zinc-900 hover:border-zinc-800 transition-all active:translate-y-1 active:border-b-0"
            >
              SOLO
            </button>
            <button 
              onClick={() => initGame('coop', difficulty)}
              className="font-pixel bg-red-900/40 hover:bg-red-900/60 text-red-200 px-6 py-4 border-b-4 border-red-950 hover:border-red-900 transition-all active:translate-y-1 active:border-b-0"
            >
              COOPERATIVO LOCAL (2P)
            </button>
            <button 
              onClick={() => {
                setGameMode('coop_online');
                setGameState('waiting');
              }}
              className="font-pixel bg-orange-900/40 hover:bg-orange-900/60 text-orange-200 px-6 py-4 border-b-4 border-orange-950 hover:border-orange-900 transition-all active:translate-y-1 active:border-b-0"
            >
              COOPERATIVO ONLINE (2P)
            </button>
            <button 
              onClick={() => initGame('squad', difficulty)}
              className="font-pixel bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 px-6 py-4 border-b-4 border-blue-950 hover:border-blue-900 transition-all active:translate-y-1 active:border-b-0"
            >
              SQUAD LOCAL (4P)
            </button>
            <button 
              onClick={() => {
                setGameMode('squad_online');
                setGameState('waiting');
              }}
              className="font-pixel bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 px-6 py-4 border-b-4 border-purple-950 hover:border-purple-900 transition-all active:translate-y-1 active:border-b-0"
            >
              SQUAD ONLINE (4P)
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 border-2 border-dashed border-zinc-900 rounded opacity-30 max-w-xs"
        >
          <p className="font-mono text-[8px] text-zinc-500 text-center uppercase leading-relaxed">
            Aviso: Ahora la bomba cuenta con múltiples módulos de seguridad.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if ((gameMode === 'squad_online' || gameMode === 'coop_online') && gameState === 'waiting') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center gap-8 p-8 bg-zinc-950 min-h-screen w-full overflow-y-auto"
      >
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-pixel text-3xl text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          >
            SALA ONLINE
          </motion.h1>
        </div>

        {!roomId ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="space-y-2">
              <p className="font-pixel text-[10px] text-zinc-400 text-center">TU NOMBRE:</p>
              <input 
                type="text" 
                value={myName} 
                onChange={handleNameChange}
                placeholder="NOMBRE DE JUGADOR" 
                className="w-full font-pixel text-center bg-zinc-900 border-2 border-zinc-700 text-white p-4 outline-none focus:border-purple-500 uppercase"
                maxLength={12}
              />
            </div>
            <button 
              onClick={createRoom}
              className="w-full font-pixel bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 border-b-4 border-purple-900 transition-all active:translate-y-1 active:border-b-0"
            >
              CREAR SALA
            </button>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={joinCode} 
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO" 
                className="w-full font-pixel text-center bg-zinc-900 border-2 border-zinc-700 text-white p-4 outline-none focus:border-purple-500 uppercase"
                maxLength={4}
              />
              <button 
                onClick={() => joinRoom(joinCode)}
                className="font-pixel bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 border-b-4 border-zinc-900 transition-all active:translate-y-1 active:border-b-0"
              >
                UNIRSE
              </button>
            </div>
            <button 
              onClick={() => setGameMode('menu')}
              className="w-full font-pixel bg-zinc-800 text-zinc-400 px-6 py-3 border-b-4 border-zinc-900 transition-all active:translate-y-1 active:border-b-0 text-[10px]"
            >
              VOLVER
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="bg-zinc-900 p-6 rounded-lg border-4 border-zinc-800 text-center">
              <p className="font-pixel text-[10px] text-zinc-400 mb-2">CÓDIGO DE SALA:</p>
              <p className="font-pixel text-4xl text-white tracking-widest">{roomId}</p>
            </div>

            <div className="space-y-4">
              <p className="font-pixel text-[10px] text-zinc-400 text-center">SELECCIONA TU ROL:</p>
              <div className="grid grid-cols-2 gap-2">
                {(gameMode === 'coop_online' 
                  ? [
                      { id: 'technician', label: 'TÉCNICO' },
                      { id: 'expert', label: 'EXPERTO' }
                    ]
                  : [
                      { id: 'technician', label: 'TÉCNICO' },
                      { id: 'expert_alpha', label: 'EXP. ALPHA' },
                      { id: 'expert_beta', label: 'EXP. BETA' },
                      { id: 'expert_gamma', label: 'EXP. GAMMA' }
                    ]
                ).map(role => {
                  const playerInRole = players[role.id];
                  const isTaken = playerInRole && playerInRole.uid !== myUid;
                  const isMe = playerInRole && playerInRole.uid === myUid;
                  return (
                    <button
                      key={role.id}
                      onClick={() => claimRole(role.id)}
                      disabled={isTaken}
                      className={`font-pixel text-[8px] py-4 px-2 border-2 transition-all flex flex-col items-center justify-center gap-2
                        ${isMe ? 'bg-purple-600 border-purple-500 text-white' : 
                          isTaken ? 'bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed' : 
                          'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}
                    >
                      <span className="text-[10px]">{role.label}</span>
                      <span className={`text-[8px] ${isTaken ? 'text-zinc-500' : isMe ? 'text-purple-200' : 'text-zinc-500'}`}>
                        {playerInRole ? playerInRole.name : 'DISPONIBLE'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <motion.button 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => initGame(gameMode as any, difficulty)}
                className="w-full font-pixel bg-green-600 hover:bg-green-500 text-white px-6 py-4 border-b-4 border-green-900 transition-all active:translate-y-1 active:border-b-0"
              >
                INICIAR PARTIDA
              </motion.button>
              <button 
                onClick={() => { setRoomId(null); setGameMode('menu'); }}
                className="w-full font-pixel bg-zinc-800 text-zinc-400 px-6 py-3 border-b-4 border-zinc-900 transition-all active:translate-y-1 active:border-b-0 text-[10px]"
              >
                SALIR DE LA SALA
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start gap-6 pb-20 min-h-screen w-full overflow-x-hidden bg-zinc-950">
      
      {/* Sticky Header for Timer and Status */}
      <div className="sticky top-0 z-50 w-full bg-zinc-950/90 backdrop-blur-md border-b-4 border-zinc-900 p-4 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-col">
            <span className="font-pixel text-[8px] text-zinc-500 mb-1">DIF: {difficulty.toUpperCase()} | MODO: {gameMode.toUpperCase()}</span>
            <h1 className={`font-pixel text-xl md:text-2xl ${gameState === 'exploded' ? 'text-red-600' : gameState === 'defused' ? 'text-green-500' : 'text-red-500'}`}>
              {gameState === 'exploded' ? '¡BOOM!' : gameState === 'defused' ? '¡DESACTIVADA!' : 'ACTIVA'}
            </h1>
          </div>
          
          <div className={`bg-zinc-900 border-4 border-zinc-800 px-6 py-2 rounded flex justify-center items-center`}>
            <span className={`font-pixel text-3xl md:text-4xl ${gameState === 'exploded' ? 'text-zinc-700' : gameState === 'defused' ? 'text-green-500' : 'text-red-600 animate-pulse'}`}>
              {gameState === 'exploded' ? '00:00' : formatTime(timeLeft)}
            </span>
          </div>

          <div className="bg-zinc-200 border-2 border-zinc-900 px-3 py-1 shadow-md transform rotate-1">
            <p className="font-mono text-zinc-900 text-xs md:text-sm font-bold tracking-widest">S/N: {serialNumber}</p>
          </div>
        </div>
      </div>

      <div className="text-center w-full max-w-md px-4">
        {(gameMode === 'coop' || gameMode === 'coop_online') && gameState === 'playing' && (
          <div className="flex justify-center gap-2 mb-4">
            {gameMode === 'coop' ? (
              <>
                <button 
                  onClick={() => setCoopRole('technician')}
                  className={`font-pixel text-[8px] px-4 py-2 border-2 transition-all ${coopRole === 'technician' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
                >
                  TÉCNICO
                </button>
                <button 
                  onClick={() => setCoopRole('expert')}
                  className={`font-pixel text-[8px] px-4 py-2 border-2 transition-all ${coopRole === 'expert' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
                >
                  EXPERTO
                </button>
              </>
            ) : (
              <span className="font-pixel text-[8px] px-4 py-2 border-2 bg-orange-900/30 text-orange-300 border-orange-800">
                ROL ACTUAL: {coopRole.toUpperCase()}
              </span>
            )}
          </div>
        )}

        {gameMode === 'squad' && gameState === 'playing' && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button 
              onClick={() => setCoopRole('technician')}
              className={`font-pixel text-[8px] px-4 py-2 border-2 transition-all ${coopRole === 'technician' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
            >
              TÉCNICO
            </button>
            <button 
              onClick={() => setCoopRole('expert_alpha')}
              className={`font-pixel text-[8px] px-4 py-2 border-2 transition-all ${coopRole === 'expert_alpha' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
            >
              EXP. ALPHA
            </button>
            <button 
              onClick={() => setCoopRole('expert_beta')}
              className={`font-pixel text-[8px] px-4 py-2 border-2 transition-all ${coopRole === 'expert_beta' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
            >
              EXP. BETA
            </button>
            <button 
              onClick={() => setCoopRole('expert_gamma')}
              className={`font-pixel text-[8px] px-4 py-2 border-2 transition-all ${coopRole === 'expert_gamma' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
            >
              EXP. GAMMA
            </button>
          </div>
        )}

        {gameMode === 'squad_online' && gameState === 'playing' && (
          <div className="flex justify-center gap-2 mb-4">
            <span className="font-pixel text-[8px] px-4 py-2 border-2 bg-purple-900/30 text-purple-300 border-purple-800">
              ROL ACTUAL: {coopRole.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full max-w-6xl flex flex-wrap justify-center gap-6">
        
        {(gameMode === 'single' || ((gameMode === 'coop' || gameMode === 'coop_online' || gameMode === 'squad' || gameMode === 'squad_online') && coopRole === 'technician')) ? (
          <>
            {moduleOrder.map((moduleType, index) => {
              const modNum = (index + 1).toString().padStart(2, '0');
              
              if (moduleType === 'wires') {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key="wires" 
                    className={`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    ${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    ${modulesSolved.wires ? 'border-green-900' : ''}`}
                  >
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-{modNum}: CABLES</span>
                      <div className={`w-3 h-3 rounded-full ${modulesSolved.wires ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}`}></div>
                    </div>

                    <div className="bg-zinc-700 border-4 border-zinc-900 p-4 rounded-lg mb-6">
                      <div className="flex flex-col gap-4">
                        {wires.map((wire) => (
                          <div key={wire.id} onClick={() => handleWireClick(wire.id)} className={`relative group ${gameState === 'playing' && !wire.cut && !modulesSolved.wires ? 'cursor-pointer' : ''}`}>
                            <div className={`h-4 w-full rounded-full ${wire.class} transition-all duration-300 ${wire.cut ? 'opacity-0 scale-x-0' : 'opacity-100'}`}></div>
                            {wire.cut && (
                              <div className="absolute inset-0 flex justify-between items-center px-4">
                                <div className={`h-4 w-1/3 rounded-full ${wire.class} opacity-50 rotate-12`}></div>
                                <div className={`h-4 w-1/3 rounded-full ${wire.class} opacity-50 -rotate-12`}></div>
                              </div>
                            )}
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-zinc-900 rounded-sm"></div>
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-zinc-900 rounded-sm"></div>
                          </div>
                        ))}
                      </div>
                      {!modulesSolved.wires && gameState === 'playing' && (
                        <button 
                          onClick={handlePanicClick}
                          className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white font-pixel text-[8px] py-2 border-b-4 border-red-900 active:translate-y-1 active:border-b-0 transition-all"
                        >
                          BOTÓN DE PÁNICO (CORTE TOTAL)
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              }

              if (moduleType === 'keypad') {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key="keypad" 
                    className={`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    ${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    ${modulesSolved.keypad ? 'border-green-900' : ''}`}
                  >
                    
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-{modNum}: TECLADO ULTRA</span>
                      <div className={`w-3 h-3 rounded-full ${modulesSolved.keypad ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}`}></div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-zinc-700 border-4 border-zinc-900 p-3 rounded-lg">
                      {keypad.map((btn, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleKeypadClick(btn.symbol)}
                          className={`h-14 flex items-center justify-center text-xl border-4 border-zinc-900 rounded transition-all active:translate-y-1 active:border-b-0
                            ${btn.pressed ? 'bg-green-900/50 text-green-500 border-green-900' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 border-b-4 border-zinc-400'}`}
                        >
                          {btn.symbol}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              }

              if (moduleType === 'simon') {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key="simon" 
                    className={`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    ${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    ${modulesSolved.simon ? 'border-green-900' : ''}`}
                  >
                    
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-{modNum}: SIMON</span>
                      <div className={`w-3 h-3 rounded-full ${modulesSolved.simon ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}`}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-900 rounded-lg border-4 border-zinc-950">
                      {SIMON_COLORS.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSimonClick(idx)}
                          className={`h-20 rounded-lg transition-all duration-100 border-4 border-zinc-950
                            ${simonActiveIdx === idx ? color.activeClass : color.class}
                            ${gameState === 'playing' && !modulesSolved.simon ? 'cursor-pointer active:scale-95' : ''}`}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex justify-center gap-1">
                      {simonSequence.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < simonInput.length ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                      ))}
                    </div>
                  </motion.div>
                );
              }

              if (moduleType === 'frequency') {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key="frequency" 
                    className={`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    ${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    ${modulesSolved.frequency ? 'border-green-900' : ''}`}
                  >
                    
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-{modNum}: SINTONIZADOR</span>
                      <div className={`w-3 h-3 rounded-full ${modulesSolved.frequency ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}`}></div>
                    </div>

                    <div className="bg-zinc-950 border-4 border-zinc-900 p-4 mb-6 rounded flex flex-col items-center justify-center">
                      <span className="font-pixel text-[8px] text-zinc-500 mb-1">FRECUENCIA (MHz)</span>
                      <span className={`font-pixel text-3xl ${gameState === 'exploded' ? 'text-zinc-800' : 'text-blue-400'}`}>
                        {freqCurrent.toFixed(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleFreqChange(1.0)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[8px] py-2 border-b-4 border-zinc-900 rounded">+</button>
                        <button onClick={() => handleFreqChange(-1.0)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[8px] py-2 border-b-4 border-zinc-900 rounded">-</button>
                        <span className="text-center font-pixel text-[6px] text-zinc-500">GRUESO</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleFreqChange(0.1)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[8px] py-2 border-b-4 border-zinc-900 rounded">+</button>
                        <button onClick={() => handleFreqChange(-0.1)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[8px] py-2 border-b-4 border-zinc-900 rounded">-</button>
                        <span className="text-center font-pixel text-[6px] text-zinc-500">FINO</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleFreqSubmit}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-pixel text-[8px] py-3 border-b-4 border-blue-900 active:translate-y-1 active:border-b-0 transition-all rounded"
                    >
                      ESTABLECER CANAL
                    </button>
                  </motion.div>
                );
              }

              if (moduleType === 'morse') {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key="morse" 
                    className={`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    ${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    ${modulesSolved.morse ? 'border-green-900' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-{modNum}: CÓDIGO MORSE</span>
                      <div className={`w-3 h-3 rounded-full ${modulesSolved.morse ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}`}></div>
                    </div>

                    <div className="flex justify-center mb-6">
                      <div className={`w-12 h-12 rounded-full transition-colors duration-75 ${morseLightOn && gameState === 'playing' && !modulesSolved.morse ? 'bg-yellow-400 shadow-[0_0_30px_#facc15]' : 'bg-zinc-900'}`}></div>
                    </div>

                    <div className="bg-zinc-950 border-4 border-zinc-900 p-4 mb-6 rounded flex flex-col items-center justify-center">
                      <span className="font-pixel text-[8px] text-zinc-500 mb-1">TX FREQ (MHz)</span>
                      <span className={`font-pixel text-3xl ${gameState === 'exploded' ? 'text-zinc-800' : 'text-orange-400'}`}>
                        {MORSE_WORDS[currentMorseFreqIdx].freq}
                      </span>
                    </div>

                    <div className="flex gap-4 mb-4">
                      <button onClick={() => setCurrentMorseFreqIdx(prev => (prev - 1 + MORSE_WORDS.length) % MORSE_WORDS.length)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[12px] py-3 border-b-4 border-zinc-900 rounded">&lt;</button>
                      <button onClick={() => setCurrentMorseFreqIdx(prev => (prev + 1) % MORSE_WORDS.length)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[12px] py-3 border-b-4 border-zinc-900 rounded">&gt;</button>
                    </div>

                    <button 
                      onClick={handleMorseSubmit}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-pixel text-[8px] py-3 border-b-4 border-orange-900 active:translate-y-1 active:border-b-0 transition-all rounded"
                    >
                      TRANSMITIR
                    </button>
                  </motion.div>
                );
              }
              return null;
            })}
          </>
        ) : (
          /* Expert View (The Manual) */
          <div className="w-full max-w-4xl bg-zinc-100 border-8 border-zinc-300 rounded-lg p-6 shadow-[0_12px_0_#a1a1aa] text-zinc-900 min-h-[500px]">
            <h2 className="font-pixel text-[12px] border-b-2 border-zinc-300 pb-2 mb-6 text-center">MANUAL DE DESACTIVACIÓN AVANZADO</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {moduleOrder.map((moduleType, index) => {
                const modNum = (index + 1).toString().padStart(2, '0');
                
                if (moduleType === 'wires') {
                  const showModule = (gameMode !== 'squad' && gameMode !== 'squad_online') || coopRole === 'expert_alpha';
                  if (!showModule) return null;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key="wires" 
                      className="space-y-4 font-mono text-xs leading-relaxed"
                    >
                      <div className="p-4 bg-zinc-200 rounded-lg border-l-4 border-zinc-400 h-full shadow-sm">
                        <p className="font-bold mb-3 underline text-sm">MÓDULO {modNum}: CABLES</p>
                        {difficulty === 'easy' && (
                          <p>Si S/N termina en <span className="font-bold">PAR</span> &rarr; Rojo. Si no &rarr; Azul.</p>
                        )}
                        {difficulty === 'medium' && (
                          <p>Si S/N tiene <span className="font-bold">LETRAS</span> &rarr; Amarillo. Si no &rarr; Verde.</p>
                        )}
                        {difficulty === 'hard' && (
                          <p>Si S/N tiene <span className="font-bold">&gt;3 NÚMEROS</span> &rarr; Blanco. Si no &rarr; Amarillo.</p>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                if (moduleType === 'keypad') {
                  const showModule = (gameMode !== 'squad' && gameMode !== 'squad_online') || coopRole === 'expert_alpha';
                  if (!showModule) return null;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key="keypad" 
                      className="space-y-4 font-mono text-xs leading-relaxed"
                    >
                      <div className="p-4 bg-zinc-200 rounded-lg border-l-4 border-zinc-400 h-full shadow-sm">
                        <p className="font-bold mb-3 underline text-sm">MÓDULO {modNum}: TECLADO ULTRA</p>
                        <p className="mb-2">Jerarquía Maestra:</p>
                        <div className="flex flex-wrap gap-1 bg-zinc-300 p-2 rounded mb-3">
                          {KEYPAD_HIERARCHY.map((s, i) => (
                            <span key={i} className="text-xs bg-zinc-100 px-1 rounded border border-zinc-400">{s}</span>
                          ))}
                        </div>
                        <div className="space-y-2 bg-zinc-300 p-2 rounded">
                          <p className="font-bold border-b border-zinc-400 mb-1">REGLAS DE SECUENCIA:</p>
                          <p>1. <span className="font-bold">ORDEN BASE:</span> Si S/N tiene <span className="font-bold">DÍGITO PAR</span> &rarr; Ascendente. Else &rarr; Descendente.</p>
                          <p>2. <span className="font-bold">DESPLAZAMIENTO:</span> Si S/N tiene <span className="font-bold">VOCAL</span> &rarr; Rotar secuencia 1 pos. a la derecha.</p>
                          <p>3. <span className="font-bold">PARADOJA:</span> Si S/N tiene <span className="font-bold">&gt;2 LETRAS</span> &rarr; Intercambiar 1er y 6to símbolo.</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (moduleType === 'simon') {
                  const showModule = (gameMode !== 'squad' && gameMode !== 'squad_online') || coopRole === 'expert_beta';
                  if (!showModule) return null;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key="simon" 
                      className="space-y-4 font-mono text-xs leading-relaxed"
                    >
                      <div className="p-4 bg-zinc-200 rounded-lg border-l-4 border-zinc-400 h-full shadow-sm">
                        <p className="font-bold mb-3 underline text-sm">MÓDULO {modNum}: SIMON</p>
                        <p className="mb-2">Traduzca el color que parpadea:</p>
                        <div className="space-y-2">
                          <div className="bg-zinc-300 p-2 rounded">
                            <p className="font-bold border-b border-zinc-400 mb-1">Si S/N tiene VOCAL:</p>
                            <p>Rojo &rarr; Azul | Azul &rarr; Rojo</p>
                            <p>Verde &rarr; Amar | Amar &rarr; Verde</p>
                          </div>
                          <div className="bg-zinc-300 p-2 rounded">
                            <p className="font-bold border-b border-zinc-400 mb-1">Si NO tiene VOCAL:</p>
                            <p>Rojo &rarr; Amar | Azul &rarr; Verde</p>
                            <p>Verde &rarr; Azul | Amar &rarr; Rojo</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (moduleType === 'frequency') {
                  const showModule = (gameMode !== 'squad' && gameMode !== 'squad_online') || coopRole === 'expert_beta';
                  if (!showModule) return null;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key="frequency" 
                      className="space-y-4 font-mono text-xs leading-relaxed"
                    >
                      <div className="p-4 bg-zinc-200 rounded-lg border-l-4 border-zinc-400 h-full shadow-sm">
                        <p className="font-bold mb-3 underline text-sm">MÓDULO {modNum}: SINTONIZADOR</p>
                        <p className="mb-2 font-bold">Frecuencia (MHz) = 80.0 + [BASE] + [MOD]</p>
                        <div className="space-y-2">
                          <div className="bg-zinc-300 p-2 rounded">
                            <p className="font-bold border-b border-zinc-400 mb-1">[BASE]:</p>
                            <p>Si S/N empieza con LETRA &rarr; 10.5</p>
                            <p>Si S/N empieza con NÚMERO &rarr; 15.0</p>
                          </div>
                          <div className="bg-zinc-300 p-2 rounded">
                            <p className="font-bold border-b border-zinc-400 mb-1">[MOD]:</p>
                            <p>Por cada VOCAL en S/N: +1.2</p>
                            <p>Si S/N tiene &gt;3 NÚMEROS: -2.5</p>
                            <p>Si no: +3.0</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (moduleType === 'morse') {
                  const showModule = (gameMode !== 'squad' && gameMode !== 'squad_online') || coopRole === 'expert_gamma';
                  if (!showModule) return null;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key="morse" 
                      className="space-y-4 font-mono text-xs leading-relaxed"
                    >
                      <div className="p-4 bg-zinc-200 rounded-lg border-l-4 border-zinc-400 h-full shadow-sm">
                        <p className="font-bold mb-3 underline text-sm">MÓDULO {modNum}: CÓDIGO MORSE</p>
                        <p className="mb-2">Identifique la palabra y sintonice:</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-zinc-300 p-2 rounded">
                          {MORSE_WORDS.map((m, i) => (
                            <div key={i} className="flex justify-between border-b border-zinc-400/30">
                              <span className="font-bold">{m.word}</span>
                              <span>{m.freq} MHz</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                }
                return null;
              })}
            </div>
            {(gameMode === 'squad' || gameMode === 'squad_online' || gameMode === 'coop' || gameMode === 'coop_online') && (coopRole === 'expert_gamma' || coopRole === 'expert') && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 bg-zinc-800 text-zinc-100 rounded-lg border-4 border-zinc-900 font-mono text-xs shadow-md"
              >
                <p className="font-bold text-red-400 mb-2 underline uppercase">Información Global (S/N):</p>
                <p className="text-zinc-400">Número de Serie: <span className="text-white font-bold">{serialNumber}</span></p>
                <div className="mt-2 space-y-1 text-[10px]">
                  <p>- Vocales: {serialNumber.match(/[AEIOU]/g)?.length || 0}</p>
                  <p>- Dígitos: {serialNumber.match(/\d/g)?.length || 0}</p>
                  <p>- Letras: {serialNumber.match(/[A-Z]/g)?.length || 0}</p>
                </div>
              </motion.div>
            )}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="italic text-red-500 font-bold mt-8 text-center text-xs"
            >
              ¡ADVERTENCIA: Un error en cualquier módulo provocará la explosión!
            </motion.p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {gameState !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4"
          >
            <button onClick={() => initGame(gameMode, difficulty)} className={`font-pixel text-[10px] text-white px-6 py-3 border-b-4 transition-all active:translate-y-1 active:border-b-0 ${gameState === 'exploded' ? 'bg-red-600 border-red-900' : 'bg-green-600 border-green-900'}`}>
              REINTENTAR
            </button>
            <button onClick={() => setGameMode('menu')} className="font-pixel text-[10px] bg-zinc-800 text-white px-6 py-3 border-b-4 border-zinc-900 transition-all active:translate-y-1 active:border-b-0">
              MENÚ
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

