const CACHE_NAME = 'barbie-filmes-cache-v1';
const urlsToCache = [
    'Webapp.html',
    'https://cdn.tailwindcss.com', // Será cacheado na primeira visita
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css', // Será cacheado na primeira visita
    // Ícones removidos do cache inicial. Eles serão cacheados dinamicamente no primeiro uso.
];

// Evento de Instalação: Abre o cache e adiciona os arquivos do app shell.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache aberto na instalação.');
                // Adiciona o arquivo principal da aplicação ao cache.
                // Outros recursos serão cacheados dinamicamente no evento 'fetch'.
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento de Fetch: Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
    // Estratégia: Cache, caindo para a rede (Cache falling back to network)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se o recurso estiver no cache, retorna ele. Senão, busca na rede.
                if (response) {
                    return response;
                }

                // Clona a requisição. Uma requisição é um stream e só pode ser consumida uma vez. 
                // Precisamos de um clone para o fetch e outro para o cache.
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    networkResponse => {
                        // Verifica se recebemos uma resposta válida.
                        // Respostas de CDNs (cross-origin) podem ser do tipo 'opaque'.
                        // Não podemos verificar o status de respostas 'opaque', mas ainda podemos cacheá-las.
                        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                            return networkResponse;
                        }

                        // Clona a resposta para que possamos colocá-la no cache e retorná-la ao navegador.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            console.log('Service Worker: Cacheando nova resposta para:', event.request.url);
                            cache.put(event.request, responseToCache);
                        });

                        return networkResponse;
                    }
                );
            })
    );
});

// Evento de Ativação: Limpa caches antigos.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});