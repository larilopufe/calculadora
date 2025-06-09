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

// Função para capturar dados da equação a partir de string
async function entradaDeDados() {
    let digitado = await obterEntrada("Informe a equação f(x) ex: (x^2 + 3*x + 2): ");
    digitado = digitado.replace(/\s+/g, ""); // remove espaços

    let constante = [1, 1];
    let equacao = [];

    // Captura constante multiplicadora do tipo 1/15(...)
    let matchConstante = digitado.match(/^([0-9]+)\/([0-9]+)\((.+)\)$/);
    if (matchConstante) {
        constante = [parseFloat(matchConstante[1]), parseFloat(matchConstante[2])];
        digitado = matchConstante[3];
    }

    // Se for do tipo a/b*..., também aceita
    let matchConstante2 = digitado.match(/^([0-9]+)\/([0-9]+)\*(.+)$/);
    if (matchConstante2) {
        constante = [parseFloat(matchConstante2[1]), parseFloat(matchConstante2[2])];
        digitado = matchConstante2[3];
    }

    // Divide termos por + e -, preservando sinais
    let termos = [];
    let termo = "";
    for (let i = 0; i < digitado.length; i++) {
        if (i > 0 && (digitado[i] === "+" || digitado[i] === "-") && digitado[i - 1] !== "^") {
            termos.push(termo);
            termo = digitado[i];
        } else {
            termo += digitado[i];
        }
    }
    if (termo) termos.push(termo);

    for (let t of termos) {
        // Exponencial do tipo e^x ou e^(x^2)
        let expMatch = t.match(/^([+-]?[0-9]*\.?[0-9]*)\*?e\^\(?([^)]+)\)?$/i);
        if (expMatch) {
            let coef = expMatch[1] === "" || expMatch[1] === "+" ? 1 : expMatch[1] === "-" ? -1 : parseFloat(expMatch[1]);
            let expoenteStr = expMatch[2];
            equacao.push({
                tipo: "exp",
                coeficiente: coef,
                base: Math.E,
                expoenteStr: expoenteStr
            });
            continue;
        }

        // Exponencial do tipo a^x ou a^(k*x)
        let expMatch2 = t.match(/^([+-]?[0-9]*\.?[0-9]*)\*?([0-9.]+)\^\(?([^)]+)\)?$/i);
        if (expMatch2) {
            let coef = expMatch2[1] === "" || expMatch2[1] === "+" ? 1 : expMatch2[1] === "-" ? -1 : parseFloat(expMatch2[1]);
            let base = parseFloat(expMatch2[2]);
            let expoenteStr = expMatch2[3];
            equacao.push({
                tipo: "exp",
                coeficiente: coef,
                base: base,
                expoenteStr: expoenteStr
            });
            continue;
        }

        // Raiz do tipo 1/sqrt(x^n)
        let raizMatch = t.match(/^([+-]?[0-9]*)\/sqrt\((x(?:\^([0-9]+))?)\)$/i);
        if (raizMatch) {
            let coef = raizMatch[1] ? parseFloat(raizMatch[1]) : 1;
            let exp = raizMatch[3] ? parseFloat(raizMatch[3]) : 1;
            equacao.push({
                tipo: "pol",
                coeficiente: coef,
                expoente: 0.5 * exp
            });
            continue;
        }

        // Polinômio do tipo ax^n (com ou sem *)
        let polMatch = t.match(/^([+-]?[0-9]*\.?[0-9]*)\*?x(?:\^([+-]?[0-9]+))?$/i);
        if (polMatch) {
            let coef = polMatch[1] === "" || polMatch[1] === "+" ? 1 : polMatch[1] === "-" ? -1 : parseFloat(polMatch[1]);
            let exp = polMatch[2] ? parseFloat(polMatch[2]) : 1;
            equacao.push({
                tipo: "pol",
                coeficiente: coef,
                expoente: exp
            });
            continue;
        }

        // Polinômio do tipo x (coeficiente 1 ou -1)
        let polMatch2 = t.match(/^([+-]?)x$/i);
        if (polMatch2) {
            let coef = polMatch2[1] === "-" ? -1 : 1;
            equacao.push({
                tipo: "pol",
                coeficiente: coef,
                expoente: 1
            });
            continue;
        }

        // Constante (ex: 3, -5)
        let constMatch = t.match(/^([+-]?[0-9]+(\.[0-9]+)?)$/);
        if (constMatch) {
            equacao.push({
                tipo: "pol",
                coeficiente: parseFloat(constMatch[1]),
                expoente: 0
            });
            continue;
        }

        // 1/sqrt(x^n) sem coeficiente
        let raizMatch2 = t.match(/^1\/sqrt\((x(?:\^([0-9]+))?)\)$/i);
        if (raizMatch2) {
            let exp = raizMatch2[2] ? parseFloat(raizMatch2[2]) : 1;
            equacao.push({
                tipo: "pol",
                coeficiente: 1,
                expoente: 0.5 * exp
            });
            continue;
        }

        // 1/x^n
        let invMatch = t.match(/^1\/x\^([0-9]+)$/i);
        if (invMatch) {
            equacao.push({
                tipo: "pol",
                coeficiente: 1,
                expoente: -parseFloat(invMatch[1])
            });
            continue;
        }

        // Se não reconhecido, tenta como constante
        equacao.push({
            tipo: "pol",
            coeficiente: parseFloat(t) || 0,
            expoente: 0
        });
    }

    return { equacao, constante };
}

// Função para montar a equação formatada
function montarEquacao(entrada) {
    if (!entrada || !entrada.equacao) {
        return "Equação inválida";
    }
    if (entrada.soNaoPol) {
        return "Integral exata não implementada para funções não polinomiais.";
    }
    if (entrada.equacao.length === 0) {
        return "Equação inválida";
    }
    let verEquacao = "";
    if (entrada.constante && (entrada.constante[0] !== 1 || entrada.constante[1] !== 1)) {
        verEquacao += entrada.constante[0] + "/" + entrada.constante[1] + "*(";
    }
    for (let i = 0; i < entrada.equacao.length; i++) {
        let termo = entrada.equacao[i];
        if (i > 0 && termo.coeficiente > 0) {
            verEquacao += " + ";
        } else if (i > 0 && termo.coeficiente < 0) {
            verEquacao += " ";
        }
        if (termo.tipo === "ln") {
            verEquacao += `${termo.coeficiente === 1 ? "" : termo.coeficiente + "*"}ln|x|`;
        } else if (termo.tipo === "exp") {
            if (termo.base === Math.E) {
                verEquacao += `${termo.coeficiente === 1 ? "" : termo.coeficiente + "*"}e^(${termo.expoenteStr})`;
            } else {
                verEquacao += `${termo.coeficiente === 1 ? "" : termo.coeficiente + "*"}${termo.base}^(${termo.expoenteStr})`;
            }
        } else {
            verEquacao += termo.coeficiente;
            if (termo.expoente !== 0) {
                verEquacao += "x";
                if (termo.expoente !== 1) {
                    verEquacao += "^" + termo.expoente;
                }
            }
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
    let constanteMultiplicadora = entrada.constante;
    for (let termo of entrada.equacao) {
        if (termo.tipo === "pol") {
            if (termo.expoente > 0) {
                derivada.push({
                    tipo: "pol",
                    coeficiente: termo.coeficiente * termo.expoente,
                    expoente: termo.expoente - 1
                });
            }
        } else if (termo.tipo === "exp") {
            // Derivada de a^{g(x)} = a^{g(x)} * ln(a) * g'(x)
            // Aqui só tratamos casos simples: expoenteStr = x ou kx
            let g = termo.expoenteStr;
            let coef = termo.coeficiente;
            let base = termo.base;
            if (g === "x") {
                derivada.push({
                    tipo: "exp",
                    coeficiente: coef * Math.log(base),
                    base: base,
                    expoenteStr: g
                });
            } else if (/^[0-9.]*x$/.test(g)) {
                // g(x) = kx
                let k = parseFloat(g.replace("x", "")) || 1;
                derivada.push({
                    tipo: "exp",
                    coeficiente: coef * Math.log(base) * k,
                    base: base,
                    expoenteStr: g
                });
            } else if (/^x\^([0-9.]+)$/.test(g)) {
                // g(x) = x^n, derivada = n*x^(n-1)
                let n = parseFloat(g.match(/^x\^([0-9.]+)$/)[1]);
                derivada.push({
                    tipo: "exp",
                    coeficiente: coef * Math.log(base) * n * Math.pow(0, n - 1), // para x=0
                    base: base,
                    expoenteStr: g
                });
            } else {
                // Não implementado para casos mais complexos
                console.log("Derivada de exponencial com expoente complexo não implementada.");
            }
        }
    }
    return { equacao: derivada, constante: constanteMultiplicadora };
}

//função para identificar pontos críticos (apenas polinomiais)
function pontoCritico(resultado) {
    if (!Array.isArray(resultado) || resultado.length === 0) {
        console.log("Erro: resultado não é um array válido.");
        return [];
    }
    // Considere apenas termos polinomiais para pontos críticos
    let polinomios = resultado.filter(term => term.tipo === "pol" && typeof term.expoente === "number");
    if (polinomios.length === 0) {
        console.log("Nenhum termo polinomial para ponto crítico.");
        return [];
    }
    let criticos = [];
    let maiorExpoente = Math.max(...polinomios.map(term => term.expoente));
    if (maiorExpoente === 1) {
        let coefA = polinomios.find(term => term.expoente === 1)?.coeficiente || 0;
        let coefB = polinomios.find(term => term.expoente === 0)?.coeficiente || 0;
        if (coefA !== 0) {
            criticos.push(-coefB / coefA);
        }
    } else if (maiorExpoente === 2) {
        let coefA = polinomios.find(term => term.expoente === 2)?.coeficiente || 0;
        let coefB = polinomios.find(term => term.expoente === 1)?.coeficiente || 0;
        let coefC = polinomios.find(term => term.expoente === 0)?.coeficiente || 0;
        let delta = (coefB ** 2) - (4 * coefA * coefC);
        if (delta >= 0) {
            let x1 = (-coefB + Math.sqrt(delta)) / (2 * coefA);
            let x2 = (-coefB - Math.sqrt(delta)) / (2 * coefA);
            criticos.push(x1, x2);
        } else {
            console.log("Não há pontos críticos reais (Delta < 0).");
        }
    } else if (maiorExpoente >= 3) {
        let coeficientes = polinomios.map(term => ({ coef: term.coeficiente, exp: term.expoente }));
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
        if (polinomios.some(term => term.expoente % 2 !== 0 && term.coeficiente !== 0)) {
            criticos.push(0);
        }
    }
    criticos = [...new Set(criticos)].sort((a, b) => a - b);
    if (criticos.length === 0) {
        console.log("Nenhum ponto crítico foi encontrado.");
        return [];
    }
    console.log(`Pontos críticos encontrados: ${criticos.map(p => p.toFixed(2)).join(", ")}`);
    return criticos;
}

// Função para calcular a equação substituindo por valores determinados de x
function calcularEquacao(entrada, x) {
    let resposta = 0;
    for (let termo of entrada.equacao) {
        if (termo.tipo === "exp") {
            // Suporta expoenteStr = x ou kx ou x^n
            let expoente = 0;
            if (termo.expoenteStr === "x") {
                expoente = x;
            } else if (/^[0-9.]*x$/.test(termo.expoenteStr)) {
                let k = parseFloat(termo.expoenteStr.replace("x", "")) || 1;
                expoente = k * x;
            } else if (/^x\^([0-9.]+)$/.test(termo.expoenteStr)) {
                let pot = parseFloat(termo.expoenteStr.match(/^x\^([0-9.]+)$/)[1]);
                expoente = Math.pow(x, pot);
            } else {
                expoente = parseFloat(termo.expoenteStr) || 0;
            }
            resposta += termo.coeficiente * Math.pow(termo.base, expoente);
        } else {
            resposta += termo.coeficiente * Math.pow(x, termo.expoente);
        }
    }
    let constanteMultiplicadora = entrada.constante[0] / entrada.constante[1];
    resposta *= constanteMultiplicadora;
    return resposta;
}

//calcular integral por aproximação usando o método do ponto médio de Riemann
function pontoMedioRiemann(entrada, a, b, n) {
    let soma = 0;
    let deltaX = (b - a) / n;
    for (let i = 0; i < n; i++) {
        let x = a + (i + 0.5) * deltaX; // Ponto médio
        soma += calcularEquacao(entrada, x) * deltaX;
    }
    return soma;
}

//cálculo integrar por soma exata usando o método soma de Riemann (apenas polinômios)
function calculaIntegral(entrada) {
    let integral = [];
    let temNaoPol = false;
    for (let termo of entrada.equacao) {
        if (termo.tipo === "pol") {
            if (termo.expoente === -1) {
                // Integral de 1/x = ln|x|
                integral.push({
                    tipo: "ln",
                    coeficiente: termo.coeficiente
                });
            } else {
                let novoExpoente = termo.expoente + 1;
                integral.push({
                    tipo: "pol",
                    coeficiente: termo.coeficiente / novoExpoente,
                    expoente: novoExpoente
                });
            }
        } else {
            // Exponenciais e outros tipos não implementados
            temNaoPol = true;
        }
    }
    if (integral.length === 0 && temNaoPol) {
        // Se só havia termos não polinomiais
        return { equacao: [], constante: entrada.constante, soNaoPol: true };
    }
    return { equacao: integral, constante: entrada.constante };
}

//calcular integral por aproximação usando a regra do Trapézio
function regraTrapezio(entrada, a, b, n) {
    let soma = 0;
    let h = (b - a) / n;
    for (let i = 0; i < n + 1; i++) {
        let x = a + (i * h);
        if (x === a || x === b) {
            soma += calcularEquacao(entrada, x);
        } else {
            soma += 2 * calcularEquacao(entrada, x);
        }
    }
    return soma * h / 2;
}

// calcular integral por aproximação usando a Regra de Simpson 1/3
function simpsonUmTerco(entrada, a, b, n) {
    if (n % 2 !== 0) {
        n += 1;
    }
    let h = (b - a) / n;
    let soma = calcularEquacao(entrada, a) + calcularEquacao(entrada, b);

    for (let i = 1; i < n; i++) {
        let x = a + i * h;
        if (i % 2 === 0) {
            soma += 2 * calcularEquacao(entrada, x);
        } else {
            soma += 4 * calcularEquacao(entrada, x);
        }
    }
    return (h / 3) * soma;
}

// calcular integral por aproximação usando a Regra de Simpson 3/8
function simpsonTresOitavos(entrada, a, b, n) {
    if (n % 3 !== 0) {
        n += 3 - (n % 3);
    }
    let h = (b - a) / n;
    let soma = calcularEquacao(entrada, a) + calcularEquacao(entrada, b);

    for (let i = 1; i < n; i++) {
        let x = a + i * h;
        if (i % 3 === 0) {
            soma += 2 * calcularEquacao(entrada, x);
        } else {
            soma += 3 * calcularEquacao(entrada, x);
        }
    }
    return (3 * h / 8) * soma;
}

// Função principal que organiza a execução do programa
async function iniciarPrograma() {
    let entrada = await entradaDeDados();
    if (!entrada) {
        rl.close();
        return;
    }
    console.log("\n---------------Cálculo da derivada--------------- ");
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
                    rl.question("Informe o número de partições para cálculo de integral: ", nStr => {
                        let n = parseInt(nStr);
                        if (isNaN(n) || n <= 0) {
                            console.log("Número de partições inválido.");
                            rl.close();
                            return;
                        }

                        // Resultado final conforme os limites estipulados
                        let pontosDentroLimite = pontosCriticos.filter(x => x >= limiteMin && x <= limiteMax);
                        if (pontosDentroLimite.length === 0) {
                            console.log(`Nenhum ponto crítico está dentro do intervalo [${limiteMin}, ${limiteMax}].`);
                        } else {
                            pontosDentroLimite.forEach(x => {
                                let sFuncao = calcularEquacao(entrada, x);
                                let sDerivadaSegunda = calcularEquacao(resultado2, x);
                                console.log(`Resposta considerando os limites estabelecidos: Ponto crítico ${x.toFixed(2)}:`);
                                console.log(`s(${x.toFixed(2)}) na função original: ${sFuncao.toFixed(2)}`);
                                console.log(`s(${x.toFixed(2)}) na segunda derivada: ${sDerivadaSegunda.toFixed(2)}`);
                            });
                        }

                        // Integral
                        console.log(" \n---------------Cálculo da integral--------------- ");
                        const integral = calculaIntegral(entrada);
                        console.log("Cálculo da integral: ", montarEquacao(integral));
                        let integralExata = calcularEquacao(integral, limiteMax) - calcularEquacao(integral, limiteMin);
                        console.log(`Resultado da integral exata: ${integralExata.toFixed(4)}`);
                        let resultadoPontoMedio = pontoMedioRiemann(entrada, limiteMin, limiteMax, n);
                        console.log(`Resultado do ponto médio de Riemann: ${resultadoPontoMedio.toFixed(4)}`);
                        let calculoTrapezio = regraTrapezio(entrada, limiteMin, limiteMax, n);
                        console.log(`Resultado da Regra do Trapézio: ${calculoTrapezio.toFixed(4)}`);
                        let calculoSimpson1_3 = simpsonUmTerco(entrada, limiteMin, limiteMax, n);
                        console.log(`Resultado da Regra de Simpson 1/3: ${calculoSimpson1_3.toFixed(4)}`);  
                        let calculoSimpson3_8 = simpsonTresOitavos(entrada, limiteMin, limiteMax, n);
                        console.log(`Resultado da Regra de Simpson 3/8: ${calculoSimpson3_8.toFixed(4)}`);
                        console.log("--------------------------------------------------");
                        rl.close();
                    });
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