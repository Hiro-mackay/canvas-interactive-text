import * as PIXI from 'pixi.js';
import { useCallback, useState } from 'react';
import { Canvas } from '../components/Canvas';

let pixiApp: PIXI.Application;
const DefalutTextStyles: Partial<PIXI.ITextStyle> | PIXI.TextStyle = new PIXI.TextStyle();

interface BaseElement extends PIXI.Container {
  inTime: number;
  outTime: number;
  deltaStart: number;
}

class Text extends PIXI.Text implements BaseElement {
  inTime: number;
  outTime: number;
  deltaStart: number;

  constructor(text: string) {
    super(text, DefalutTextStyles);

    this.inTime = 0;
    this.outTime = 3;
    this.deltaStart = 0;

    this.interactive = true;
    this.buttonMode = true;

    this.anchor.set(0.5);

    this.x = 200;
    this.y = 200;
  }
}

// Video Elementを作成し、video pathを読み込ませる
const loadVideoRef = (pathVideo: string) => {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.preload = '';
  video.src = pathVideo;

  return video;
};

// ファイルからpathを生成する
const loadVideoPath = (file: File) => URL.createObjectURL(file);

const loadVideoElement = (file: File) => {
  const path = loadVideoPath(file);
  const video = loadVideoRef(path);
  return video;
};

const loadVideo = (file: File): Promise<HTMLVideoElement> => {
  const video = loadVideoElement(file);

  return new Promise((resolve, reject) => {
    video.play().then(() => {
      video.pause();
      resolve(video);
    });
  });
};

const loadTexture = (video: HTMLVideoElement) => PIXI.Texture.from(video);

let start = 0;
let end = 2;
let completed = false;
let paused = true;

export const Container = () => {
  const initApp = useCallback((ref: HTMLCanvasElement) => {
    pixiApp = new PIXI.Application({ view: ref, width: 800, height: 450, backgroundColor: 0xffffff });

    pixiApp.stage.width = 800;
    pixiApp.stage.height = 450;

    // Invisible hitArea
    const _sprite = new PIXI.Sprite();
    _sprite.hitArea = new PIXI.Rectangle(0, 0, 800, 450);
    _sprite.interactive = true;
    _sprite.buttonMode = true;

    _sprite.on('pointerdown', pointerDown);

    function pointerDown(event) {
      setSelectedSprite(null);
    }

    pixiApp.stage.addChild(_sprite);
  }, []);

  const [video, setVideo] = useState<HTMLVideoElement>(null);
  const [sprite, setSprite] = useState<PIXI.Sprite>(null);
  const [textSprite, setTextSprite] = useState<Text[]>([]);
  const [selectedSprite, setSelectedSprite] = useState<Text>(null);
  const [time, setTime] = useState(0);

  const addVideo = async (file: File) => {
    const _video = await loadVideo(file);
    const texture = loadTexture(_video);
    const _sprite = PIXI.Sprite.from(texture);
    _sprite.width = 800;
    _sprite.height = 450;
    _sprite.zIndex = 1;

    if (!pixiApp) {
      console.error('Not set PIXI Application');
    }

    pixiApp.stage.addChild(_sprite);

    _video.pause();

    setVideo(_video);
    setSprite(_sprite);
  };

  const loop = () => {
    if (completed) return;
    if (paused) return;

    const ct = Math.round(video.currentTime * 10) / 10;
    setTime(ct);

    if (video.paused) {
      completed = true;
      paused = true;
      return;
    }

    textSprite.forEach((text) => {
      if (ct < text.inTime || text.outTime < ct) {
        pixiApp.stage.removeChild(text);
      } else {
        pixiApp.stage.addChild(text);
      }
    });

    requestAnimationFrame(loop);
  };

  const play = () => {
    if (!paused) return;
    paused = false;
    requestAnimationFrame(() => {
      video.play();
      loop();
    });
  };

  const pause = () => {
    video.pause();
    paused = true;
  };

  const stop = () => {
    pause();
    video.currentTime = 0;
    completed = false;
    setTime(0);
    video.onseeked = () => {
      sprite.texture.update();
    };
  };

  function onSelected(event) {
    setSelectedSprite(event.currentTarget);

    this.data = event.data;
    this.dragging = true;
  }
  function onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    // set the interaction data to null
    this.data = null;
  }

  function onDragMove() {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      this.x = newPosition.x;
      this.y = newPosition.y;
    }
  }

  const addText = (_t: string) => {
    const tSprite = new Text(_t);

    tSprite.x = 200;
    tSprite.y = 200;
    tSprite.zIndex = 10;
    tSprite.interactive = true;
    tSprite.buttonMode = true;

    tSprite.anchor.set(0.5);

    tSprite
      .on('pointerdown', onSelected)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);

    pixiApp.stage.addChild(tSprite);

    setTextSprite([...textSprite, tSprite]);
  };

  const onChangeText = (val: string) => {
    selectedSprite.text = val;
  };

  const onChangeIn = (val: number) => {
    selectedSprite.inTime = val;
  };

  const onChangeOut = (val: number) => {
    selectedSprite.outTime = val;
  };

  return (
    <div className="p-10 bg-gray-600">
      <Canvas initApp={initApp} />

      <p className="text-white">{time}</p>

      <p className="p-2 inline-block">
        <input
          type="file"
          onChange={(e) => {
            if (!e.currentTarget.files?.length) return;

            addVideo(e.currentTarget.files.item(0));
          }}
        />
      </p>
      <p className="p-2 inline-block">
        <input
          type="button"
          value="テキスト追加"
          onClick={() => {
            addText('テキスト');
          }}
        />
      </p>

      <div>
        <p className="p-2 inline-block">
          <input type="button" value="再生" onClick={play} />
        </p>
        <p className="p-2 inline-block">
          <input type="button" value="停止" onClick={pause} />
        </p>
        <p className="p-2 inline-block">
          <input type="button" value="リセット" onClick={stop} />
        </p>
      </div>

      {selectedSprite && (
        <div>
          <p className="p-2 inline-block">
            <input
              type="text"
              defaultValue={selectedSprite.text}
              onChange={(e) => {
                onChangeText(e.currentTarget.value);
              }}
            />
          </p>
          <p className="p-2 inline-block">
            <input
              type="number"
              defaultValue={selectedSprite.inTime}
              onChange={(e) => {
                onChangeIn(parseInt(e.currentTarget.value));
              }}
            />
          </p>
          <p className="p-2 inline-block">
            <input
              type="number"
              defaultValue={selectedSprite.outTime}
              onChange={(e) => {
                onChangeOut(parseInt(e.currentTarget.value));
              }}
            />
          </p>
        </div>
      )}
    </div>
  );
};

export default Container;
