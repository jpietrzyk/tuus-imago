This is most important part of our experiment. The `A'` , `B'`, `C'` should show exactly parts of panoramka covered by `A`, `B`, `C` mask parts. So `A'` `B'` `C'` should have same proportions as `A`, `B` and `C` , but can be scaled down (with content) - not need to have same size as panoramka parts.
I believe classic solution is to use **Canvas + `drawImage`**  with applying panoramka scale (in the future panoramka size can be adjusted to displaying device screen size)

#### Main idea

1. You have a main `<img>` and a container with `position: relative`.
2. On top of it lie divs with `position: absolute` (crop areas).
3. For each such div:
- calculate its position relative to the image,
- convert it to coordinates at the image's **native** resolution,
- draw this fragment on a separate canvas,
- place the canvas (or `toDataURL`) in a "slot" below/next to the main image.

#### Example conde

```html
<div id="image-wrapper" style="position: relative; display: inline-block;">
  <img id="main-img" src="twoje-zdjecie.jpg" style="display: block; max-width: 100%;">

  <!-- przykładowe obszary (możesz dodawać dynamicznie) -->
  <div class="crop-area" style="position: absolute; left: 50px; top: 80px; width: 120px; height: 90px; border: 2px solid red;"></div>
  <div class="crop-area" style="position: absolute; left: 200px; top: 150px; width: 80px; height: 110px; border: 2px solid blue;"></div>
</div>

<div id="crops-container" style="margin-top: 20px; display: flex; gap: 15px; flex-wrap: wrap;"></div>
```

```js
const img = document.getElementById('main-img');
const cropsContainer = document.getElementById('crops-container');

function createCropFromArea(areaEl) {
  // 1. Pozycja diva względem obrazka
  const imgRect = img.getBoundingClientRect();
  const areaRect = areaEl.getBoundingClientRect();

  const displayX = areaRect.left - imgRect.left;
  const displayY = areaRect.top  - imgRect.top;
  const displayW = areaRect.width;
  const displayH = areaRect.height;

  // 2. Skala (wyświetlany rozmiar → naturalny)
  const scaleX = img.naturalWidth  / img.width;
  const scaleY = img.naturalHeight / img.height;

  // 3. Współrzędne w naturalnej rozdzielczości
  const sx = displayX * scaleX;
  const sy = displayY * scaleY;
  const sw = displayW * scaleX;
  const sh = displayH * scaleY;

  // 4. Canvas o rozmiarze cropa (możesz dać większy, jeśli chcesz upscale)
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(sw);
  canvas.height = Math.round(sh);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    img,
    sx, sy, sw, sh,   // źródło (naturalne współrzędne)
    0, 0, canvas.width, canvas.height  // cel
  );

  // 5. Możesz zwrócić canvas albo DataURL
  return canvas;
  // return canvas.toDataURL('image/png');
}

// Funkcja, która generuje wszystkie cropy
function renderAllCrops() {
  cropsContainer.innerHTML = '';

  document.querySelectorAll('.crop-area').forEach((area, index) => {
    const cropCanvas = createCropFromArea(area);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'border: 1px solid #ccc; padding: 4px;';

    const label = document.createElement('div');
    label.textContent = `Crop #${index + 1}`;
    label.style.fontSize = '12px';
    label.style.marginBottom = '4px';

    wrapper.appendChild(label);
    wrapper.appendChild(cropCanvas);
    cropsContainer.appendChild(wrapper);
  });
}

// Czekamy aż obrazek się załaduje (ważne!)
if (img.complete) {
  renderAllCrops();
} else {
  img.addEventListener('load', renderAllCrops);
}

// Przykład dynamicznego dodawania obszaru
function addCropArea(x, y, w, h) {
  const area = document.createElement('div');
  area.className = 'crop-area';
  area.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${w}px;
    height: ${h}px;
    border: 2px solid lime;
    box-sizing: border-box;
    pointer-events: none; /* opcjonalnie */
  `;
  document.getElementById('image-wrapper').appendChild(area);
  renderAllCrops(); // odświeżamy sloty
}
```
### Important Notes

| Problem | Solution |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Image is scaled (CSS) | Always use `naturalWidth` / `naturalHeight` + scale |
| Divs have `border` / `box-sizing` | `getBoundingClientRect()` already accounts for this |
| Want a 1:1 relationship | Give each `.crop-area` a unique `data-id` and keep the map |
| Want live previews (no clicking) | Call `renderAllCrops()` after each div position/size change |
| CORS | If the image is from a different domain, it must have appropriate headers, otherwise the canvas will be "tainted" |
