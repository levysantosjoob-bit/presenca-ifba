# Presença IFBA — ajuste de logotipo e localização GPS

Esta versão mantém a integração existente com Supabase e faz dois ajustes solicitados:

- Exibe o logotipo do IFBA no topo do formulário público (`presenca.html`).
- Melhora a leitura da localização: coleta atualizações do GPS por até 18 segundos e utiliza a melhor precisão obtida; considera a margem de erro do aparelho na borda do raio (até 50 m de tolerância) e informa a distância estimada, o limite e a precisão quando rejeita uma localização.
- No cadastro/edição de localidade, inclui o botão **Usar minha localização atual** para preencher latitude e longitude no local físico. Depois é necessário clicar em **Salvar localização** e salvar o evento.

## Instalação

Substitua os arquivos correspondentes na raiz do repositório GitHub Pages pelos arquivos deste pacote. Não é necessário executar SQL para estas alterações.

## Como configurar corretamente um ponto GPS

1. Abra o evento para editar no próprio local onde a presença deve ser permitida.
2. Em cada localidade, clique em **Usar minha localização atual**.
3. Confira a precisão exibida pelo navegador e clique em **Salvar localização**.
4. Salve o evento.
5. Faça um teste com um celular, com localização precisa ativada e permissão concedida ao navegador.

**Importante:** GPS de navegador é uma estimativa, não uma medição exata. A margem de erro pode variar por aparelho, ambiente, sinal e configurações. A tolerância de até 50 m evita rejeições na borda, mas também significa que um aparelho ligeiramente fora do raio pode ser aceito se a incerteza do GPS alcançar a área permitida. Para controle rigoroso de presença, use um raio maior que a margem de erro observada e teste no local.
