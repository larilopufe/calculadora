
// --- TECLADO VIRTUAL ---
document.querySelectorAll('.keyboard button').forEach(btn => {
    btn.addEventListener('click', function () {
        const input = document.getElementById('inputFuncao');
        const valor = this.textContent;

        if (valor === 'DEL') {
            input.value = input.value.slice(0, -1);
        } else if (valor === 'AC') {
            input.value = '';
        } else if (valor === '=') {
            // Não faz nada, cálculo é feito pelo botão Calcular
        } else if (valor === 'x^') {
            input.value += 'x^';
        } else if (valor === '√') {
            input.value += 'sqrt(';
        } else if (valor === '^2') {
            input.value += '^2';
        } else if (valor === '^3') {
            input.value += '^3';
        } else if (valor === 'π') {
            input.value += 'pi';
        } else if (valor === 'e') {
            input.value += 'e';
        } else if (valor === '1/x') {
            input.value += '1/';
        } else if (valor === '|x|') {
            input.value += 'abs(x)';
        } else if (valor === 'x!') {
            input.value += '!';
        } else {
            input.value += valor;
        }
    });
});

// --- PARSER MELHORADO PARA POLINÔMIOS E CONSTANTE MULTIPLICADORA ---
function parseFuncaoParaObjeto(funcaoStr) {
    let constante = [1, 1];
    let funcao = funcaoStr.trim();

    // Detecta padrão de constante multiplicadora (ex: 1/29* ou 2*)
    let matchConst = funcao.match(/^([0-9]+)\/([0-9]+)\s*\*\s*/);
    if (matchConst) {
        constante = [parseInt(matchConst[1]), parseInt(matchConst[2])];
        funcao = funcao.replace(matchConst[0], '');
    } else {
        let matchInt = funcao.match(/^([0-9]+)\s*\*\s*/);
        if (matchInt) {
            constante = [parseInt(matchInt[1]), 1];
            funcao = funcao.replace(matchInt[0], '');
        }
    }

    // REMOVE PARÊNTESES
    funcao = funcao.replace(/[()]/g, '');

    // Divide termos, tratando sinais negativos
    const termos = funcao.replace(/-/g, '+-').split('+').map(t => t.trim()).filter(t => t.length > 0);

    const equacao = [];
    for (const term of termos) {
        if (!term) continue; // ignora termos vazios
        let match = term.match(/^([+-]?\d*\.?\d*)x(?:\^(\d+))?$/i);
        if (match) {
            let coefRaw = match[1];
            let coef = (coefRaw === '' || coefRaw === '+') ? 1 : (coefRaw === '-' ? -1 : Number(coefRaw));
            let expo = match[2] ? Number(match[2]) : 1;
            equacao.push({ coeficiente: coef, expoente: expo });
        } else if (!isNaN(Number(term)) && term !== "") {
            equacao.push({
                coeficiente: Number(term),
                expoente: 0
            });
        }
        // ignora termos inválidos
    }

    return { equacao, constante };
}

// --- MONTAR EQUAÇÃO FORMATADA ---
function montarEquacao(entrada) {
    if (!entrada || !entrada.equacao || entrada.equacao.length === 0) return "";

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
        if (termo.expoente > 0) {
            verEquacao += termo.coeficiente + "x";
            if (termo.expoente > 1) {
                verEquacao += "^" + termo.expoente;
            }
        } else {
            verEquacao += termo.coeficiente;
        }
    }
    if (entrada.constante && (entrada.constante[0] !== 1 || entrada.constante[1] !== 1)) {
        verEquacao += ")";
    }
    return verEquacao;
}

// --- DERIVADA ---
function calculaDerivada(entrada) {
    if (!entrada || !entrada.equacao || entrada.equacao.length === 0) {
        return { equacao: [], constante: entrada ? entrada.constante : [1, 1] };
    }

    let derivada = [];
    let constanteMultiplicadora = entrada.constante;

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

// --- CALCULAR EQUAÇÃO PARA UM X ---
function calcularEquacao(entrada, x) {
    if (!entrada || !entrada.equacao) return NaN;
    let resposta = 0;
    for (let i = 0; i < entrada.equacao.length; i++) {
        resposta += entrada.equacao[i].coeficiente * Math.pow(x, entrada.equacao[i].expoente);
    }
    let constanteMultiplicadora = entrada.constante[0] / entrada.constante[1];
    resposta *= constanteMultiplicadora;
    return resposta;
}

// --- BOTÃO CALCULAR ---
document.getElementById('btnCalcular').addEventListener('click', function () {
    const funcao = document.getElementById('inputFuncao').value;
    if (!funcao.trim()) {
        document.getElementById('funcaoMostrada').textContent = "Digite uma função!";
        document.getElementById('derivadaMostrada').textContent = "";
        document.getElementById('pontosCriticos').textContent = "";
        return;
    }

    // 1. Parse para objeto
    const entrada = parseFuncaoParaObjeto(funcao);

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
});

// --- ACORDEON (Accordion) ---
function toggleAccordion(header) {
    const body = header.nextElementSibling;
    body.style.display = (body.style.display === "block") ? "none" : "block";
}

