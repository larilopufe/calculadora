document.querySelectorAll('.keyboard button').forEach(button => {
  button.addEventListener('click', () => {
    const input = document.getElementById('inputFuncao');
    const value = button.textContent;

    if (value === 'DEL') {
      input.value = input.value.slice(0, -1);
    } else if (value === 'AC') {
      input.value = '';
    } else {
      input.value += value;
    }
  });
});

document.getElementById('btnCalcular').addEventListener('click', () => {
  const input = document.getElementById('inputFuncao').value;
  const x = math.parse('x');

  try {
    const parsed = math.parse(input);
    const derivada = math.derivative(parsed, 'x');
    const derivadaStr = derivada.toString();

    // Derivada
    document.getElementById('funcaoMostrada').innerText = `Função: ${input}`;
    document.getElementById('derivadaMostrada').innerText = `Derivada: ${derivadaStr}`;
    document.getElementById('passo1').innerText = `Derivando f(x) = ${input}, temos f'(x) = ${derivadaStr}`;

    // Pontos críticos: resolver f'(x) = 0
    const f = math.compile(derivadaStr);
    let pontosCriticos = [];

    for (let i = -10; i <= 10; i += 0.5) {
      if (Math.abs(f.evaluate({ x: i })) < 0.1) {
        pontosCriticos.push(i.toFixed(2));
      }
    }

    document.getElementById('pontosCriticos').innerText = `Pontos Críticos: ${pontosCriticos.join(', ')}`;
    document.getElementById('passo2').innerText = `Resolvendo f'(x) = 0: encontramos x = ${pontosCriticos.join(', ')}`;

    document.getElementById('passo3').innerText = `Checagem: Substitua os valores em f''(x) (não implementado ainda).`;

  } catch (err) {
    alert("Erro ao calcular: verifique a sintaxe da função.");
  }
});

function toggleAccordion(header) {
  const body = header.nextElementSibling;
  body.style.display = body.style.display === 'block' ? 'none' : 'block';
}
