# Radiação — a energia que não vemos

Site educacional responsivo sobre radiação de corpo negro, energia solar térmica e automação de uma piscina.

## Abrir

Abra `index.html` em um navegador ou sirva esta pasta com qualquer servidor estático. O site não exige compilação nem dependências de JavaScript. O widget VLibras e as fontes web precisam de conexão à internet.

## Experiências

- **Espectro de corpo negro:** curva de Planck em tempo real, pico de Wien, potência de Stefan–Boltzmann e comparação com 293 K.
- **Piscina inteligente:** controle de temperaturas, intensidade solar e fluxo; decisão de circulação com segurança; simulação com volume didático de 40.000 L e coletor fixo de 8 m².
- **Aprendizagem:** quiz com explicação científica por resposta e glossário filtrável.
- **Acessibilidade:** foco de teclado, link para pular ao conteúdo, descrições de gráficos e diagramas, preferências persistentes de contraste, tipografia, espaçamento, leitura e movimento.

## Notas científicas

A distribuição espectral usa a lei de Planck para emitância espectral por comprimento de onda. O gráfico normaliza cada curva pelo seu próprio pico para facilitar a comparação da forma; os valores de potência por área são absolutos para um corpo negro ideal. A cor exibida é uma aproximação visual da cor térmica.

O simulador de piscina é didático, não uma previsão de desempenho. Usa 10 minutos simulados por segundo real, 40 m³ de água, coletor fixo de 8 m², perdas simplificadas e temperatura ambiente de 20 °C. O sinal de luminosidade é percentual ilustrativo; o BH1750 mede lux e não irradiância solar em W/m². Um sistema físico requer projeto dimensionado e revisão técnica.

Vídeos em Libras aparecem como espaços reservados, identificados como ainda não disponíveis. O VLibras segue o [método oficial de integração](https://vlibras.gov.br/doc/widget/installation/webpageintegration.html).

## Fontes principais

- [OpenStax — radiação do corpo negro](https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation)
- [NIST — constantes fundamentais CODATA](https://physics.nist.gov/cuu/pdf/wallet_2022.pdf)
- [NASA — balanço de energia da Terra](https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/)
- [ROHM — ficha técnica BH1750](https://cdn.velleman.eu/downloads/29/infosheets/bh1750fvi-e_datasheet.pdf)
- [Analog Devices — DS18B20](https://www.analog.com/en/products/DS18B20.html)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## GitHub Pages

O diretório inclui um workflow em `.github/workflows/pages.yml`. Para publicar como site de projeto, envie o conteúdo desta pasta à raiz de um repositório chamado `radiacao-energia-invisivel`, defina **Settings → Pages → Source** como **GitHub Actions** e publique na branch `main`. O endereço será `https://<seu-usuario>.github.io/radiacao-energia-invisivel/`. No GitHub Free, o repositório precisa ser público e tanto o código quanto o site ficam acessíveis na internet. Consulte a [documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
