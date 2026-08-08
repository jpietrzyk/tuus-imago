-- Content pages (legal, info, payments). Replaces the local content/legal/*.md files.
-- Source of truth for storefront content; baked into the bundle at build time by the
-- Vite content plugin (virtual:tuus-content) and edited via the admin "Content" section.
create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  icon text not null default 'FileText',
  menu_section text not null check (menu_section in ('legal', 'payments', 'company')) default 'legal',
  menu_order int not null default 99,
  last_updated date,
  body text not null default '',
  lang text not null default 'pl',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_pages enable row level security;

-- Public may read published pages only. Writes are performed with the service key
-- (admin-api gateway + build-time fetch), which bypasses RLS.
create policy content_pages_public_read
  on public.content_pages
  for select
  using (is_published = true);

create or replace function public.handle_content_pages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger content_pages_updated_at_trigger
  before update on public.content_pages
  for each row
  execute function public.handle_content_pages_updated_at();

-- Seed the existing pages (migrated verbatim from content/legal/*.md frontmatter + body).
insert into public.content_pages (slug, title, subtitle, icon, menu_section, menu_order, last_updated, body) values
('about', 'O nas', 'Dowiedz się więcej o Tuus Imago i naszej misji', 'Building2', 'company', 1, '2025-02-01', $md$
## Nasza misja

W Tuus Imago wierzymy, że każde zdjęcie opowiada unikalną historię. Naszą misją jest pomaganie Ci w zachowaniu i ulepszeniu Twoich najcenniejszych wspomnień dzięki najnowocześniejszej technologii AI i premiumowym usługom drukowania na płótnie.

## Nasza historia

Założona w 2024 roku, Tuus Imago powstała z pasji do fotografii i wizji udostępnienia profesjonalnego ulepszania zdjęć wszystkim. Łączymy lata doświadczeń w cyfrowym obrazowaniu z najnowocześniejszą sztuczną inteligencją, aby dostarczać oszałamiające wyniki.

## Co robimy

**Ulepszanie AI:** Używamy zaawansowanej sztucznej inteligencji, aby automatycznie ulepszyć Twoje zdjęcia, poprawiając kolory, ostrość i ogólną jakość.

**Drukowanie na płótnie:** Twoje ulepszone zdjęcia są drukowane na premiumowym płótnie przy użyciu tuszów muzealnej jakości, które zapewniają żywe kolory na pokolenia.

**Niestandardowe ramy:** Wybierz spośród różnych opcji ramek, aby idealnie uzupełnić swoje dzieło sztuki i wystrój domu.

## Nasze wartości

* **Jakość w pierwszej kolejności:** Nigdy nie kompromitujemy jakości, od algorytmów ulepszania po proces drukowania i końcową dostawę.
* **Satysfakcja klienta:** Twoje szczęście jest naszym priorytetem. Ciężko pracujemy, aby upewnić się, że pokochasz każde zdjęcie, które otrzymasz.
* **Innowacja:** Ciągle inwestujemy w najnowsze technologie AI i obrazowania, aby przynieść Ci najlepsze możliwe wyniki.
* **Zrównoważony rozwój:** Jesteśmy zaangażowani w środowiskowo odpowiedzialne praktyki, od ekologicznych tuszów do zrównoważonych materiałów opakowaniowych.

## Skontaktuj się z nami

Masz pytania lub chcesz się dowiedzieć więcej? Chętnie usłyszymy od Ciebie!

* **E-mail:** [info@tuusimago.com](mailto:info@tuusimago.com)
* **Telefon:** 570-603-695
* **Adres:** ul. Wybickiego 48, 32-400 Myślenice

## Dane firmy

* **Nazwa firmy:** Car-folie.pl Adrian Uniszyn
* **NIP:** 6811882876
* **REGON:** 120769615
* **Adres siedziby:** ul. Wybickiego 48, 32-400 Myślenice
$md$),
('legal', 'Informacje prawne', 'Polityka prywatności i warunki korzystania z usług', 'FileText', 'legal', 1, '2025-02-01', $md$
## Polityka prywatności

W Tuus Imago traktujemy Twoją prywatność poważnie. Wszystkie przesłane zdjęcia są przetwarzane bezpiecznie i są używane wyłącznie do celów ulepszania AI i usług drukowania na płótnie.

**Zbieranie danych:** Zbieramy tylko zdjęcia, które przesyłasz, oraz wszelkie niezbędne informacje kontaktowe do dostarczania usług.

**Przechowywanie danych:** Twoje zdjęcia są bezpiecznie przechowywane na zaszyfrowanych serwerach chmurowych.

**Wykorzystanie danych:** Zdjęcia są używane wyłącznie do przetwarzania i dostarczania zamówień. Nigdy nie udostępniamy Twoich obrazów stronom trzecim bez wyraźnej zgody.

**Przechowywanie danych:** Twoje dane są przechowywane tylko tak długo, jak to konieczne do zrealizowania zamówienia i świadczenia obsługi klienta.

## Warunki korzystania z usług

Korzystając z naszych usług, zgadzasz się na następujące warunki.

**Korzystanie z usług:** Zgadzasz się używać naszych usług ulepszania AI i drukowania tylko do legalnych celów i zgodnie z niniejszymi Warunkami.

**Własność treści:** Zachowujesz pełną własność wszystkich przesłanych zdjęć. Tuus Imago otrzymuje ograniczoną licencję do przetwarzania i dostarczania Twoich zdjęć.

**Polityka zwrotów:** Zwroty są dostępne w ciągu 14 dni od dostawy, zgodnie z Ustawą o prawach konsumenta.

**Ograniczenie odpowiedzialności:** Nie ponosimy odpowiedzialności za żadne szkody wynikające z korzystania z naszych usług poza ceną zakupu Twojego zamówienia.

## Kontakt i wsparcie

W razie jakichkolwiek pytań dotyczących naszej polityki prywatności lub warunków korzystania z usług, prosimy o kontakt:

- **E-mail:** [info@tuusimago.com](mailto:info@tuusimago.com)
- **Telefon:** 570-603-695
- **Adres:** ul. Wybickiego 48, 32-400 Myślenice
$md$),
('terms', 'Warunki korzystania', 'Warunki użytkowania naszych usług', 'FileText', 'legal', 2, '2025-03-01', $md$
## 1. Przegląd warunków korzystania

Niniejsze Warunki korzystania (dalej: 'Warunki') określają zasady korzystania ze sklepu internetowego dostępnego pod adresem www.tuusimago.com (dalej: 'Sklep'). Sklep prowadzony jest przez Car-folie.pl Adrian Uniszyn z siedzibą pod adresem Myślenice, ul. Wybickiego 48, NIP: 6811882876, REGON: 120769615. Składając zamówienie w Sklepie, Klient akceptuje niniejsze Warunki w całości.

## 2. Zakres usług

Sklep oferuje usługi druku spersonalizowanego, w tym wydruki zdjęć, wydruki na płótnie, plakaty oraz inne produkty personalizowane. Oferujemy również usługi oprawiania i dodatkowe opcje wykończenia.

## 3. Proces składania zamówienia

1. Wybierz rodzaj i rozmiar produktu
2. Prześlij swoje zdjęcie lub grafikę
3. Wybierz opcje personalizacji (efekty, ramy itp.)
4. Dodaj do koszyka i przejdź do kasy
5. Wybierz metodę płatności i dostawy
6. Potwierdź zamówienie i dokonaj płatności

## 4. Ceny i płatności

Wszystkie ceny podane w Sklepie są w polskich złotych (PLN) i zawierają VAT. Cena końcowa jest potwierdzana przed złożeniem zamówienia. Akceptujemy płatności przez Przelewy24 (BLIK, przelewy bankowe, karty) oraz inne metody wskazane na stronie płatności.

Dodatkowe opłaty mogą dotyczyć ekspresowej realizacji lub specjalnych opcji wykończenia. Zostaną one wyraźnie wskazane przed potwierdzeniem zamówienia.

## 5. Warunki dostawy

Dostawa realizowana jest za pośrednictwem paczkomatów InPost na terenie całej Polski. Standardowy koszt dostawy wynosi 14,99 zł. Czas dostawy to 2-4 dni robocze od nadania. Obecnie nie realizujemy wysyłek zagranicznych.

Po nadaniu przesyłki Klienci otrzymują e-mail z numerem śledzenia.

## 6. Produkty i jakość

Używamy materiałów wysokiej jakości, w tym premium papieru fotograficznego, płótna i ramek. Produkty spersonalizowane są wykonywane według indywidualnych specyfikacji. Kolory mogą nieznacznie różnić się od wyświetlania na ekranie ze względu na kalibrację monitora.

## 7. Obowiązki Klienta

Klienci są zobowiązani do podawania prawidłowych informacji przy składaniu zamówień. Użytkownicy są odpowiedzialni za posiadanie praw do przesłanych grafik. Zabronione są treści naruszające prawa osób trzecich, treści nielegalne lub obraźliwe.

## 8. Własność intelektualna

Klient zachowuje własność przesłanych grafik. Przesyłając materiały, Klient udziela Sklepowi licencji na wykorzystanie grafik wyłącznie w celu realizacji zamówienia. Wszystkie treści, projekty i materiały Sklepu są chronione prawem autorskim i nie mogą być reprodukowane bez zgody.

## 9. Ograniczenie odpowiedzialności

Sklep nie ponosi odpowiedzialności za opóźnienia spowodowane okolicznościami pozostającymi poza naszą kontrolą (force majeure). Nasza odpowiedzialność jest ograniczona do wartości zamówionego produktu. Nie odpowiadamy za szkody pośrednie lub utracone zyski.

## 10. Force majeure

Żadna ze stron nie ponosi odpowiedzialności za niewykonanie zobowiązań z powodu okoliczności pozostających poza rozsądną kontrolą, w tym: klęski żywiołowe, wojna, strajki, działania rządowe, pandemie lub awarie infrastruktury.

## 11. Rozwiązanie umowy

Klient może odstąpić od umowy w ciągu 14 dni bez podania przyczyn (Ustawa o prawach konsumenta). Produkty wykonane według indywidualnych specyfikacji nie podlegają zwrotowi, chyba że są wadliwe. Aby odstąpić od umowy, należy powiadomić nas pisemnie na adres info@tuusimago.com.

## 12. Rozstrzyganie sporów

Wszelkie spory będą rozstrzygane przez polskie sądy powszechne właściwe dla miejsca zamieszkania Konsumenta. Konsumenci mogą również korzystać z pozasądowego rozstrzygania sporów poprzez platformę ODR UE (https://ec.europa.eu/consumers/odr/).

## 13. Rozpatrywanie reklamacji

### Podstawa prawna

Reklamacje rozpatrywane są na podstawie Ustawy o prawach konsumenta z dnia 30 maja 2014 r. (Dz.U. 2014 poz. 827 ze zm.), w szczególności art. 43a–43f, oraz przepisów Kodeksu cywilnego dotyczących rękojmi i gwarancji.

### Sposoby składania reklamacji

Reklamacje można składać:

- e-mailem na adres info@tuusimago.com
- poprzez [formularz reklamacji](/complaint) dostępny na naszej stronie internetowej
- pisemnie na adres: ul. Wybickiego 48, 32-400 Myślenice

### Wymagane informacje

Reklamacja powinna zawierać:

- imię i nazwisko konsumenta
- numer zamówienia
- opis wady lub problemu
- zdjęcia dokumentujące wadę (jeśli dotyczy)
- oczekiwany sposób rozwiązania (naprawa, wymiana, obniżenie ceny lub odstąpienie od umowy)

### Uprawnienia konsumenta (art. 43a–43f Ustawy o prawach konsumenta)

Zgodnie z art. 43a ust. 1 Ustawy o prawach konsumenta, konsument może złożyć oświadczenie o żądaniu:

1. **Naprawy** — usunięcie wady produktu
2. **Wymiany** — dostarczenie produktu wolnego od wad
3. **Obniżenia ceny** — proporcjonalne obniżenie ceny za produkt wadliwy
4. **Odstąpienia od umowy** — zwrot produktu i zwrot ceny, jeśli wada jest istotna

Sprzedawca może odmówić wymiany lub naprawy, gdy są one niemożliwe lub wymagają nadmiernych kosztów (art. 43c ust. 1). W takim przypadku konsument ma prawo żądać obniżenia ceny lub odstąpienia od umowy.

Jeśli konsument żąda naprawy lub wymiany, a sprzedawca nie ustosunkuje się do żądania w terminie 14 dni, uznaje się, że sprzedawca uznał żądanie za uzasadnione (art. 43c ust. 3).

### Termin rozpatrzenia reklamacji

Reklamacje rozpatrujemy w ciągu 14 dni od daty jej otrzymania. O wyniku rozpatrzenia informujemy konsumenta na piśmie lub innym trwałym nośniku.

### Pozasądowe rozstrzyganie sporów

W przypadku braku satysfakcjonującego rozpatrzenia reklamacji, konsument ma prawo skorzystać z pozasądowych metod rozstrzygania sporów:

- **Platforma ODR UE** — elektroniczne rozstrzyganie sporów konsumenckich: https://ec.europa.eu/consumers/odr/
- **Wojewódzki Inspektorat Inspekcji Handlowej (WIIH)** — właściwy dla miejsca wykonywania działalności przez sprzedawcę
- **UOKiK** — Urząd Ochrony Konkurencji i Konsumentów: www.uokik.gov.pl

Wadliwe produkty zostaną wymienione lub zwrócone.

## 14. Zmiany w Warunkach

Zastrzegamy sobie prawo do modyfikacji niniejszych Warunków. Zmiany będą publikowane na stronie Sklepu z co najmniej 14-dniowym wyprzedzeniem przed wejściem w życie. Zamówienia złożone przed wejściem w życie zmian podlegają poprzednim Warunkom.

## 15. Prawo właściwe

Niniejsze Warunki podlegają prawu polskiemu, w tym Kodeksowi cywilnemu, Ustawie o prawach konsumenta oraz RODO. W sprawach nieuregulowanych niniejszymi Warunkami stosuje się prawo polskie.

## 16. Prawa konsumenta

Konsumenci mają prawo do: odstąpienia od umowy w ciągu 14 dni, składania reklamacji, dostępu do danych osobowych, żądania sprostowania lub usunięcia danych, skarg do organu ochrony danych. Pełne informacje dostępne na www.uokik.gov.pl.

## 17. Kontakt

W sprawach dotyczących niniejszych Warunków prosimy o kontakt pod adresem info@tuusimago.com lub telefonicznie pod numerem 570-603-695.
$md$),
('privacy', 'Polityka prywatności', 'Jak chronimy Twoje dane osobowe', 'Shield', 'legal', 3, '2026-03-01', $md$
## Polityka prywatności - przegląd

Niniejsza Polityka prywatności opisuje sposób zbierania, wykorzystywania i ochrony Twoich danych osobowych zgodnie z Rozporządzeniem o Ochronie Danych Osobowych (RODO) oraz polskimi przepisami o ochronie danych. Zobowiązujemy się do zapewnienia bezpieczeństwa i poufności Twoich danych osobowych.

## Administrator danych

Administratorem Twoich danych osobowych jest:

- **Nazwa firmy:** Car-folie.pl Adrian Uniszyn
- **NIP:** 6811882876
- **REGON:** 120769615
- **Adres siedziby:** ul. Wybickiego 48, 32-400 Myślenice
- **Adres e-mail:** info@tuusimago.com
- **Telefon:** 570-603-695

## Rodzaje zbieranych danych osobowych

Zbieramy następujące rodzaje danych osobowych:

- Dane identyfikacyjne (imię, nazwisko)
- Dane kontaktowe (adres e-mail, numer telefonu, adres dostawy)
- Dane finansowe (informacje o płatnościach, dane konta bankowego do zwrotów)
- Dane transakcyjne (historia zamówień, zakupione produkty)
- Dane techniczne (adres IP, typ przeglądarki, informacje o urządzeniu)
- Dane komunikacyjne (korespondencja z działem obsługi klienta)

## Podstawa prawna przetwarzania

Przetwarzamy Twoje dane osobowe na podstawie następujących podstaw prawnych zgodnie z art. 6 RODO:

**Art. 6 ust. 1 lit. b) - Wykonanie umowy** — Przetwarzanie niezbędne do wykonania umowy, której stroną jesteś, np. realizacja zamówienia i dostawa.

**Art. 6 ust. 1 lit. c) - Obowiązek prawny** — Przetwarzanie niezbędne do wypełnienia obowiązku prawnego, np. wymogi podatkowe i księgowe.

**Art. 6 ust. 1 lit. f) - Prawnie uzasadniony interes** — Przetwarzanie niezbędne do realizacji naszego prawnie uzasadnionego interesu, np. doskonalenie usług i obsługa klienta.

## Cele przetwarzania danych

Wykorzystujemy Twoje dane osobowe w następujących celach:

- Realizacja i obsługa zamówień
- Dostawa towarów na wskazany adres
- Przetwarzanie płatności przez Przelewy24
- Obsługa klienta i obsługa zapytań
- Komunikaty marketingowe (tylko za Twoją zgodą)

## Udostępnianie danych

Możemy udostępniać Twoje dane osobowe następującym podmiotom zewnętrznym:

**Zaufani partnerzy:**

- Przelewy24 - usługi przetwarzania płatności
- InPost - usługi kurierskie i dostaw
- Dostawcy hostingu - przechowywanie danych i infrastruktura
- Usługi księgowe - sprawozdawczość finansowa i zgodność podatkowa

Nie sprzedajemy Twoich danych osobowych osobom trzecim.

## Okres przechowywania danych

Przechowujemy Twoje dane osobowe tylko przez okres niezbędny do realizacji celów, w których zostały zebrane:

- **Dane zamówień i transakcji** — 5 lat (wymogi podatkowe i księgowe)
- **Dane finansowe i płatności** — 5 lat (wymogi podatkowe i księgowe)
- **Dane marketingowe (jeśli wyrażono zgodę)** — Do momentu wycofania zgody
- **Dane analityczne i techniczne** — 2 lata

## Twoje prawa wynikające z RODO

Zgodnie z Rozporządzeniem o Ochronie Danych Osobowych przysługują Ci następujące prawa:

**Prawo dostępu** — Możesz żądać kopii swoich danych osobowych oraz informacji o sposobie ich przetwarzania.

**Prawo do sprostowania** — Możesz żądać poprawienia niedokładnych lub niekompletnych danych osobowych.

**Prawo do usunięcia** — Możesz żądać usunięcia swoich danych osobowych, gdy nie ma podstawy prawnej do ich przetwarzania.

**Prawo do ograniczenia** — Możesz żądać ograniczenia przetwarzania w określonych okolicznościach.

**Prawo do przenoszenia** — Możesz żądać swoich danych w ustrukturyzowanym, powszechnie używanym formacie nadającym się do odczytu maszynowego.

**Prawo do sprzeciwu** — Możesz wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie, w tym profilowaniu.

Aby skorzystać z któregokolwiek z tych praw, skontaktuj się z nami pod adresem info@tuusimago.com

## Polityka cookies

Nasza strona internetowa wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania i poprawy doświadczenia użytkownika.

**Niezbędne pliki cookies** — Niezbędne do prawidłowego działania strony. Te pliki umożliwiają podstawowe funkcje, takie jak nawigacja i dostęp do bezpiecznych obszarów.

**Pliki cookies analityczne** — Pomagają nam zrozumieć, jak odwiedzający korzystają z naszej strony, zbierając anonimowe informacje o wizytach i źródłach ruchu.

**Pliki cookies marketingowe** — Służą do śledzenia odwiedzających na różnych stronach w celu wyświetlania odpowiednich reklam. Te pliki cookies są ustawiane tylko za Twoją zgodą.

Możesz zarządzać preferencjami plików cookies poprzez ustawienia przeglądarki.

## Bezpieczeństwo danych

Wdrażamy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych osobowych:

- Szyfrowanie SSL/TLS danych podczas transmisji
- Bezpieczne serwery z kontrolą dostępu
- Regularne audyty bezpieczeństwa i aktualizacje
- Szkolenia pracowników z zakresu ochrony danych
- Procedury reagowania na incydenty

## Ochrona nieletnich

Nasze usługi nie są przeznaczone dla dzieci poniżej 16 roku życia. Nie zbieramy świadomie danych osobowych od nieletnich bez zgody rodziców.

## Zmiany w Polityce prywatności

Możemy aktualizować niniejszą Politykę prywatności od czasu do czasu. Wszelkie zmiany zostaną opublikowane na tej stronie z zaktualizowaną datą rewizji. Zachęcamy do okresowego przeglądu polityki.

## Dane kontaktowe

W przypadku jakichkolwiek pytań dotyczących niniejszej Polityki prywatności lub realizacji Twoich praw w zakresie ochrony danych, prosimy o kontakt:

- **Adres e-mail:** info@tuusimago.com
- **Numer telefonu:** 570-603-695

Odpowiemy na Twoje zapytanie w ciągu 30 dni.

W sprawach związanych z ochroną danych możesz się z nami skontaktować również pod adresem: info@tuusimago.com

## Prawo do wniesienia skargi

Jeśli uważasz, że Twoje prawa w zakresie ochrony danych zostały naruszone, masz prawo wnieść skargę do Urzędu Ochrony Danych Osobowych (UODO).
$md$),
('cookies', 'Polityka ciasteczek', 'Jak używamy ciasteczek na naszej stronie', 'Cookie', 'legal', 4, '2025-03-01', $md$
## Przegląd polityki ciasteczek

Niniejsza Polityka ciasteczek wyjaśnia, czym są ciasteczka, jakie ich rodzaje używamy, dlaczego je stosujemy oraz jak możesz zarządzać swoimi preferencjami. Korzystając z naszej strony internetowej, wyrażasz zgodę na używanie ciasteczek zgodnie z tą polityką.

## Czym są ciasteczka

Ciasteczka to małe pliki tekstowe przechowywane na Twoim komputerze lub urządzeniu mobilnym podczas odwiedzania strony internetowej. Pozwalają one stronie rozpoznać Twoje urządzenie i zapamiętać informacje o Twojej wizycie, takie jak preferowany język, dane logowania i inne ustawienia. Może to ułatwić kolejną wizytę i sprawić, że strona będzie bardziej użyteczna.

## Rodzaje ciasteczek, których używamy

### Niezbędne ciasteczka

Te ciasteczka są niezbędne do prawidłowego działania strony. Umożliwiają podstawowe funkcje, takie jak nawigacja, dostęp do bezpiecznych obszarów i zapamiętywanie Twoich preferencji. Strona nie może funkcjonować bez tych ciasteczek.

Przykłady: Ciasteczka sesyjne, ciasteczka uwierzytelniające, ciasteczka bezpieczeństwa

### Ciasteczka analityczne

Te ciasteczka pomagają nam zrozumieć, jak odwiedzający wchodzą w interakcję z naszą stroną, zbierając i raportując anonimowe informacje. Pomaga nam to poprawiać działanie strony i doświadczenie użytkownika.

Przykłady: Ciasteczka Google Analytics, czas trwania sesji, wizyty na stronie

### Ciasteczka funkcjonalne

Te ciasteczka umożliwiają rozszerzone funkcje i personalizację, takie jak czat na żywo i filmy. Mogą być ustawione przez nas lub przez zewnętrznych dostawców, których usług używamy.

Przykłady: Preferencje czatu, ustawienia odtwarzania filmów

### Ciasteczka marketingowe

Te ciasteczka służą do śledzenia odwiedzających na różnych stronach w celu wyświetlania reklam, które są istotne i angażujące dla poszczególnych użytkowników. Te ciasteczka są ustawiane tylko za Twoją wyraźną zgodą.

Przykłady: Ciasteczka reklamowe, ciasteczka remarketingowe

## Ciasteczka osób trzecich

Korzystamy z usług zewnętrznych, które mogą również ustawiać ciasteczka na Twoim urządzeniu. Obejmują one:

- Google Analytics - do analizy ruchu na stronie
- Przelewy24 - do przetwarzania płatności
- Cloudinary - do przesyłania i przetwarzania obrazów
- Widgety mediów społecznościowych - do funkcji udostępniania

## Czas przechowywania ciasteczek

- **Ciasteczka sesyjne** - są usuwane po zamknięciu przeglądarki
- **Ciasteczka trwałe** - pozostają na Twoim urządzeniu przez określony czas (zazwyczaj do 12 miesięcy)

## Zgoda na ciasteczka

Podczas pierwszej wizyty na naszej stronie zobaczysz baner ciasteczek, który pozwoli Ci zaakceptować lub odrzucić niezbędne ciasteczka. W każdej chwili możesz zmienić swoje preferencje, klikając link 'Ustawienia ciasteczek' w stopce.

Możesz wycofać swoją zgodę w dowolnym momencie, usuwając ciasteczka przeglądarki lub korzystając z naszych ustawień ciasteczek.

## Zarządzanie ciasteczkami

Możesz zarządzać preferencjami ciasteczek poprzez ustawienia przeglądarki internetowej. Większość przeglądarek pozwala na:

- Zablokowanie wszystkich ciasteczek
- Zablokowanie ciasteczek osób trzecich
- Usunięcie istniejących ciasteczek
- Powiadomienie o ustawieniu ciasteczek

Uwaga: Wyłączenie niezbędnych ciasteczek może wpłynąć na funkcjonalność naszej strony.

## Konsekwencje wyłączenia ciasteczek

Jeśli wyłączysz lub odrzucisz ciasteczka, niektóre części naszej strony mogą nie działać prawidłowo. Możesz nie mieć dostępu do niektórych funkcji, a niektóre usługi mogą nie działać zgodnie z przeznaczeniem. Niezbędne ciasteczka są wymagane do działania koszyka i procesu zamówienia.

## Aktualizacje polityki

Możemy aktualizować niniejszą Politykę ciasteczek od czasu do czasu, aby odzwierciedlić zmiany w naszych praktykach lub ze względów operacyjnych, prawnych lub regulacyjnych. Wszelkie zmiany zostaną zamieszczone na tej stronie, a data 'Ostatnia aktualizacja' zostanie zaktualizowana na dole.

## Kontakt

Jeśli masz pytania dotyczące naszej Polityki ciasteczek, skontaktuj się z nami pod adresem info@tuusimago.com.
$md$),
('consents', 'Zgody', 'Zgody użytkownika i uprawnienia', 'CheckCircle', 'legal', 5, '2025-02-01', $md$
## Przegląd zgód

Ta strona zawiera informacje o zgodach, które wyraziłeś na korzystanie z naszych usług. Szczegółowa treść zostanie dodana wkrótce.
$md$),
('security', 'Bezpieczeństwo', 'Jak chronimy Twoje informacje', 'Lock', 'legal', 6, '2025-02-01', $md$
## Przegląd bezpieczeństwa

Ta strona zawiera informacje o środkach bezpieczeństwa, które podejmujemy w celu ochrony Twoich informacji. Szczegółowa treść zostanie dodana wkrótce.
$md$),
('returns', 'Zwroty i reklamacje', 'Nasza polityka zwrotów i reklamacji', 'RotateCcw', 'legal', 7, '2025-03-01', $md$
## Regulamin zwrotów i reklamacji

Poniżej znajdują się szczegółowe informacje dotyczące procedury zwrotu towaru, składania reklamacji oraz przysługujących Ci praw jako konsumentowi.

## Prawo odstąpienia od umowy

Masz prawo odstąpić od umowy w terminie 14 dni od dnia otrzymania towaru bez podania przyczyny.

**Jak odstąpić od umowy:**

1. Wypełnij formularz odstąpienia od umowy (dostępny na naszej stronie lub poproś o niego e-mailem)
2. Odeślij towar na adres: ul. Wybickiego 48, 32-400 Myślenice
3. Odeślij nam wypełniony formularz e-mailem na adres: info@tuusimago.com

Termin zachowany, jeśli odeślesz towar przed upływem 14 dni.

## Koszty zwrotu

W przypadku odstąpienia od umowy ponosisz bezpośrednie koszty zwrotu towaru.

Towar musi być zwrócony w stanie niezmienionym, w oryginalnym opakowaniu.

## Zwrot pieniędzy

Zwrot pieniędzy nastąpi w ciągu 14 dni od dnia otrzymania zwróconego towaru lub dostarczenia dowodu jego odesłania.

Zwrot nastąpi tą samą metodą płatności, którą użyto przy zakupie.

Możemy wstrzymać się ze zwrotem pieniędzy do czasu otrzymania towaru lub do czasu dostarczenia dowodu jego odesłania.

## Stan towaru

Odpowiadasz za zmniejszenie wartości towaru wynikające z korzystania z niego w sposób inny niż było to konieczne do stwierdzenia charakteru, cech i funkcjonowania towaru.

## Reklamacja uszkodzonego lub wadliwego towaru

Jeśli otrzymany towar jest uszkodzony lub wadliwy, masz prawo złożyć reklamację na podstawie Ustawy o prawach konsumenta z dnia 30 maja 2014 r. (Dz.U. 2014 poz. 827 ze zm.), w szczególności art. 43a–43f, oraz przepisów Kodeksu cywilnego dotyczących rękojmi (art. 556–576 K.c.).

### Uprawnienia konsumenta (art. 43a–43f)

Zgodnie z art. 43a ust. 1 Ustawy o prawach konsumenta, jeżeli produkt ma wadę, konsument może złożyć oświadczenie o żądaniu:

1. **Naprawy** — usunięcie wady produktu
2. **Wymiany** — dostarczenie produktu wolnego od wad
3. **Obniżenia ceny** — proporcjonalne obniżenie ceny za produkt wadliwy
4. **Odstąpienia od umowy** — zwrot produktu i zwrot ceny, jeśli wada jest istotna

Sprzedawca może odmówić wymiany lub naprawy, gdy są one niemożliwe lub wymagają nadmiernych kosztów (art. 43c ust. 1). W takim przypadku konsument ma prawo żądać obniżenia ceny lub odstąpienia od umowy.

### Procedura reklamacji

1. Skontaktuj się z nami e-mailem na adres: info@tuusimago.com
2. Opisz problem i dołącz zdjęcia uszkodzenia
3. Rozpatrzymy reklamację w ciągu 14 dni od daty otrzymania
4. O wyniku rozpatrzenia informujemy na piśmie lub innym trwałym nośniku

Jeśli konsument żąda naprawy lub wymiany, a sprzedawca nie ustosunkuje się do żądania w terminie 14 dni, uznaje się, że sprzedawca uznał żądanie za uzasadnione (art. 43c ust. 3).

W przypadku reklamacji towaru koszty odesłania pokrywamy my.

### Pozasądowe rozstrzyganie sporów

W przypadku braku satysfakcjonującego rozpatrzenia reklamacji, konsument ma prawo skorzystać z pozasądowych metod rozstrzygania sporów:

- **Platforma ODR UE** — elektroniczne rozstrzyganie sporów konsumenckich: https://ec.europa.eu/consumers/odr/
- **Wojewódzki Inspektorat Inspekcji Handlowej (WIIH)** — właściwy dla miejsca wykonywania działalności przez sprzedawcę
- **UOKiK** — Urząd Ochrony Konkurencji i Konsumentów: www.uokik.gov.pl

## Formularz reklamacji

Możesz skorzystać z naszego formularza reklamacji dostępnego na stronie: [Formularz reklamacji](/legal/complaint)

## Kontakt

**Adres do zwrotów i reklamacji:**

- Car-folie.pl Adrian Uniszyn
- ul. Wybickiego 48
- 32-400 Myślenice
- **Telefon:** 570-603-695
- **E-mail:** info@tuusimago.com

Godziny pracy: poniedziałek-piątek 9:00-17:00

## Wyłączenia

Prawo odstąpienia od umowy nie przysługuje w przypadku:

- Towarów wykonanych na indywidualne zamówienie (np. produkty spersonalizowane)
- Towarów łatwo psujących się lub z krótkim terminem ważności
- Towarów dostarczanych w zapieczętowanych opakowaniach, których nie można zwrócić ze względu na ochronę zdrowia lub higienę

## Podstawa prawna

Polityka zwrotów i reklamacji oparta jest na Ustawie o prawach konsumenta z dnia 30 maja 2014 r.
$md$),
('shipping', 'Informacje o dostawie', 'Jak dostarczamy Twoje zamówienia', 'Truck', 'legal', 8, '2025-03-01', $md$
## Regulamin dostawy

Poniżej znajdują się szczegółowe informacje dotyczące metod dostawy, kosztów, czasów realizacji oraz procedur postępowania w przypadku niedostarczonej przesyłki.

## Dostawcy usług

- InPost Paczkomaty

## Koszty dostawy

- **Standardowa przesyłka** — 14,99 zł

## Czas realizacji

Termin realizacji wynosi 2-4 dni robocze od momentu wysłania zamówienia.

Czas liczony od dnia nadania przesyłki przez kuriera.

## Śledzenie przesyłki

Po wysłaniu zamówienia otrzymasz wiadomość e-mail z numerem przesyłki oraz linkiem do śledzenia jej statusu.

## Postępowanie w przypadku niedostarczonej przesyłki

W przypadku, gdy przesyłka nie zostanie dostarczona z powodu nieobecności odbiorcy lub podania błędnego adresu, kurier pozostawi zawiadomienie o próbie dostarczenia. Przesyłka zostanie przekazana do najbliższego punktu odbioru, gdzie będzie oczekiwać na odbiór przez 7 dni.

Procedura odbioru z punktu: prosimy udać się do wskazanego punktu odbioru z dowodem osobistym. W przypadku odbioru przez osobę trzecią, wymagane jest pełnomocnictwo.

Nie realizujemy wysyłek zagranicznych. Aktualnie dostawa dostępna jest tylko na terytorium Polski.
$md$),
('complaint', 'Formularz reklamacji', 'Złóż reklamację dotyczącą zamówienia', 'AlertCircle', 'legal', 9, '2025-03-01', $md$
## Informacje o reklamacjach

**Termin składania reklamacji** — Reklamacje można składać w ciągu 14 dni od otrzymania produktu zgodnie z polskim prawem konsumenckim.

**Czas odpowiedzi** — Odpowiemy na Twoją reklamację w ciągu 14 dni od daty jej otrzymania.

**Wymagane dokumenty** — Do rozpatrzenia reklamacji wymagane są: numer zamówienia, zdjęcie produktu, opis problemu i dowód zakupu.

## Podstawa prawna

Reklamacje rozpatrywane są na podstawie Ustawy o prawach konsumenta z dnia 30 maja 2014 r. (Dz.U. 2014 poz. 827 ze zm.), w szczególności art. 43a–43f, oraz przepisów Kodeksu cywilnego dotyczących rękojmi (art. 556–576 K.c.) i gwarancji (art. 577–581 K.c.).

## Uprawnienia konsumenta (art. 43a–43f)

Zgodnie z art. 43a ust. 1 Ustawy o prawach konsumenta, jeżeli produkt ma wadę, konsument może złożyć oświadczenie o żądaniu:

1. **Naprawa (art. 43a ust. 1 pkt 1)** — usunięcie wady produktu poprzez naprawę lub wymianę uszkodzonych elementów
2. **Wymiana (art. 43a ust. 1 pkt 2)** — dostarczenie produktu wolnego od wad w miejsce produktu wadliwego
3. **Obniżenie ceny (art. 43a ust. 1 pkt 3)** — proporcjonalne obniżenie ceny zapłaconej za produkt wadliwy
4. **Odstąpienie od umowy (art. 43a ust. 1 pkt 4)** — zwrot produktu i zwrot pełnej ceny zakupu, jeżeli wada jest istotna

### Ograniczenia

Zgodnie z art. 43c ust. 1, sprzedawca może odmówić wymiany lub naprawy, gdy:

- są one niemożliwe do wykonania
- wymagają nadmiernych kosztów w porównaniu z innym sposobem rozstrzygnięcia (obniżenie ceny lub odstąpienie od umowy)

W takim przypadku konsument ma prawo żądać obniżenia ceny lub odstąpienia od umowy.

### Termin ustosunkowania (art. 43c ust. 3)

Jeśli konsument żąda naprawy lub wymiany, a sprzedawca nie ustosunkuje się do żądania w terminie 14 dni od daty jego otrzymania, uznaje się, że sprzedawca uznał żądanie za uzasadnione.

### Koszty (art. 43e)

Sprzedawca ponosi koszty:

- wymiany lub naprawy produktu
- odesłania produktu do sprzedawcy po rozpatrzeniu reklamacji
- dostarczenia nowego produktu konsumentowi

## Procedura składania reklamacji

### Sposoby składania reklamacji

Reklamację można złożyć:

1. **Elektronicznie** — poprzez poniższy formularz reklamacji
2. **E-mailem** — na adres info@tuusimago.com
3. **Pisemnie** — na adres: ul. Wybickiego 48, 32-400 Myślenice

### Wymagane informacje

Prawidłowo złożona reklamacja powinna zawierać:

- Imię i nazwisko konsumenta
- Adres do korespondencji
- Numer zamówienia
- Opis wady lub problemu
- Zdjęcia dokumentujące wadę (jeśli dotyczy)
- Oczekiwany sposób rozwiązania (naprawa, wymiana, obniżenie ceny lub odstąpienie od umowy)

### Przebieg procedury

1. Konsument składa reklamację jednym z powyższych sposobów
2. Sprzedawca potwierdza otrzymanie reklamacji
3. Sprzedawca rozpatruje reklamację w terminie 14 dni od daty otrzymania
4. Sprzedawca informuje konsumenta o wyniku na piśmie lub innym trwałym nośniku
5. W przypadku uznania reklamacji, sprzedawca realizuje wybrane przez konsumenta rozwiązanie

## Pozasądowe rozstrzyganie sporów

W przypadku braku satysfakcjonującego rozpatrzenia reklamacji, konsument ma prawo skorzystać z pozasądowych metod rozstrzygania sporów:

- **Platforma ODR UE** — elektroniczne rozstrzyganie sporów konsumenckich na terenie Unii Europejskiej: https://ec.europa.eu/consumers/odr/
- **Wojewódzki Inspektorat Inspekcji Handlowej (WIIH)** — właściwy dla miejsca wykonywania działalności przez sprzedawcę
- **UOKiK** — Urząd Ochrony Konkurencji i Konsumentów, więcej informacji na: www.uokik.gov.pl
- **Stały Sąd Arbitrażowy przy Związku Rzemiosła Polskiego** — arbitraż konsumencki

Korzystanie z pozasądowych metod rozstrzygania sporów jest dobrowolne i nie wpływa na prawo dochodzenia roszczeń przed sądem.
$md$),
('payments', 'Płatności', 'Informacje o metodach płatności i bezpieczeństwie', 'BadgeDollarSign', 'payments', 1, '2025-03-01', $md$
## Metody płatności

### BLIK

Szybka i bezpieczna metoda płatności mobilnej. Użyj aplikacji bankowej, aby sfinalizować płatność w kilka sekund.

1. Wybierz BLIK jako metodę płatności
2. Wprowadź 6-cyfrowy kod BLIK w aplikacji bankowej
3. Potwierdź płatność w aplikacji bankowej

### Przelew tradycyjny

Standardowy przelew bankowy dostępny w większości polskich banków. Płatność zostanie zaksięgowana po zaksięgowaniu środków.

1. Wybierz swój bank z listy
2. Zaloguj się do bankowości internetowej i potwierdź płatność

### Karty płatnicze

Akceptujemy karty Visa, Mastercard, Maestro i inne. Płatności są przetwarzane bezpiecznie przez Przelewy24.

### Raty

Zapłać w ratach za pomocą PayPo lub Alior Raty. Dostępne dla zamówień powyżej 200 zł.

## Przetwarzanie płatności

**Czas przetwarzania** — Płatności BLIK są przetwarzane natychmiast. Przelewy tradycyjne są księgowane w ciągu 1-2 dni roboczych.

**Potwierdzenie zamówienia** — Po zaksięgowaniu płatności otrzymasz e-mail z potwierdzeniem zamówienia i numerem zamówienia.

## Bezpieczeństwo płatności

**Szyfrowanie SSL** — Wszystkie transakcje są chronione przez szyfrowanie SSL/TLS, co zapewnia bezpieczeństwo Twoich danych.

**Zgodność z PCI DSS** — Nasz operator płatności Przelewy24 jest zgodny ze standardem PCI DSS, co zapewnia najwyższy poziom bezpieczeństwa transakcji kartami.

**Ochrona danych** — Nie przechowujemy danych Twojej karty płatniczej. Wszystkie transakcje są przetwarzane przez Przelewy24.

## Zwroty płatności

**Proces zwrotu** — Zwroty są przetwarzane przez Przelewy24 i zwracane na tę samą metodę płatności, której użyto przy zakupie.

**Czas realizacji zwrotu** — Zwroty są przetwarzane w ciągu 14 dni roboczych od zatwierdzenia reklamacji.

**Metoda zwrotu** — Środki zostaną zwrócone na konto bankowe lub kartę używaną do płatności. Czas zaksięgowania zwrotu zależy od banku.

## Nieudana płatność

**Przyczyny nieudanej płatności** — Płatność może zostać odrzucona z powodu niewystarczających środków, błędnych danych karty, przekroczenia limitu lub problemów z połączeniem internetowym.

**Co zrobić?** — Sprawdź swoje dane i saldo, a następnie spróbuj ponownie. Jeśli problem się powtarza, skontaktuj się z nami lub swoim bankiem.

## Informacje o Przelewy24

Płatności są przetwarzane przez Przelewy24 - lidera polskiego rynku płatności internetowych. Kliknij poniżej, aby zapoznać się z regulaminem i polityką prywatności Przelewy24.

- Regulamin Przelewy24
- Polityka prywatności Przelewy24
$md$),
('contact', 'Kontakt', 'Skontaktuj się z naszym zespołem', 'Mail', 'company', 2, '2025-02-01', $md$
## Informacje kontaktowe

### Car-folie.pl Adrian Uniszyn
- **NIP:** 6811882876
- **REGON:** 120769615
- **E-mail:** info@tuusimago.com
- **Telefon:** 570-603-695
- **Adres:** ul. Wybickiego 48, 32-400 Myślenice

## Godziny pracy

Nasz zespół jest dostępny od poniedziałku do piątku, w godzinach 9:00 - 17:00 CET.
$md$)
on conflict (slug) do nothing;
