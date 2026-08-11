import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const projectId = 'cmrluwpgn0003bwonjja5zdom';
const W = 1080;
const H = 1728;
const obj = (o) => ({ ...o });
const scene = {
  version: '1.0.0',
  width: W,
  height: H,
  background: '#061421',
  metadata: { grid: true, safeArea: true, inspiration: 'blue stadium matchday poster' },
  objects: [
    obj({ type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#071320', objectId: 'bg-base', name: 'Deep Blue Background', selectable: true }),
    obj({ type: 'circle', left: -250, top: -320, radius: 540, fill: '#0EA5E9', opacity: 0.55, objectId: 'top-left-glow', name: 'Top Cyan Glow' }),
    obj({ type: 'circle', left: 520, top: -280, radius: 520, fill: '#38BDF8', opacity: 0.48, objectId: 'top-right-glow', name: 'Top Sky Glow' }),
    obj({ type: 'circle', left: 160, top: 200, radius: 520, fill: '#67E8F9', opacity: 0.12, objectId: 'center-haze', name: 'Center Haze' }),
    obj({ type: 'rect', left: 0, top: 0, width: W, height: 650, fill: 'rgba(56,189,248,0.16)', objectId: 'blue-sky-wash', name: 'Blue Sky Wash' }),
    obj({ type: 'textbox', text: 'MATCHDAY', left: 28, top: 66, width: 1028, fontSize: 176, fill: '#F8FCFF', fontFamily: 'Impact', fontWeight: '900', opacity: 0.96, textAlign: 'center', objectId: 'poster-title', name: 'MATCHDAY Title' }),
    obj({ type: 'textbox', text: 'MATCHDAY', left: 36, top: 72, width: 1028, fontSize: 176, fill: '#7DD3FC', fontFamily: 'Impact', fontWeight: '900', opacity: 0.2, textAlign: 'center', objectId: 'poster-title-shadow', name: 'Title Blue Shadow' }),
    obj({ type: 'rect', left: 0, top: 640, width: W, height: 1088, fill: '#14151C', objectId: 'stadium-night', name: 'Stadium Lower Field' }),
    obj({ type: 'rect', left: 0, top: 1358, width: W, height: 370, fill: '#331126', opacity: 0.88, objectId: 'purple-pitch', name: 'Purple Pitch' }),
    obj({ type: 'ellipse', left: -130, top: 730, rx: 670, ry: 180, fill: 'rgba(5,10,20,0.82)', stroke: '#DCEBFF', strokeWidth: 10, opacity: 0.92, objectId: 'stadium-bowl-1', name: 'Stadium Bowl Upper' }),
    obj({ type: 'ellipse', left: -180, top: 895, rx: 720, ry: 205, fill: 'rgba(18,24,34,0.9)', stroke: '#C6D7EA', strokeWidth: 9, opacity: 0.92, objectId: 'stadium-bowl-2', name: 'Stadium Bowl Middle' }),
    obj({ type: 'ellipse', left: -210, top: 1065, rx: 750, ry: 225, fill: 'rgba(29,35,45,0.92)', stroke: '#9CAEC0', strokeWidth: 8, opacity: 0.9, objectId: 'stadium-bowl-3', name: 'Stadium Bowl Lower' }),
    obj({ type: 'rect', left: 0, top: 905, width: W, height: 36, fill: '#E4EEF7', opacity: 0.9, objectId: 'stand-ring-1', name: 'Bright Stand Ring' }),
    obj({ type: 'rect', left: 0, top: 1115, width: W, height: 34, fill: '#C7D7E7', opacity: 0.85, objectId: 'stand-ring-2', name: 'Lower Stand Ring' }),
    obj({ type: 'rect', left: 0, top: 1260, width: W, height: 80, fill: 'rgba(0,0,0,0.28)', objectId: 'field-shadow', name: 'Field Shadow' }),
    obj({ type: 'line', x1: 190, y1: 250, x2: 100, y2: 1080, stroke: '#CFFAFE', strokeWidth: 8, opacity: 0.55, objectId: 'floodlight-left', name: 'Left Floodlight Beam' }),
    obj({ type: 'line', x1: 890, y1: 250, x2: 980, y2: 1080, stroke: '#CFFAFE', strokeWidth: 8, opacity: 0.55, objectId: 'floodlight-right', name: 'Right Floodlight Beam' }),
    ...Array.from({ length: 44 }, (_, i) => obj({ type: 'circle', left: 36 + (i % 11) * 94, top: 825 + Math.floor(i / 11) * 78, radius: 7 + (i % 3), fill: i % 4 === 0 ? '#E2E8F0' : '#94A3B8', opacity: 0.45, objectId: 'crowd-dot-' + i, name: 'Crowd Dot ' + (i + 1) })),
    obj({ type: 'circle', left: 485, top: 318, radius: 72, fill: '#FFE1C6', stroke: '#BFDBFE', strokeWidth: 4, objectId: 'player-head', name: 'Player Head' }),
    obj({ type: 'rect', left: 520, top: 270, width: 100, height: 42, fill: '#F8FAFC', rx: 25, ry: 25, angle: 18, objectId: 'player-hair-tail', name: 'Player Hair Tail' }),
    obj({ type: 'circle', left: 515, top: 285, radius: 50, fill: '#F8FAFC', opacity: 0.95, objectId: 'player-hair', name: 'Player Hair' }),
    obj({ type: 'textbox', text: '>', left: 566, top: 356, width: 40, fontSize: 34, fill: '#7F1D1D', fontFamily: 'Impact', angle: 12, objectId: 'player-mouth', name: 'Player Shout' }),
    obj({ type: 'polygon', points: [{x:520,y:430},{x:710,y:555},{x:642,y:900},{x:456,y:890},{x:378,y:555}], fill: '#61C8F7', stroke: '#DDF7FF', strokeWidth: 5, objectId: 'player-shirt', name: 'Player Blue Shirt' }),
    obj({ type: 'textbox', text: 'CITY', left: 468, top: 590, width: 210, fontSize: 58, fill: 'rgba(255,255,255,0.44)', fontFamily: 'Impact', textAlign: 'center', objectId: 'shirt-mark', name: 'Shirt Mark' }),
    obj({ type: 'line', x1: 405, y1: 548, x2: 238, y2: 815, stroke: '#FFE1C6', strokeWidth: 56, objectId: 'player-left-arm', name: 'Player Left Arm' }),
    obj({ type: 'line', x1: 665, y1: 560, x2: 812, y2: 812, stroke: '#FFE1C6', strokeWidth: 52, objectId: 'player-right-arm', name: 'Player Right Arm' }),
    obj({ type: 'circle', left: 202, top: 798, radius: 35, fill: '#FFE1C6', objectId: 'player-left-hand', name: 'Player Left Hand' }),
    obj({ type: 'circle', left: 790, top: 800, radius: 38, fill: '#FFE1C6', objectId: 'player-right-hand', name: 'Player Right Hand' }),
    obj({ type: 'rect', left: 442, top: 850, width: 215, height: 188, fill: '#FFFFFF', stroke: '#A7D9F4', strokeWidth: 4, rx: 22, ry: 22, objectId: 'player-shorts', name: 'Player White Shorts' }),
    obj({ type: 'line', x1: 510, y1: 1010, x2: 418, y2: 1320, stroke: '#FFE1C6', strokeWidth: 72, objectId: 'player-left-leg', name: 'Player Left Leg' }),
    obj({ type: 'line', x1: 610, y1: 1008, x2: 680, y2: 1358, stroke: '#FFE1C6', strokeWidth: 74, objectId: 'player-right-leg', name: 'Player Right Leg' }),
    obj({ type: 'line', x1: 403, y1: 1318, x2: 294, y2: 1438, stroke: '#6B1031', strokeWidth: 66, objectId: 'player-left-boot', name: 'Player Left Boot' }),
    obj({ type: 'line', x1: 672, y1: 1355, x2: 792, y2: 1415, stroke: '#6B1031', strokeWidth: 66, objectId: 'player-right-boot', name: 'Player Right Boot' }),
    obj({ type: 'circle', left: 638, top: 380, radius: 180, fill: '#7DD3FC', opacity: 0.1, objectId: 'player-rim-light', name: 'Player Rim Light' }),
    obj({ type: 'rect', left: 273, top: 1320, width: 534, height: 150, fill: '#38BDF8', stroke: '#075985', strokeWidth: 5, rx: 24, ry: 24, objectId: 'match-card', name: 'Match Card' }),
    obj({ type: 'circle', left: 304, top: 1340, radius: 58, fill: 'rgba(255,255,255,0.12)', stroke: '#061421', strokeWidth: 8, objectId: 'home-badge', name: 'Home Badge' }),
    obj({ type: 'circle', left: 714, top: 1340, radius: 58, fill: 'rgba(255,255,255,0.12)', stroke: '#061421', strokeWidth: 8, objectId: 'away-badge', name: 'Away Badge' }),
    obj({ type: 'textbox', text: 'MCI', left: 316, top: 1366, width: 76, fontSize: 28, fill: '#061421', fontFamily: 'Impact', textAlign: 'center', objectId: 'home-team', name: 'Home Team Initials' }),
    obj({ type: 'textbox', text: 'ACM', left: 726, top: 1366, width: 76, fontSize: 28, fill: '#061421', fontFamily: 'Impact', textAlign: 'center', objectId: 'away-team', name: 'Away Team Initials' }),
    obj({ type: 'textbox', text: 'VS', left: 476, top: 1345, width: 128, fontSize: 72, fill: '#061421', fontFamily: 'Impact', textAlign: 'center', objectId: 'vs-text', name: 'VS Text' }),
    obj({ type: 'rect', left: 360, top: 1482, width: 360, height: 52, fill: '#071320', stroke: '#7DD3FC', strokeWidth: 2, rx: 12, ry: 12, objectId: 'live-pill', name: 'Live Match Pill' }),
    obj({ type: 'textbox', text: 'LIVE MATCH ON', left: 408, top: 1492, width: 268, fontSize: 22, fill: '#FFFFFF', fontFamily: 'monospace', fontWeight: '700', textAlign: 'center', objectId: 'live-text', name: 'Live Match Text' }),
    obj({ type: 'textbox', text: 'YANKEE STADIUM', left: 380, top: 1530, width: 320, fontSize: 26, fill: '#E0F2FE', fontFamily: 'Impact', textAlign: 'center', objectId: 'stadium-text', name: 'Stadium Text' }),
    obj({ type: 'ellipse', left: 275, top: 1482, rx: 48, ry: 14, fill: 'transparent', stroke: '#FFFFFF', strokeWidth: 5, objectId: 'stadium-icon-1', name: 'Stadium Icon Ring 1' }),
    obj({ type: 'ellipse', left: 275, top: 1500, rx: 48, ry: 14, fill: 'transparent', stroke: '#FFFFFF', strokeWidth: 5, objectId: 'stadium-icon-2', name: 'Stadium Icon Ring 2' }),
    obj({ type: 'rect', left: 0, top: 0, width: W, height: H, fill: 'transparent', stroke: 'rgba(125,211,252,0.35)', strokeWidth: 18, objectId: 'poster-border', name: 'Poster Border' })
  ]
};
await prisma.project.update({ where: { id: projectId }, data: { width: W, height: H, title: 'Matchday Poster - City vs Milan', sceneJson: scene, lastSavedAt: new Date() } });
console.log(JSON.stringify({ projectId, width: W, height: H, objects: scene.objects.length }, null, 2));
await prisma.$disconnect();
