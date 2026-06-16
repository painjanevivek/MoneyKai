Cypress.Commands.add('resetMoneyKaiBrowserState', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window({ log: false }).then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      resetMoneyKaiBrowserState(): Chainable<void>;
    }
  }
}

export {};
