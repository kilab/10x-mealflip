# Dokument wymagań produktu (PRD) - Aplikacja do losowania pomysłu na obiad
## 1. Przegląd produktu
Cel: umożliwić użytkownikowi szybki wybór pomysłu na obiad poprzez jedno kliknięcie losowania, z opcjonalnymi prostymi filtrami czasu i diety. Aplikacja działa jako PWA, wymaga zalogowania w momencie losowania i korzysta z TheMealDB jako głównego źródła przepisów, z lokalnym cache i importem do znormalizowanej bazy.

Zakres MVP w skrócie:
- Web PWA z onboardingiem filtrów (czas, dieta) i akcją Losuj za bramką logowania.
- Losowanie przepisu z mechaniką różnorodności (seed, wykluczenia, limit rerolli, „Ukryj na zawsze”) oraz „Daily pick”.
- Widok przepisu z danymi (składniki, instrukcje, obraz) i atrybucją do TheMealDB.
- Zapisy do ulubionych, historia, udostępnianie stron przepisu (SSR, no-index jeśli wymagane).
- Podstawowy offline: ostatnio wylosowany przepis i shell PWA.
- Panel admina minimum: kuracja, blokady, korekta tagów.
- Analityka zdarzeń i KPI dla czasu decyzji, aktywacji, retencji oraz wydajności.

Źródło przepisów: TheMealDB jako główne API z importem do lokalnej bazy i cache obrazów. Rozważenie planu premium przy limitach API. Odwołania: [TheMealDB](https://www.themealdb.com/), [API docs](https://www.themealdb.com/api.php)

Środowiska i wdrożenia: dev i prod, bez staging; podglądy PR (ephemeral) i canary rollout 10% przed pełnym wdrożeniem.

Technologie i założenia (ograniczenia wykonawcze):
- Frontend: Astro 5 + React 19, TypeScript 5, Tailwind 4, shadcn/ui.
- Backend: Supabase (PostgreSQL, Auth, Storage). Wyłącznie znormalizowany model danych.
- Rendering: SSG dla treści publicznych, SSR dla strefy po zalogowaniu oraz stron udostępnianych.
- Hosting: DigitalOcean (Docker). CI/CD: GitHub Actions (lint, test, build, skan sekretów).

Monetyzacja: plan premium w późniejszym etapie; MVP bez płatności.

## 2. Problem użytkownika
Użytkownicy często tracą czas na podjęcie decyzji „co na obiad”, co prowadzi do frustracji i odkładania decyzji. Potrzebują szybkiej, sensownej propozycji dopasowanej do podstawowych ograniczeń (czas przygotowania, dieta), z możliwością szybkiej zmiany propozycji i zapisania wybranych przepisów na przyszłość. Produkt ma skrócić czas decyzji i zmniejszyć obciążenie decyzyjne, niezależnie od tego, kim jest użytkownik.

## 3. Wymagania funkcjonalne
3.1 Autentykacja i dostęp
- Konto jest wymagane przy akcji Losuj (publiczny landing, bramka logowania na działaniu Losuj).
- Metody logowania MVP: magic link e‑mail oraz Google. Apple w etapie późniejszym. Brak 2FA w MVP.
- Magic link: ważność 10 minut, rate limit 3/min. Wysyłka przez dedykowany SMTP (np. Postmark/Resend) z poprawną konfiguracją DKIM/SPF.
- Account linking: automatyczne łączenie kont po tym samym e‑mailu; brak duplikatów.

3.2 Filtry i preferencje
- Filtry MVP: czas przygotowania i dieta.
- Bucket czasu: ≤15, ≤30, ≤45, 60+ minut. Domyślnie 30 minut.
- Diety: wegetariańska, wegańska, bezglutenowa, bezlaktozowa. Domyślnie brak ograniczeń.
- Filtry wielokrotnego wyboru; preferencje zapisywane per użytkownik.

3.3 Losowanie i różnorodność
- Losowanie sterowane seedem na bazie userId + data + aktywne filtry.
- Wykluczenia: brak powtórek z ostatnich 20 wyników per użytkownik.
- Limit miękki 5 rerolli na sesję; komunikat po przekroczeniu.
- Funkcja „Ukryj na zawsze” dodaje przepis do czarnej listy użytkownika.
- „Daily pick”: propozycja stała na 24h zgodna z filtrami użytkownika.

3.4 Widok przepisu i interakcje
- Widok zawiera: tytuł, obraz, listę składników z miarami, instrukcje, źródło i atrybucję do TheMealDB.
- Akcje: Reroll, Zapisz do ulubionych, Udostępnij, Ukryj na zawsze.
- Udostępnianie: publiczna strona przepisu (SSR) z atrybucją; no-index jeśli wymagane przez licencję.

3.5 Jakość wyników
- Scoring przepisu na podstawie: kompletności pól, jakości obrazu, czasu przygotowania, liczby składników (preferencja ≤12), reputacji źródła.
- Progi jakości: odrzucanie wyników poniżej ustalonego progu.
- Feedback negatywny („To nie dla mnie”) obniża ranking dla danego użytkownika i globalnie w granicach rozsądku.

3.6 PWA i offline
- Pre‑cache shell UI i zasoby krytyczne; strategia stale‑while‑revalidate dla danych.
- Pamięć ostatnio wylosowanego przepisu do działania offline.
- Instalowalna PWA z promptem i wskaźnikiem instalacji.

3.7 Analityka i obserwowalność
- Taksonomia zdarzeń: login_success, draw_click, reroll, filter_change, save_recipe, share_click, pwa_install, api_error.
- Własność zdarzeń: aktywne filtry oraz time_to_decision.
- Retencja zdarzeń: 12 miesięcy. Minimalizacja PII. Alerty błędów (Sentry) i progi SLO.

3.8 Panel admina i moderacja
- Panel w ścieżce /admin dla roli admin (RLS bypass) z logiem audytowym.
- Funkcje: podgląd zgłoszeń, blokowanie przepisów, korekta tagów diety i estymacji czasu.

3.9 Synchronizacja treści i źródła zewnętrzne
- Główne źródło: TheMealDB; endpointy random/lookup. Import startowy (snapshot) i cotygodniowe inkrementy w nocy (ok. 02:00 UTC) w paczkach po ~200.
- Deduplikacja po znormalizowanym tytule i składnikach; wersjonowanie rekordów.
- Cache obrazów w Supabase Storage; transkodowanie do WebP; CDN TTL 7 dni.
- Fallback przy niedostępności API: lokalny pakiet 50–100 przepisów.

3.10 Model danych i indeksy (tylko znormalizowany)
- Tabele: recipes, ingredients, recipe_ingredients, users, favorites, user_hidden_recipes, draw_history, attributions.
- Kluczowe pola recipes: title, image_url, instructions, diet_flags, prep_time_estimate, quality_score, source, source_id, version.
- Indeksy pod filtry: diet_flags, prep_time_estimate; klucze obce w relacjach składników.

## 4. Granice produktu
W zakresie MVP:
- Losowanie przepisu z filtrami czas/dieta, rerolle, wykluczenia, „Daily pick”, „Ukryj na zawsze”.
- Zapis ulubionych, historia, udostępnianie SSR.
- Wymagane konto przy „Losuj” z magic link + Google.
- PWA z offline dla ostatniego przepisu.
- Panel admina minimum, analityka zdarzeń i KPI, podstawowe alertowanie.

Poza zakresem MVP:
- Płatne plany premium, listy zakupów, plan tygodniowy posiłków, dodatkowe zaawansowane filtry (budżet, sprzęt kuchenny, alergie rozszerzone poza diet_flags).
- Integracje e-commerce lub dostaw zakupów.
- Logowanie Apple i 2FA.
- Staging jako środowisko stałe.

Ograniczenia i założenia wykonawcze:
- Tylko środowiska dev i prod; podglądy PR dla walidacji zmian, canary 10% przed pełnym rolloutem.
- TheMealDB jako źródło danych; atrybucja źródła i obrazów jest wymagana, możliwy upgrade do planu premium.
- Polityka prywatności i zgodność z RODO: minimalne PII, RLS w Supabase, mechanizm eksportu i usunięcia danych.
- UI w języku polskim; treści TheMealDB w oryginale na MVP, tłumaczenia w późniejszym etapie.

Ryzyka i mitigacje (wysokopoziomowo):
- Limity/awarie API: lokalny cache i pakiet startowy, circuit breaker.
- Jakość treści: scoring, progi, feedback użytkowników i kuracja admina.
- Licencje/obrazy: wyraźna atrybucja, cache po naszej stronie, filtr źródeł.
- Wydajność mobile: PWA, SWR, optymalizacja obrazów, KPI wydajności.

## 5. Historyjki użytkowników
- ID: US-001
  - Tytuł: Logowanie magic link
  - Opis: Jako użytkownik chcę zalogować się linkiem e‑mail, aby bez hasła uzyskać dostęp do losowania.
  - Kryteria akceptacji:
    - Link ważny 10 minut, pojedynczego użycia, komunikat po wygaśnięciu.
    - Rate limit 3/min na adres i IP.
    - Po zalogowaniu wracam do ostatnio odwiedzanej strony i mogę kliknąć Losuj.

- ID: US-002
  - Tytuł: Logowanie Google
  - Opis: Jako użytkownik chcę zalogować się kontem Google, aby szybko rozpocząć korzystanie z aplikacji.
  - Kryteria akceptacji:
    - Udane logowanie tworzy konto, jeśli nie istnieje.
    - Jeśli istnieje konto na ten sam e‑mail, jest łączone bez duplikatów.

- ID: US-003
  - Tytuł: Bramka logowania przy Losuj
  - Opis: Jako niezalogowany użytkownik po kliknięciu Losuj chcę zobaczyć modal logowania.
  - Kryteria akceptacji:
    - Modal oferuje magic link i Google.
    - Po zalogowaniu natychmiast wykonywane jest losowanie z aktualnymi filtrami.

- ID: US-004
  - Tytuł: Ustawienie filtrów w onboardingu
  - Opis: Jako nowy użytkownik chcę ustawić czas i dietę na starcie.
  - Kryteria akceptacji:
    - Dostępne bucket czasu: ≤15/30/45/60+.
    - Diety: wegetariańska, wegańska, bezglutenowa, bezlaktozowa.
    - Domyślne: 30 minut, brak diety.

- ID: US-005
  - Tytuł: Zmiana filtrów w aplikacji
  - Opis: Jako użytkownik chcę w dowolnym momencie zmienić czas i dietę.
  - Kryteria akceptacji:
    - Zmiana filtrów wpływa na kolejne losowania i daily pick.
    - Preferencje zapisane w profilu.

- ID: US-006
  - Tytuł: Losowanie przepisu
  - Opis: Jako użytkownik chcę wylosować przepis zgodny z filtrami.
  - Kryteria akceptacji:
    - Wynik w czasie do 60 s w ≥70% sesji.
    - Brak powtórki z ostatnich 20 wyników.
    - Widok przepisu zawiera tytuł, obraz, składniki, instrukcje, atrybucję.

- ID: US-007
  - Tytuł: Reroll z limitem
  - Opis: Jako użytkownik chcę ponawiać losowanie do 5 razy na sesję.
  - Kryteria akceptacji:
    - Licznik rerolli zmniejsza się po każdym ponowieniu.
    - Po przekroczeniu limitu pojawia się komunikat i brak dalszych rerolli.

- ID: US-008
  - Tytuł: Daily pick
  - Opis: Jako użytkownik chcę mieć stałą propozycję na 24h zgodną z filtrami.
  - Kryteria akceptacji:
    - Daily pick odświeża się raz dziennie na użytkownika.
    - Nie koliduje z licznikiem rerolli.

- ID: US-009
  - Tytuł: Ukryj na zawsze
  - Opis: Jako użytkownik chcę ukryć przepisy, których nie chcę widzieć ponownie.
  - Kryteria akceptacji:
    - Przepis trafia na listę wykluczeń użytkownika.
    - Wykluczenia są respektowane we wszystkich losowaniach.

- ID: US-010
  - Tytuł: Podgląd przepisu
  - Opis: Jako użytkownik chcę zobaczyć kompletne szczegóły przepisu.
  - Kryteria akceptacji:
    - Widok zawiera składniki z miarami, instrukcje, obraz i źródło.
    - Atrybucja TheMealDB i link do oryginału są widoczne.

- ID: US-011
  - Tytuł: Zapis do ulubionych
  - Opis: Jako użytkownik chcę zapisać przepis, by wrócić do niego później.
  - Kryteria akceptacji:
    - Kliknięcie Zapisz dodaje do favorites użytkownika.
    - Lista ulubionych jest dostępna w profilu.

- ID: US-012
  - Tytuł: Historia wylosowanych
  - Opis: Jako użytkownik chcę zobaczyć listę ostatnich 50 wyników.
  - Kryteria akceptacji:
    - Historia zawiera tytuł, miniaturę, datę.
    - TTL rekordów historii 30 dni.

- ID: US-013
  - Tytuł: Udostępnienie przepisu
  - Opis: Jako użytkownik chcę udostępnić publiczny link do przepisu.
  - Kryteria akceptacji:
    - Link prowadzi do SSR strony przepisu z atrybucją.
    - Strona może mieć no-index zgodnie z wymogami licencji.

- ID: US-014
  - Tytuł: Instalacja PWA
  - Opis: Jako użytkownik chcę zainstalować aplikację na urządzeniu.
  - Kryteria akceptacji:
    - PWA spełnia kryteria instalacji i wyświetla prompt.
    - Po instalacji aplikacja działa bez adresu URL w przeglądarce.

- ID: US-015
  - Tytuł: Offline ostatni przepis
  - Opis: Jako użytkownik chcę mieć dostęp do ostatnio wylosowanego przepisu bez internetu.
  - Kryteria akceptacji:
    - Ostatni wynik i shell UI działają offline.
    - Po odzyskaniu sieci dane odświeżają się w tle.

- ID: US-016
  - Tytuł: Błędy API i fallback
  - Opis: Jako użytkownik w razie awarii zewnętrznego API chcę nadal otrzymać propozycję.
  - Kryteria akceptacji:
    - Aplikacja używa lokalnego pakietu przepisów jako fallback.
    - Użytkownik widzi przyjazny komunikat i może zmienić filtry.

- ID: US-017
  - Tytuł: Zgłoszenie problemu z przepisem
  - Opis: Jako użytkownik chcę zgłosić błąd w przepisie.
  - Kryteria akceptacji:
    - Formularz zgłoszenia z kategorią i komentarzem.
    - Zgłoszenie trafia do panelu admina.

- ID: US-018
  - Tytuł: Panel admina – moderacja
  - Opis: Jako admin chcę przeglądać zgłoszenia, blokować przepisy i korygować tagi.
  - Kryteria akceptacji:
    - Dostęp tylko dla roli admin, log audytowy każdej akcji.
    - Zmiany od razu wpływają na losowania i widoki.

- ID: US-019
  - Tytuł: Zarządzanie kontem i wylogowanie
  - Opis: Jako użytkownik chcę zobaczyć status logowania i się wylogować.
  - Kryteria akceptacji:
    - Widoczne dane profilu i przycisk Wyloguj.
    - Po wylogowaniu akcja Losuj ponownie wymaga logowania.

- ID: US-020
  - Tytuł: Prywatność – eksport/usunięcie danych
  - Opis: Jako użytkownik chcę zażądać eksportu lub usunięcia danych.
  - Kryteria akceptacji:
    - Formularz żądania; potwierdzenie mailowe.
    - Dane są eksportowane/usuwane w zgodzie z RODO.

- ID: US-021
  - Tytuł: Akceptacja regulaminu i polityki prywatności
  - Opis: Jako użytkownik chcę zaakceptować regulamin i politykę prywatności przy pierwszym logowaniu.
  - Kryteria akceptacji:
    - Checkboxy akceptacji; odsyłacze do dokumentów.
    - Brak dalszego korzystania bez akceptacji.

- ID: US-022
  - Tytuł: Ustawienia preferencji
  - Opis: Jako użytkownik chcę zapisać domyślne filtry i preferencje.
  - Kryteria akceptacji:
    - Zmiany zapisują się automatycznie w profilu.
    - Nowe losowania używają preferencji.

- ID: US-023
  - Tytuł: Łączenie kont po e‑mailu
  - Opis: Jako użytkownik z kontem e‑mail chcę podłączyć Google bez duplikowania konta.
  - Kryteria akceptacji:
    - System wykrywa ten sam e‑mail i łączy konta.
    - W razie konfliktu oferuje bezpieczne połączenie.

- ID: US-024
  - Tytuł: Limit rerolli – komunikacja
  - Opis: Jako użytkownik po przekroczeniu limitu chcę zrozumiałą informację o ograniczeniu.
  - Kryteria akceptacji:
    - Wyświetla się komunikat z powodem i sugestią zmiany filtrów.
    - Brak dalszych rerolli w tej sesji.

## 6. Metryki sukcesu
North Star:
- Co najmniej 70% sesji kończy decyzją w czasie do 60 sekund.

Aktywacja i zaangażowanie:
- Skuteczność logowania (aktywacja) co najmniej 75%.
- Mediana rerolli 2.
- Zapis przepisu w co najmniej 25% sesji z wynikiem.

Retencja:
- D1 co najmniej 20%, D7 co najmniej 8%.

Wydajność i niezawodność:
- P50 TTI ≤ 1.5 s, P95 TTI ≤ 3 s.
- LCP ≤ 2.5 s.
- 5xx < 0.5% żądań.
- PWA install eligible co najmniej 10% użytkowników kwalifikowanych.

Analityka i instrumentacja:
- Zdarzenia: login_success, draw_click, reroll, filter_change, save_recipe, share_click, pwa_install, api_error z właściwościami filtry oraz time_to_decision.
- Retencja danych zdarzeń: 12 miesięcy; minimalna PII; zgodność z RODO.

Wymogi zgodności i legalne:
- Widoczna atrybucja TheMealDB na stronach przepisu i udostępnianych stronach.
- Dostępne mechanizmy zgłaszania treści oraz eksportu/usunięcia danych.

Zależności i gotowość operacyjna:
- Dostępność 99.5% miesięcznie; p95 TTFB ≤ 500 ms dla SSR.
- Alerty błędów do kanału operacyjnego; przeglądy tygodniowe budżetu błędów.

Odwołania do źródeł zewnętrznych:
- TheMealDB: [https://www.themealdb.com/](https://www.themealdb.com/)
- TheMealDB API: [https://www.themealdb.com/api.php](https://www.themealdb.com/api.php)


