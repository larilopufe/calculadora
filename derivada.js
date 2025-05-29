let prompt = require("prompt-sync")();

function entradaDeDados(){
    let equacao = []
    let constante = [1,1]
    let temFator = prompt("A equação possui uma constante (fator multiplicador)? (S/N): ").toUpperCase();
    if (temFator === "S") {
        let ehFracao = prompt("A constante é uma fração ? (S/N): ").toUpperCase();
        if (ehFracao === "S") {
            constante[0] = Number(prompt("Informe o numerador da constante: "))
            constante[1] = Number(prompt("Informe o denominador da constante: "))
        } else {
            constante[0] = Number(prompt("Informe o valor da constante: "))
        }

    }
    const quantVariaveis = Number(prompt("Informe a quantidade de variáveis da equação: "));

    if (isNaN(quantVariaveis) || quantVariaveis <= 0) {
        console.log("Número inválido! A equação deve ter pelo menos um termo.");
        return [];
    }
    
    for (let i = 0; i < quantVariaveis; i++) {
        equacao[i] = {};
        equacao[i].coeficiente = Number(prompt(`Informe o ${i+1}. coeficiente da equação: `));
        let potencia = prompt("O coeficiente é acompanhado de incógnita (X)? Responda S/N: ");
        equacao[i].expoente = (potencia === "S" || potencia === "s") ? Number(prompt(`Informe o ${i+1}. expoente da equação: `)) : 0;
    }
    return{
        equacao, 
        constante
    }
}

let entrada = entradaDeDados()
function montarEquacao(entrada) {
    let verEquacao = "";

    // Verifica se entrada contém constante

    if (entrada.constante && (entrada.constante[0] !== 1 || entrada.constante[1] !== 1)) {
        verEquacao += entrada.constante[0] + "/" + entrada.constante[1] + "*(";
    }
    for (let i = 0; i < entrada.equacao.length; i++) {
        if (i > 0 && entrada.equacao[i].coeficiente > 0) {
            verEquacao += " + ";
        } else if (i > 0 && entrada.equacao[i].coeficiente < 0) {
            verEquacao += " ";
        }

        if (entrada.equacao[i].expoente > 0) {
            verEquacao += entrada.equacao[i].coeficiente + "x";
            if (entrada.equacao[i].expoente > 1) {
                verEquacao += "^" + entrada.equacao[i].expoente;
            }
        } else {
            verEquacao += entrada.equacao[i].coeficiente;
        }
    }

    if (entrada.constante && (entrada.constante[0] !== 1 || entrada.constante[1] !== 1)) {
        verEquacao += ")";
    }
    return verEquacao;
}

console.log("Equação: ", montarEquacao(entrada));

function calculaDerivada(entrada) {
    let derivada = [];
    for (let i = 0; i < entrada.equacao.length; i++) {
        if (entrada.equacao[i].expoente > 0) {
            derivada.push({
                coeficiente: entrada.equacao[i].coeficiente * entrada.equacao[i].expoente,
                expoente: entrada.equacao[i].expoente - 1
            });
        }
    }
    return derivada;
}

let resultado = calculaDerivada(entrada);

console.log("Derivada: ", montarEquacao({ equacao: resultado, constante: [1, 1] }));

let expoentes = resultado.map(term => term.expoente);
let maiorExpoente = expoentes.length > 0 ? Math.max(...expoentes) : 0;


function encontrarCoeficiente(resultado, expoenteDesejado) {
    for (let i = 0; i < resultado.length; i++) {
        if (resultado[i].expoente === expoenteDesejado) {
            return resultado[i].coeficiente;
        }
    }
    return 0; // Caso não haja o expoente na equação
}

function pontoCritico(resultado) {
    if (maiorExpoente >= 3) {
        console.log("Erro: Não foi possível calcular os pontos críticos. Equação polinomial superior a segundo grau");
        return null;
    }

    if (maiorExpoente == 2) {    
        let a = encontrarCoeficiente(resultado, 2);
        let b = encontrarCoeficiente(resultado, 1);
        let c = encontrarCoeficiente(resultado, 0);

        let delta = (b ** 2) - (4 * a * c);

        if (delta < 0) {
            console.log("Não há pontos críticos reais. (Delta < 0");
            return null;
        }

        let resp1 = (-b + Math.sqrt(delta)) / (2 * a);
        let resp2 = (-b - Math.sqrt(delta)) / (2 * a);

        return { resp1, resp2 };
    }

    if (maiorExpoente == 1) {
        let a = encontrarCoeficiente(resultado, 1);
        let b = encontrarCoeficiente(resultado, 0);

        let resp1 = -b / a; 
        return resp1;        
    }
}
let pontosCriticos = pontoCritico(resultado);
console.log(`Pontos críticos: x1 = ${pontosCriticos.resp1.toFixed(2)}, x2 = ${pontosCriticos.resp2.toFixed(2)}`);

function calcularEquacao(entrada, x) {
    let resposta = 0;

    for (let i = 0; i < entrada.equacao.length; i++) { 
        resposta += entrada.equacao[i].coeficiente * Math.pow(x, entrada.equacao[i].expoente);
    }

    if (entrada.constante[0] !== 1 || entrada.constante[1] !== 1) {
        resposta *= (entrada.constante[0] / entrada.constante[1]);
    }

    return resposta;
}

// Substituir os pontos crÃ­ticos na equação original
if (pontosCriticos) {
    if (typeof pontosCriticos.resp1 !== "undefined" && pontosCriticos.resp1 !== null) {
        console.log(`s(${pontosCriticos.resp1.toFixed(2)}) = ${calcularEquacao(entrada, pontosCriticos.resp1).toFixed(2)}`);
    } else {
        console.log("Nenhum ponto crítico válido encontrado para x1.");
    }

    if (typeof pontosCriticos.resp2 !== "undefined" && pontosCriticos.resp2 !== null) {
        console.log(`s(${pontosCriticos.resp2.toFixed(2)}) = ${calcularEquacao(entrada, pontosCriticos.resp2).toFixed(2)}`);
    } else {
        console.log("Nenhum ponto crítico válido encontrado para x2.");
    }
} else {
    console.log("Nenhum ponto crítico foi encontrado.");
}
