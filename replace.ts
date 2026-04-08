import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '<div className="relative w-full max-w-6xl flex flex-wrap justify-center gap-6">';
const endMarker = '      <div className="mt-8 flex flex-col items-center gap-4">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const newRender = `      <div className="relative w-full max-w-6xl flex flex-col items-center gap-6">
        
        {/* Anomaly Controls (Cross-Interaction) */}
        <div className="w-full flex flex-col items-center gap-4">
          {bombPowerLost && (coopRole === 'expert' || coopRole === 'expert_alpha' || coopRole === 'expert_gamma') && (
            <motion.button
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              onClick={fixPower}
              className="w-full max-w-[320px] bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-pixel py-4 border-4 border-yellow-700 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.6)] z-50"
            >
              ¡REINICIAR ENERGÍA DEL SECTOR ALIADO!
            </motion.button>
          )}

          {manualScrambled && (coopRole === 'technician' || coopRole === 'expert_beta') && (
            <motion.button
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              onClick={fixComms}
              className="w-full max-w-[320px] bg-red-600 hover:bg-red-500 text-white font-pixel py-4 border-4 border-red-900 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)] z-50"
            >
              ¡RESTAURAR SISTEMA DEL SECTOR ALIADO!
            </motion.button>
          )}
        </div>

        {/* The Bomb Modules */}
        <div className="flex flex-wrap justify-center gap-6 max-w-4xl relative">
          
          {/* Anomaly Overlays for the affected players */}
          {bombPowerLost && (coopRole === 'technician' || coopRole === 'expert_beta' || gameMode === 'solo' || gameMode === 'coop') && (
            <div className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 rounded-xl border-2 border-red-900">
              <h2 className="text-red-600 font-pixel text-2xl md:text-4xl animate-pulse text-center drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">¡ENERGÍA CAÍDA!</h2>
              <p className="text-zinc-300 font-mono text-center mt-4 text-xs md:text-sm">SOLICITA REINICIO AL SECTOR ALIADO</p>
            </div>
          )}

          {manualScrambled && (coopRole === 'expert' || coopRole === 'expert_alpha' || coopRole === 'expert_gamma') && (
            <div className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 rounded-xl border-2 border-green-900">
              <h2 className="text-green-500 font-pixel text-2xl md:text-4xl animate-pulse text-center drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">ERROR DE SISTEMA</h2>
              <p className="text-green-700 font-mono text-center mt-6 break-all text-xs md:text-sm opacity-70">
                01001110 01001111 00100000 01010011 01001001 01000111 01001110 01000001 01001100 01010011 01011001 01010011 01010100 01000101 01001101 00100000 01000110 01000001 01001001 01001100 01010101 01010010 01000101
              </p>
              <p className="text-zinc-300 font-mono text-center mt-4 text-xs md:text-sm">SOLICITA RESTAURACIÓN AL SECTOR ALIADO</p>
            </div>
          )}

          {/* Map over visible modules */}
          {(() => {
            let visibleModules = moduleOrder;
            if (gameMode === 'coop_online' || gameMode === 'coop') {
              if (coopRole === 'technician') visibleModules = moduleOrder.slice(0, 2);
              if (coopRole === 'expert') visibleModules = moduleOrder.slice(2, 4);
            } else if (gameMode === 'squad_online' || gameMode === 'squad') {
              if (coopRole === 'technician') visibleModules = [moduleOrder[0]];
              if (coopRole === 'expert_alpha') visibleModules = [moduleOrder[1]];
              if (coopRole === 'expert_beta') visibleModules = [moduleOrder[2]];
              if (coopRole === 'expert_gamma') visibleModules = [moduleOrder[3]];
            }

            return visibleModules.map((moduleType, index) => {
              const modNum = (moduleOrder.indexOf(moduleType) + 1).toString().padStart(2, '0');
              
              if (moduleType === 'wires') {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key="wires" 
                    className={\`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    \${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    \${modulesSolved.wires ? 'border-green-900' : ''}\`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-\${modNum}: CABLES</span>
                      <div className={\`w-3 h-3 rounded-full \${modulesSolved.wires ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}\`}></div>
                    </div>

                    <div className="bg-zinc-700 border-4 border-zinc-900 p-4 rounded-lg mb-4">
                      <div className="flex flex-col gap-4">
                        {wires.map((wire) => (
                          <div key={wire.id} onClick={() => handleWireClick(wire.id)} className={\`relative group \${gameState === 'playing' && !wire.cut && !modulesSolved.wires ? 'cursor-pointer' : ''}\`}>
                            <div className={\`h-4 w-full rounded-full \${wire.class} transition-all duration-300 \${wire.cut ? 'opacity-0 scale-x-0' : 'opacity-100'}\`}></div>
                            {wire.cut && (
                              <div className="absolute inset-0 flex justify-between items-center px-4">
                                <div className={\`h-4 w-1/3 rounded-full \${wire.class} opacity-50 rotate-12\`}></div>
                                <div className={\`h-4 w-1/3 rounded-full \${wire.class} opacity-50 -rotate-12\`}></div>
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

                    {/* INSTRUCTIONS */}
                    <div className="p-3 bg-zinc-900 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                      <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INSTRUCCIONES:</p>
                      {difficulty === 'easy' && <p>Si S/N termina en PAR &rarr; Cortar Rojo. Si no &rarr; Azul.</p>}
                      {difficulty === 'medium' && <p>Si S/N tiene LETRAS &rarr; Cortar Amarillo. Si no &rarr; Verde.</p>}
                      {difficulty === 'hard' && <p>Si S/N tiene VOCAL &rarr; Cortar Negro. Si no &rarr; Blanco.</p>}
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
                    className={\`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    \${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    \${modulesSolved.keypad ? 'border-green-900' : ''}\`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-\${modNum}: TECLADO</span>
                      <div className={\`w-3 h-3 rounded-full \${modulesSolved.keypad ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}\`}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {keypadSymbols.map((symbol, i) => {
                        const isPressed = keypadInput.includes(symbol);
                        const isError = keypadError === symbol;
                        return (
                          <button
                            key={i}
                            onClick={() => handleKeypadClick(symbol)}
                            disabled={isPressed || modulesSolved.keypad || gameState !== 'playing'}
                            className={\`h-16 flex items-center justify-center text-2xl bg-zinc-200 border-b-4 border-zinc-400 rounded transition-all
                              \${isPressed ? 'bg-green-200 border-green-400 translate-y-1 border-b-0' : ''}
                              \${isError ? 'bg-red-400 border-red-600 animate-shake' : ''}
                              \${!isPressed && !isError && gameState === 'playing' ? 'hover:bg-white active:translate-y-1 active:border-b-0' : ''}
                            \`}
                          >
                            {symbol}
                          </button>
                        );
                      })}
                    </div>

                    {/* INSTRUCTIONS */}
                    <div className="p-3 bg-zinc-900 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                      <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INSTRUCCIONES:</p>
                      <p>Presionar en orden:</p>
                      <p className="text-white mt-1 text-center text-sm">{KEYPAD_SEQUENCES[difficulty].join(' ➔ ')}</p>
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
                    className={\`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    \${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    \${modulesSolved.simon ? 'border-green-900' : ''}\`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-\${modNum}: SIMON</span>
                      <div className={\`w-3 h-3 rounded-full \${modulesSolved.simon ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}\`}></div>
                    </div>

                    <div className="relative w-48 h-48 mx-auto mb-4 bg-zinc-900 rounded-full p-2">
                      <div className="absolute inset-2 rounded-full overflow-hidden">
                        <div className="w-full h-full relative">
                          <button onClick={() => handleSimonClick('red')} disabled={modulesSolved.simon || gameState !== 'playing'} className={\`absolute top-0 left-0 w-1/2 h-1/2 bg-red-600 border-r-4 border-b-4 border-zinc-900 transition-all \${activeSimonColor === 'red' ? 'brightness-150 bg-red-400' : 'hover:brightness-110'}\`}></button>
                          <button onClick={() => handleSimonClick('blue')} disabled={modulesSolved.simon || gameState !== 'playing'} className={\`absolute top-0 right-0 w-1/2 h-1/2 bg-blue-600 border-l-4 border-b-4 border-zinc-900 transition-all \${activeSimonColor === 'blue' ? 'brightness-150 bg-blue-400' : 'hover:brightness-110'}\`}></button>
                          <button onClick={() => handleSimonClick('yellow')} disabled={modulesSolved.simon || gameState !== 'playing'} className={\`absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-500 border-r-4 border-t-4 border-zinc-900 transition-all \${activeSimonColor === 'yellow' ? 'brightness-150 bg-yellow-300' : 'hover:brightness-110'}\`}></button>
                          <button onClick={() => handleSimonClick('green')} disabled={modulesSolved.simon || gameState !== 'playing'} className={\`absolute bottom-0 right-0 w-1/2 h-1/2 bg-green-600 border-l-4 border-t-4 border-zinc-900 transition-all \${activeSimonColor === 'green' ? 'brightness-150 bg-green-400' : 'hover:brightness-110'}\`}></button>
                        </div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-zinc-800 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-zinc-950"></div>
                      </div>
                    </div>

                    {/* INSTRUCTIONS */}
                    <div className="p-3 bg-zinc-900 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                      <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INSTRUCCIONES:</p>
                      <p>Si parpadea:</p>
                      <ul className="mt-1 space-y-1">
                        <li><span className="text-red-400">Rojo</span> &rarr; Presiona <span className="text-blue-400">Azul</span></li>
                        <li><span className="text-blue-400">Azul</span> &rarr; Presiona <span className="text-yellow-400">Amarillo</span></li>
                        <li><span className="text-green-400">Verde</span> &rarr; Presiona <span className="text-green-400">Verde</span></li>
                        <li><span className="text-yellow-400">Amarillo</span> &rarr; Presiona <span className="text-red-400">Rojo</span></li>
                      </ul>
                    </div>
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
                    className={\`relative w-full max-w-[320px] bg-zinc-800 border-8 border-zinc-900 rounded-lg p-6 shadow-[0_12px_0_#18181b] transition-all duration-500 
                    \${gameState === 'exploded' ? 'brightness-50 grayscale' : ''}
                    \${modulesSolved.morse ? 'border-green-900' : ''}\`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-pixel text-[8px] text-zinc-400">MOD-\${modNum}: CÓDIGO MORSE</span>
                      <div className={\`w-3 h-3 rounded-full \${modulesSolved.morse ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-900'}\`}></div>
                    </div>

                    <div className="flex justify-center mb-4">
                      <div className={\`w-12 h-12 rounded-full transition-colors duration-75 \${morseLightOn && gameState === 'playing' && !modulesSolved.morse ? 'bg-yellow-400 shadow-[0_0_30px_#facc15]' : 'bg-zinc-900'}\`}></div>
                    </div>

                    <div className="bg-zinc-950 border-4 border-zinc-900 p-4 mb-4 rounded flex flex-col items-center justify-center">
                      <span className="font-pixel text-[8px] text-zinc-500 mb-1">TX FREQ (MHz)</span>
                      <span className={\`font-pixel text-3xl \${gameState === 'exploded' ? 'text-zinc-800' : 'text-orange-400'}\`}>
                        {MORSE_WORDS[currentMorseFreqIdx].freq}
                      </span>
                    </div>

                    <div className="flex gap-4 mb-4">
                      <button onClick={() => setCurrentMorseFreqIdx(prev => (prev - 1 + MORSE_WORDS.length) % MORSE_WORDS.length)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[12px] py-3 border-b-4 border-zinc-900 rounded">&lt;</button>
                      <button onClick={() => setCurrentMorseFreqIdx(prev => (prev + 1) % MORSE_WORDS.length)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-pixel text-[12px] py-3 border-b-4 border-zinc-900 rounded">&gt;</button>
                    </div>

                    <button 
                      onClick={handleMorseSubmit}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-pixel text-[8px] py-3 border-b-4 border-orange-900 active:translate-y-1 active:border-b-0 transition-all rounded mb-4"
                    >
                      TRANSMITIR
                    </button>

                    {/* INSTRUCTIONS */}
                    <div className="p-3 bg-zinc-900 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                      <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INSTRUCCIONES:</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
                        {MORSE_WORDS.map(w => (
                          <div key={w.word} className="flex justify-between">
                            <span>{w.word}</span>
                            <span className="text-orange-300">{w.freq}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              }
              return null;
            });
          })()}
        </div>
      </div>
`;

content = content.substring(0, startIndex) + newRender + content.substring(endIndex);

fs.writeFileSync('src/App.tsx', content);
console.log('Replaced render block successfully');
