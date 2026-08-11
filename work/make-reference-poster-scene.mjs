import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const projectId = 'cmrluwpgn0003bwonjja5zdom';
const W = 1080;
const H = 1728;
const scene = {
  version: '1.0.0',
  width: W,
  height: H,
  background: '#061421',
  metadata: { grid: true, safeArea: true, source: 'user reference matchday poster' },
  objects: [
    {
      type: 'image',
      src: '/reference/matchday-poster-reference.jpeg',
      left: 0,
      top: 0,
      width: 375,
      height: 600,
      scaleX: 2.88,
      scaleY: 2.88,
      selectable: true,
      evented: true,
      objectId: 'reference-poster-background',
      name: 'Reference Poster Background'
    },
    {
      type: 'rect',
      left: 0,
      top: 0,
      width: W,
      height: H,
      fill: 'transparent',
      stroke: 'rgba(125,211,252,0.45)',
      strokeWidth: 12,
      selectable: true,
      evented: true,
      objectId: 'poster-border',
      name: 'Poster Border'
    },
    {
      type: 'textbox',
      text: 'MATCHDAY',
      left: 42,
      top: 78,
      width: 996,
      fontSize: 176,
      fill: 'rgba(255,255,255,0.01)',
      fontFamily: 'Impact',
      fontWeight: '900',
      textAlign: 'center',
      selectable: true,
      evented: true,
      objectId: 'editable-title-guide',
      name: 'Editable Title Guide'
    },
    {
      type: 'textbox',
      text: 'MCI   VS   ACM',
      left: 290,
      top: 1362,
      width: 500,
      fontSize: 52,
      fill: 'rgba(6,20,33,0.01)',
      fontFamily: 'Impact',
      textAlign: 'center',
      selectable: true,
      evented: true,
      objectId: 'editable-match-guide',
      name: 'Editable Match Guide'
    }
  ]
};
await prisma.project.update({
  where: { id: projectId },
  data: {
    width: W,
    height: H,
    title: 'Matchday Poster - Reference Style',
    sceneJson: scene,
    lastSavedAt: new Date()
  }
});
console.log(JSON.stringify({ projectId, width: W, height: H, objects: scene.objects.length }, null, 2));
await prisma.$disconnect();
