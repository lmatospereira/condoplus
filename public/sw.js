// Service worker mínimo: habilita a instalação do app. Não intercepta requisições
// nem faz cache (as páginas são autenticadas); o navegador trata a rede normalmente.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
