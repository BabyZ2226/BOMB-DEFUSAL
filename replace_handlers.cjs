const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Wires (Panic and Click)
content = content.replace(
  /if \(gameState !== 'playing' \|\| modulesSolved\.wires \|\| \(\(gameMode === 'coop' \|\| gameMode === 'coop_online'\) && coopRole === 'expert'\)\) return;/g,
  "if (gameState !== 'playing' || modulesSolved.wires || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'beta')) return;"
);

// Keypad
content = content.replace(
  /if \(gameState !== 'playing' \|\| modulesSolved\.keypad \|\| \(\(gameMode === 'coop' \|\| gameMode === 'coop_online'\) && coopRole === 'expert'\)\) return;/g,
  "if (gameState !== 'playing' || modulesSolved.keypad || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'alpha')) return;"
);

// Simon (Effect and Click)
content = content.replace(
  /if \(gameState !== 'playing' \|\| modulesSolved\.simon \|\| \(\(gameMode === 'coop' \|\| gameMode === 'coop_online'\) && coopRole === 'expert'\)\) return;/g,
  "if (gameState !== 'playing' || modulesSolved.simon || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'beta')) return;"
);

// Morse (Effect and Click)
content = content.replace(
  /if \(gameState !== 'playing' \|\| modulesSolved\.morse \|\| \(\(gameMode === 'coop' \|\| gameMode === 'coop_online'\) && coopRole === 'expert'\)\) return;/g,
  "if (gameState !== 'playing' || modulesSolved.morse || ((gameMode === 'coop' || gameMode === 'coop_online') && coopRole === 'alpha')) return;"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Replaced handlers successfully');
