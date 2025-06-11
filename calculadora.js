// --- PARSER PARA POLINÔMIOS E CONSTANTE MULTIPLICADORA ---
function entradaDeDados(funcaoStr) {
    let constante = [1, 1];
    let digitado = funcaoStr.trim().replace(/\s+/g, "");

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


    const equacao = [];
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

// --- PONTOS CRÍTICOS ---
function pontoCritico(resultado) {
    if (!Array.isArray(resultado) || resultado.length === 0) {
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
        }
    }
    // Caso polinômio de grau ≥ 3 - Método direto baseado na equação original
    else if (maiorExpoente >= 3) {
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
        // Calcula o valor da equação para x
        soma += calcularEquacao(entrada, x) * deltaX;
    }
    return soma;
}

//cálculo integrar por soma exata usando o método soma de Riemann
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
        } else if (termo.tipo === "exp") {
            // Só implementa para expoenteStr === "x"
            if (termo.expoenteStr === "x") {
                // ∫a^x dx = a^x / ln(a)
                integral.push({
                    tipo: "exp",
                    coeficiente: termo.coeficiente / Math.log(termo.base),
                    base: termo.base,
                    expoenteStr: "x"
                });
            } else {
                temNaoPol = true;
            }
        } else {
            temNaoPol = true;
        }
    }
    if (integral.length === 0 && temNaoPol) {
        return { equacao: [], constante: entrada.constante, soNaoPol: true };
    }
    return { equacao: integral, constante: entrada.constante };
}

//calcular integral por aproximação usando a regra do Trapézio
function regraTrapezio(entrada, a, b, n) {
    let soma = 0;
    let h = (b - a) / n;

    for (let i = 0; i < n+1; i++) {        
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


function mostrarSessaoDerivada() {
    document.getElementById('accordionDerivada').style.display = 'block';
    document.getElementById('accordionIntegral').style.display = 'none';
}

function mostrarSessaoIntegral() {
    document.getElementById('accordionDerivada').style.display = 'none';
    document.getElementById('accordionIntegral').style.display = 'block';
}
alert("Informe a função a ser calculada, os limites mínimo(a) e máximo(b), e o número de partições(n) para o cálculo da integral.");

// --- BOTÃO CALCULAR DERIVADA ---
document.getElementById('btnDerivada').addEventListener('click', function () {
    mostrarSessaoDerivada();

    const funcao = document.getElementById('inputFuncao').value;

    if (!funcao.trim()) {
        document.getElementById('funcaoMostrada').textContent = "Digite uma função!";
        document.getElementById('derivadaMostrada').textContent = "";
        document.getElementById('pontosCriticos').textContent = "";
        return;
    }

    // 1. Parse para objeto
    const entrada = entradaDeDados(funcao);

    // 2. Montar equação formatada
    document.getElementById('funcaoMostrada').textContent = "Função formatada: " + montarEquacao(entrada);
   
    
    // Passo 1: Derivada detalhada
    const derivada = calculaDerivada(entrada);
    document.getElementById('passo1').textContent = montarEquacao(derivada);
    document.getElementById('passo1').style.display = "block";

    // Passo 2: Pontos críticos detalhados
    const pontos = derivada && derivada.equacao ? pontoCritico(derivada.equacao) : [];
    if (pontos.length > 0) {
        document.getElementById('passo2').textContent = pontos.map(x => x.toFixed(2)).join(", ");
    } else {
        document.getElementById('passo2').textContent = "Nenhum ponto crítico encontrado.";
    }
    document.getElementById('passo2').style.display = "block";

    // Passo 3: Máximos e Mínimos: Checagem na equação original
    if (pontos.length > 0) {
        document.getElementById('passo3').innerHTML = pontos.map(x =>
            `s''(${x.toFixed(2)}) = ${calcularEquacao(entrada, x).toFixed(2)}`
        ).join("<br>");
    } else {
        document.getElementById('passo3').textContent = "Nenhum ponto crítico encontrado.";
    }
    document.getElementById('passo3').style.display = "block";

    // Passo 4: Derivada de segunda ordem
    const derivada2 = calculaDerivada(derivada)
    document.getElementById('passo4').textContent = montarEquacao(derivada2);
    document.getElementById('passo4').style.display = "block";

    // Passo 5: Máximos e Mínimos: Checagem na derivada de segunda ordem
    if (pontos.length > 0) {
        document.getElementById('passo5').innerHTML = pontos.map(x =>
            `s''(${x.toFixed(2)}) = ${calcularEquacao(derivada2, x).toFixed(2)}`
        ).join("<br>");
    } else {
        document.getElementById('passo5').textContent = "Nenhum ponto crítico encontrado.";
    }
    document.getElementById('passo5').style.display = "block";

    // Passo 6: Análise dos pontos críticos dentro dos limites
    const limiteMin = parseFloat(document.getElementById('limiteMin').value);
    const limiteMax = parseFloat(document.getElementById('limiteMax').value);

    let pontosDentroLimite = pontos.filter(x => x >= limiteMin && x <= limiteMax);

    let html = "<strong>Análise dos pontos críticos dentro dos limites:</strong><br>";
    if (isNaN(limiteMin) || isNaN(limiteMax)) {
        html += "Defina limites mínimo e máximo válidos.";
    } else if (pontosDentroLimite.length === 0) {
        html += `Nenhum ponto crítico está dentro do intervalo [${limiteMin}, ${limiteMax}].`;
    } else {
        pontosDentroLimite.forEach(x => {
            let sFuncao = calcularEquacao(entrada, x);
            let sDerivadaSegunda = calcularEquacao(derivada2, x);
            html += `<div>
                <strong>Ponto crítico ${x.toFixed(2)}:</strong><br>
                s(${x.toFixed(2)}) na função original: ${sFuncao.toFixed(2)}<br>
                s(${x.toFixed(2)}) na segunda derivada: ${sDerivadaSegunda.toFixed(2)}
            </div>`;
        });
    }

const divLimite = document.getElementById('passo6');
divLimite.innerHTML = html;
divLimite.style.display = "block";
});

// --- BOTÃO CALCULAR INTEGRAL ---
document.getElementById('btnIntegral').addEventListener('click', function () {
    mostrarSessaoIntegral();

    const funcao = document.getElementById('inputFuncao').value;
    const entrada = entradaDeDados(funcao);

    //Montar equação formatada
    document.getElementById('funcaoMostrada').textContent = "Função formatada: " + montarEquacao(entrada);

    //Cálculo da integral
    let integral = calculaIntegral(entrada);
    document.getElementById('passo7').innerText = montarEquacao(integral);
    document.getElementById('passo7').style.display = "block";


    //Cálculo da integral por aproximação de Riemann
    const limiteMin = parseFloat(document.getElementById('limiteMin').value);
    const limiteMax = parseFloat(document.getElementById('limiteMax').value);
    const particoes = parseInt(document.getElementById('particoes').value);
    if (isNaN(limiteMin) || isNaN(limiteMax) || limiteMin >= limiteMax) {
        alert("Por favor, insira limites válidos.");
        return;
    }

    //Cálculo da integral por soma exata
    let integralExata = calcularEquacao(integral, limiteMax) - calcularEquacao(integral, limiteMin);
    document.getElementById('passo9').innerText = integralExata.toFixed(4);
    document.getElementById('passo9').style.display = "block";

    //Cálculo da integral por aproximação de Riemann
    let integralAproximada = pontoMedioRiemann(entrada, limiteMin, limiteMax, particoes);
    document.getElementById('passo8').innerText = integralAproximada.toFixed(4);
    document.getElementById('passo8').style.display = "block";

    //Cálculo da integral pela Regra do Trapézio
    let integralTrapezio = regraTrapezio(entrada, limiteMin, limiteMax, particoes);
    document.getElementById('passo10').innerText = integralTrapezio.toFixed(4);
    document.getElementById('passo10').style.display = "block";

    //Cálculo da integral pela Regra de Simpson 1/3
    let integralSimpson1 = simpsonUmTerco(entrada, limiteMin, limiteMax, particoes);
    document.getElementById('passo11').innerText = integralSimpson1.toFixed(4);
    document.getElementById('passo11').style.display = "block";

    //Cálculo da integral pela Regra de Simpson 3/8
    let integralSimpson2 = simpsonTresOitavos(entrada, limiteMin, limiteMax, particoes);
    document.getElementById('passo12').innerText = integralSimpson2.toFixed(4);
    document.getElementById('passo12').style.display = "block";
});

// Função para abrir apenas o acordeão desejado
function abrirAccordion(id) {
    document.querySelectorAll('.accordion-body').forEach(div => div.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}                                                                   



// --- TECLADO VIRTUAL ---
//Deixar o teclado móvel
const tecladoDiv = document.getElementById("keyboards");
let campoAtivo = null;

// Mostrar teclado ao focar em qualquer input
document.querySelectorAll("input[type='text'], input[type='number']").forEach(input => {
    input.addEventListener("focus", () => {
        campoAtivo = input;
        tecladoDiv.classList.add("active");
    });
});

// Esconder teclado ao clicar fora
document.addEventListener("click", function (event) {
    const clicouDentro =
        tecladoDiv.contains(event.target) ||
        (campoAtivo && campoAtivo.contains(event.target));
    if (!clicouDentro) {
        tecladoDiv.classList.remove("active");
    }
});

// Inserir valores nos campos
document.querySelectorAll(".keyboard button").forEach(botao => {
    botao.addEventListener("click", () => {
        if (!campoAtivo) return;
        const valor = botao.textContent;

        if (valor === 'DEL') {
            campoAtivo.value = campoAtivo.value.slice(0, -1);
        } else if (valor === 'AC') {
            campoAtivo.value = '';
        } else if (valor === '=') {
            // nada, cálculo é manual
        } else if (valor === 'x^') {
            campoAtivo.value += 'x^';
        } else if (valor === '√') {
            campoAtivo.value += 'sqrt(';
        } else if (valor === '^2') {
            campoAtivo.value += '^2';
        } else if (valor === '^3') {
            campoAtivo.value += '^3';
        } else if (valor === 'π') {
            campoAtivo.value += 'pi';
        } else if (valor === 'e') {
            campoAtivo.value += 'e';
        } else if (valor === '1/x') {
            campoAtivo.value += '1/';
        } else if (valor === '|x|') {
            campoAtivo.value += 'abs(x)';
        } else if (valor === 'x!') {
            campoAtivo.value += '!';
        } else {
            campoAtivo.value += valor;
        }
    });
});
