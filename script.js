(() => {
  "use strict";

  // Atalhos para encontrar elementos do HTML.
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

  const html = document.documentElement;

  /* =========================================================
     1. MENU PRINCIPAL
     ========================================================= */

  const menuToggle = $("#menu-toggle");
  const menuLista = $("#menu-lista");

  if (menuToggle && menuLista) {
    menuToggle.addEventListener("click", () => {
      const aberto = menuLista.classList.toggle("is-aberto");
      menuToggle.setAttribute("aria-expanded", String(aberto));
    });

    // Fecha o menu depois que um link é escolhido.
    $$("a", menuLista).forEach((link) => {
      link.addEventListener("click", () => {
        menuLista.classList.remove("is-aberto");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    // Fecha o menu ao clicar fora dele.
    document.addEventListener("click", (evento) => {
      if (!menuLista.contains(evento.target) && !menuToggle.contains(evento.target)) {
        menuLista.classList.remove("is-aberto");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================================================
     2. TEMA CLARO / ESCURO
     ========================================================= */

  const botaoTema = $("#btn-tema");
  const iconeTema = $("#btn-tema-icone");
  const textoTema = $("#btn-tema-texto");

  if (botaoTema) {
    botaoTema.addEventListener("click", () => {
      const temaAtual = html.dataset.theme || "dark";
      const novoTema = temaAtual === "dark" ? "light" : "dark";

      html.dataset.theme = novoTema;
      botaoTema.setAttribute("aria-pressed", String(novoTema === "light"));

      if (iconeTema) iconeTema.textContent = novoTema === "dark" ? "☀️" : "🌙";
      if (textoTema) {
        textoTema.textContent = novoTema === "dark"
          ? "Alternar para modo claro"
          : "Alternar para modo escuro";
      }
    });
  }

  /* =========================================================
     3. PAINEL DE ACESSIBILIDADE
     ========================================================= */

  const botaoAcessibilidade = $("#btn-acessibilidade");
  const painelAcessibilidade = $("#painel-acessibilidade");
  const opcaoContraste = $("#opt-contraste");
  const opcaoAnimacoes = $("#opt-animacoes");

  if (botaoAcessibilidade && painelAcessibilidade) {
    botaoAcessibilidade.addEventListener("click", () => {
      const vaiAbrir = painelAcessibilidade.hidden;
      painelAcessibilidade.hidden = !vaiAbrir;
      botaoAcessibilidade.setAttribute("aria-expanded", String(vaiAbrir));
    });

    document.addEventListener("click", (evento) => {
      if (
        !painelAcessibilidade.contains(evento.target) &&
        !botaoAcessibilidade.contains(evento.target)
      ) {
        painelAcessibilidade.hidden = true;
        botaoAcessibilidade.setAttribute("aria-expanded", "false");
      }
    });
  }

  // A escala começa em 1 e pode variar de 0.85 a 1.25.
  let escalaFonte = 1;

  function atualizarEscalaFonte() {
    html.style.setProperty("--escala", escalaFonte.toFixed(2));
  }

  $("#fonte-menos")?.addEventListener("click", () => {
    escalaFonte = Math.max(0.85, escalaFonte - 0.05);
    atualizarEscalaFonte();
  });

  $("#fonte-mais")?.addEventListener("click", () => {
    escalaFonte = Math.min(1.25, escalaFonte + 0.05);
    atualizarEscalaFonte();
  });

  $("#fonte-reset")?.addEventListener("click", () => {
    escalaFonte = 1;
    atualizarEscalaFonte();
  });

  opcaoContraste?.addEventListener("change", () => {
    html.dataset.contraste = opcaoContraste.checked ? "alto" : "normal";
  });

  opcaoAnimacoes?.addEventListener("change", () => {
    html.dataset.animacoes = opcaoAnimacoes.checked ? "off" : "on";
  });

  $("#a11y-restaurar")?.addEventListener("click", () => {
    escalaFonte = 1;
    atualizarEscalaFonte();

    html.dataset.contraste = "normal";
    html.dataset.animacoes = "on";

    if (opcaoContraste) opcaoContraste.checked = false;
    if (opcaoAnimacoes) opcaoAnimacoes.checked = false;
  });

  /* =========================================================
     4. ABAS E PESQUISA DOS ESPETÁCULOS
     ========================================================= */

  const abas = $$(".abas__aba");
  const paineisAbas = $$(".abas__painel");

  function ativarAba(abaAtiva) {
    abas.forEach((aba) => {
      const selecionada = aba === abaAtiva;
      aba.setAttribute("aria-selected", String(selecionada));
      aba.tabIndex = selecionada ? 0 : -1;
    });

    paineisAbas.forEach((painel) => {
      painel.hidden = painel.id !== abaAtiva.getAttribute("aria-controls");
    });

    filtrarEspetaculos();
  }

  abas.forEach((aba, indice) => {
    aba.addEventListener("click", () => ativarAba(aba));

    // Permite navegar pelas abas usando as setas do teclado.
    aba.addEventListener("keydown", (evento) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(evento.key)) return;

      evento.preventDefault();

      let novoIndice = indice;
      if (evento.key === "ArrowRight") novoIndice = (indice + 1) % abas.length;
      if (evento.key === "ArrowLeft") novoIndice = (indice - 1 + abas.length) % abas.length;
      if (evento.key === "Home") novoIndice = 0;
      if (evento.key === "End") novoIndice = abas.length - 1;

      abas[novoIndice].focus();
      ativarAba(abas[novoIndice]);
    });
  });

  const cardsEspetaculos = $$(".card");
  const buscaNome = $("#busca-nome");
  const buscaGenero = $("#busca-genero");
  const buscaTurno = $("#busca-turno");
  const buscaStatus = $("#busca-status");

  // Remove acentos para que "comedia" também encontre "Comédia".
  function normalizarTexto(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function filtrarEspetaculos() {
    const abaSelecionada = $('.abas__aba[aria-selected="true"]')?.id;
    const termo = normalizarTexto(buscaNome?.value || "");
    const genero = buscaGenero?.value || "";
    const turno = buscaTurno?.value || "";

    let quantidadeVisivel = 0;

    cardsEspetaculos.forEach((card) => {
      let corresponde = true;

      if (abaSelecionada === "aba-nome" && termo) {
        corresponde = normalizarTexto(card.dataset.titulo || "").includes(termo);
      } else if (abaSelecionada === "aba-genero" && genero) {
        corresponde = card.dataset.genero === genero;
      } else if (abaSelecionada === "aba-turno" && turno) {
        corresponde = card.dataset.turno === turno;
      }

      card.hidden = !corresponde;
      if (corresponde) quantidadeVisivel++;
    });

    if (buscaStatus) {
      buscaStatus.textContent = quantidadeVisivel === 1
        ? "Mostrando 1 espetáculo."
        : `Mostrando ${quantidadeVisivel} espetáculos.`;

      if (quantidadeVisivel === 0) {
        buscaStatus.textContent = "Nenhum espetáculo encontrado. Tente outra pesquisa.";
      }
    }
  }

  buscaNome?.addEventListener("input", filtrarEspetaculos);
  buscaGenero?.addEventListener("change", filtrarEspetaculos);
  buscaTurno?.addEventListener("change", filtrarEspetaculos);

  /* =========================================================
     5. CARROSSEL
     ========================================================= */

  const carrossel = $("#carrossel");
  const trilhoCarrossel = $("#carrossel-trilho");
  const slides = $$(".carrossel__slide", trilhoCarrossel || document);
  const pontosCarrossel = $("#car-pontos");
  const botaoAnterior = $("#car-anterior");
  const botaoProximo = $("#car-proximo");
  const botaoPausa = $("#car-pausa");

  let slideAtual = 0;
  let carrosselPausado = false;
  let temporizadorCarrossel = null;

  function mostrarSlide(indice) {
    if (!trilhoCarrossel || slides.length === 0) return;

    slideAtual = (indice + slides.length) % slides.length;
    trilhoCarrossel.style.transform = `translateX(-${slideAtual * 100}%)`;

    $$(".carrossel__pontos button", pontosCarrossel || document).forEach((ponto, i) => {
      ponto.setAttribute("aria-current", String(i === slideAtual));
      ponto.setAttribute("aria-label", `Mostrar slide ${i + 1}`);
    });
  }

  if (slides.length && pontosCarrossel) {
    slides.forEach((slide, indice) => {
      const ponto = document.createElement("button");
      ponto.type = "button";
      ponto.setAttribute("aria-label", `Mostrar slide ${indice + 1}`);
      ponto.setAttribute("aria-current", String(indice === 0));
      ponto.addEventListener("click", () => mostrarSlide(indice));
      pontosCarrossel.appendChild(ponto);
    });
  }

  botaoAnterior?.addEventListener("click", () => mostrarSlide(slideAtual - 1));
  botaoProximo?.addEventListener("click", () => mostrarSlide(slideAtual + 1));

  function iniciarCarrosselAutomatico() {
    clearInterval(temporizadorCarrossel);

    const movimentoReduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const animacoesDesligadas = html.dataset.animacoes === "off";

    if (carrosselPausado || movimentoReduzido || animacoesDesligadas || slides.length < 2) {
      return;
    }

    temporizadorCarrossel = setInterval(() => {
      mostrarSlide(slideAtual + 1);
    }, 5500);
  }

  botaoPausa?.addEventListener("click", () => {
    carrosselPausado = !carrosselPausado;
    botaoPausa.setAttribute("aria-pressed", String(carrosselPausado));
    botaoPausa.textContent = carrosselPausado ? "▶" : "⏸";
    botaoPausa.setAttribute(
      "aria-label",
      carrosselPausado ? "Retomar rotação automática" : "Pausar rotação automática"
    );
    iniciarCarrosselAutomatico();
  });

  // Reinicia/pausa o carrossel quando a preferência de animações mudar.
  opcaoAnimacoes?.addEventListener("change", iniciarCarrosselAutomatico);
  iniciarCarrosselAutomatico();

  /* =========================================================
     6. TEATRO: CRIAÇÃO DA PLATEIA E DOS ASSENTOS
     ========================================================= */

  const teatro = $("#teatro");
  const mundoTeatro = $("#teatro-mundo");
  const mapaAssentos = $("#mapa-assentos");
  const dicaTeatro = $("#teatro-dica");
  const botaoVoltarMapa = $("#btn-voltar-mapa");

  const campoEspetaculo = $("#assento-espetaculo");
  const resumoAssento = $("#res-assento");
  const resumoSetor = $("#res-setor");
  const resumoValor = $("#res-valor");
  const botaoReservar = $("#btn-reservar");
  const avisoAssento = $("#assento-aviso");

  const seletorFila = $("#alt-fila");
  const seletorPoltrona = $("#alt-poltrona");
  const formularioAlternativo = $("#form-alternativa");

  const filas = "ABCDEFGHIJ".split("");
  const quantidadePoltronasPorFila = 12;

  const nomesSetores = {
    premium: "Plateia Premium",
    central: "Plateia Central",
    superior: "Plateia Superior"
  };

  const ajustesPreco = {
    premium: 40,
    central: 0,
    superior: -15
  };

  let assentoSelecionado = null;
  let espetaculoSelecionado = null;
  let temporizadorVista = null;

  // Guarda todos os assentos para facilitar as consultas.
  const todosAssentos = [];

  function descobrirSetor(indiceFila) {
    if (indiceFila <= 2) return "premium";  // A, B e C
    if (indiceFila <= 6) return "central";  // D, E, F e G
    return "superior";                      // H, I e J
  }

  function assentoEstaOcupado(indiceFila, indicePoltrona) {
    // Ocupação fictícia e fixa: não muda a cada atualização da página.
    // Isso deixa alguns assentos indisponíveis para simular uma bilheteria.
    return (indiceFila * 13 + indicePoltrona * 7) % 17 === 0;
  }

  function criarAssentos() {
    if (!mapaAssentos || !mundoTeatro) return;

    mapaAssentos.replaceChildren();
    todosAssentos.length = 0;

    filas.forEach((letraFila, indiceFila) => {
      const linha = document.createElement("div");
      linha.className = "plateia__fila";
      linha.dataset.fila = letraFila;

      const rotulo = document.createElement("span");
      rotulo.className = "plateia__rotulo";
      rotulo.textContent = letraFila;
      rotulo.setAttribute("aria-hidden", "true");
      linha.appendChild(rotulo);

      for (let numero = 1; numero <= quantidadePoltronasPorFila; numero++) {
        const setor = descobrirSetor(indiceFila);
        const ocupado = assentoEstaOcupado(indiceFila, numero);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "assento";
        botao.dataset.fila = letraFila;
        botao.dataset.poltrona = String(numero);
        botao.dataset.setor = setor;
        botao.dataset.ocupado = String(ocupado);
        botao.setAttribute("aria-pressed", "false");

        const identificacao = `${letraFila}-${String(numero).padStart(2, "0")}`;
        botao.setAttribute(
          "aria-label",
          `Fila ${letraFila}, poltrona ${numero}, ${nomesSetores[setor]}${ocupado ? ", ocupada" : ", disponível"}`
        );
        botao.title = `${identificacao} — ${nomesSetores[setor]}`;

        if (ocupado) {
          botao.classList.add("is-ocupado");
          botao.disabled = true;
        }

        linha.appendChild(botao);

        const registro = {
          elemento: botao,
          fila: letraFila,
          numero,
          setor,
          ocupado,
          indiceFila,
          identificacao
        };

        todosAssentos.push(registro);

        botao.addEventListener("click", () => selecionarAssento(registro));
      }

      mapaAssentos.appendChild(linha);
    });

    preencherSeletorFilas();
  }

  /*
   * Calcula a posição da poltrona dentro do mundo 3D.
   * O CSS usa --seat-x e --seat-y para deslocar a câmera até ela.
   */
  function obterPosicaoNoMundo(elemento) {
    let x = 0;
    let y = 0;
    let atual = elemento;

    while (atual && atual !== mundoTeatro) {
      x += atual.offsetLeft;
      y += atual.offsetTop;
      atual = atual.offsetParent;
    }

    return {
      x: x + elemento.offsetWidth / 2,
      y: y + elemento.offsetHeight / 2
    };
  }

  function obterPrecoBase() {
    if (!espetaculoSelecionado) return 80;

    const textoPreco = $(".card__meta strong", espetaculoSelecionado)?.textContent || "R$ 80";
    const numero = Number(
      textoPreco
        .replace(/[^\d,]/g, "")
        .replace(",", ".")
    );

    return Number.isFinite(numero) && numero > 0 ? numero : 80;
  }

  function calcularPreco(setor) {
    return Math.max(0, obterPrecoBase() + ajustesPreco[setor]);
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function atualizarResumo(registro) {
    if (!registro) {
      if (resumoAssento) resumoAssento.textContent = "Nenhum selecionado";
      if (resumoSetor) resumoSetor.textContent = "—";
      if (resumoValor) resumoValor.textContent = "—";
      if (botaoReservar) botaoReservar.disabled = true;
      return;
    }

    if (resumoAssento) resumoAssento.textContent = registro.identificacao;
    if (resumoSetor) resumoSetor.textContent = nomesSetores[registro.setor];
    if (resumoValor) resumoValor.textContent = formatarMoeda(calcularPreco(registro.setor));
    if (botaoReservar) botaoReservar.disabled = false;
  }

  function atualizarSelecaoVisual(registro) {
    todosAssentos.forEach((assento) => {
      const selecionado = assento === registro;
      assento.elemento.classList.toggle("is-escolhido", selecionado);
      assento.elemento.setAttribute("aria-pressed", String(selecionado));
    });
  }

  function selecionarAssento(registro) {
    if (!teatro || !registro || registro.ocupado) return;

    clearTimeout(temporizadorVista);
    assentoSelecionado = registro;

    atualizarSelecaoVisual(registro);
    atualizarResumo(registro);

    const posicao = obterPosicaoNoMundo(registro.elemento);

    teatro.style.setProperty("--seat-x", `${posicao.x}px`);
    teatro.style.setProperty("--seat-y", `${posicao.y}px`);

    teatro.dataset.estado = "aproximando";

    if (dicaTeatro) {
      dicaTeatro.textContent = `Aproximando da poltrona ${registro.identificacao}...`;
    }

    if (botaoVoltarMapa) botaoVoltarMapa.hidden = true;

    if (avisoAssento) {
      avisoAssento.textContent = `Poltrona ${registro.identificacao} selecionada. Aproximando para mostrar a vista do palco.`;
    }

    // O CSS anima o primeiro movimento durante 1,5 segundo.
    temporizadorVista = setTimeout(() => {
      if (!teatro || !assentoSelecionado) return;

      teatro.dataset.estado = "vista";

      if (dicaTeatro) {
        dicaTeatro.textContent = `Vista do palco a partir da poltrona ${registro.identificacao}. Gostou? Você pode reservar ou voltar ao mapa.`;
      }

      if (botaoVoltarMapa) botaoVoltarMapa.hidden = false;
    }, 1550);
  }

  function voltarAoMapa() {
    if (!teatro) return;

    clearTimeout(temporizadorVista);
    teatro.dataset.estado = "mapa";

    if (dicaTeatro) {
      dicaTeatro.textContent = "Vista da plateia. Escolha uma poltrona.";
    }

    if (botaoVoltarMapa) botaoVoltarMapa.hidden = true;

    if (avisoAssento) {
      avisoAssento.textContent = "Você voltou ao mapa da plateia.";
    }
  }

  botaoVoltarMapa?.addEventListener("click", voltarAoMapa);

  /* =========================================================
     7. ESCOLHA DO ESPETÁCULO
     ========================================================= */

  $$("[data-espetaculo]").forEach((link) => {
    link.addEventListener("click", () => {
      const nome = link.dataset.espetaculo;
      espetaculoSelecionado = link.closest(".card");

      if (campoEspetaculo) {
        campoEspetaculo.textContent = nome;
      }

      // Atualiza o preço do assento caso o usuário já tenha escolhido um.
      if (assentoSelecionado) atualizarResumo(assentoSelecionado);
    });
  });

  /* =========================================================
     8. FORMULÁRIO ALTERNATIVO (FILA E POLTRONA)
     ========================================================= */

  function preencherSeletorFilas() {
    if (!seletorFila || !seletorPoltrona) return;

    seletorFila.replaceChildren();

    filas.forEach((letra) => {
      const opcao = document.createElement("option");
      opcao.value = letra;
      opcao.textContent = `Fila ${letra}`;
      seletorFila.appendChild(opcao);
    });

    atualizarOpcoesPoltronas();
  }

  function atualizarOpcoesPoltronas() {
    if (!seletorFila || !seletorPoltrona) return;

    const filaEscolhida = seletorFila.value || "A";
    const disponiveis = todosAssentos.filter(
      (assento) => assento.fila === filaEscolhida && !assento.ocupado
    );

    seletorPoltrona.replaceChildren();

    disponiveis.forEach((assento) => {
      const opcao = document.createElement("option");
      opcao.value = String(assento.numero);
      opcao.textContent = `Poltrona ${assento.numero}`;
      seletorPoltrona.appendChild(opcao);
    });

    if (disponiveis.length === 0) {
      const opcao = document.createElement("option");
      opcao.value = "";
      opcao.textContent = "Nenhuma disponível";
      seletorPoltrona.appendChild(opcao);
    }
  }

  seletorFila?.addEventListener("change", atualizarOpcoesPoltronas);

  formularioAlternativo?.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const fila = seletorFila?.value;
    const numero = Number(seletorPoltrona?.value);

    const registro = todosAssentos.find(
      (assento) =>
        assento.fila === fila &&
        assento.numero === numero &&
        !assento.ocupado
    );

    if (!registro) {
      if (avisoAssento) avisoAssento.textContent = "Escolha uma poltrona disponível.";
      return;
    }

    selecionarAssento(registro);
    teatro?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* =========================================================
     9. RESERVA (DEMONSTRAÇÃO)
     ========================================================= */

  botaoReservar?.addEventListener("click", () => {
    if (!assentoSelecionado) return;

    const nomeEspetaculo = espetaculoSelecionado
      ? $(".card__titulo", espetaculoSelecionado)?.textContent
      : "Espetáculo não selecionado";

    const mensagem =
      `Reserva demonstrativa\n\n` +
      `Espetáculo: ${nomeEspetaculo}\n` +
      `Assento: ${assentoSelecionado.identificacao}\n` +
      `Setor: ${nomesSetores[assentoSelecionado.setor]}\n` +
      `Valor: ${formatarMoeda(calcularPreco(assentoSelecionado))}\n\n` +
      `Esta é apenas uma simulação. Nenhum ingresso foi comprado.`;

    window.alert(mensagem);
  });

  // Constrói a plateia assim que o script é executado.
  criarAssentos();
  atualizarResumo(null);

  /* =========================================================
     10. FORMULÁRIO DE CONTATO
     ========================================================= */

  const formularioContato = $("#form-contato");
  const statusContato = $("#form-status");

  function mostrarErro(campo, mensagem) {
    const elementoErro = $(`#${campo.id}-erro`);

    if (!elementoErro) return;

    elementoErro.textContent = mensagem;
    elementoErro.hidden = !mensagem;

    campo.setAttribute("aria-invalid", String(Boolean(mensagem)));
  }

  formularioContato?.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (!formularioContato || !statusContato) return;

    const nome = $("#ct-nome");
    const email = $("#ct-email");
    const assunto = $("#ct-assunto");
    const mensagem = $("#ct-mensagem");
    const aceite = $("#ct-aceite");

    let formularioValido = true;

    [nome, email, assunto, mensagem, aceite].forEach((campo) => {
      if (campo) mostrarErro(campo, "");
    });

    if (!nome.value.trim()) {
      mostrarErro(nome, "Informe seu nome.");
      formularioValido = false;
    }

    if (!email.value.trim()) {
      mostrarErro(email, "Informe seu e-mail.");
      formularioValido = false;
    } else if (!email.validity.valid) {
      mostrarErro(email, "Digite um endereço de e-mail válido.");
      formularioValido = false;
    }

    if (!assunto.value) {
      mostrarErro(assunto, "Selecione um assunto.");
      formularioValido = false;
    }

    if (!mensagem.value.trim()) {
      mostrarErro(mensagem, "Escreva sua mensagem.");
      formularioValido = false;
    } else if (mensagem.value.trim().length < 10) {
      mostrarErro(mensagem, "A mensagem precisa ter pelo menos 10 caracteres.");
      formularioValido = false;
    }

    if (!aceite.checked) {
      mostrarErro(aceite, "É necessário concordar para enviar.");
      formularioValido = false;
    }

    if (!formularioValido) {
      statusContato.textContent = "Revise os campos destacados antes de continuar.";
      statusContato.className = "form__status is-erro";

      const primeiroCampoInvalido = $(" [aria-invalid='true']", formularioContato);
      primeiroCampoInvalido?.focus();
      return;
    }

    // Não há servidor conectado: mostramos apenas uma confirmação demonstrativa.
    statusContato.textContent =
      "Mensagem validada! Este formulário é uma demonstração e ainda não envia e-mails.";
    statusContato.className = "form__status is-sucesso";
    formularioContato.reset();
  });

  // Limpa mensagens de erro enquanto a pessoa corrige os campos.
  $$("#form-contato input, #form-contato select, #form-contato textarea").forEach((campo) => {
    campo.addEventListener("input", () => mostrarErro(campo, ""));
    campo.addEventListener("change", () => mostrarErro(campo, ""));
  });

})();