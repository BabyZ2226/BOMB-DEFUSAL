const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const intelPanel = `
        {/* INTEL PANEL (Only for online modes) */}
        {(gameMode === 'coop_online' || gameMode === 'squad_online') && gameState === 'playing' && (
          <div className="w-full max-w-4xl bg-zinc-900 border-4 border-blue-900 p-4 rounded-xl mb-2">
            <h3 className="text-blue-400 font-pixel text-sm mb-4 text-center">INTELIGENCIA ASIGNADA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wires Intel */}
              {((gameMode === 'coop_online' && coopRole === 'beta') || (gameMode === 'squad_online' && coopRole === 'delta')) && (
                <div className="p-3 bg-zinc-950 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                  <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INTEL: CABLES</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Si S/N tiene vocal: Cortar el ÚLTIMO cable.</li>
                    <li>Si S/N termina en número PAR: Cortar el PRIMER cable ROJO.</li>
                    <li>Si hay más de 2 cables AZULES: Cortar el SEGUNDO cable AZUL.</li>
                    <li>Si no se cumple nada: Cortar el PRIMER cable.</li>
                  </ul>
                </div>
              )}
              
              {/* Keypad Intel */}
              {((gameMode === 'coop_online' && coopRole === 'alpha') || (gameMode === 'squad_online' && coopRole === 'alpha')) && (
                <div className="p-3 bg-zinc-950 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                  <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INTEL: TECLADO</p>
                  <ul className="list-decimal pl-3 space-y-1 mb-2 text-[8px]">
                    <li>Si S/N tiene dígito PAR: Menor a mayor jerarquía. Si no: Mayor a menor.</li>
                    <li>Si S/N tiene VOCAL: El último pasa a ser el primero.</li>
                    <li>Si S/N tiene &gt; 2 LETRAS: Intercambia el 1º y el 6º.</li>
                  </ul>
                  <p className="text-white text-center text-[8px] break-words">{KEYPAD_HIERARCHY.join(' < ')}</p>
                </div>
              )}

              {/* Simon Intel */}
              {((gameMode === 'coop_online' && coopRole === 'beta') || (gameMode === 'squad_online' && coopRole === 'beta')) && (
                <div className="p-3 bg-zinc-950 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                  <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INTEL: SIMON</p>
                  <div className="grid grid-cols-2 gap-2 text-[8px]">
                    <div>
                      <p className="text-white mb-1">Si S/N tiene VOCAL:</p>
                      <ul className="space-y-1">
                        <li><span className="text-red-400">Rojo</span> &rarr; <span className="text-blue-400">Azul</span></li>
                        <li><span className="text-blue-400">Azul</span> &rarr; <span className="text-red-400">Rojo</span></li>
                        <li><span className="text-green-400">Verde</span> &rarr; <span className="text-yellow-400">Amarillo</span></li>
                        <li><span className="text-yellow-400">Amarillo</span> &rarr; <span className="text-green-400">Verde</span></li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-white mb-1">Si NO tiene vocal:</p>
                      <ul className="space-y-1">
                        <li><span className="text-red-400">Rojo</span> &rarr; <span className="text-yellow-400">Amarillo</span></li>
                        <li><span className="text-blue-400">Azul</span> &rarr; <span className="text-green-400">Verde</span></li>
                        <li><span className="text-green-400">Verde</span> &rarr; <span className="text-blue-400">Azul</span></li>
                        <li><span className="text-yellow-400">Amarillo</span> &rarr; <span className="text-red-400">Rojo</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Morse Intel */}
              {((gameMode === 'coop_online' && coopRole === 'alpha') || (gameMode === 'squad_online' && coopRole === 'gamma')) && (
                <div className="p-3 bg-zinc-950 border-2 border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                  <p className="mb-2 text-zinc-300 font-bold border-b border-zinc-700 pb-1">INTEL: MORSE</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px]">
                    {MORSE_WORDS.map((m, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-white">{m.word}</span>
                        <span className="text-green-400">{m.freq} MHz</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
`;

content = content.replace(
  "{/* The Bomb Modules */}",
  intelPanel + "\n        {/* The Bomb Modules */}"
);

// Hide instructions in modules for online modes
content = content.replace(
  /\{\/\* INSTRUCTIONS \*\/\}/g,
  "{/* INSTRUCTIONS */}\n                    {gameMode !== 'coop_online' && gameMode !== 'squad_online' && ("
);

// We need to close the parenthesis for each instruction block.
// Let's do it manually for each module.
content = content.replace(
  /<\/ul>\n                    <\/div>\n                  <\/motion\.div>/g,
  "</ul>\n                    </div>\n                    )}\n                  </motion.div>"
);

content = content.replace(
  /<\/p>\n                    <\/div>\n                  <\/motion\.div>/g,
  "</p>\n                    </div>\n                    )}\n                  </motion.div>"
);

content = content.replace(
  /<\/div>\n                    <\/div>\n                  <\/motion\.div>/g,
  "</div>\n                    </div>\n                    )}\n                  </motion.div>"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Added Intel Panel successfully');
