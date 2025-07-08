# Regole di Protezione dei Branch

Questa guida descrive come configurare le regole di protezione per i branch principali (`main` e `develop`) di questo repository. Queste regole sono fondamentali per garantire la qualità e la stabilità del codice.

La configurazione va eseguita nelle impostazioni del repository su GitHub, sotto la sezione **Branches**.

## Configurazione

Per ogni branch (`main` e `develop`), creare una nuova regola di protezione con le seguenti impostazioni:

### 1. Nome del Branch
- **Branch name pattern**: `main` (e una regola separata per `develop`)

### 2. Richiedi una Pull Request prima del Merge
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: `1`
    - _Questo richiede che almeno un altro collaboratore approvi la PR._

### 3. Richiedi il Superamento degli Status Checks
- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
    - _Questo assicura che la PR sia sincronizzata con il branch di destinazione prima del merge._
  - Selezionare i seguenti status checks (se disponibili):
    - `build` (dal nostro workflow `ci.yml`)

### 4. Conversazioni da Risolvere
- ✅ **Require conversation resolution before merging**
  - _Questo impedisce il merge se ci sono commenti nella PR che sono ancora da risolvere._

### 5. Richiedi Commit Firmati (Opzionale)
- ☐ **Require signed commits**
  - _Questa opzione può essere abilitata per una maggiore sicurezza, ma richiede che tutti i collaboratori configurino la firma dei commit con GPG._

### 6. Impedisci Modifiche Forzate (Push forzati)
- ✅ **Do not allow bypassing the above settings**
  - _Assicura che le regole vengano applicate a tutti, inclusi gli amministratori._

---

## Esempio di Configurazione per il branch `main`

1. Vai su `Settings` > `Branches`.
2. Clicca su `Add branch protection rule`.
3. In `Branch name pattern`, inserisci `main`.
4. Abilita `Require a pull request before merging`.
   - Imposta `Required approving reviews` a `1`.
5. Abilita `Require status checks to pass before merging`.
   - Cerca e seleziona lo status check `build`.
6. Abilita `Require conversation resolution before merging`.
7. Clicca su `Create`.

**Ripeti la stessa procedura per il branch `develop`.** 