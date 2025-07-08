describe('Login Flow', () => {
  it('should successfully log in a user and redirect to the timeline', () => {
    // Visita la pagina di login
    cy.visit('/auth/signin');

    // Inserisci le credenziali
    // NOTA: In un'app reale, usare cy.env() per le credenziali
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');

    // Clicca sul pulsante di login
    cy.get('button[type="submit"]').click();

    // Verifica il reindirizzamento
    cy.url().should('include', '/timeline');

    // Verifica la presenza di un elemento nella timeline
    cy.contains('I tuoi ricordi').should('be.visible');
  });
}); 