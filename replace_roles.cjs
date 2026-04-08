const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace role type
content = content.replace(
  "const [coopRole, setCoopRole] = useState<'technician' | 'expert' | 'expert_alpha' | 'expert_beta' | 'expert_gamma'>('technician');",
  "const [coopRole, setCoopRole] = useState<'alpha' | 'beta' | 'gamma' | 'delta'>('alpha');"
);

// Replace role resets
content = content.replace(/setCoopRole\('technician'\);/g, "setCoopRole('alpha');");

// Replace frequency from modulesSolved
content = content.replace(
  "const [modulesSolved, setModulesSolved] = useState({ wires: false, keypad: false, simon: false, frequency: false, morse: false });",
  "const [modulesSolved, setModulesSolved] = useState({ wires: false, keypad: false, simon: false, morse: false });"
);
content = content.replace(
  "modulesSolved: { wires: false, keypad: false, simon: false, frequency: false, morse: false }",
  "modulesSolved: { wires: false, keypad: false, simon: false, morse: false }"
);
content = content.replace(
  "setModulesSolved({ wires: false, keypad: false, simon: false, frequency: false, morse: false });",
  "setModulesSolved({ wires: false, keypad: false, simon: false, morse: false });"
);

// Replace moduleOrder
content = content.replace(
  "const [moduleOrder, setModuleOrder] = useState<string[]>(['wires', 'keypad', 'simon', 'frequency', 'morse']);",
  "const [moduleOrder, setModuleOrder] = useState<string[]>(['wires', 'keypad', 'simon', 'morse']);"
);
content = content.replace(
  "const finalOrder = ['wires', 'keypad', 'simon', 'frequency', 'morse'].sort(() => Math.random() - 0.5);",
  "const finalOrder = ['wires', 'keypad', 'simon', 'morse'].sort(() => Math.random() - 0.5);"
);

// Replace win condition
content = content.replace(
  "if (modulesSolved.wires && modulesSolved.keypad && modulesSolved.simon && modulesSolved.frequency && modulesSolved.morse && gameState === 'playing') {",
  "if (modulesSolved.wires && modulesSolved.keypad && modulesSolved.simon && modulesSolved.morse && gameState === 'playing') {"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Replaced roles and frequency successfully');
