const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Função para obter entrada do usuário
function obterEntrada(pergunta) {
    return new Promise((resolve) => {
        rl.question(pergunta, (resposta) => {
            resolve(resposta);
        });
    });
}
// Função para capturar dados da equação
async function entradaDeDados() {
    let equacao = [];
    let constante = [1, 1];
    let temFator = (await obterEntrada("A equação possui uma constante (fator multiplicador)? (S/N): ")).toUpperCase();
    if (temFator === "S") {
        let ehFracao = (await obterEntrada("A constante é uma fração ? (S/N): ")).toUpperCase();
        if (ehFracao === "S") {
            constante[0] = Number(await obterEntrada("Informe o numerador da constante: "));
            constante[1] = Number(await obterEntrada("Informe o denominador da constante: "));
        } else {
            constante[0] = Number(await obterEntrada("Informe o valor da constante: "));
        }
    }
    const quantVariaveis = Number(await obterEntrada("Informe a quantidade de variáveis da equação: "));
    if (isNaN(quantVariaveis) || quantVariaveis <= 0) {
        console.log("Número inválido! A equação deve ter pelo menos um termo.");
        rl.close();
        return null;
    }
    for (let i = 0; i < quantVariaveis; i++) {
        equacao[i] = {};
        equacao[i].coeficiente = Number(await obterEntrada(`Informe o ${i + 1}. coeficiente da equação: `));
        let potencia = await obterEntrada("O coeficiente é acompanhado de incógnita (X)? Responda S/N: ");
        equacao[i].expoente = (potencia === "S" || potencia === "s") ? Number(await obterEntrada(`Informe o ${i + 1}. expoente da equação: `)) : 0;
    }
    return { equacao, constante };
}
// Função para montar a equação formatada
function montarEquacao(entrada) {
    if (!entrada || !entrada.equacao || entrada.equacao.length === 0) {
        return "Equação inválida";
    }
    let verEquacao = "";
    if (entrada.constante && (entrada.constante[0] !== 1 || entrada.constante[1] !== 1)) {
        verEquacao += entrada.constante[0] + "/" + entrada.constante[1] + "*(";
    }
    for (let i = 0; i < entrada.equacao.length; i++) {
        if (i > 0 && entrada.equacao[i].coeficiente > 0) {
            verEquacao += " + ";
        } else if (i > 0 && entrada.equacao[i].coeficiente < 0) {
            verEquacao += " ";
        }
        verEquacao += entrada.equacao[i].coeficiente + "x";
        if (entrada.equacao[i].expoente > 1) {
            verEquacao += "^" + entrada.equacao[i].expoente;
        }
    }
    if (entrada.constante && (entrada.constante[0] !== 1 || entrada.constante[1] !== 1)) {
        verEquacao += ")";
    }
    return verEquacao;
}
// Função para calcular a derivada
function calculaDerivada(entrada) {
    if (!entrada || !entrada.equacao || entrada.equacao.length === 0) {
        console.log("Erro: Entrada inválida para cálculo da derivada.");
        return null;
    }
    let derivada = [];
    let constanteMultiplicadora = entrada.constante; // Mantém a constante como fração
    for (let i = 0; i < entrada.equacao.length; i++) {
        if (entrada.equacao[i].expoente > 0) {
            derivada.push({
                coeficiente: entrada.equacao[i].coeficiente * entrada.equacao[i].expoente,
                expoente: entrada.equacao[i].expoente - 1
            });
        }
    }
    return { equacao: derivada, constante: constanteMultiplicadora };
}
function pontoCritico(resultado) {
    if (!Array.isArray(resultado) || resultado.length === 0) {
        console.log("Erro: resultado não é um array válido.");
        return [];
    }
    let criticos = [];
    // Identifica o maior expoente presente na equação derivada
    let maiorExpoente = Math.max(...resultado.map(term => term.expoente));
    // Caso linear (ax + b = 0)
    if (maiorExpoente === 1) {
        let coefA = resultado.find(term => term.expoente === 1)?.coeficiente || 0;
        let coefB = resultado.find(term => term.expoente === 0)?.coeficiente || 0;
        if (coefA !== 0) {
            criticos.push(-coefB / coefA);
        }
    }
    // Caso quadrático (ax² + bx + c = 0) - Bhaskara
    else if (maiorExpoente === 2) {
        let coefA = resultado.find(term => term.expoente === 2)?.coeficiente || 0;
        let coefB = resultado.find(term => term.expoente === 1)?.coeficiente || 0;
        let coefC = resultado.find(term => term.expoente === 0)?.coeficiente || 0;
        let delta = (coefB ** 2) - (4 * coefA * coefC);
        if (delta >= 0) {
            let x1 = (-coefB + Math.sqrt(delta)) / (2 * coefA);
            let x2 = (-coefB - Math.sqrt(delta)) / (2 * coefA);
            criticos.push(x1, x2);
        } else {
            console.log("Não há pontos críticos reais (Delta < 0).");
        }
    }
    // Caso polinômio de grau ≥ 3 - Método direto baseado na equação original
    else if (maiorExpoente >= 3) {
        console.log("Equação de grau ≥ 3 detectada. Utilizando método de análise de coeficientes.");
        let coeficientes = resultado.map(term => ({ coef: term.coeficiente, exp: term.expoente }));
        if (coeficientes.length > 1) {
            let termosOrdenados = coeficientes.sort((a, b) => b.exp - a.exp);
            let coefMaior = termosOrdenados[0].coef;
            let coefMenor = termosOrdenados.find(term => term.exp === termosOrdenados[0].exp - 1);
            if (coefMaior !== 0 && coefMenor && coefMenor.coef !== 0) {
                let xCritico = -coefMenor.coef / coefMaior;
                if (!isNaN(xCritico) && isFinite(xCritico)) {
                    criticos.push(xCritico);
                }
            }
        }
        // Se houver um termo de grau ímpar, verificar se x = 0 é um ponto crítico válido
        if (resultado.some(term => term.expoente % 2 !== 0 && term.coeficiente !== 0)) {
            criticos.push(0);
        }
    }
    // Remove duplicatas e ordena os pontos críticos
    criticos = [...new Set(criticos)].sort((a, b) => a - b);
    if (criticos.length === 0) {
        console.log("Nenhum ponto crítico foi encontrado.");
        return [];
    }
    console.log(`Pontos críticos encontrados: ${criticos.join(", ")}`);
    return criticos;
}
// Função para calcular a equação substituindo pontos críticos
function calcularEquacao(entrada, x) {
    let resposta = 0;
    for (let i = 0; i < entrada.equacao.length; i++) {
        resposta += entrada.equacao[i].coeficiente * Math.pow(x, entrada.equacao[i].expoente);
    }
    let constanteMultiplicadora = entrada.constante[0] / entrada.constante[1];
    resposta *= constanteMultiplicadora;
    return resposta;
}
// Função principal que organiza a execução do programa
async function iniciarPrograma() {
    let entrada = await entradaDeDados();
    if (!entrada) {
        rl.close();
        return;
    }
    console.log("Equação: ", montarEquacao(entrada));
    let resultado = calculaDerivada(entrada);
    console.log("Derivada: ", montarEquacao(resultado));
    let resultado2 = calculaDerivada(resultado);
    console.log("Derivada segunda ordem: ", montarEquacao(resultado2));
    let pontosCriticos = pontoCritico(resultado.equacao);
    if (pontosCriticos.length > 0) {
        console.log("Resultado ao substituir os pontos críticos na equação original:");
        for (let i = 0; i < pontosCriticos.length; i++) {
            console.log(`s(${pontosCriticos[i].toFixed(2)}) = ${calcularEquacao(entrada, pontosCriticos[i]).toFixed(2)}`);
        }
        console.log("Resultado ao substituir os pontos críticos na derivada de segunda ordem:");
        for (let i = 0; i < pontosCriticos.length; i++) {
            console.log(`s(${pontosCriticos[i].toFixed(2)}) = ${calcularEquacao(resultado2, pontosCriticos[i]).toFixed(2)}`);
        }
    } else {
        console.log("Nenhum ponto crítico foi encontrado.");
    }
    rl.question("Deseja definir limites mínimo e máximo? (s/n): ", resposta => {
        if (resposta.trim().toLowerCase() === "s") {
            rl.question("Informe o limite mínimo: ", limiteMinStr => {
                let limiteMin = parseFloat(limiteMinStr);
                if (isNaN(limiteMin)) {
                    console.log("Limite mínimo inválido.");
                    rl.close();
                    return;
                }
                rl.question("Informe o limite máximo: ", limiteMaxStr => {
                    let limiteMax = parseFloat(limiteMaxStr);
                    if (isNaN(limiteMax)) {
                        console.log("Limite máximo inválido.");
                        rl.close();
                        return;
                    }
                    // **Correção na filtragem dos pontos críticos**
                    let pontosDentroLimite = pontosCriticos.filter(x => x >= limiteMin && x <= limiteMax);
                    if (pontosDentroLimite.length === 0) {
                        console.log(`Nenhum ponto crítico está dentro do intervalo [${limiteMin}, ${limiteMax}].`);
                    } else {
                        pontosDentroLimite.forEach(x => {
                            let sFuncao = calcularEquacao(entrada, x);
                            let sDerivadaSegunda = calcularEquacao(resultado2, x);
                            console.log(`Ponto crítico dentro do intervalo: x = ${x}`);
                            console.log(`s(${x}) na função original: ${sFuncao.toFixed(2)}`);
                            console.log(`s(${x}) na segunda derivada: ${sDerivadaSegunda.toFixed(2)}`);
                        });
                    }
                    rl.close();
                });
            });
        } else {
            console.log("Nenhuma restrição foi aplicada.");
            rl.close();
        }
    });
}
// Executa o programa
iniciarPrograma();
