/* ==========================================================
   ALL INFORMÁTICA — SINCRONIZAÇÃO ONLINE
   Supabase + localStorage (modo offline)
   ========================================================== */
(function () {
    const config = window.ALL_SUPABASE_CONFIG || {};
    const configurado = String(config.url || '').startsWith('http') && String(config.anonKey || '').length > 20;

    const state = {
        configurado,
        cliente: null,
        sessao: null,
        inicializado: false,
        online: false,
        erro: ''
    };

    const filas = {};
    let canaisRealtime = {};
    let realtimeIniciado = false;

    if (configurado && window.supabase) {
        state.cliente = window.supabase.createClient(config.url, config.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
    }

    function aviso(texto, tipo = 'info') {
        let el = document.getElementById('allSyncStatus');
        if (!el) {
            el = document.createElement('div');
            el.id = 'allSyncStatus';
            el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;max-width:360px;padding:11px 14px;border-radius:10px;font:600 12px Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35);display:none;';
            document.body.appendChild(el);
        }
        el.textContent = texto;
        el.style.display = 'block';
        el.style.background = tipo === 'ok' ? '#123c28' : tipo === 'erro' ? '#4a1820' : '#172b3e';
        el.style.color = '#fff';
        el.style.border = '1px solid ' + (tipo === 'ok' ? '#238a54' : tipo === 'erro' ? '#b4232f' : '#168cff');
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.style.display = 'none', 4500);
    }

    function local(key, fallback = []) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch {
            return fallback;
        }
    }

    async function usuarioAtual() {
        if (!state.cliente) return null;
        const { data, error } = await state.cliente.auth.getSession();
        if (error) throw error;
        state.sessao = data.session || null;
        return state.sessao;
    }

    async function login(email, senha) {
        if (!state.cliente) throw new Error('Supabase ainda não foi configurado.');
        const { data, error } = await state.cliente.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        state.sessao = data.session;
        return data;
    }

    async function logout() {
        await pararRealtime();
        if (state.cliente) await state.cliente.auth.signOut();
        state.sessao = null;
    }

    async function cadastrarUsuario(email, senha) {
        if (!state.cliente) throw new Error('Supabase ainda não foi configurado.');
        const { data, error } = await state.cliente.auth.signUp({ email, password: senha });
        if (error) throw error;
        if (data.session) state.sessao = data.session;
        return data;
    }

    const tabelas = {
        produtos: 'all_produtos',
        vendas: 'all_vendas',
        ordens: 'all_ordens_servico'
    };

    async function buscarTabela(tabela) {
        if (!state.cliente || !state.sessao) return [];
        const { data, error } = await state.cliente
            .from(tabela)
            .select('id,dados,atualizado_em')
            .eq('user_id', state.sessao.user.id);
        if (error) throw error;
        return (data || []).map(row => row.dados).filter(Boolean);
    }

    function idDoItem(item) {
        return String(item?.codigo ?? item?.id ?? item?.numero ?? '');
    }

    async function salvarTabelaAgora(tabela, lista) {
        if (!state.cliente || !state.sessao) return false;

        const listaNormalizada = Array.isArray(lista) ? lista : [];
        const agora = new Date().toISOString();
        const userId = state.sessao.user.id;

        const { data: existentes, error: erroBusca } = await state.cliente
            .from(tabela)
            .select('id')
            .eq('user_id', userId);
        if (erroBusca) throw erroBusca;

        const idsNovos = listaNormalizada.map(idDoItem).filter(Boolean);
        const idsAntigos = (existentes || []).map(row => String(row.id));
        const idsRemover = idsAntigos.filter(id => !idsNovos.includes(id));

        if (idsRemover.length) {
            const { error } = await state.cliente
                .from(tabela)
                .delete()
                .eq('user_id', userId)
                .in('id', idsRemover);
            if (error) throw error;
        }

        const rows = listaNormalizada
            .map(item => ({
                id: idDoItem(item),
                user_id: userId,
                dados: item,
                atualizado_em: agora
            }))
            .filter(row => row.id);

        if (rows.length) {
            const { error } = await state.cliente
                .from(tabela)
                .upsert(rows, { onConflict: 'user_id,id' });
            if (error) throw error;
        }

        return true;
    }

    // Garante que duas gravações rápidas não se sobrescrevam por causa de corrida.
    function salvarTabela(tabela, lista) {
        const anterior = filas[tabela] || Promise.resolve();
        const atual = anterior
            .catch(() => {})
            .then(() => salvarTabelaAgora(tabela, lista));
        filas[tabela] = atual.catch(() => {});
        return atual;
    }

    async function apagarTabela(tabela) {
        if (!state.cliente || !state.sessao) return false;
        const { error } = await state.cliente
            .from(tabela)
            .delete()
            .eq('user_id', state.sessao.user.id);
        if (error) throw error;
        return true;
    }

    async function carregarNuvem() {
        if (!state.configurado) return { configurado: false, conectado: false };
        if (!state.cliente) return { configurado: true, conectado: false, erro: 'Biblioteca Supabase não carregada.' };

        const sessao = await usuarioAtual();
        if (!sessao) return { configurado: true, conectado: false };

        const [produtos, vendas, ordens] = await Promise.all([
            buscarTabela(tabelas.produtos),
            buscarTabela(tabelas.vendas),
            buscarTabela(tabelas.ordens)
        ]);

        state.online = true;
        iniciarRealtime();
        return {
            configurado: true,
            conectado: true,
            produtos,
            vendas,
            ordens,
            temDadosNuvem: produtos.length > 0 || vendas.length > 0 || ordens.length > 0
        };
    }

    async function init(opcoes = {}) {
        if (state.inicializado) return;
        state.inicializado = true;

        if (!state.configurado) {
            if (opcoes.mostrarAviso !== false) aviso('Modo local: configure o Supabase para sincronizar entre aparelhos.');
            return { configurado: false, conectado: false };
        }

        try {
            const dados = await carregarNuvem();
            if (!dados.conectado) {
                if (opcoes.mostrarAviso !== false) aviso('Banco configurado, mas nenhum usuário está conectado.');
                return dados;
            }

            if (typeof opcoes.aplicar === 'function') {
                await opcoes.aplicar(dados);
            }

            aviso('☁️ Conectado à nuvem.', 'ok');
            return dados;
        } catch (erro) {
            state.erro = erro.message || String(erro);
            state.online = false;
            console.error('ALL Sync:', erro);
            aviso('Não foi possível sincronizar. O modo local continua funcionando.', 'erro');
            return { configurado: true, conectado: false, erro: state.erro };
        }
    }

    async function sincronizarTudoLocal() {
        if (!state.configurado) throw new Error('Configure o Supabase primeiro.');
        if (!state.cliente) throw new Error('Biblioteca Supabase não carregada.');
        await usuarioAtual();
        if (!state.sessao) throw new Error('Faça login antes de enviar os dados.');

        const produtos = local('all_produtos', []);
        const vendas = local('all_vendas', []);
        const ordens = local('all_ordens_servico', []);

        await Promise.all([
            salvarTabela(tabelas.produtos, produtos),
            salvarTabela(tabelas.vendas, vendas),
            salvarTabela(tabelas.ordens, ordens)
        ]);

        state.online = true;
        aviso('☁️ Dados deste aparelho enviados para a nuvem.', 'ok');
        return { produtos: produtos.length, vendas: vendas.length, ordens: ordens.length };
    }

    async function baixarNuvemParaLocal() {
        const dados = await carregarNuvem();
        if (!dados.conectado) throw new Error('Faça login antes de baixar os dados.');

        localStorage.setItem('all_produtos', JSON.stringify(dados.produtos || []));
        localStorage.setItem('all_vendas', JSON.stringify(dados.vendas || []));
        localStorage.setItem('all_ordens_servico', JSON.stringify(dados.ordens || []));
        aviso('⬇️ Dados da nuvem baixados para este aparelho.', 'ok');
        return dados;
    }

    function salvarProdutos(lista) {
        localStorage.setItem('all_produtos', JSON.stringify(lista || []));
        if (!state.sessao) return;
        salvarTabela(tabelas.produtos, lista).catch(erro => {
            console.error('ALL Sync produtos:', erro);
            aviso('Produto salvo localmente. Nuvem ainda não atualizada.', 'erro');
        });
    }

    function salvarVendas(lista) {
        localStorage.setItem('all_vendas', JSON.stringify(lista || []));
        if (!state.sessao) return;
        salvarTabela(tabelas.vendas, lista).catch(erro => {
            console.error('ALL Sync vendas:', erro);
            aviso('Venda salva localmente. Nuvem ainda não atualizada.', 'erro');
        });
    }

    function salvarOrdens(lista) {
        localStorage.setItem('all_ordens_servico', JSON.stringify(lista || []));
        if (!state.sessao) return;
        salvarTabela(tabelas.ordens, lista).catch(erro => {
            console.error('ALL Sync OS:', erro);
            aviso('OS salva localmente. Nuvem ainda não atualizada.', 'erro');
        });
    }

    // ==========================================================
    // SINCRONIZAÇÃO EM TEMPO REAL
    // Atualiza o aparelho quando outro aparelho altera a nuvem.
    // ==========================================================
    async function atualizarTabelaDoRealtime(chave) {
        try {
            const tabela = tabelas[chave];
            if (!tabela || !state.sessao) return;
            const lista = await buscarTabela(tabela);
            const mapaLocal = {
                produtos: 'all_produtos',
                vendas: 'all_vendas',
                ordens: 'all_ordens_servico'
            };
            const localKey = mapaLocal[chave];
            if (!localKey) return;
            localStorage.setItem(localKey, JSON.stringify(lista));

            if (chave === 'produtos' && Array.isArray(window.produtos)) {
                window.produtos = lista;
            }
            if (chave === 'vendas' && Array.isArray(window.vendas)) {
                window.vendas = lista;
            }
            if (chave === 'ordens' && Array.isArray(window.ordensServico)) {
                window.ordensServico = lista;
            }

            // As páginas atuais usam variáveis locais; os eventos abaixo permitem
            // que cada página redesenhe seus próprios componentes sem duplicar regras.
            window.dispatchEvent(new CustomEvent('all:sync', {
                detail: { tipo: chave, dados: lista }
            }));
        } catch (erro) {
            console.error('ALL Realtime:', erro);
        }
    }

    function iniciarRealtime() {
        if (realtimeIniciado || !state.cliente || !state.sessao) return false;
        realtimeIniciado = true;

        Object.entries(tabelas).forEach(([chave, tabela]) => {
            const canal = state.cliente
                .channel('all-sync-' + tabela + '-' + state.sessao.user.id)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: tabela,
                    filter: 'user_id=eq.' + state.sessao.user.id
                }, () => {
                    atualizarTabelaDoRealtime(chave);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('ALL Realtime conectado:', tabela);
                    }
                });
            canaisRealtime[tabela] = canal;
        });
        return true;
    }

    async function pararRealtime() {
        if (!state.cliente) return;
        const canais = Object.values(canaisRealtime);
        for (const canal of canais) {
            try { await state.cliente.removeChannel(canal); } catch (_) {}
        }
        canaisRealtime = {};
        realtimeIniciado = false;
    }

    function info() {
        return {
            configurado: state.configurado,
            conectado: !!state.sessao,
            online: state.online,
            email: state.sessao?.user?.email || '',
            erro: state.erro || ''
        };
    }

    window.ALLSync = {
        init,
        login,
        logout,
        cadastrarUsuario,
        usuarioAtual,
        carregarNuvem,
        sincronizarTudoLocal,
        baixarNuvemParaLocal,
        salvarProdutos,
        salvarVendas,
        salvarOrdens,
        buscarTabela,
        salvarTabela,
        apagarTabela,
        info,
        iniciarRealtime,
        pararRealtime,
        aviso
    };
})();
