# rcelebrone-Modelo-Maturidade-Apps-Script
Um exemplo de algoritmos que podemos usar para criar um modelo de maturidade

**Projeto Google Apps Script - README**

## Descrição

Este projeto Google Apps Script foi desenvolvido para automatizar a coleta de informações de repositórios no GitHub e integrá-las a uma planilha no Google Sheets. O script extrai dados relevantes, como informações sobre padrões de engenharia, métricas de cobertura do SonarCloud e presença de configurações específicas nos repositórios.

## Pré-requisitos

Antes de usar este script, certifique-se de ter as seguintes informações e configurações:

1. **Tokens de API:**
   - `GITHUB_TOKEN`: Token de acesso para a API do GitHub.
   - `SONAR_TOKEN`: Token de acesso para a API do SonarCloud.
   - `NEWRELIC_TOKEN`: Token de acesso para a API do New Relic.

2. **Configuração da Planilha:**
   - Crie uma planilha no Google Sheets com uma aba chamada 'variaveis'.
   - Defina a estrutura da planilha com as colunas necessárias.

## Como Usar

1. **Configuração Inicial:**
   - Abra a planilha associada ao script no Google Sheets.
   - No menu, vá para "Extensões" e clique em "Apps Script".
   - Cole o código fornecido no editor de scripts.

2. **Definindo Variáveis:**
   - Preencha as variáveis `GITHUB_TOKEN`, `SONAR_TOKEN`, e `NEWRELIC_TOKEN` com seus tokens correspondentes.
   - Personalize a variável `sheetName` para o nome da aba da planilha que você deseja utilizar.

3. **Executando o Script:**
   - No editor de scripts, execute a função `main()` para coletar e atualizar os dados na planilha.

4. **Automatização (Opcional):**
   - Configure triggers no Apps Script para automatizar a execução do script em intervalos desejados.

## Funcionalidades

O script realiza as seguintes tarefas:

- **Coleta de Repositórios:** Obtém informações sobre os repositórios da organização especificada no GitHub.
- **Coleta de Dados do SonarCloud:** Verifica a presença de configurações relacionadas ao SonarCloud nos repositórios.
- **Coleta de Dados do New Relic:** Recupera informações relacionadas aos aplicativos monitorados no New Relic.
- **Atualização da Planilha:** Insere e atualiza as informações coletadas na planilha, facilitando a análise.

## Contribuições e Problemas

Contribuições e relatórios de problemas são bem-vindos! Sinta-se à vontade para abrir issues ou enviar pull requests para aprimorar este projeto.

---

*Este script foi desenvolvido por Rodrigo Celebrone.*
