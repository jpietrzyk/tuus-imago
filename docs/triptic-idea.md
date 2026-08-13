
Mam taki problem do rozwiązania - kontekst: webowa appka w której można podzielić zdjęcie na 3 części (nazwijmy to tryptykiem). Mamy zdjęcie a'la panorama (dłuższa jest krawędź pozioma niż pionowa). Element tryptyku zawsze ma proporcję 2:3 i jak nazwa wskazuje - obejmujemy takimi równymi ramkami 2:3 tyle panoramicznego zdjęcia ile się da.
3 fragmenty tryptyku mają wspólną wewnętrzną krawędź (czyli możemy sobie wyobrazić że wydzielamy jak największy fragment naszej panoramy, który możemy objąć ramką 2:1  bo 6:3  bo 3 * 2/3).
Po wydzieleniu 3 fragmentów tryptyku, każdy z fragmentów oddzielamy od siebie. Ich zawartość pozostaje bez zmian. Czyli powiedzmy że mamy 3 sloty [0, 1 ,2], każdy zawiera fragment pierwotnego zdjęcia.
I teraz, możemy w poziomie i pionie każdy z fragmentów w slotach przesuwać w każdym kierunku, granicą jest granica pierwotnej panoramy.
Cały czas po połączeniu wewnętrznymi krawędziami osiągamy środkowy fragment pierwotnej panoramy.
Jak podejść do implementacji takiego podziału zdjęcia tak, żeby utrzymać połączenie między fragmentami również w przypadku zoom in / out.

---

Problem, który opisujesz, można elegancko rozwiązać, przechodząc z myślenia o "przycinaniu osobnych obrazków" na **matematyczny układ współrzędnych Canvasa/SVG (viewport/matrix transformations)**.

Kluczem do zachowania spójności (zwłaszcza przy Zoom In/Out oraz przesuwaniu) jest zasada: **wszystkie 3 sloty korzystają z jednego, dokładnie tego samego źródłowego obrazu panorama i tego samego globalnego poziomu skali (`zoom`), a zmienia się dla nich jedynie lokalny przesuw (`offset`) oraz nakładana maska.**
### 1. Architektura danych (Model Matematyczny)

Zamiast ciąć fizycznie plik graficzny (np. PNG) na 3 osobne pliki, traktujesz oryginał jako stałe tło, a sloty jako **trzy okna wizjera (viewporty)** o stałych proporcjach $2:3$.
#### a) Matematyczna budowa bazy

1. **Wymiary Slotu:** Proporcja $2:3$ (szerokość $W_{slot}$, wysokość $H_{slot}$).
2. **Proporcja całej ramki (3 sloty obok siebie):** Proporcja $6:3$, czyli $2:1$.
3. **Początkowe kadrowanie (Inicjalizacja):**

- Wyznaczasz z oryginalnej panoramy największy możliwy obszar o proporcji $2:1$.
- Wyznaczona w ten sposób wysokość $H_{fit}$ i szerokość $W_{fit} = 2 \cdot H_{fit}$ określają Twój bazowy punkt wyjścia (**zoom = 1.0**).
- Ten obszar $2:1$ dzielisz wzdłuż osi X na trzy równe części o szerokości $W_{part} = W_{fit} / 3$.
#### b) Stan każdego slotu (State per Slot)

Dla każdego slotu $i \in \{0, 1, 2\}$ przechowujesz w stanie aplikacji:
- `zoom`: ciągła wartość float (np. $1.0$ = domyślne idealne dopasowanie $2:1$, $>1.0$ = powiększenie). **Najlepiej trzymać ten sam `zoom` dla całego tryptyku**, by krawędzie i skala obiektów na przejściach między slotami zawsze do siebie pasowały.
- `panX`, `panY`: przesunięcie obrazu wewnątrz slotu (w pikselach oryginalnego obrazu lub we współrzędnych względnych $0..1$).
### 2. Logika Działania i Transformacji

Wyobraź sobie, że w każdym slocie renderujesz **ten sam oryginalny plik ze zdjęciem**, ale nakładasz na niego kontener z własnością `overflow: hidden` (maskę $2:3$) oraz odpowiednią transformację CSS/Canvas:
$$\text{Transformacja Slotu } i = \text{Baza Bazowa Slotu } i + \text{Lokalne przesunięcie (Pan)} + \text{Skala (Zoom)}$$
#### Wzór na pozycjonowanie obrazu w slocie $i$:

Dla danego slotu $i$ (gdzie $i = 0, 1, 2$):

1. **Baza początkowa (Domyślny Tryptyk):**
	Obraz przesunięty jest w lewo o $i \times W_{part}$, aby w slocie $0$ widzieć lewą część panoramy, w slocie $1$ środkową, a w slocie $2$ prawą.

2. **Uwzględnienie Zoomu:**
    Powiększenie aplikujemy względem środka kadru lub lewej krawędzi.

3. **Uwzględnienie Pan (Przesuwania):**
	Użytkownik przesuwa obraz w slocie $i$ o delta $(\Delta X_i, \Delta Y_i)$.

Dzięki temu, gdy w Slocie 0, 1 i 2 parametry $\Delta X$ oraz $\Delta Y$ wynoszą $(0,0)$, a `zoom` wynosi $1.0$ – po złączeniu slotów krawędziami otrzymujesz idealną, ciągłą panoramę $2:1$.
### 3. Walidacja Granic (Bounding Box / Constraints)

Skoro granicą przesuwania i zoomowania ma być **krawędź pierwotnej panoramy**, musisz ograniczać wartości `panX` i `panY` w zależności od aktualnego `zoom`.

Równanie warunku krawędzi dla pojedynczego slotu:

```ts
// Szerokość i wysokość widocznego wycinka w slocie przy danym zoomie:
const visibleWidth = W_part / zoom;
const visibleHeight = H_fit / zoom;

// Dozwolone zakresy przesunięcia (współrzędne lewego górnego rogu w źródłowym obrazie):
const minX = 0;
const maxX = panoramaWidth - visibleWidth;

const minY = 0;
const maxY = panoramaHeight - visibleHeight;

// Pozycja X dla slotu `i` z uwzględnieniem offsetu początkowego:
const defaultX = initialOffsetX + i * W_part;
const currentX = defaultX + panX_i;

// Clamping (przycinanie do granic):
const clampedX = Math.max(minX, Math.min(maxX, currentX));
```
### 4. Wykorzystanie w kodzie (React / HTML Canvas / CSS)

Najprostszą i najbardziej wydajną metodą w interfejsie webowym (np. w React/Vue) jest użycie **kontenerów z maską CSS** (`overflow: hidden`).
#### Koncepcja Componentu (CSS Transform):

```ts
// Komponent reprezentujący pojedynczy Slot Tryptyku
function TriptychSlot({ slotIndex, panoramaUrl, zoom, pan, slotBounds }) {
  // slotBounds = wymiary pojedynczego slotu na ekranie (np. 200px x 300px)
  // basePartWidth = szerokość 1/3 panoramy bazowej

  const style = {
    position: 'absolute',
    // 1. Przesunięcie wynikające z pozycji slotu (0, 1/3, 2/3)
    // 2. Przesunięcie manualne użytkownika (pan.x, pan.y)
    // 3. Powiększenie (zoom)
    transform: `scale(${zoom}) translate(${-(slotIndex * basePartWidth) + pan.x}px, ${pan.y}px)`,
    transformOrigin: 'top left',
  };

  return (
    <div className="slot-container" style={{ width: 200, height: 300, overflow: 'hidden' }}>
      <img src={panoramaUrl} style={style} draggable={false} />
    </div>
  );
}
```
### 5. Jak powiązać ze sobą Zoom / Pan między slotami?

Masz do wyboru dwie ścieżki UX zależnie od potrzeb aplikacji:

1. **Grupowy Zoom & Indywidualny Pan (Rekomendowane):**

    - **Zoom** jest globalny (zmieniając zoom w jednym slocie, zmienia się skala we wszystkich 3 slotach). Dzięki temu obiekty przechodzące przez krawędzie slotów zawsze zachowują tę samą skalę i proporcje.
    - **Pan (Przesuwanie)** jest niezależne dla każdego slotu – pozwala to użytkownikowi kadrować każdy ze slotów osobno, ale w ramach tej samej skali zdjęcia.

2. **Przycisk "Resetuj do spójnej panoramy":**

    - Jeśli użytkownik przesunie każdy slot w inną stronę, ciągłość obrazu zostanie przerwana. Warto dodać akcję, która przywraca: $\Delta X_0 = \Delta X_1 = \Delta X_2 = 0$ oraz $\Delta Y_0 = \Delta Y_1 = \Delta Y_2 = 0$. Wtedy, niezależnie od zoomu, połączenie krawędziowe natychmiast wraca.

### Podsumowanie kroku po kroku

1. **Nie tnij pliku źródłowego.** Trzymaj w pamięci jeden obrazek panoramy.
2. **Definiuj ramki wycinające (Viewporty)** o wymiarach 2:3 dla każdego ze slotów `[0, 1, 2]`.
3. **Ustaw domyślny offset X** dla slotu `0` na $0$, dla `1` na $1/3$ szerokości kadru 2:1, dla `2` na $2/3$.
4. **Steruj widokiem za pomocą macierzy przemieszczenia (`zoom`, `panX`, `panY`)** nakładanej na obraz w slocie.
5. Przy **eksporcie finalnym** (np. do druku/pobrania) użyj niewidocznego `<canvas>`, gdzie dla każdego slotu wycinasz fragment źródła używając przeliczonych współrzędnych `(clampedX, clampedY, visibleWidth, visibleHeight)` i zapisujesz jako 3 osobne pliki `.jpg`.
