Najprostszy i najbardziej efektowny sposób polega na połączeniu **wielowarstwowego cienia (`box-shadow`)** z delikatną ramką simulate'ującą grubość szkła lub pleksi.

---

### Gotowy kod CSS (Efekt Antyramy)

Użycie dwóch warstw cienia daje miękkie rozproszenie na ścianie oraz ostra krawędź bezpośrednio pod obiektem.

```html
<div class="photo-frame">
  <img src="sciezka-do-zdjecia.jpg" alt="Miniatura">
</div>

```

```css
.photo-frame {
  display: inline-block;
  position: relative;

  /* 1. Ramka imitująca krawędź szkła antyramy */
  padding: 1px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 2px; /* Lekkie zaokrąglenie krawędzi szkła */

  /* 2. Wielowarstwowy cień (Ostrość blisko + miękkie rozproszenie dalej) */
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.12),   /* Cień krawędziowy (tuż przy ścianie) */
    0 10px 20px rgba(0, 0, 0, 0.22),  /* Główny, miękki cień zawieszenia */
    0 20px 35px rgba(0, 0, 0, 0.15);  /* Bardzo miękkie rozproszenie światła */

  /* 3. Subtelne odchylenie w przestrzeni (opcjonalnie) */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.photo-frame img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* Opcjonalny efekt po najechaniu myszką – lekki "dźwig" obrazu */
.photo-frame:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 15px 30px rgba(0, 0, 0, 0.28),
    0 30px 45px rgba(0, 0, 0, 0.18);
}

```

---

### Kluczowe elementy tego efektu

1. **Podwójny/Potrójny `box-shadow**`: Jedna warstwa cienia wygląda płasko. Połączenie wąskiego, ciemniejszego cienia z szerokim, półprzezroczystym rozmyciem buduje iluzję odległości od ściany.
2. **Krawędź Szkła**: Wąski `border` lub `padding` z półprzezroczystym białym i czarnym odcieniem imituje refleks światła na ściętej krawędzi antyramy.
3. **Refleks na szkle (dla zaawansowanych)**: Możesz dodać gradient jako nakładkę na zdjęcie (`::after`), tworząc skośny, delikatny połysk (np. `background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%)`).
