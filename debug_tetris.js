const fs = require('fs');

// DOM Mock
global.document = {
    getElementById: (id) => {
        if (id === 'tetrisCanvas' || id === 'nextCanvas') {
            return { 
                width: 240, 
                height: 400, 
                getContext: () => ({
                    fillRect: () => {},
                    strokeRect: () => {},
                    fillText: () => {},
                    beginPath: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    stroke: () => {}
                })
            };
        }
        if (id === 'game-score' || id === 'high-score') return { innerText: '' };
        return null;
    },
    addEventListener: () => {}
};
global.localStorage = { getItem: () => '0', setItem: () => {} };
global.requestAnimationFrame = (cb) => { global.nextCb = cb; return 1; };
global.performance = { now: () => Date.now() };
global.window = {};

eval(fs.readFileSync('auth.js', 'utf8'));
eval(fs.readFileSync('game_tetris.js', 'utf8'));

try {
    startTetris();
    console.log("startTetris executed successfully.");
    if (global.nextCb) {
        global.nextCb(performance.now() + 100);
        console.log("loop executed successfully.");
    }
} catch (e) {
    console.error("ERROR CAUGHT:", e);
}
