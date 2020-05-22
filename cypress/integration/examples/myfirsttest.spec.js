
describe('My First Test', function(){
  it('Does not do so much!',function(){
    expect(true).to.equal(true);
  })
    it('our app runs', function(){
        cy.visit('');
        cy.get('[data-cy=add]').should('be.enabled');
    })
    it('mock coin get', function(){
        cy.server();
        cy.route({
            method: 'GET',
            url: '/api/coins',
            status: 200,
    response: 'fixture:coins.json'
          });
          cy.visit('');
  cy.get('[data-cy=coinCard]').should('have', 3);
    })
    it('on error should show error message', function(){
        cy.server();
        cy.route({
          method: 'GET',
          url: '/api/coins',
          status: 500,
          response: 'ERROR'
        });
        cy.visit('/');
  cy.get('[data-cy=appError]').should('be.visible');
    });
})