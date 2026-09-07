const fs = require('fs');
const { createCanvas } = require('canvas');

const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#10b981';
ctx.fillRect(0, 0, 512, 512);
ctx.fillStyle = '#fff';
ctx.font = '100px sans-serif';
ctx.fillText('MemoriNER', 20, 280);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./public/icons/icon-512x512.png', buffer);

const canvas2 = createCanvas(192, 192);
const ctx2 = canvas2.getContext('2d');
ctx2.fillStyle = '#10b981';
ctx2.fillRect(0, 0, 192, 192);
ctx2.fillStyle = '#fff';
ctx2.font = '40px sans-serif';
ctx2.fillText('Mem', 40, 100);

const buffer2 = canvas2.toBuffer('image/png');
fs.writeFileSync('./public/icons/icon-192x192.png', buffer2);
