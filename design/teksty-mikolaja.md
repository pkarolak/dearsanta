# Teksty Świętego Mikołaja – ceremonia (PL)

Popraw tekst w liniach zaczynających się od `>` i daj znać, a przeniosę zmiany do aplikacji i nagram je na nowo. Klucz w nawiasie (np. `welcome1`) to nazwa kwestii w `messages/pl.json`, zostaw go bez zmian.

**Zmienne** w nawiasach klamrowych (np. `{title}`) aplikacja podmienia sama. Możesz je przestawiać w zdaniu, ale nie zmieniaj ich nazw.

Każda linijka to osobne nagranie i osobny napis na ekranie, z krótką pauzą po nim. Krótsze zdania brzmią naturalniej i łatwiej je przeczytać z napisów.

---

## 1. Zbiórka (lobby)

_Zanim Naczelnik elfów rozpocznie ceremonię. Na tablicy renifera jest kod QR._

- **`lobby1`**
  > Ho, ho, ho! Wchodźcie, wchodźcie i ogrzejcie dłonie przy kominku. Zeskanujcie kod, żeby dołączyć do mojego warsztatu.

## 2. Powitanie

- **`welcome1`**
  > Ho, ho, ho! Dobry wieczór, moi drodzy!

- **`welcome2`**
  > To ja, Święty Mikołaj. Dziś mój warsztat należy do was. Elfy wypolerowały każdy dzwoneczek i podgrzały kakao.

- **`welcome3`**
  > Spotykamy się na „{title}” i widzę tu {count, plural, one {jednego wspaniałego elfa} few {# wspaniałe elfy} many {# wspaniałych elfów} other {# wspaniałego elfa}}.
  
  ℹ️ `{title}` to nazwa sesji, `{count}` to liczba elfów. Część `{count, plural, …}` odmienia „elf” przez liczby: one = 1, few = 2–4, many = 5+, other = ułamki. Popraw same słowa w środku, a `#` zostaw, bo to miejsce na liczbę.

## 3. Elfy

_Na kole pojawiają się wszyscy uczestnicy._

- **`elves1`**
  > Pozwólcie, że dobrze wam się przyjrzę.

- **`elvesNames`** — _lista wszystkich imion_
  > {names}.
  
  ℹ️ Imiona czytane są z gotowych nagrań: „Patryk, Julka i Babcia Kasia.”. Lepiej zostawić tę kwestię jako samą listę.

- **`elves2`**
  > Co za wspaniała drużyna! Każde z was jest w tym roku na mojej liście grzecznych.

- **`elvesRemote`** — _tylko gdy ktoś ogląda zdalnie_
  > I ciepłe pozdrowienia dla tych, którzy są z nami z daleka: {names}. Świąteczna magia działa na każdą odległość.
  
  ℹ️ Fragmenty przed i po `{names}` są nagrane osobno. Po zmianie trzeba je nagrać ponownie, zrobię to.

## 4. Zasady

_Na tablicy renifera jest budżet._

- **`rules1`**
  > A teraz zasady warsztatu. Każde z was w tajemnicy dostanie jedną osobę, którą trzeba zaskoczyć prezentem.

- **`rulesExclusions`** — _gdy są pary, które się nie losują_
  > Nikt nie wylosuje siebie, a Naczelnik elfów zadbał, by niektóre pary się ominęły, żeby każda niespodzianka pozostała niespodzianką.

- **`rulesNoSelf`** — _gdy nie ma takich par (zamiast poprzedniej)_
  > Nikt nie wylosuje siebie, a każde imię ma dokładnie taką samą szansę.

- **`rulesBudget`** — _gdy jest ustalony budżet_
  > Prezent ma kosztować do {budget}. Liczy się myśl i odrobina brokatu.
  
  ℹ️ `{budget}` to kwota z walutą, np. „100 zł”.

- **`rulesNoBudget`** — _gdy nie ma budżetu (zamiast poprzedniej)_
  > Dziś nie ma limitu, ale pamiętajcie: najlepsze prezenty płyną prosto z serca.

- **`rules2`**
  > I najważniejsze: zachowajcie wynik w tajemnicy, aż prezenty zostaną otwarte!

## 5. Losowanie

_Koło się kręci. Na trzeciej kwestii zwalnia i staje._

- **`draw1`** — _dźwięk: dzwoneczki_
  > Elfy, na stanowiska! Niech zacznie się wielkie losowanie!

- **`draw2`** — _dźwięk: werbel_
  > Imiona wirują, dzwoneczki dzwonią…

- **`draw3`** — _dźwięk: dzwonek, koło się zatrzymuje_
  > Gotowe! Każde imię znalazło swojego elfa.

## 6. Odkrywanie

_Każdy rozpakowuje prezent na swoim telefonie._

- **`reveal1`**
  > Teraz spójrzcie na swoje urządzenia i trzymajcie je blisko siebie.

- **`reveal2`**
  > Przytrzymajcie prezent, żeby go rozpakować. Ciii, nikomu ani słowa!
  
  ℹ️ Musi pasować do gestu na telefonie: przytrzymanie prezentu.

## 7. Pożegnanie

_Na ekranie są linki do świątecznej muzyki._

- **`farewell1`**
  > To cała magia na dzisiejszy wieczór. Dziękuję, że odwiedziliście mój warsztat.

- **`farewell2`** — _Mikołaj się śmieje_
  > Wesołych Świąt, moje kochane elfy! Ho, ho, ho!

---

## Tryb „każdy w swoim czasie” (osobista wiadomość)

_Każdy odtwarza ją sam na swoim telefonie, kiedy losowanie jest już gotowe._

- **`personal1`**
  > Ho, ho, ho! Witaj, {name}!
  
  ℹ️ `{name}` to imię osoby, która ogląda.

- **`personal2`**
  > Elfy skończyły wielkie losowanie „{title}” i mam dla Ciebie mały sekret.
  
  ℹ️ `{title}` to nazwa sesji.

- **`personal3`** — _dźwięk: werbel, zaraz potem odsłonięcie_
  > Gotowe? No to słuchaj…

- **`personalReveal`** — _dźwięk: dzwonek_
  > W tym roku zaskoczysz… {receiver}!
  
  ℹ️ `{receiver}` to imię wylosowanej osoby.

- **`rulesBudget / rulesNoBudget`** — _te same co w zasadach powyżej_

- **`personalBye`**
  > Zachowaj to w tajemnicy i baw się dobrze. Ho, ho, ho!

---

Wszystkie kwestie razem to około 1786 znaków. Ponowne nagranie całości w ElevenLabs zużywa mniej więcej tyle samo kredytów, czyli ułamek miesięcznego limitu. Inne języki (en, de, es, pt) poprawię według polskiej wersji.
