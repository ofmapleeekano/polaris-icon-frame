(() => {
  'use strict';
  const SIZE = 512;
  const names = ['blue', 'green', 'pink', 'red', 'white'];
  const frames = Object.fromEntries(names.map(name => [name, new Image()]));
  const canvases = [document.getElementById('preview-desktop'), document.getElementById('preview-mobile')];
  const fileInput = document.getElementById('photo-input');
  const zoomInput = document.getElementById('zoom');
  const status = document.getElementById('status');
  let photo = null;
  let frameName = 'blue';
  let scale = Number(zoomInput.value);
  let offsetX = 0, offsetY = 0;
  const pointers = new Map();
  let dragStart = null, pinchStart = null;

  function notify(message) { status.textContent = message; }
  function coverSize() {
    if (!photo) return { width: SIZE, height: SIZE };
    const ratio = Math.max(SIZE / photo.naturalWidth, SIZE / photo.naturalHeight) * scale;
    return { width: photo.naturalWidth * ratio, height: photo.naturalHeight * ratio };
  }
  function clampOffset() {
    const { width, height } = coverSize();
    offsetX = Math.max((SIZE - width) / 2, Math.min((width - SIZE) / 2, offsetX));
    offsetY = Math.max((SIZE - height) / 2, Math.min((height - SIZE) / 2, offsetY));
  }
  function render(canvas, placeholder = false) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (photo) {
      const { width, height } = coverSize();
      ctx.drawImage(photo, (SIZE - width) / 2 + offsetX, (SIZE - height) / 2 + offsetY, width, height);
    } else if (placeholder) {
      ctx.fillStyle = '#b9d3dd'; ctx.fillRect(0, 0, SIZE, SIZE);
    }
    if (frames[frameName].complete && frames[frameName].naturalWidth) ctx.drawImage(frames[frameName], 0, 0, SIZE, SIZE);
  }
  function renderAll() { canvases.forEach(canvas => render(canvas, true)); }
  names.forEach(name => {
    frames[name].onload = renderAll;
    frames[name].src = `frames/icon-frame-${name}.png`;
  });
  document.querySelectorAll('input[name="frame"]').forEach(input => {
    input.addEventListener('change', () => { frameName = input.value; renderAll(); });
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { notify('画像ファイルを選択してください。'); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      photo = image; offsetX = offsetY = 0; scale = Number(zoomInput.value);
      clampOffset(); renderAll(); notify('写真を読み込みました。');
    } catch { notify('この画像を読み込めませんでした。JPGまたはPNGをお試しください。'); }
    finally { URL.revokeObjectURL(url); }
  });
  zoomInput.addEventListener('input', () => {
    scale = Number(zoomInput.value); clampOffset(); renderAll();
  });
  function xy(event, target) {
    const rect = target.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * SIZE / rect.width, y: (event.clientY - rect.top) * SIZE / rect.height };
  }
  for (const canvas of canvases) {
    canvas.addEventListener('pointerdown', event => {
      if (!photo) return;
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, xy(event, canvas));
      if (pointers.size === 1) dragStart = { point: xy(event, canvas), x: offsetX, y: offsetY };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
      }
    });
    canvas.addEventListener('pointermove', event => {
      if (!photo || !pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, xy(event, canvas));
      if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()];
        scale = Math.max(1, Math.min(3, pinchStart.scale * Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.distance));
        zoomInput.value = scale;
      } else if (pointers.size === 1 && dragStart) {
        const point = xy(event, canvas);
        offsetX = dragStart.x + point.x - dragStart.point.x;
        offsetY = dragStart.y + point.y - dragStart.point.y;
      }
      clampOffset(); renderAll();
    });
    const end = event => { pointers.delete(event.pointerId); pinchStart = null; dragStart = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', event => {
      if (!photo) return;
      event.preventDefault();
      scale = Math.max(1, Math.min(3, scale - event.deltaY * 0.002));
      zoomInput.value = scale; clampOffset(); renderAll();
    }, { passive: false });
  }
  document.getElementById('download').addEventListener('click', () => {
    if (!photo) {
      notify('先に写真を選択してください。');
      fileInput.focus();
      return;
    }

    if (!frames[frameName].complete || !frames[frameName].naturalWidth) {
      notify('フレームを読み込み中です。');
      return;
    }

    const output = document.createElement('canvas');
    output.width = output.height = SIZE;
    render(output);

    output.toBlob(async blob => {
      if (!blob) {
        notify('画像を保存できませんでした。');
        return;
      }

      const fileName = `polaris-icon-${frameName}.png`;

      // CSSのスマホ表示と同じ800pxを基準にする
      const isMobile = window.matchMedia('(max-width: 800px)').matches;

      // ─────────────────────────
      // PC
      // → 従来どおりPNGをダウンロード
      // ─────────────────────────
      if (!isMobile) {
        downloadImage(blob, fileName);
        return;
      }

      // ─────────────────────────
      // スマホ
      // → まずOSの共有画面を試す
      // ─────────────────────────
      const file = new File(
        [blob],
        fileName,
        { type: 'image/png' }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file]
          });

          notify('画像を共有しました。');
          return;

        } catch (error) {

          // ユーザー自身が共有画面を閉じた場合は何もしない
          if (error.name === 'AbortError') {
            return;
          }

          console.warn(
            '共有機能を使用できなかったため、長押し保存に切り替えます。',
            error
          );
        }
      }

      // ─────────────────────────
      // LINE・Xなど、
      // ファイル共有できないアプリ内ブラウザ
      // → 完成画像を表示して長押し保存
      // ─────────────────────────
      showSaveFallback(blob);

    }, 'image/png');
  });


  function downloadImage(blob, fileName) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);

    notify('PNG画像を保存しました。');
  }


  function showSaveFallback(blob) {
    const url = URL.createObjectURL(blob);

    const overlay = document.createElement('div');

    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.92);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      overflow-y: auto;
    `;


    // メインメッセージ
    const message = document.createElement('p');

    message.textContent =
      '画像を長押しして保存してください';

    message.style.cssText = `
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.5;
      margin: 0 0 20px;
      text-align: center;
    `;


    // 完成画像
    const image = document.createElement('img');

    image.src = url;
    image.alt = '完成したアイコン';

    image.style.cssText = `
      display: block;
      width: min(100%, 512px);
      height: auto;
      border-radius: 8px;
      -webkit-touch-callout: default;
      -webkit-user-select: auto;
      user-select: auto;
    `;


    // 補足
    const subMessage = document.createElement('p');

    subMessage.textContent =
      '保存できない場合は、ブラウザで開いてお試しください。';

    subMessage.style.cssText = `
      color: #fff;
      font-size: 13px;
      line-height: 1.5;
      margin: 18px 0 0;
      text-align: center;
      opacity: 0.75;
    `;


    // 閉じるボタン
    const closeButton = document.createElement('button');

    closeButton.type = 'button';
    closeButton.textContent = '閉じる';

    closeButton.style.cssText = `
      margin-top: 22px;
      width: min(100%, 320px);
      min-height: 52px;
      border: 0;
      border-radius: 8px;
      background: #fff;
      color: #000;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    `;


    // 閉じる処理
    closeButton.addEventListener('click', () => {
      overlay.remove();
      URL.revokeObjectURL(url);
    });


    overlay.appendChild(message);
    overlay.appendChild(image);
    overlay.appendChild(subMessage);
    overlay.appendChild(closeButton);

    document.body.appendChild(overlay);

    notify('完成した画像を長押しして保存してください。');
  }
})();
