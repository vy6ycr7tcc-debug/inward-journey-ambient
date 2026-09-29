import { Engine } from './Engine';
import { Descent } from './chapters/Descent';
import { EmberField } from './chapters/EmberField';
import { StillWater } from './chapters/StillWater';
import { UIManager } from './UIManager';

const init = () => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  document.getElementById('app')?.appendChild(canvas);

  const engine = new Engine(canvas);

  engine.addChapter(new Descent());
  engine.addChapter(new EmberField());
  engine.addChapter(new StillWater());

  new UIManager(engine);

  requestAnimationFrame(engine.animate.bind(engine));
};

window.addEventListener('load', init);
