# Contribuire a SORE V2

Prima di tutto, grazie per considerare di contribuire a questo progetto!

## Come Contribuire

1.  **Trova un issue su cui lavorare.** Controlla l' [issue tracker](https://github.com/payd3r/SORE-V2/issues) per le issue aperte.
2.  **Forka il repository.**
3.  **Crea un nuovo branch.** `git checkout -b feat/my-new-feature`
4.  **Apporta le tue modifiche.**
5.  **Committa le tue modifiche.** Usa messaggi di commit convenzionali (es. `feat:`, `fix:`, `docs:`).
    ```bash
    git commit -m "feat: Aggiunta nuova funzionalità"
    ```
6.  **Pusha le tue modifiche.** `git push origin feat/my-new-feature`
7.  **Crea una Pull Request.**
    - Compila il template della pull request.
    - Assicurati di collegare la pull request all'issue su cui stai lavorando.

## 📜 Politiche dei Branch

Per garantire la stabilità e la qualità del codice, i nostri branch principali (`main` e `develop`) sono protetti. Le seguenti regole devono essere configurate nelle impostazioni del repository di GitHub:

### Per i branch `main` e `develop`:
1.  **Richiedi una Pull Request prima del merge.**
    -   I push diretti sono disabilitati. Tutte le modifiche devono essere proposte tramite una Pull Request.
2.  **Richiedi il superamento dei controlli di stato (Status Checks).**
    -   La PR può essere unita solo se il workflow di CI (`build`) viene completato con successo.
3.  **Richiedi la revisione di almeno un collaboratore.**
    -   Ogni PR deve essere approvata da almeno un altro membro del team prima di poter essere unita.
4.  **Richiedi la risoluzione delle conversazioni.**
    -   Tutti i commenti e le discussioni sulla PR devono essere risolti prima del merge.

Queste regole assicurano che ogni modifica sia revisionata, testata automaticamente e discussa prima di essere integrata nel codice base.

## Codice di Condotta

Questo progetto è rilasciato con un [Codice di Condotta del Contributore](CODE_OF_CONDUCT.md). Partecipando a questo progetto, accetti di rispettarne i termini. 