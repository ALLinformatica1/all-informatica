/* =================================
       PRODUTOS INICIAIS
    ================================= */

    let vendas = JSON.parse(localStorage.getItem("all_vendas")) || [];

function salvarVendas(){ localStorage.setItem("all_vendas", JSON.stringify(vendas)); if (window.ALLSync) window.ALLSync.salvarVendas(vendas); }

let produtos = JSON.parse(localStorage.getItem("all_produtos") || "[]");


    /* =================================
       SALVAR
    ================================= */

    function salvarProdutos() {
        localStorage.setItem("all_produtos", JSON.stringify(produtos));
        if (window.ALLSync) window.ALLSync.salvarProdutos(produtos);
    }


    /* =================================
       FORMATAÇÃO
    ================================= */

    function moeda(valor) {

        return valor.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    }


    /* =================================
       STATUS
    ================================= */

    function statusProduto(produto) {

        if (produto.quantidade === 0) {

            return `
                <span class="status status-out">
                    SEM ESTOQUE
                </span>
            `;

        }

        if (produto.quantidade <= produto.minimo) {

            return `
                <span class="status status-low">
                    ESTOQUE BAIXO
                </span>
            `;

        }

        return `
            <span class="status status-ok">
                NORMAL
            </span>
        `;

    }


    /* =================================
       DASHBOARD
    ================================= */

    function atualizarDashboard() {

        let totalProdutos = produtos.length;

        let totalUnidades = produtos.reduce(
            (total, produto) =>
                total + Number(produto.quantidade),
            0
        );

        let estoqueBaixo = produtos.filter(
            produto =>
                produto.quantidade <= produto.minimo
        ).length;

        let valorEstoqueCusto = produtos.reduce(
            (total, produto) =>
                total +
                Number(produto.quantidade) *
                Number(produto.custo),
            0
        );

        let valorEstoqueVenda = produtos.reduce(
            (total, produto) =>
                total +
                Number(produto.quantidade) *
                Number(produto.venda),
            0
        );


        document.getElementById(
            "totalProdutos"
        ).textContent = totalProdutos;


        document.getElementById(
            "totalUnidades"
        ).textContent = totalUnidades;


        document.getElementById(
            "estoqueBaixo"
        ).textContent = estoqueBaixo;


        const valorEstoqueCustoEl = document.getElementById("valorEstoqueCusto");
        if (valorEstoqueCustoEl) valorEstoqueCustoEl.textContent = moeda(valorEstoqueCusto);

        const valorEstoqueVendaEl = document.getElementById("valorEstoqueVenda");
        if (valorEstoqueVendaEl) valorEstoqueVendaEl.textContent = moeda(valorEstoqueVenda);


        const hoje = new Date().toLocaleDateString("pt-BR");
        const totalVendasHoje = vendas.filter(v => v.data === hoje).reduce((t,v) => t + Number(v.total), 0);
        const vendasHojeEl = document.getElementById("vendasHoje");
        if (vendasHojeEl) vendasHojeEl.textContent = moeda(totalVendasHoje);

        let tabela = document.getElementById("dashboardProdutos");
        if (!tabela) return;
        tabela.innerHTML = "";


        produtos.slice(0, 6).forEach(produto => {

            tabela.innerHTML += `

                <tr>

                    <td class="product-name">
                        ${produto.nome}
                    </td>

                    <td class="category">
                        ${produto.categoria}
                    </td>

                    <td>
                        ${produto.quantidade}
                    </td>

                    <td>
                        ${moeda(Number(produto.venda))}
                    </td>

                    <td>
                        ${statusProduto(produto)}
                    </td>

                </tr>

            `;

        });

    }


    /* =================================
       RENDERIZAR PRODUTOS
    ================================= */

    function renderizarProdutos() {

        let tabela = document.getElementById("tabelaProdutos");
        if (!tabela) return;
        tabela.innerHTML = "";


        let busca =
            document.getElementById(
                "buscar"
            ).value.toLowerCase();


        let categoria =
            document.getElementById(
                "filtroCategoria"
            ).value;


        let filtrados = produtos.filter(produto => {

            let correspondeBusca =
                produto.nome
                    .toLowerCase()
                    .includes(busca) ||

                produto.codigo
                    .toLowerCase()
                    .includes(busca);


            let correspondeCategoria =
                categoria === "" ||
                produto.categoria === categoria;


            return correspondeBusca &&
                   correspondeCategoria;

        });


        if (filtrados.length === 0) {

            tabela.innerHTML = `

                <tr>

                    <td colspan="8"
                        style="text-align:center;color:#777;padding:30px;">

                        Nenhum produto encontrado.

                    </td>

                </tr>

            `;

            return;

        }


        filtrados.forEach((produto, index) => {

            tabela.innerHTML += `

                <tr>

                    <td>
                        ${produto.codigo}
                    </td>

                    <td class="product-name">
                        ${produto.nome}
                    </td>

                    <td class="category">
                        ${produto.categoria}
                    </td>

                    <td>
                        ${produto.quantidade}
                    </td>

                    <td>
                        ${moeda(Number(produto.custo))}
                    </td>

                    <td>
                        ${moeda(Number(produto.venda))}
                    </td>

                    <td>
                        ${statusProduto(produto)}
                    </td>

                    <td>

                        <div class="acoes-produto">
                            <button
                                class="btn btn-estoque btn-small"
                                type="button"
                                onclick="abrirEntradaEstoque('${produto.codigo}')">
                                + Estoque
                            </button>
                            <button
                                class="btn btn-danger btn-small"
                                type="button"
                                onclick="excluirProduto('${produto.codigo}')">
                                Excluir
                            </button>
                        </div>

                    </td>

                </tr>

            `;

        });

    }


    /* =================================
       ENTRADA DE ESTOQUE
    ================================= */

    function abrirEntradaEstoque(codigoInicial = "") {
        const select = document.getElementById("produtoEntradaSelect");
        select.innerHTML = '<option value="">Selecione um produto</option>';

        produtos.forEach(produto => {
            const option = document.createElement("option");
            option.value = produto.codigo;
            option.textContent = produto.nome + " — estoque: " + Number(produto.quantidade);
            select.appendChild(option);
        });

        document.getElementById("quantidadeEntrada").value = 1;

        if (codigoInicial) {
            select.value = codigoInicial;
        }

        atualizarResumoEntradaEstoque();
        document.getElementById("modalEntradaEstoque").style.display = "flex";
    }

    function fecharEntradaEstoque() {
        document.getElementById("modalEntradaEstoque").style.display = "none";
    }

    function atualizarResumoEntradaEstoque() {
        const codigo = document.getElementById("produtoEntradaSelect").value;
        const quantidadeEntrada = Math.max(0, Number(document.getElementById("quantidadeEntrada").value) || 0);
        const produto = produtos.find(p => p.codigo === codigo);
        const estoqueAtual = produto ? Number(produto.quantidade) : 0;
        const novoEstoque = estoqueAtual + quantidadeEntrada;

        document.getElementById("estoqueAtualEntrada").value = estoqueAtual + " unidades";
        document.getElementById("novoEstoqueEntrada").textContent = novoEstoque + " unidades";
    }

    const produtoEntradaSelectEl = document.getElementById("produtoEntradaSelect");
    const quantidadeEntradaEl = document.getElementById("quantidadeEntrada");
    const formEntradaEstoqueEl = document.getElementById("formEntradaEstoque");

    if (produtoEntradaSelectEl) produtoEntradaSelectEl.addEventListener("change", atualizarResumoEntradaEstoque);
    if (quantidadeEntradaEl) quantidadeEntradaEl.addEventListener("input", atualizarResumoEntradaEstoque);

    if (formEntradaEstoqueEl) formEntradaEstoqueEl.addEventListener("submit", function(event) {
        event.preventDefault();

        const codigo = document.getElementById("produtoEntradaSelect").value;
        const quantidadeEntrada = Number(document.getElementById("quantidadeEntrada").value);
        const produto = produtos.find(p => p.codigo === codigo);

        if (!produto) {
            alert("Selecione um produto.");
            return;
        }

        if (!Number.isInteger(quantidadeEntrada) || quantidadeEntrada < 1) {
            alert("Informe uma quantidade válida de unidades que chegaram.");
            return;
        }

        const estoqueAnterior = Number(produto.quantidade);
        produto.quantidade = estoqueAnterior + quantidadeEntrada;

        salvarProdutos();
        atualizarDashboard();
        renderizarProdutos();
        fecharEntradaEstoque();

        alert(
            "Entrada de estoque registrada com sucesso!\n\n" +
            produto.nome +
            "\nEstoque anterior: " + estoqueAnterior +
            "\nQuantidade adicionada: " + quantidadeEntrada +
            "\nNovo estoque: " + produto.quantidade
        );
    });

    /* =================================
       CADASTRAR PRODUTO
    ================================= */

const formProduto = document.getElementById("formProduto");

if (formProduto) {
    formProduto.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            let novoProduto = {

                codigo:
                    document.getElementById(
                        "codigo"
                    ).value.trim(),

                nome:
                    document.getElementById(
                        "nome"
                    ).value.trim(),

                categoria:
                    document.getElementById(
                        "categoria"
                    ).value,

                quantidade:
                    Number(
                        document.getElementById(
                            "quantidade"
                        ).value
                    ),

                minimo:
                    Number(
                        document.getElementById(
                            "minimo"
                        ).value
                    ),

                custo:
                    Number(
                        document.getElementById(
                            "custo"
                        ).value
                    ),

                venda:
                    Number(
                        document.getElementById(
                            "venda"
                        ).value
                    ),

                localizacao:
                    document.getElementById(
                        "localizacao"
                    ).value.trim()

            };


            /* Verificar código duplicado */

            let existe = produtos.some(
                produto =>
                    produto.codigo ===
                    novoProduto.codigo
            );


            if (existe) {

                alert(
                    "Já existe um produto com esse código."
                );

                return;

            }


            produtos.push(novoProduto);

            salvarProdutos();

            atualizarDashboard();

            renderizarProdutos();

            fecharModal();

            this.reset();

            alert(
                "Produto cadastrado com sucesso!"
            );

        }
    );
}


    /* =================================
       EXCLUIR
    ================================= */

    function excluirProduto(codigo) {

        let confirmar = confirm(
            "Tem certeza que deseja excluir este produto?"
        );


        if (!confirmar) return;


        produtos = produtos.filter(
            produto =>
                produto.codigo !== codigo
        );


        salvarProdutos();

        atualizarDashboard();

        renderizarProdutos();

    }


    /* =================================
       MODAL
    ================================= */

    function abrirModal() {

        document.getElementById(
            "modalProduto"
        ).style.display = "flex";

    }


    function fecharModal() {

        document.getElementById(
            "modalProduto"
        ).style.display = "none";

    }


    /* =================================
       NAVEGAÇÃO
    ================================= */

    function mostrarSecao(secao, botao) {

        document.getElementById(
            "dashboard"
        ).style.display =
            secao === "dashboard"
                ? "block"
                : "none";


        document.getElementById(
            "produtos"
        ).style.display =
            secao === "produtos"
                ? "block"
                : "none";

        document.getElementById(
            "historicoVendas"
        ).style.display =
            secao === "historicoVendas"
                ? "block"
                : "none";


        document.getElementById(
            "pageTitle"
        ).textContent =
            secao === "dashboard"
                ? "Dashboard"
                : secao === "historicoVendas"
                    ? "Histórico de vendas"
                    : "Produtos";


        if (botao) {

            document
                .querySelectorAll(".menu button")
                .forEach(btn =>
                    btn.classList.remove(
                        "active"
                    )
                );

            botao.classList.add("active");

        }


        if (secao === "produtos") {

            renderizarProdutos();

        }

    }


    /* =================================
       MOSTRAR TODOS
    ================================= */

    function mostrarTodos() {

        mostrarSecao("produtos");

        document.getElementById(
            "buscar"
        ).value = "";

        document.getElementById(
            "filtroCategoria"
        ).value = "";

        renderizarProdutos();

    }


    /* =================================
       FILTRAR ESTOQUE BAIXO
    ================================= */

    function filtrarBaixoEstoque() {

        mostrarSecao("produtos");

        document.getElementById(
            "buscar"
        ).value = "";

        document.getElementById(
            "filtroCategoria"
        ).value = "";


        let tabela = document.getElementById("tabelaProdutos");
        if (!tabela) return;
        tabela.innerHTML = "";


        let baixos = produtos.filter(
            produto =>
                produto.quantidade <=
                produto.minimo
        );


        baixos.forEach(produto => {

            tabela.innerHTML += `

                <tr>

                    <td>
                        ${produto.codigo}
                    </td>

                    <td class="product-name">
                        ${produto.nome}
                    </td>

                    <td class="category">
                        ${produto.categoria}
                    </td>

                    <td>
                        ${produto.quantidade}
                    </td>

                    <td>
                        ${moeda(Number(produto.custo))}
                    </td>

                    <td>
                        ${moeda(Number(produto.venda))}
                    </td>

                    <td>
                        ${statusProduto(produto)}
                    </td>

                    <td>

                        <div class="acoes-produto">
                            <button
                                class="btn btn-estoque btn-small"
                                type="button"
                                onclick="abrirEntradaEstoque('${produto.codigo}')">
                                + Estoque
                            </button>
                            <button
                                class="btn btn-danger btn-small"
                                type="button"
                                onclick="excluirProduto('${produto.codigo}')">
                                Excluir
                            </button>
                        </div>

                    </td>

                </tr>

            `;

        });


        if (baixos.length === 0) {

            tabela.innerHTML = `

                <tr>

                    <td colspan="8"
                        style="text-align:center;padding:30px;color:#2ecc71;">

                        ✓ Nenhum produto com estoque baixo.

                    </td>

                </tr>

            `;

        }

    }


    /* =================================
       INICIALIZAÇÃO
    ================================= */

    if (document.getElementById("totalProdutos")) atualizarDashboard();
    if (document.getElementById("tabelaProdutos")) renderizarProdutos();


let itensVendaAtual = [];

function abrirNovaVenda(codigoInicial = "") {
    const select = document.getElementById("produtoVendaSelect");
    select.innerHTML = '<option value="">Selecione um produto</option>';

    produtos.filter(p => Number(p.quantidade) > 0).forEach(p => {
        const option = document.createElement("option");
        option.value = p.codigo;
        option.textContent = p.nome + " — estoque: " + p.quantidade;
        select.appendChild(option);
    });

    if (select.options.length === 1) {
        alert("Não há produtos disponíveis em estoque para venda.");
        return;
    }

    itensVendaAtual = [];
    document.getElementById("quantidadeProdutoVenda").value = 1;
    document.getElementById("descontoNovaVenda").value = 0;
    renderizarItensVenda();

    if (codigoInicial) {
        select.value = codigoInicial;
    }

    document.getElementById("modalNovaVenda").style.display = "flex";
}

function abrirVenda(codigo) {
    abrirNovaVenda(codigo);
}

function fecharNovaVenda() {
    document.getElementById("modalNovaVenda").style.display = "none";
    itensVendaAtual = [];
}

function atualizarOpcoesProdutosVenda() {
    const select = document.getElementById("produtoVendaSelect");
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione um produto</option>';

    produtos.filter(p => Number(p.quantidade) > 0).forEach(p => {
        const option = document.createElement("option");
        option.value = p.codigo;
        option.textContent = p.nome + " — estoque: " + p.quantidade;
        select.appendChild(option);
    });

    if ([...select.options].some(o => o.value === valorAtual)) {
        select.value = valorAtual;
    }
}

function adicionarProdutoVenda() {
    const codigo = document.getElementById("produtoVendaSelect").value;
    const quantidade = Number(document.getElementById("quantidadeProdutoVenda").value);
    const produto = produtos.find(p => p.codigo === codigo);

    if (!produto) {
        alert("Selecione um produto.");
        return;
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
        alert("Informe uma quantidade válida.");
        return;
    }

    const itemExistente = itensVendaAtual.find(item => item.codigo === codigo);
    const quantidadeAtual = itemExistente ? itemExistente.quantidade : 0;
    const novaQuantidade = quantidadeAtual + quantidade;

    if (novaQuantidade > Number(produto.quantidade)) {
        alert("Quantidade indisponível. Estoque atual: " + produto.quantidade + " e já adicionado: " + quantidadeAtual + ".");
        return;
    }

    if (itemExistente) {
        itemExistente.quantidade = novaQuantidade;
    } else {
        itensVendaAtual.push({
            codigo: produto.codigo,
            produto: produto.nome,
            quantidade: quantidade,
            valorUnitario: Number(produto.venda)
        });
    }

    document.getElementById("quantidadeProdutoVenda").value = 1;
    renderizarItensVenda();
    atualizarOpcoesProdutosVenda();
}

function removerProdutoVenda(codigo) {
    itensVendaAtual = itensVendaAtual.filter(item => item.codigo !== codigo);
    renderizarItensVenda();
    atualizarOpcoesProdutosVenda();
}

function renderizarItensVenda() {
    const tabela = document.getElementById("itensNovaVenda");

    if (itensVendaAtual.length === 0) {
        tabela.innerHTML = '<tr><td colspan="5" class="venda-vazia">Nenhum produto adicionado.</td></tr>';
    } else {
        tabela.innerHTML = itensVendaAtual.map(item => `
            <tr>
                <td>${item.produto}</td>
                <td>${item.quantidade}</td>
                <td>${moeda(item.valorUnitario)}</td>
                <td>${moeda(item.quantidade * item.valorUnitario)}</td>
                <td>
                    <button type="button" class="btn-remover-item" onclick="removerProdutoVenda('${item.codigo}')">×</button>
                </td>
            </tr>
        `).join("");
    }

    atualizarTotaisVenda();
}

function atualizarTotaisVenda() {
    const subtotal = itensVendaAtual.reduce(
        (total, item) => total + (Number(item.quantidade) * Number(item.valorUnitario)),
        0
    );

    const desconto = Math.max(0, Number(document.getElementById("descontoNovaVenda").value) || 0);
    const total = Math.max(0, subtotal - desconto);

    document.getElementById("subtotalNovaVenda").value = moeda(subtotal);
    document.getElementById("totalNovaVenda").textContent = moeda(total);
}

document.getElementById("descontoNovaVenda")?.addEventListener("input", atualizarTotaisVenda);

document.getElementById("formNovaVenda")?.addEventListener("submit", function(e) {
    e.preventDefault();

    if (itensVendaAtual.length === 0) {
        alert("Adicione pelo menos um produto à venda.");
        return;
    }

    const subtotal = itensVendaAtual.reduce(
        (total, item) => total + (Number(item.quantidade) * Number(item.valorUnitario)),
        0
    );

    const desconto = Math.max(0, Number(document.getElementById("descontoNovaVenda").value) || 0);

    if (desconto > subtotal) {
        alert("O desconto não pode ser maior que o subtotal da venda.");
        return;
    }

    // Confere o estoque novamente antes de concluir a venda.
    for (const item of itensVendaAtual) {
        const produto = produtos.find(p => p.codigo === item.codigo);
        if (!produto || Number(item.quantidade) > Number(produto.quantidade)) {
            alert("O estoque do produto '" + (item.produto || item.codigo) + "' não é suficiente para concluir a venda.");
            return;
        }
    }

    const total = subtotal - desconto;
    const d = new Date();

    // Baixa o estoque de todos os produtos da compra.
    itensVendaAtual.forEach(item => {
        const produto = produtos.find(p => p.codigo === item.codigo);
        produto.quantidade = Number(produto.quantidade) - Number(item.quantidade);
    });

    vendas.push({
        id: Date.now(),
        itens: itensVendaAtual.map(item => ({ ...item })),
        quantidadeItens: itensVendaAtual.length,
        subtotal,
        desconto,
        total,
        data: d.toLocaleDateString("pt-BR"),
        hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    });

    salvarProdutos();
    salvarVendas();
    if (document.getElementById("totalProdutos")) atualizarDashboard();
    if (document.getElementById("tabelaProdutos")) renderizarProdutos();

    const resumoProdutos = itensVendaAtual
        .map(item => "• " + item.produto + " x" + item.quantidade)
        .join("\n");

    fecharNovaVenda();

    alert(
        "Venda registrada com sucesso!\n\n" +
        resumoProdutos +
        "\n\nSubtotal: " + moeda(subtotal) +
        "\nDesconto: " + moeda(desconto) +
        "\nTotal: " + moeda(total)
    );
});

/* =================================
   HISTÓRICO DE VENDAS
================================= */

let periodoHistoricoAtual = "dia";

function dataVendaParaDate(venda) {
    if (!venda || !venda.data) return null;

    const partes = String(venda.data).split("/");
    if (partes.length !== 3) return null;

    const dia = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const ano = Number(partes[2]);
    const horaPartes = String(venda.hora || "00:00").split(":");
    const hora = Number(horaPartes[0]) || 0;
    const minuto = Number(horaPartes[1]) || 0;

    return new Date(ano, mes, dia, hora, minuto, 0, 0);
}

function obterItensDaVenda(venda) {
    // Mantém compatibilidade com vendas antigas que possuíam apenas um produto.
    if (Array.isArray(venda.itens)) {
        return venda.itens;
    }

    if (venda.codigo || venda.produto) {
        return [{
            codigo: venda.codigo || "",
            produto: venda.produto || "Produto",
            quantidade: Number(venda.quantidade) || 0,
            valorUnitario: Number(venda.valorUnitario ?? venda.preco ?? 0)
        }];
    }

    return [];
}

function vendaEstaNoPeriodo(venda, periodo) {
    const dataVenda = dataVendaParaDate(venda);
    if (!dataVenda) return false;

    const agora = new Date();

    if (periodo === "todas") return true;

    if (periodo === "dia") {
        return dataVenda.getFullYear() === agora.getFullYear() &&
               dataVenda.getMonth() === agora.getMonth() &&
               dataVenda.getDate() === agora.getDate();
    }

    if (periodo === "semana") {
        const inicioSemana = new Date(agora);
        const diaSemana = inicioSemana.getDay();
        const distanciaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
        inicioSemana.setDate(inicioSemana.getDate() - distanciaSegunda);
        inicioSemana.setHours(0, 0, 0, 0);

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 7);

        return dataVenda >= inicioSemana && dataVenda < fimSemana;
    }

    if (periodo === "mes") {
        return dataVenda.getFullYear() === agora.getFullYear() &&
               dataVenda.getMonth() === agora.getMonth();
    }

    return true;
}

function mostrarHistoricoVendas(botao) {
    mostrarSecao("historicoVendas", botao);
    periodoHistoricoAtual = "dia";

    document.querySelectorAll(".filtro-venda").forEach(btn => btn.classList.remove("ativo", "btn-primary"));
    const filtroHoje = document.querySelector('.filtro-venda[onclick*="filtrarHistoricoVendas(\'dia\'"]');
    if (filtroHoje) {
        filtroHoje.classList.add("ativo", "btn-primary");
    }

    renderizarHistoricoVendas();
}

function filtrarHistoricoVendas(periodo, botao) {
    periodoHistoricoAtual = periodo;

    document.querySelectorAll(".filtro-venda").forEach(btn => {
        btn.classList.remove("ativo", "btn-primary");
    });

    if (botao) {
        botao.classList.add("ativo", "btn-primary");
    }

    renderizarHistoricoVendas();
}

function renderizarHistoricoVendas() {
    const vendasPeriodo = vendas
        .filter(venda => vendaEstaNoPeriodo(venda, periodoHistoricoAtual))
        .sort((a, b) => (b.id || 0) - (a.id || 0));

    const faturamentoBruto = vendasPeriodo.reduce((total, venda) => total + Number(venda.subtotal || 0), 0);
    const descontos = vendasPeriodo.reduce((total, venda) => total + Number(venda.desconto || 0), 0);
    const valorVendido = vendasPeriodo.reduce((total, venda) => total + Number(venda.total || 0), 0);
    const quantidadeVendas = vendasPeriodo.length;

    let quantidadeProdutos = 0;
    const produtosVendidos = {};

    vendasPeriodo.forEach(venda => {
        obterItensDaVenda(venda).forEach(item => {
            const quantidade = Number(item.quantidade) || 0;
            const valorUnitario = Number(item.valorUnitario) || 0;
            quantidadeProdutos += quantidade;

            const chave = item.codigo || item.produto;
            if (!produtosVendidos[chave]) {
                produtosVendidos[chave] = {
                    codigo: item.codigo || "",
                    produto: item.produto || "Produto",
                    quantidade: 0,
                    valorTotal: 0,
                    ultimoValorUnitario: valorUnitario
                };
            }

            produtosVendidos[chave].quantidade += quantidade;
            produtosVendidos[chave].valorTotal += quantidade * valorUnitario;
            produtosVendidos[chave].ultimoValorUnitario = valorUnitario;
        });
    });

    document.getElementById("historicoTotalVendido").textContent = moeda(valorVendido);
    document.getElementById("historicoFaturamentoBruto").textContent = moeda(faturamentoBruto);
    document.getElementById("historicoQuantidadeVendas").textContent = quantidadeVendas;
    document.getElementById("historicoQuantidadeProdutos").textContent = quantidadeProdutos;
    document.getElementById("historicoDescontos").textContent = moeda(descontos);

    const tabelaProdutos = document.getElementById("historicoProdutosTabela");
    const listaProdutos = Object.values(produtosVendidos).sort((a, b) => b.quantidade - a.quantidade);

    if (listaProdutos.length === 0) {
        tabelaProdutos.innerHTML = '<tr><td colspan="4" class="historico-sem-resultados">Nenhum produto vendido neste período.</td></tr>';
    } else {
        tabelaProdutos.innerHTML = listaProdutos.map(item => `
            <tr>
                <td class="product-name">${item.produto}</td>
                <td>${item.quantidade}</td>
                <td>${moeda(item.ultimoValorUnitario)}</td>
                <td>${moeda(item.valorTotal)}</td>
            </tr>
        `).join("");
    }

    const tabelaVendas = document.getElementById("historicoVendasTabela");

    if (vendasPeriodo.length === 0) {
        tabelaVendas.innerHTML = '<tr><td colspan="6" class="historico-sem-resultados">Nenhuma venda registrada neste período.</td></tr>';
    } else {
        tabelaVendas.innerHTML = vendasPeriodo.map(venda => {
            const itens = obterItensDaVenda(venda);
            const quantidadeItens = itens.reduce((total, item) => total + (Number(item.quantidade) || 0), 0);
            const resumo = itens.map(item => `${item.produto} x${item.quantidade}`).join(" • ");

            return `
                <tr title="${resumo}">
                    <td>${venda.data || "-"}</td>
                    <td>${venda.hora || "-"}</td>
                    <td>${quantidadeItens}</td>
                    <td>${moeda(Number(venda.subtotal || 0))}</td>
                    <td>${moeda(Number(venda.desconto || 0))}</td>
                    <td><strong>${moeda(Number(venda.total || 0))}</strong></td>
                </tr>
            `;
        }).join("");
    }
}


/* =================================
   LIMPAR HISTÓRICO DE VENDAS
================================= */

function limparHistoricoVendas() {
    if (vendas.length === 0) {
        alert("Não há vendas registradas para limpar.");
        return;
    }

    const confirmar = confirm(
        "ATENÇÃO!\n\n" +
        "Isso irá apagar todo o histórico de vendas e DEVOLVER ao estoque os produtos que foram baixados pelas vendas.\n\n" +
        "Use esta opção somente se quiser desfazer as vendas registradas.\n\n" +
        "Deseja realmente limpar todas as vendas?"
    );

    if (!confirmar) return;

    // Recoloca no estoque todos os produtos vendidos.
    vendas.forEach(venda => {
        obterItensDaVenda(venda).forEach(item => {
            const produto = produtos.find(p => p.codigo === item.codigo);
            if (produto) {
                produto.quantidade = Number(produto.quantidade) + (Number(item.quantidade) || 0);
            }
        });
    });

    vendas = [];
    salvarProdutos();
    salvarVendas();
    if (document.getElementById("totalProdutos")) atualizarDashboard();
    if (document.getElementById("tabelaProdutos")) renderizarProdutos();
    if (document.getElementById("historicoVendasTabela")) renderizarHistoricoVendas();

    alert("Histórico de vendas limpo e estoque restaurado com sucesso!");
}


// ==========================================================
// NAVEGAÇÃO POR LINKS DO MENU (quando vindo de outra página)
// ==========================================================
function abrirDestinoDoHash() {
    const hash = String(location.hash || '').toLowerCase();
    if (!hash) return;

    if (hash === '#produtos') {
        mostrarSecao('produtos');
        return;
    }
    if (hash === '#entrada-estoque') {
        setTimeout(() => abrirEntradaEstoque(), 100);
        return;
    }
    if (hash === '#estoque-baixo') {
        setTimeout(() => filtrarBaixoEstoque(), 100);
        return;
    }
    if (hash === '#todos-produtos') {
        setTimeout(() => mostrarTodos(), 100);
        return;
    }
}

document.addEventListener('DOMContentLoaded', abrirDestinoDoHash);
window.addEventListener('hashchange', abrirDestinoDoHash);

// ==========================================================
// SINCRONIZAÇÃO ONLINE — mantém o sistema local funcionando
// enquanto carrega os dados compartilhados da nuvem.
// ==========================================================
window.addEventListener("load", function () {
    if (!window.ALLSync) return;
    ALLSync.init({
        aplicar: async function (dados) {
            // Se a nuvem já possui dados, ela passa a ser a fonte principal deste usuário.
            // Se a nuvem estiver totalmente vazia, preservamos o local para permitir o primeiro envio.
            if (dados.temDadosNuvem) {
                if (Array.isArray(dados.produtos)) {
                    produtos = dados.produtos;
                    localStorage.setItem("all_produtos", JSON.stringify(produtos));
                }
                if (Array.isArray(dados.vendas)) {
                    vendas = dados.vendas;
                    localStorage.setItem("all_vendas", JSON.stringify(vendas));
                }
            }
            atualizarDashboard();
            renderizarProdutos();
            if (typeof renderizarHistoricoVendas === "function") renderizarHistoricoVendas();
        }
    });
});
