describe('ParkEase smoke', () => {
  it('loads the landing page and auth routes', () => {
    cy.visit('/');
    cy.contains('ParkEase').should('be.visible');

    cy.visit('/#/login');
    cy.contains('Welcome back').should('be.visible');

    cy.visit('/#/forgot-password');
    cy.contains('Forgot password').should('be.visible');
  });
});
