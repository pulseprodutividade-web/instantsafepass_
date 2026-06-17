# instantsafepass.com 🔒

Ferramenta web de cibersegurança premium com design system moderno (Dark Mode & Glassmorphism), 100% executada no lado do cliente (client-side), para a geração e verificação segura de senhas.

## 🚀 Funcionalidades

*   **Gerador de Senhas Criptograficamente Seguras:** Utiliza a API `window.crypto.getRandomValues()` para garantir aleatoriedade forte, permitindo customizar comprimento, tipos de caracteres (maiusc., minusc., números e símbolos) e exclusão de caracteres ambíguos.
*   **Medidor de Força Local:** Calcula a entropia da senha digitada em tempo real com base no conjunto de caracteres e comprimento.
*   **Simulador de Brute-Force:** Estima o tempo de quebra da senha simulando um cluster de ataque offline massivo (10 bilhões de tentativas por segundo).
*   **Verificador de Vazamentos via HIBP (Privacidade Ponta-a-Ponta):** Utiliza o protocolo *k-Anonymity* enviando apenas os primeiros 5 caracteres do hash SHA-1 da senha para a API do *Have I Been Pwned*. A senha real nunca viaja pela rede e não sai do navegador.
*   **Gerador de Passphrases (Frases de Acesso):** Gera frases seguras em português combinando palavras aleatórias fáceis de lembrar e difíceis de quebrar.
*   **Conformidade com LGPD:** Banner de consentimento de cookies integrado com persistência local e páginas completas de *Política de Privacidade* e *Termos de Uso*.

## 🛠️ Tecnologias Utilizadas

*   **Estrutura:** HTML5 Semântico.
*   **Estilo:** CSS3 Avançado com variáveis, layouts flexíveis/grid, Glassmorphism e animações.
*   **Lógica:** JavaScript (Vanilla) puro (sem bibliotecas externas) utilizando a Web Crypto API nativa do navegador.

## 📦 Como Executar e Hospedar

Por ser um projeto puramente estático, basta abrir o arquivo `index.html` em qualquer navegador moderno. 

### Hospedagem recomendada:
Recomendamos o upload e deploy em servidores estáticos com suporte HTTPS ativado por padrão para habilitar a API criptográfica do JavaScript:
*   **Vercel / Netlify:** Oferecem deploy automático a partir deste repositório e certificados SSL gratuitos.
*   **GitHub Pages:** Gratuito e nativo.
