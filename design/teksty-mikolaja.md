# Teksty Świętego Mikołaja – ceremonia (PL)

Popraw tekst w liniach zaczynających się od `>` i daj znać, a przeniosę zmiany do aplikacji i nagram je na nowo. Klucz w nawiasie (np. `welcome1`) to nazwa kwestii w `messages/pl.json`, zostaw go bez zmian.

**Zmienne** w nawiasach klamrowych (np. `{title}`) aplikacja podmienia sama. Możesz je przestawiać w zdaniu, ale nie zmieniaj ich nazw.

W częściach 1–4, 6 i 7 każde zdanie jest osobnym napisem na ekranie i osobnym nagraniem, z krótką pauzą po nim. Kwestie losowania (część 5) zostają w całości, bo koło staje na trzeciej z nich.

**Przebieg:** po kliknięciu „Rozpocznij ceremonię” Mikołaj mówi części 1 i 2, a na końcu pyta `welcomeAsk`. Na ekranie i u Naczelnika pojawia się przycisk „Tak, możemy zaczynać”. Części 3 i 4 lecą jedna po drugiej, zakończone pytaniem `rulesAsk` i przyciskiem „Losujemy!”. Części 5 i 6 też lecą same. Część 7 zaczyna się, gdy wszyscy rozpakują prezenty (Naczelnik ma też przycisk „Dalej”). Po ostatnim słowie Mikołaja zasuwa się kurtyna, zjeżdża napis „Wesołych Świąt!” i pojawiają się playlisty.

---

## 1. Zbiórka

_Zaraz po starcie ceremonii. Na tablicy renifera nadal jest kod QR, więc spóźnialscy mogą dołączyć._

- **`lobby1`**
  > Ho, ho, ho! Wchodźcie, wchodźcie i ogrzejcie dłonie przy kominku. Zeskanujcie kod, żeby dołączyć do mojego warsztatu.

## 2. Powitanie

- **`welcome1`**
  > Ho, ho, ho! Dobry wieczór, moi drodzy!

- **`welcome2`**
  > To ja, Święty Mikołaj. Dziś mój warsztat należy do was. Moi pomocnicy posprzątali, upiekli dla was ciasteczka i podgrzali kakao.

- **`welcome3`**
  > Widzę tu {count, plural, one {jednego nowego elfa} few {# nowe elfy} many {# nowych elfów} other {# nowego elfa}}.
  
  ℹ️ `{title}` to nazwa sesji, `{count}` to liczba elfów. Część `{count, plural, …}` odmienia „elf” przez liczby: one = 1, few = 2–4, many = 5+, other = ułamki. Popraw same słowa w środku, a `#` zostaw, bo to miejsce na liczbę.

- **`welcomeAsk`** — _pytanie: czeka na „Tak, możemy zaczynać”_
  > Czy jesteśmy już wszyscy?

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
  > I serdeczne pozdrowienia dla tych, którzy są z nami z daleka: {names}. Świąteczna magia działa na każdą odległość.
  
  ℹ️ Fragmenty przed i po `{names}` są nagrane osobno. Po zmianie trzeba je nagrać ponownie, zrobię to.

## 4. Zasady

_Na tablicy renifera jest budżet._

- **`rules1`**
  > A teraz zasady warsztatu. Każde z was w tajemnicy dostanie imię jednej osoby, którą w tym roku należy zaskoczyć prezentem.

- **`rulesExclusions`** — _gdy są pary, które się nie losują_
  > Oczywiście nikt nie wylosuje samego siebie, a Naczelnik elfów zadbał, by niektóre pary się ominęły, żeby każda niespodzianka pozostała niespodzianką. Nad uczciwym przebiegiem losowania czuwają Pani Mikołajowa i Rudolf.

- **`rulesNoSelf`** — _gdy nie ma takich par (zamiast poprzedniej)_
  > Oczywiście nikt nie wylosuje samego siebie. Nad uczciwym przebiegiem losowania czuwają Pani Mikołajowa i Rudolf.

- **`rulesBudget`** — _gdy jest ustalony budżet_
  > Prezent ma kosztować nie więcej niż {budget}. Liczy się dobry pomysł, polot i odrobina brokatu.
  
  ℹ️ `{budget}` to kwota z walutą, np. „100 zł”.

- **`rulesNoBudget`** — _gdy nie ma budżetu (zamiast poprzedniej)_
  > Nie ustaliliśmy ograniczenia na to, ile ma kosztować prezent, ale pamiętajcie – najlepsze prezenty płyną prosto z serca. Liczy się dobry pomysł, polot i odrobina brokatu.

- **`rules2`**
  > I najważniejsze: zachowajcie wynik w tajemnicy!

- **`rulesAsk`** — _pytanie: czeka na „Losujemy!”_
  > Gotowi na losowanie?

## 5. Losowanie

_Koło się kręci. Na trzeciej kwestii zwalnia i staje._

- **`draw1`** — _dźwięk: dzwoneczki_
  > Elfy, na stanowiska! Niech zacznie się wielkie losowanie!

- **`draw2`** — _dźwięk: werbel_
  > Imiona wirują, dzwoneczki dzwonią, koło fortuny przejmuje wielka skarpeta…

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

_Po ostatniej kwestii zasuwa się kurtyna, zjeżdża napis „Wesołych Świąt!” i pojawiają się linki do świątecznej muzyki._

- **`farewell1`**
  > To koniec losowania, ale niech nie opuszcza was świąteczna atmosfera. Przygotowaliśmy dla was kilka list świątecznych przebojów do posłuchania.

- **`farewell2`** — _Mikołaj się śmieje_
  > Dziękuję, że odwiedziliście mój warsztat. Wesołych Świąt, moje kochane elfy! Ho, ho, ho!

---

## Tryb „każdy w swoim czasie” (osobista wiadomość)

_Każdy odtwarza ją sam na swoim telefonie, kiedy losowanie jest już gotowe._

- **`personal1`**
  > Ho, ho, ho! Witaj, {name}!
  
  ℹ️ `{name}` to imię osoby, która ogląda.

- **`personal2`**
  > Elfy skończyły wielkie losowanie i mam dla Ciebie mały sekret.
  
  ℹ️ `{title}` to nazwa sesji.

- **`personal3`** — _dźwięk: werbel, zaraz potem odsłonięcie_
  > Gotowe? No to słuchaj…

- **`personalReveal`** — _dźwięk: dzwonek_
  > W tym roku {receiver} będzie osobą, którą zaskoczysz świątecznym prezentem!
  
  ℹ️ `{receiver}` to imię wylosowanej osoby.

- **`rulesBudget / rulesNoBudget`** — _te same co w zasadach powyżej_

- **`personalBye`**
  > Zachowaj to w tajemnicy i baw się dobrze. Ho, ho, ho!

---

Wszystkie kwestie razem to około 1786 znaków. Ponowne nagranie całości w ElevenLabs zużywa mniej więcej tyle samo kredytów, czyli ułamek miesięcznego limitu. Inne języki (en, de, es, pt) poprawię według polskiej wersji.
